/* Smart Summarise – AI Care Plan Builder (demo module)
   Uses real outputs captured from the FYAM Airtable pilot run on fictional test data (TEST-CP-001). */
(function () {
  const D = window.CAREPLAN_DEMO;
  const ORIGINAL = JSON.parse(JSON.stringify(D));
  const live = () => window.SSLive && window.SSLive.isLive();
  const factLines = () => D.facts.map((f) => `- [${f.section}] ${f.fact} (${f.kind}; ${f.source}; ${f.verification})`).join("\n");
  const answerLines = () => D.clarifications.map((c, i) => cp.answers[i] ? `- Q: ${c.q}\n  A: ${cp.answers[i]}` : "").filter(Boolean).join("\n") + (cp.notes ? `\n- Manager notes: ${cp.notes}` : "");
  const STAGES = ["Upload", "Extract", "Clarify", "Draft", "Quality check", "Review", "Approve"];
  const cp = {};
  function reset() {
    for (const k of Object.keys(ORIGINAL)) D[k] = JSON.parse(JSON.stringify(ORIGINAL[k]));
    Object.assign(cp, {
      notes: ORIGINAL.managerNotes || "", liveRun: false, error: "", name: ORIGINAL.job.name || "", photo: "",
      stage: 0, busy: false, answers: {}, resolved: {}, regen: {}, reviewed: {},
      qaResolved: {}, approver: "", declaration: false, approved: false, blockedMsg: "",
      sel: 1, factFilter: "all", files: []
    });
  }
  reset();

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // Gaps the AI could not fill are shown as a soft "To complete" note rather than an alarm.
  const mark = (s) => esc(s)
    .replace(/\[(TO BE VERIFIED|INFORMATION REQUIRED)\s*:?\s*([^\]]*)\]/g, (m, k, t) => `<span class="cp-flag">${k === "TO BE VERIFIED" ? "To check" : "To complete"}: ${t || "information needed"}</span>`)
    .replace(/^Completed by the service - not processed by AI$/, '<span class="cp-svc">To be completed by the service</span>')
    .replace(/\n/g, "<br>");
  const TPL = window.CAREPLAN_TEMPLATE || [];
  const tplOf = (order) => TPL.find((t) => t.order === order) || {};
  // The AI only ever sees the reference (e.g. SU-TEST-001); the real name is put back here, in the browser.
  const NAME_LABELS = /^(name|person's name|name of person being assessed)$/i;
  const reid = (v) => String(v || "").split(D.job.su).join(displayName());
  const rawData = (s) => (cp.regen[s.order] && s.finalFields ? { fields: s.finalFields, risks: s.finalRisks || [] } : { fields: s.draftFields || [], risks: s.draftRisks || [] });
  const secData = (s) => {
    const d = rawData(s);
    return {
      fields: d.fields.map((f) => ({ label: f.label, value: NAME_LABELS.test(f.label) ? displayName() : reid(f.value) })),
      risks: d.risks.map((r) => ({ ...r, who_at_risk: reid(r.who_at_risk), risk: reid(r.risk), consequences: reid(r.consequences), current_measures: reid(r.current_measures), additional_actions: reid(r.additional_actions) }))
    };
  };
  const fieldsToText = (d) => [...(d.fields || []).map((f) => `${f.label}: ${f.value}`), ...(d.risks || []).map((r, i) => `Risk ${i + 1}: ${r.risk}\n  Who is at risk: ${r.who_at_risk}\n  Possible consequences: ${r.consequences}\n  Measures in place: ${r.current_measures}\n  Additional actions: ${r.additional_actions}`)].join("\n");
  const sectionText = (s) => fieldsToText(rawData(s)); // what is sent to the AI: reference only, never the name
  const displayName = () => (cp.name || D.job.name || D.job.su);
  const openClar = () => D.clarifications.filter((_, i) => !cp.resolved[i]).length;
  const openBlocking = () => D.qa.filter((q, i) => q.severity === "Blocking" && !cp.qaResolved[i]).length;
  // ---- gaps ("To complete" items) – the manager fills every one before approval
  const GAPRE = /\[(INFORMATION REQUIRED|TO BE VERIFIED)\s*:?\s*([^\]]*)\]/;
  const RISKKEYS = ["risk", "who_at_risk", "consequences", "current_measures", "additional_actions"];
  function gapList() {
    const out = [];
    D.sections.forEach((s) => {
      const d = rawData(s);
      d.fields.forEach((f, fi) => { const m = String(f.value || "").match(GAPRE); if (m) out.push({ key: `${s.order}|f${fi}`, order: s.order, title: s.title, fi, label: f.label, need: m[2] || f.label }); });
      (d.risks || []).forEach((r, ri) => RISKKEYS.forEach((k) => { const m = String(r[k] || "").match(GAPRE); if (m) out.push({ key: `${s.order}|r${ri}|${k}`, order: s.order, title: s.title, ri, k, label: `Risk ${ri + 1} – ${k.replace(/_/g, " ")}`, need: m[2] || k }); }));
    });
    return out;
  }
  const openGaps = () => gapList().length;
  function fillGap(g, text) {
    const s = D.sections.find((x) => x.order === g.order);
    if (!(cp.regen[s.order] && s.finalFields)) { s.finalFields = JSON.parse(JSON.stringify(s.draftFields || [])); s.finalRisks = JSON.parse(JSON.stringify(s.draftRisks || [])); cp.regen[s.order] = true; }
    const put = (v) => { const rest = String(v || "").replace(GAPRE, "").replace(/[\s.\-–]/g, ""); return rest ? String(v).replace(GAPRE, text) : text; };
    if (g.k) s.finalRisks[g.ri][g.k] = put(s.finalRisks[g.ri][g.k]); else s.finalFields[g.fi].value = put(s.finalFields[g.fi].value);
  }
  function demoAnswer(g) {
    const l = (g.label + " " + g.need).toLowerCase(); const r = new Date(); r.setMonth(r.getMonth() + 6);
    const map = [[/likes to be called|preferred name/, "Grace"], [/religion|faith|belief/, "No religious or cultural needs stated by Grace"], [/relationship status/, "Single"],
      [/protected characteristic/, "Disability (learning disability)"], [/keyworker/, "Sam, Senior Support Worker (demo)"], [/funded|1:1 hours|support hours/, "24-hour shared support, funded by the local authority (demo)"],
      [/cross-referenc|other documents/, "Risk assessment (S18); PEEP (S19); MAR chart"], [/review frequency/, "Every 6 months, or sooner if needs change"],
      [/next review date|review date/, r.toLocaleDateString("en-GB")], [/night routine/, "Goes to bed around 10pm. Sensor mat on. Staff check at midnight (demo)"],
      [/reading and writing/, "Reads simple words with pictures; writes her name (demo)"], [/all about me/, "Grace is 34, kind and funny, loves 80s pop and swimming (demo)"]];
    const hit = map.find(([re]) => re.test(l));
    return hit ? hit[1] : "Agreed with Grace and her sister at the plan meeting (demo)";
  }
  function gapPanel() {
    const gaps = gapList(); if (!gaps.length) return "";
    const secs = [...new Set(gaps.map((g) => g.order))];
    if (!secs.includes(cp.gapSec)) cp.gapSec = secs[0];
    cp.gapTotal = Math.max(cp.gapTotal || 0, gaps.length);
    const here = gaps.filter((g) => g.order === cp.gapSec);
    const pct = Math.round(((cp.gapTotal - gaps.length) / cp.gapTotal) * 100);
    return `<div class="cp-gaps">
      <div class="cp-gaps-head"><strong>Complete the gaps before approval</strong><span>${gaps.length} left · section ${secs.indexOf(cp.gapSec) + 1} of ${secs.length}</span></div>
      <div class="cp-gap-bar"><i style="width:${pct}%"></i></div>
      <h4>${esc(here[0].title)}</h4>
      ${here.map((g) => `<div class="cp-gap"><label>${esc(g.label)}<small>Needed: ${esc(g.need)}</small>
        <input data-cp-gap="${esc(g.key)}" placeholder="Type the answer"></label>
        <button class="ghost-button small" data-cp-gapna="${esc(g.key)}">Not applicable</button></div>`).join("")}
      <div class="cp-row"><button class="primary-button" data-cp="gapsave">Save and next section</button>
        ${secs.length > 1 ? '<button class="ghost-button" data-cp="gapskip">Skip for now</button>' : ""}
        <button class="ghost-button small cp-demo-btn" data-cp="gapdemo">Demo shortcut: fill every gap with sample answers</button></div>
    </div>`;
  }
  const notReviewed = () => D.sections.filter((s) => !cp.reviewed[s.order]).length;

  function checks() {
    const out = [];
    if (cp.stage < 5) out.push("draft not ready for review yet");
    if (notReviewed()) out.push(`${notReviewed()} section(s) not marked Reviewed`);
    if (openBlocking()) out.push(`${openBlocking()} blocking QA finding(s) open`);
    if (openClar()) out.push(`${openClar()} clarification(s) open`);
    if (openGaps()) out.push(`${openGaps()} "To complete" item(s) still to fill in`);
    if (!cp.approver.trim()) out.push("no approver named");
    if (!cp.declaration) out.push("approver declaration not ticked");
    return out;
  }

  // step = index of the stepper tile that spins while this runs
  function work(step, fn, liveFn) {
    cp.busy = true; cp.runStep = step; cp.error = ""; render();
    if (liveFn && live()) {
      liveFn().then(() => { cp.liveRun = true; fn(); })
        .catch((e) => { cp.error = "Live AI unavailable (" + e.message + ") – showing the recorded result instead."; fn(); })
        .finally(() => { cp.busy = false; render(); });
      return;
    }
    setTimeout(() => { cp.busy = false; fn(); render(); }, 1400);
  }
  const api = (workflow, fields) => window.SSLive.call("/api/generate", { workflow, fields }, 90000).then((r) => r.output);

  // ---- file upload ----
  const SAMPLES = [
    { file: "samples/01_Local_authority_referral.pdf", rec: () => ORIGINAL.sourceDocs[0].text, pages: 2 },
    { file: "samples/02_Hospital_discharge_letter.pdf", rec: () => ORIGINAL.sourceDocs[1].text, pages: 1 },
    { file: "samples/03_Family_information_sheet_HANDWRITTEN.jpg", rec: () => ORIGINAL.sourceDocs[2].text, pages: 1, handwritten: true },
    { file: "samples/04_Manager_initial_assessment_notes_HANDWRITTEN.jpg", rec: () => ORIGINAL.managerNotes, pages: 1, handwritten: true, role: "notes" }
  ];
  const baseName = (n) => n.replace(/\.[a-z0-9]+$/i, "").replace(/_/g, " ").replace(/^\d+\s+/, "").replace(/\s+HANDWRITTEN$/i, "").trim();
  const guessRole = (n) => (/(manager|visit|assessment).*note|notes?\b/i.test(n) ? "notes" : "source");
  let fileSeq = 0;
  function syncDocs() {
    if (!cp.files.length) { D.sourceDocs = JSON.parse(JSON.stringify(ORIGINAL.sourceDocs)); cp.notes = ORIGINAL.managerNotes || ""; return; }
    const done = cp.files.filter((f) => f.status === "done");
    D.sourceDocs = done.filter((f) => f.role === "source").map((f) => ({ name: f.label, text: f.text }));
    cp.notes = done.filter((f) => f.role === "notes").map((f) => f.text.replace(/\[Page \d+\]\n?/g, "").trim()).join("\n");
  }
  function addFiles(list, sample) {
    [...list].forEach((file, i) => {
      const sm = sample ? sample[i] : null;
      const f = { id: ++fileSeq, name: file.name, label: baseName(file.name), kind: window.CPUpload.kindOf(file), status: "reading", role: (sm && sm.role) || guessRole(file.name), text: "", thumb: "", how: "", pages: 0, handwritten: false };
      cp.files.push(f); render();
      const ai = live() ? (images, name) => api("read_document", { images, name }) : null;
      const useRecorded = (why) => Object.assign(f, { status: "done", text: sm.rec(), pages: sm.pages, handwritten: !!sm.handwritten, how: why });
      const p = sm && !live()
        ? new Promise((r) => setTimeout(r, 700 + i * 500)).then(() => { useRecorded(sm.handwritten ? "Handwriting read (offline demo – recorded result)" : "Read (offline demo – recorded result)"); return window.CPUpload.kindOf(file) === "Photo" ? window.CPUpload.read(file, null).catch((e) => { f.thumb = e.thumb || ""; }) : null; })
        : window.CPUpload.read(file, ai).then((o) => Object.assign(f, o, { status: "done" }));
      p.catch((e) => { if (e.thumb) f.thumb = e.thumb; if (sm) useRecorded("Recorded result used (" + e.message + ")"); else Object.assign(f, { status: "error", how: e.message }); })
        .finally(() => { syncDocs(); render(); });
    });
  }
  async function loadSamples() {
    cp.files = []; syncDocs();
    const files = await Promise.all(SAMPLES.map(async (s) => { const b = await (await fetch(s.file + "?v=2", { cache: "reload" })).blob(); return new File([b], s.file.split("/").pop(), { type: b.type }); }));
    addFiles(files, SAMPLES);
  }
  const reading = () => cp.files.some((f) => f.status === "reading");
  function fileCards() {
    if (!cp.files.length) return "";
    const icon = (f) => f.thumb ? `<img src="${f.thumb}" alt="">` : `<span>${f.kind === "Photo" ? "IMG" : esc(f.kind === "Word" ? "DOC" : f.kind.toUpperCase().slice(0, 4))}</span>`;
    return `<div class="cp-files">${cp.files.map((f, i) => `
      <div class="cp-file ${f.status}">
        <div class="cp-file-thumb">${icon(f)}</div>
        <div class="cp-file-main">
          <strong>${esc(f.name)}</strong>
          <p class="cp-muted">${esc(f.kind)}${f.pages ? ` · ${f.pages} page${f.pages > 1 ? "s" : ""}` : ""} · ${f.status === "reading" ? '<span class="cp-spin"></span> Reading…' : f.status === "error" ? `<span class="cp-err">${esc(f.how)}</span>` : esc(f.how)}
            ${f.handwritten ? '<span class="cp-pill hand">Handwritten</span>' : ""}</p>
          ${f.status === "done" ? `<details><summary>What the AI read from this file</summary><textarea data-cp-ftext="${i}" rows="8">${esc(f.text)}</textarea></details>` : ""}
        </div>
        <div class="cp-file-side">
          <select data-cp-role="${i}" aria-label="How to use this file">
            <option value="source" ${f.role === "source" ? "selected" : ""}>Source document</option>
            <option value="notes" ${f.role === "notes" ? "selected" : ""}>Manager's notes</option>
          </select>
          <button class="ghost-button small" data-cp-rmfile="${i}" aria-label="Remove file">Remove</button>
        </div>
      </div>`).join("")}</div>`;
  }

  function stepper() {
    const running = (i) => (cp.busy && cp.runStep === i) || (i === 0 && reading());
    return `<ol class="cp-stepper">${STAGES.map((s, i) => `
      <li class="${running(i) ? "running" : i < cp.stage || cp.approved ? "done" : i === cp.stage ? "current" : ""}">
        <span>${running(i) ? '<i class="cp-ring"></i>' : i < cp.stage || cp.approved ? "✓" : i + 1}</span>${s}</li>`).join("")}</ol>`;
  }

  function jobCard() {
    const status = cp.approved ? "APPROVED" : ["CREATED", "UPLOAD_RECEIVED", "REVIEW_REQUIRED", "READY_TO_GENERATE", "DRAFT_READY", "MANAGER_REVIEW", "READY_FOR_APPROVAL"][cp.stage];
    return `<div class="cp-job">
      <div><span class="label">Care plan job</span><h3>${esc(displayName())} · ${esc(D.job.ref)}</h3>
      <p class="cp-muted">${esc(D.job.location)} · Anonymised test data only</p></div>
      <span class="cp-status ${cp.approved ? "ok" : ""}">${status}</span></div>`;
  }

  function busyBox() {
    return (cp.error ? `<div class="cp-qa warn"><p>${esc(cp.error)}</p></div>` : "");
  }

  // ---- stage views ----
  function vUpload() {
    return `<div class="panel cp-panel">
      <span class="label">Step 1 · Person and source documents</span>
      <h3>Upload the referral pack</h3>
      <div class="cp-person">
        <div class="cp-photo">${cp.photo ? `<img src="${cp.photo}" alt="">` : '<span>No photo yet</span>'}</div>
        <div class="cp-person-fields">
          <label class="cp-field">Person's name (shown on the cover only – never sent to the AI)<input data-cp-name value="${esc(cp.name)}" placeholder="e.g. Grace Miller"></label>
          <div class="cp-row">
            <label class="ghost-button small cp-upload">Upload photo<input type="file" accept="image/*" data-cp-photo hidden></label>
            <button class="ghost-button small" data-cp="samplephoto">Use sample portrait</button>
            ${cp.photo ? '<button class="ghost-button small" data-cp="nophoto">Remove</button>' : ""}
          </div>
          <p class="cp-muted">The photo is cropped to a square on a white background automatically. Use a real photo only with the person's photography consent.</p>
        </div>
      </div>
      <label class="cp-drop" data-cp-drop>
        <input type="file" multiple accept=".pdf,.docx,.txt,image/*" data-cp-files hidden>
        <strong>Drop the referral pack here, or click to choose files</strong>
        <span>Referrals, discharge letters, assessments, family sheets – PDF, Word, photos or scans, typed or handwritten</span>
      </label>
      <div class="cp-row">
        <button class="ghost-button small" data-cp="samples" ${reading() ? "disabled" : ""}>Load the sample referral pack (4 files)</button>
        ${cp.files.length ? '<button class="ghost-button small" data-cp="clearfiles">Clear files</button>' : ""}
      </div>
      <p class="cp-muted">Demo: fictional or anonymised documents only. Mark the registered manager's own notes as "Manager's notes" – they are used to answer the AI's questions in step 3.</p>
      ${fileCards()}
      ${!cp.files.length ? `<p class="cp-muted">No files yet – or continue with the built-in example documents (${D.sourceDocs.map((d) => esc(d.name)).join(", ")}).</p>` : ""}
      ${busyBox()}
      <button class="primary-button" data-cp="extract" ${cp.busy || reading() || (cp.files.length && !D.sourceDocs.length) ? "disabled" : ""}>${reading() ? "Reading files…" : "Extract information with AI"}</button>
    </div>`;
  }

  function vExtract() {
    const kinds = ["all", "Needs verification", "Recommendation", "Opinion", "Unclear"];
    const list = D.facts.filter((f) => cp.factFilter === "all" || f.verification === cp.factFilter || f.kind === cp.factFilter);
    return `<div class="panel cp-panel">
      <span class="label">Step 2 · Extract</span>
      <h3>${D.facts.length} facts extracted from ${D.docs.length} documents</h3>
      <div class="cp-docs">${D.docs.map((d) => `<div class="cp-doc small"><div class="cp-doc-icon ok">✓</div><div><strong>${esc(d.name)}</strong>
        <p class="cp-muted">Classified: ${esc(d.type)} · ${d.facts} facts</p></div></div>`).join("")}</div>
      <div class="cp-filters">${kinds.map((k) => `<button class="cp-chip ${cp.factFilter === k ? "on" : ""}" data-cp-filter="${esc(k)}">${k === "all" ? "All" : esc(k)}</button>`).join("")}</div>
      <div class="cp-table-wrap"><table class="cp-table"><thead><tr><th>Section</th><th>Fact</th><th>Type</th><th>Source</th><th>Check</th></tr></thead><tbody>
      ${list.map((f) => `<tr><td>${esc(f.section)}</td><td>${esc(f.fact)}</td><td>${esc(f.kind)}</td><td>${esc(f.source)}</td>
        <td><span class="cp-pill ${f.verification === "Needs verification" ? "warn" : ""}">${esc(f.verification)}</span></td></tr>`).join("")}
      </tbody></table></div>
      ${busyBox()}
      <button class="primary-button" data-cp="analyse" ${cp.busy ? "disabled" : ""}>Cross-check for gaps and conflicts</button>
    </div>`;
  }

  function vClarify() {
    return `<div class="panel cp-panel">
      <span class="label">Step 3 · Clarify</span>
      <h3>${D.clarifications.length} questions for the manager · ${openClar()} open</h3>
      <p class="cp-summary">${esc(D.analysis)}</p>
      <div class="cp-clar-list">${D.clarifications.map((c, i) => `
        <div class="cp-clar ${cp.resolved[i] ? "resolved" : ""}">
          <div class="cp-clar-head">
            <span class="cp-pill ${c.reason === "Conflict" ? "bad" : "warn"}">${esc(c.reason)}</span>
            ${c.safety ? '<span class="cp-pill bad">Safety-critical</span>' : ""}
            <span class="cp-muted">${esc(c.section)} · ${esc(c.sources)}</span></div>
          <p>${esc(c.q)}</p>
          ${cp.resolved[i] ? `<div class="cp-answer"><strong>Manager answer:</strong> ${esc(cp.answers[i])}
            ${c.quote ? `<blockquote class="cp-quote"><span>From the manager's handwritten notes</span>“${esc(c.quote)}”</blockquote>` : ""}</div>` : `
          ${c.notFound ? '<p class="cp-notfound">Not covered in the manager\'s notes – answer it here, or leave it for the plan meeting.</p>' : ""}
          <textarea data-cp-answer="${i}" rows="2" placeholder="Manager answer">${esc(cp.answers[i] ?? (cp.liveRun ? "" : c.answer) ?? "")}</textarea>
          <div class="cp-row"><button class="ghost-button small" data-cp-resolve="${i}">Save answer and resolve</button>
          <button class="ghost-button small" data-cp-leave="${i}">Leave for the plan meeting</button></div>`}
        </div>`).join("")}</div>
      ${busyBox()}
      ${cp.liveRun ? `<label class="cp-field wide">What the manager knows (used to answer the questions above)<textarea data-cp-notes rows="5">${esc(cp.notes)}</textarea></label>` : ""}
      <div class="cp-row">
        <button class="ghost-button" data-cp="resolveall" ${openClar() && !cp.busy ? "" : "disabled"}>${cp.liveRun ? "Answer all from the manager's notes" : "Resolve all with the suggested answers"}</button>
        <button class="primary-button" data-cp="draft" ${openClar() || cp.busy ? "disabled" : ""}>Generate the 25-section care plan</button>
      </div>
      ${openClar() ? '<p class="cp-muted">Drafting is locked until every question is answered. The AI never guesses to resolve a conflict.</p>' : ""}
    </div>`;
  }

  function renderFields(s) {
    const t = tplOf(s.order); const d = secData(s);
    if (t.kind === "list") {
      const items = ((d.fields.find((f) => /items/i.test(f.label)) || d.fields[0] || { value: "" }).value || "").split("\n").map((x) => x.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
      return `<ul class="cp-list">${items.map((i) => `<li>${mark(i)}</li>`).join("")}</ul>`;
    }
    if (t.kind === "risks") {
      return (d.risks || []).map((r, i) => `<div class="cp-risk"><h4>Risk ${i + 1}: ${esc(r.risk)}</h4>
        <table class="cp-ftable"><tbody>
          <tr><th>Who or what is at risk?</th><td>${mark(r.who_at_risk)}</td></tr>
          <tr><th>Possible consequences</th><td>${mark(r.consequences)}</td></tr>
          <tr><th>Measures currently in place</th><td>${mark(r.current_measures)}</td></tr>
          <tr><th>Risk score</th><td><span class="cp-score">Likelihood __ × Consequence __ = __</span> <em class="cp-muted">scored by the manager, never by AI</em></td></tr>
          <tr><th>Additional actions</th><td>${mark(r.additional_actions)}</td></tr>
        </tbody></table></div>`).join("") || `<p>${mark("[INFORMATION REQUIRED: no risks recorded]")}</p>`;
    }
    const rows = (d.fields || []).map((f) => t.kind === "plan"
      ? `<tr class="cp-planrow"><th colspan="2">${esc(f.label)}</th></tr><tr><td colspan="2">${mark(f.value)}</td></tr>`
      : `<tr><th>${esc(f.label)}</th><td>${mark(f.value)}</td></tr>`).join("");
    const sig = t.kind === "signatures" ? `<table class="cp-ftable cp-sig"><thead><tr><th>Date</th><th>Name</th><th>Signature</th></tr></thead><tbody>${"<tr><td></td><td></td><td></td></tr>".repeat(3)}</tbody></table><p class="cp-muted">Signatures are added by hand – never generated.</p>` : "";
    return `<table class="cp-ftable"><tbody>${rows}</tbody></table>${sig}`;
  }
  function coverPreview() {
    return `<div class="cp-cover">
      <div class="cp-cover-title">My Support Plan</div>
      <div class="cp-cover-photo">${cp.photo ? `<img src="${cp.photo}" alt="">` : "<span>Photo</span>"}</div>
      <div class="cp-cover-name">Name: ${esc(displayName())}</div>
      <p class="cp-muted">${esc(D.job.location)} · ${esc(D.job.ref)}</p></div>`;
  }
  function downloadDocx(approved) {
    const data = {
      job: { ...D.job, name: displayName(), status: approved ? "APPROVED" : "DRAFT", approver: cp.approver, version: 1, review: approved ? new Date(Date.now() + 182 * 864e5).toLocaleDateString("en-GB") : "" },
      photo: cp.photo,
      sections: D.sections.map((s) => ({ order: s.order, title: tplOf(s.order).title || s.title.replace(/^\d+\s*/, ""), sources: s.sources, ...secData(s) }))
    };
    const blob = window.buildCarePlanDocx(data);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `FYAM_Care_Plan_${displayName().replace(/[^A-Za-z0-9]+/g, "_")}_${approved ? "APPROVED" : "DRAFT"}.docx`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  function processPhoto(file) {
    const img = new Image();
    img.onload = () => {
      const size = 600, c = document.createElement("canvas"); c.width = c.height = size;
      const g = c.getContext("2d"); g.fillStyle = "#ffffff"; g.fillRect(0, 0, size, size);
      const iw = img.naturalWidth || img.width || size, ih = img.naturalHeight || img.height || size;
      const s = Math.min(iw, ih); const sx = (iw - s) / 2; const sy = Math.max(0, (ih - s) / 2 - s * 0.08);
      g.drawImage(img, sx, sy, s, s, 0, 0, size, size);
      cp.photo = c.toDataURL("image/jpeg", 0.9); render();
    };
    img.src = typeof file === "string" ? file : URL.createObjectURL(file);
  }
  function samplePortrait() {
    // Illustrated, clearly fictional portrait on a white background (no real person).
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" fill="#ffffff"/><circle cx="300" cy="250" r="118" fill="#6b4a3a"/><ellipse cx="300" cy="262" rx="92" ry="104" fill="#e0b394"/><path d="M196 240c4-86 62-128 110-128s104 40 108 128c-24-48-60-70-108-70s-86 22-110 70z" fill="#6b4a3a"/><circle cx="266" cy="262" r="9" fill="#2b2b2b"/><circle cx="334" cy="262" r="9" fill="#2b2b2b"/><path d="M270 312q30 22 60 0" stroke="#9a5a4a" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M120 600c10-118 88-186 180-186s170 68 180 186z" fill="#2f78b7"/><path d="M262 414l38 46 38-46" fill="#ffffff"/></svg>`;
    processPhoto("data:image/svg+xml;base64," + btoa(svg));
  }

  function sectionViewer(withReview) {
    const s = D.sections.find((x) => x.order === cp.sel);
    const qaHere = cp.stage >= 5 ? D.qa.map((q, i) => ({ ...q, i })).filter((q) => q.regen === s.order && !cp.qaResolved[q.i]) : [];
    return `<div class="cp-sections">
      <div class="cp-sec-list">
        <div class="cp-part">Part A – My care plan</div>
        ${D.sections.map((x) => `${x.order === 16 ? '<div class="cp-part">Part B – Assessments & records</div>' : ""}
          <button class="cp-sec-btn ${x.order === cp.sel ? "on" : ""}" data-cp-sel="${x.order}">
            <span>${esc(x.title)}</span>${withReview ? (cp.reviewed[x.order] ? '<em class="ok">✓</em>' : "") : ""}
            ${/INFORMATION REQUIRED|TO BE VERIFIED/.test(sectionText(x)) ? '<em class="warn">!</em>' : ""}</button>`).join("")}
      </div>
      <div class="cp-sec-body">
        <span class="label">${s.part === "A" ? "Part A" : "Part B"}</span>
        <h3>${esc(s.title)}</h3>
        ${s.order === 1 ? coverPreview() : renderFields(s)}
        <p class="cp-evidence">Evidence: ${esc(s.sources)}</p>
        ${qaHere.map((q) => `<div class="cp-qa ${q.severity === "Blocking" ? "bad" : "warn"}"><strong>${esc(q.severity)} · ${esc(q.type)}</strong><p>${esc(q.finding)}</p>
          <textarea rows="2" data-cp-comment="${q.i}">${esc(q.comment)}</textarea>
          <button class="ghost-button small" data-cp-regen="${q.i}">Regenerate this section with my comment</button></div>`).join("")}
        ${withReview ? `<div class="cp-row"><button class="${cp.reviewed[s.order] ? "ghost-button" : "primary-button"} small" data-cp-review="${s.order}">${cp.reviewed[s.order] ? "Reviewed ✓" : "Mark section reviewed"}</button></div>` : ""}
      </div></div>`;
  }

  function vDraftAndQa() {
    const qaList = D.qa.map((q, i) => `
      <div class="cp-qa ${q.severity === "Blocking" ? "bad" : "warn"} ${cp.qaResolved[i] ? "resolved" : ""}">
        <strong>${esc(q.severity)} · ${esc(q.type)} · ${esc(q.section)}</strong>
        <p>${esc(q.finding)}</p><p class="cp-muted">Required action: ${esc(q.action)}</p>
        ${cp.qaResolved[i] ? '<span class="cp-pill ok">Resolved</span>' : `<button class="ghost-button small" data-cp-sel="${q.regen}">Open section</button>`}
      </div>`).join("");
    return `<div class="panel cp-panel">
      <span class="label">Step ${cp.stage === 4 ? "4 · Draft" : "5–6 · Quality check and review"}</span>
      <h3>Draft care plan · 25 sections</h3>
      ${cp.stage >= 5 ? `<div class="cp-qa-box"><strong>Quality and safety check</strong><p>${esc(D.qaSummary)}</p>${qaList}</div>` : ""}
      ${sectionViewer(cp.stage >= 5)}
      ${busyBox()}
      <div class="cp-row">
        ${cp.stage === 4 ? `<button class="primary-button" data-cp="qa" ${cp.busy ? "disabled" : ""}>Run quality and safety check</button>` : ""}
        ${cp.stage >= 5 ? `<button class="ghost-button" data-cp="reviewall">Mark all sections reviewed</button>
           <button class="primary-button" data-cp="toapprove">Go to approval (${notReviewed()} to review · ${openBlocking()} blocking)</button>` : ""}
      </div>
    </div>`;
  }

  function vApprove() {
    const c = checks();
    const draftFile = "./assets/FYAM_Care_Plan_SU-TEST-001_DRAFT.docx";
    const finalFile = "./assets/FYAM_Care_Plan_SU-TEST-001_APPROVED.docx";
    return `<div class="panel cp-panel">
      <span class="label">Step 7 · Approve</span>
      <h3>${cp.approved ? "Care plan approved" : "Approve the care plan"}</h3>
      <ul class="cp-checks">
        <li class="${notReviewed() ? "" : "ok"}">All 25 sections reviewed</li>
        <li class="${openBlocking() ? "" : "ok"}">No open blocking quality findings</li>
        <li class="${openClar() ? "" : "ok"}">All clarifications answered</li>
        <li class="${openGaps() ? "" : "ok"}">${openGaps() ? `${openGaps()} "To complete" item(s) still to fill in – complete them below` : 'Every "To complete" item filled in'}</li>
        <li class="${cp.approver.trim() ? "ok" : ""}">Approver named</li>
        <li class="${cp.declaration ? "ok" : ""}">Approver declaration ticked</li>
      </ul>
      ${cp.approved ? `<p class="cp-summary">Approved by ${esc(cp.approver)} on ${new Date().toLocaleDateString("en-GB")}. Logged to the audit trail. Signatures are added by hand – never generated.</p>
        <div class="cp-row"><button class="primary-button" data-cp="docx-final">Download approved Word care plan</button>
        <button class="ghost-button" data-cp="back">Back to sections</button></div>` : `
      ${gapPanel()}
      <label class="cp-field">Approver (registered / service manager)<input data-cp-approver value="${esc(cp.approver)}" placeholder="Name"></label>
      <label class="cp-check"><input type="checkbox" data-cp-decl ${cp.declaration ? "checked" : ""}> I have reviewed this plan against the source documents and confirm it is accurate and appropriate. I understand the AI drafted it and I am responsible for its content.</label>
      ${c.length ? `<p class="cp-muted">Approval unlocks when: ${esc(c.join("; "))}.</p>` : ""}
      <div class="cp-row"><button class="primary-button" data-cp="approve" ${c.length ? "disabled" : ""}>Approve care plan</button>
        <button class="ghost-button" data-cp="docx-draft">Download draft (watermarked)</button>
        <button class="ghost-button" data-cp="back">Back to sections</button></div>`}
    </div>`;
  }

  function render() {
    const el = document.querySelector("#workflow-layout");
    el.className = "cp-layout" + (cp.busy || reading() ? " busy" : "");
    let body;
    if (cp.stage === 0) body = vUpload();
    else if (cp.stage === 1) body = vExtract();
    else if (cp.stage === 2 || cp.stage === 3) body = vClarify();
    else if (cp.stage === 4 || cp.stage === 5) body = vDraftAndQa();
    else body = vApprove();
    el.innerHTML = `${jobCard()}${stepper()}${body}
      <div class="cp-foot"><span class="cp-muted">Every step is written to an audit log with the AI prompt version. AI never approves, signs, or makes clinical, capacity, consent, medication or risk decisions.</span>
      <button class="ghost-button small" data-cp="reset">Restart demo</button></div>`;
  }

  // ---- events ----
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-cp],[data-cp-filter],[data-cp-resolve],[data-cp-sel],[data-cp-review],[data-cp-regen],[data-cp-rmfile],[data-cp-leave],[data-cp-gapna]");
    if (!b || !document.querySelector(".cp-layout")) return;
    if (b.dataset.cpRmfile !== undefined) { cp.files.splice(+b.dataset.cpRmfile, 1); syncDocs(); return render(); }
    const a = b.dataset.cp;
    if (b.dataset.cpFilter) { cp.factFilter = b.dataset.cpFilter; return render(); }
    if (b.dataset.cpResolve) {
      const i = +b.dataset.cpResolve; const t = document.querySelector(`[data-cp-answer="${i}"]`);
      if (!t.value.trim()) return; cp.answers[i] = t.value; cp.resolved[i] = true;
      if (!openClar()) cp.stage = 3; return render();
    }
    if (b.dataset.cpSel) { cp.sel = +b.dataset.cpSel; if (cp.stage === 6 && !cp.approved) cp.stage = 5; return render(); }
    if (b.dataset.cpGapna !== undefined) { const g = gapList().find((x) => x.key === b.dataset.cpGapna); if (g) fillGap(g, "Not applicable (confirmed by the manager)"); return render(); }
    if (b.dataset.cpLeave !== undefined) { const i = +b.dataset.cpLeave; cp.answers[i] = "To be confirmed with the person and family at the plan meeting."; cp.resolved[i] = true; if (!openClar()) cp.stage = Math.max(cp.stage, 3); return render(); }
    if (b.dataset.cpReview) { const o = +b.dataset.cpReview; cp.reviewed[o] = !cp.reviewed[o]; return render(); }
    if (b.dataset.cpRegen) {
      const i = +b.dataset.cpRegen; const q = D.qa[i];
      const sec = D.sections.find((x) => x.order === q.regen);
      return work(5, () => {
        cp.regen[q.regen] = true; if (!cp.liveRun && q.regen === 12) cp.regen[20] = true;
        cp.qaResolved[i] = true; cp.reviewed[q.regen] = false;
      }, sec ? async () => {
        const o = await api("careplan_regen", { title: sec.title, text: sectionText(sec), comment: q.comment, facts: factLines(), answers: answerLines() });
        sec.finalFields = o.fields; sec.finalRisks = o.risks;
      } : null);
    }
    if (a === "extract") return work(1, () => {
      cp.stage = 1;
      if (cp.files.length && !cp.liveRun) D.docs = D.sourceDocs.map((d, i) => ({ name: d.name, pages: (d.text.match(/\[Page/g) || [1]).length, type: (ORIGINAL.docs[i] || {}).type || "Classified", facts: (ORIGINAL.docs[i] || {}).facts || 0 }));
    }, async () => {
      const docs = D.sourceDocs.map((d) => `=== DOCUMENT: ${d.name} ===\n${d.text}`).join("\n\n");
      const o = await api("careplan_extract", { documents: docs });
      D.facts = o.facts;
      D.docs = D.sourceDocs.map((d) => ({ name: d.name, pages: (d.text.match(/\[Page/g) || [1]).length, type: (o.documents.find((x) => x.name === d.name) || {}).type || "Classified", facts: o.facts.filter((f) => f.source.includes(d.name.replace("TEST ", ""))).length }));
    });
    if (a === "analyse") return work(2, () => { cp.stage = 2; }, async () => {
      const o = await api("careplan_analyse", { facts: factLines() });
      D.analysis = o.analysis_summary;
      D.clarifications = o.clarifications.map((c) => ({ ...c, answer: "" }));
      cp.answers = {}; cp.resolved = {};
    });
    if (a === "resolveall") return work(2, () => {
      D.clarifications.forEach((c, i) => { if (!cp.resolved[i] && c.answer) { cp.answers[i] = c.answer; cp.resolved[i] = true; } });
      if (!openClar()) cp.stage = 3;
    }, cp.liveRun ? async () => {
      const open = D.clarifications.map((c, i) => ({ c, i })).filter((x) => !cp.resolved[x.i]);
      if (!cp.notes.trim()) { open.forEach((x) => { x.c.notFound = true; }); return; }
      const o = await api("careplan_answer", { questions: open.map((x, k) => `${k + 1}. ${x.c.q}`).join("\n"), notes: cp.notes });
      open.forEach((x, k) => {
        const r = (o.answers || []).find((y) => Math.round(y.n) === k + 1);
        if (r && r.found && r.answer.trim()) { x.c.answer = r.answer.trim(); x.c.quote = (r.quote || "").trim(); x.c.notFound = false; }
        else { x.c.answer = ""; x.c.notFound = true; }
      });
    } : null);
    if (a === "draft") return work(3, () => { cp.stage = 4; cp.sel = 5; }, async () => {
      const o = await api("careplan_draft", { facts: factLines(), answers: answerLines(), reference: D.job.su, template: window.CAREPLAN_TEMPLATE_TEXT });
      const byOrder = new Map(o.sections.map((x) => [Math.round(x.order), x]));
      D.sections = D.sections.map((sec) => { const n = byOrder.get(sec.order); return n ? { ...sec, draftFields: n.fields, draftRisks: n.risks, finalFields: null, finalRisks: null, sources: n.sources } : sec; });
      cp.regen = {};
      D.qa = []; D.qaSummary = ""; cp.qaResolved = {};
    });
    if (a === "qa") return work(4, () => { cp.stage = 5; }, async () => {
      const draft = D.sections.map((x) => `## ${x.title}\n${sectionText(x)}`).join("\n\n");
      const o = await api("careplan_qa", { facts: factLines(), answers: answerLines(), draft });
      D.qaSummary = o.qa_summary;
      D.qa = o.findings.map((f) => ({ ...f, regen: Math.round(f.regen) || 1, comment: f.action }));
      cp.qaResolved = {};
    });
    if (a === "gapsave" || a === "gapskip") {
      const cur = cp.gapSec;
      if (a === "gapsave") document.querySelectorAll("[data-cp-gap]").forEach((inp) => { const v = inp.value.trim(); const g = gapList().find((x) => x.key === inp.dataset.cpGap); if (v && g) fillGap(g, v); });
      const secs = [...new Set(gapList().map((g) => g.order))];
      cp.gapSec = secs.find((o) => o > cur) ?? secs[0];
      render(); document.querySelector(".cp-gaps")?.scrollIntoView({ behavior: "smooth", block: "start" }); return;
    }
    if (a === "gapdemo") { gapList().forEach((g) => fillGap(g, demoAnswer(g))); return render(); }
    if (a === "reviewall") { D.sections.forEach((s) => { cp.reviewed[s.order] = true; }); return render(); }
    if (a === "toapprove") { cp.stage = 6; cp.blockedMsg = ""; return render(); }
    if (a === "back") { cp.stage = 5; return render(); }
    if (a === "approve") {
      const c = checks();
      if (c.length) { cp.blockedMsg = c.join("; "); return render(); }
      cp.approved = true; cp.blockedMsg = ""; return render();
    }
    if (a === "reset") { reset(); return render(); }
    if (a === "samplephoto") return samplePortrait();
    if (a === "samples") return loadSamples().catch((e) => { cp.error = "Could not load the sample pack: " + e.message; render(); });
    if (a === "clearfiles") { cp.files = []; syncDocs(); return render(); }
    if (a === "nophoto") { cp.photo = ""; return render(); }
    if (a === "docx-draft") return downloadDocx(false);
    if (a === "docx-final") return downloadDocx(true);
  });
  document.addEventListener("input", (e) => {
    if (e.target.matches("[data-cp-doc]")) D.sourceDocs[e.target.dataset.cpDoc].text = e.target.value;
    if (e.target.matches("[data-cp-ftext]")) { cp.files[e.target.dataset.cpFtext].text = e.target.value; syncDocs(); }
    if (e.target.matches("[data-cp-notes]")) cp.notes = e.target.value;
    if (e.target.matches("[data-cp-name]")) cp.name = e.target.value;
    if (e.target.matches("[data-cp-approver]")) cp.approver = e.target.value;
    if (e.target.matches("[data-cp-answer]")) cp.answers[e.target.dataset.cpAnswer] = e.target.value;
    if (e.target.matches("[data-cp-comment]")) D.qa[e.target.dataset.cpComment].comment = e.target.value;
  });
  document.addEventListener("change", (e) => {
    if (e.target.matches("[data-cp-decl]")) { cp.declaration = e.target.checked; render(); }
    if (e.target.matches("[data-cp-photo]") && e.target.files[0]) processPhoto(e.target.files[0]);
    if (e.target.matches("[data-cp-files]") && e.target.files.length) addFiles(e.target.files);
    if (e.target.matches("[data-cp-role]")) { cp.files[e.target.dataset.cpRole].role = e.target.value; syncDocs(); render(); }
  });
  document.addEventListener("dragover", (e) => { const z = e.target.closest && e.target.closest("[data-cp-drop]"); if (z) { e.preventDefault(); z.classList.add("over"); } });
  document.addEventListener("dragleave", (e) => { const z = e.target.closest && e.target.closest("[data-cp-drop]"); if (z) z.classList.remove("over"); });
  document.addEventListener("drop", (e) => { const z = e.target.closest && e.target.closest("[data-cp-drop]"); if (z) { e.preventDefault(); z.classList.remove("over"); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); } });

  window.renderCarePlanBuilder = function () {
    const title = document.querySelector("#workflow-title");
    title.textContent = "AI Care Plan Builder";
    document.querySelector("#generate-ai").hidden = true;
    document.querySelector(".actions-panel").hidden = true;
    document.querySelector("#status-strip").hidden = true;
    render();
  };
})();
