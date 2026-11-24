/* Smart Summarise – live AI connection for events.
   Set the API address in config.js. If the API is unreachable, the app falls back to offline demo answers. */
(function () {
  const cfg = window.SS_CONFIG || {};
  const api = (cfg.apiBase || "").replace(/\/$/, "");
  let mode = "offline"; // "live" | "offline"
  let health = null;
  try { mode = localStorage.getItem("ss-mode") || (api ? "live" : "offline"); } catch (e) { mode = api ? "live" : "offline"; }
  if (!api) mode = "offline";

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  async function call(path, body, timeoutMs = 45000) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const r = await fetch(api + path, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: ctl.signal } : { signal: ctl.signal });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
      return data;
    } finally { clearTimeout(t); }
  }

  // ---------- mapping AI JSON -> the fields the app displays ----------
  const toActions = (list, first = "High", rest = "Medium") => (list || []).slice(0, 5).map((title, i) => ({ title, priority: i === 0 ? first : rest }));
  const MAP = {
    incident: (o) => ({
      "AI Summary": o.ai_summary,
      "Risk Level": o.risk_level,
      "Safeguarding Considerations": o.safeguarding_considerations,
      "Suggested Actions / Learning": o.suggested_actions,
      ...(o.missing_information?.length ? { "Missing Information": o.missing_information } : {}),
      _actions: toActions(o.suggested_actions, o.risk_level === "High" ? "High" : "Medium")
    }),
    referral: (o) => ({
      "AI Summary": o.ai_summary,
      "Key Risks": o.key_risks,
      "Recommended Support": o.recommended_support,
      "Placement Suitability": o.placement_suitability,
      ...(o.missing_information?.length ? { "Missing Information": o.missing_information } : {}),
      _actions: toActions(o.recommended_support, "Medium")
    }),
    onboarding: (o) => ({
      "Missing Requirements": o.missing_requirements.length ? o.missing_requirements : ["No missing requirements identified."],
      "Training Checklist": o.training_checklist,
      "Onboarding Status": o.onboarding_status,
      "Ready to Start": o.ready_to_start,
      "Manager Notes": o.manager_notes,
      _actions: toActions(o.missing_requirements, o.onboarding_status === "Red" ? "High" : "Medium")
    }),
    compliance: (o) => ({
      "Review Notes": o.review_notes,
      "Priority Areas": o.priority_areas,
      "Action Required": o.action_required,
      "Overall Compliance Status": o.overall_compliance_status,
      "Evidence Strength": o.evidence_strength,
      _actions: toActions(o.action_required, "Medium")
    }),
    cqc: (o) => ({
      "Generated CQC Report": [
        "Executive Summary", o.executive_summary, "",
        "Safe", o.safe, "", "Effective", o.effective, "", "Caring", o.caring, "",
        "Responsive", o.responsive, "", "Well-Led", o.well_led, "",
        "Areas for Improvement", ...o.areas_for_improvement.map((x) => `- ${x}`), "",
        "Recommended Manager Actions", ...o.recommended_manager_actions.map((x) => `- ${x}`), "",
        "Evidence Gaps", ...o.evidence_gaps.map((x) => `- ${x}`)
      ].join("\n"),
      _actions: toActions(o.recommended_manager_actions, "High")
    })
  };

  // Build the CQC evidence from the records on screen (no names are sent).
  function cqcEvidence(values) {
    const rec = window.SS_RECORDS || {};
    const line = (r) => `${r.location} · ${r.date} · ${r.status} · ${r.detail}`;
    return {
      ...values,
      "Incident records": (rec.incident || []).map(line).join("\n"),
      "Referral records": (rec.referral || []).map(line).join("\n"),
      "Staff onboarding records": (rec.onboarding || []).map((r) => `${r.location} · ${r.status} · ${r.detail}`).join("\n"),
      "Compliance audits": (rec.compliance || []).map(line).join("\n")
    };
  }

  async function generate(workflow, values) {
    const fields = workflow === "cqc" ? cqcEvidence(values) : values;
    const { output } = await call("/api/generate", { workflow, fields });
    return MAP[workflow] ? MAP[workflow](output) : output;
  }

  // ---------- mode switch in the sidebar ----------
  function renderSwitch() {
    const host = document.querySelector("#ai-mode");
    if (!host) return;
    const ok = health && health.ai;
    const live = mode === "live" && api;
    host.innerHTML = `
      <button type="button" class="mode-switch ${live ? (ok ? "is-live" : "is-warn") : ""}" id="mode-toggle" ${api ? "" : "disabled"}>
        <span class="dot"></span>${live ? (ok ? "Live AI" : "Live AI – not connected") : "Offline demo"}
      </button>
      ${live ? '<button type="button" class="side-reset" id="show-join">Audience: join from phone</button>' : ""}`;
  }

  async function checkHealth() {
    if (!api) return renderSwitch();
    try { health = await call("/api/health", null, 8000); } catch (e) { health = null; }
    renderSwitch();
  }

  // ---------- audience feed ----------
  let feedTimer = null;
  const seen = new Set();
  async function pollFeed() {
    if (!(mode === "live" && api)) return;
    try {
      const { items } = await call("/api/feed", null, 8000);
      const fresh = items.filter((i) => !seen.has(i.id)).reverse();
      fresh.forEach((i) => seen.add(i.id));
      if (!fresh.length) return;
      const rec = window.SS_RECORDS;
      if (rec) {
        fresh.forEach((i) => rec.incident.unshift({
          title: i.input["Residents Involved"] || "Audience submission",
          location: i.input["Service Location"] || "Live demo",
          date: new Date(i.created).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
          status: i.output.risk_level,
          detail: i.output.ai_summary,
          live: true
        }));
      }
      toast(`${fresh.length} new incident${fresh.length > 1 ? "s" : ""} from the audience`);
      document.dispatchEvent(new CustomEvent("ss-feed", { detail: fresh }));
    } catch (e) { /* quiet: keep polling */ }
  }
  function startFeed() { clearInterval(feedTimer); if (mode === "live" && api) { pollFeed(); feedTimer = setInterval(pollFeed, 4000); } }

  function toast(text) {
    let t = document.querySelector(".ss-toast");
    if (!t) { t = document.createElement("div"); t.className = "ss-toast"; document.body.appendChild(t); }
    t.textContent = text; t.classList.add("on");
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("on"), 4000);
  }

  // ---------- join-from-phone overlay ----------
  function showJoin() {
    const phoneUrl = new URL("phone.html", location.href).href;
    const code = cfg.eventCode || "";
    const o = document.createElement("div");
    o.className = "join-overlay";
    o.innerHTML = `<div class="join-card">
        <h3>Report an incident from your phone</h3>
        <p>Scan the code, describe a made-up incident, and watch Smart Summarise review it live.</p>
        <div id="join-qr" class="join-qr"></div>
        <p class="join-url">${esc(phoneUrl)}</p>
        ${code ? `<p class="join-code">Event code <strong>${esc(code)}</strong></p>` : ""}
        <p class="join-note">Please use made-up names – never real people.</p>
        <button class="primary-button" type="button" id="join-close">Close</button></div>`;
    document.body.appendChild(o);
    o.addEventListener("click", (e) => { if (e.target === o || e.target.id === "join-close") o.remove(); });
    if (window.QRCode) new window.QRCode(o.querySelector("#join-qr"), { text: phoneUrl, width: 220, height: 220, colorDark: "#10243a" });
    else o.querySelector("#join-qr").textContent = "QR code needs internet access – share the link below.";
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest("#mode-toggle")) {
      mode = mode === "live" ? "offline" : "live";
      try { localStorage.setItem("ss-mode", mode); } catch (err) { /* ignore */ }
      renderSwitch(); startFeed();
      toast(mode === "live" ? "Live AI on" : "Offline demo answers on");
    }
    if (e.target.closest("#show-join")) showJoin();
  });

  window.SSLive = {
    isLive: () => mode === "live" && Boolean(api),
    generate,
    call,
    toast,
    init() { renderSwitch(); checkHealth(); startFeed(); }
  };
})();
