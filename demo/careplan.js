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
      notes: ORIGINAL.managerNotes || "", liveRun: false, error: "",
      stage: 0, busy: false, answers: {}, resolved: {}, regen: {}, reviewed: {},
      qaResolved: {}, approver: "", declaration: false, approved: false, blockedMsg: "",
      sel: 1, factFilter: "all"
    });
  }
  reset();

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const mark = (s) => esc(s).replace(/\[(TO BE VERIFIED[^\]]*|INFORMATION REQUIRED[^\]]*)\]/g, '<mark class="cp-flag">[$1]</mark>').replace(/\n/g, "<br>");
  const sectionText = (s) => (cp.regen[s.order] ? s.final : s.draft);
  const openClar = () => D.clarifications.filter((_, i) => !cp.resolved[i]).length;
  const openBlocking = () => D.qa.filter((q, i) => q.severity === "Blocking" && !cp.qaResolved[i]).length;
  const notReviewed = () => D.sections.filter((s) => !cp.reviewed[s.order]).length;

  function checks() {
    const out = [];
    if (cp.stage < 5) out.push("draft not ready for review yet");
    if (notReviewed()) out.push(`${notReviewed()} section(s) not marked Reviewed`);
    if (openBlocking()) out.push(`${openBlocking()} blocking QA finding(s) open`);
    if (openClar()) out.push(`${openClar()} clarification(s) open`);
    if (!cp.approver.trim()) out.push("no approver named");
    if (!cp.declaration) out.push("approver declaration not ticked");
    return out;
  }

  function work(label, fn, liveFn) {
    cp.busy = label; cp.error = ""; render();
    if (liveFn && live()) {
      liveFn().then(() => { cp.liveRun = true; fn(); })
        .catch((e) => { cp.error = "Live AI unavailable (" + e.message + ") – showing the recorded result instead."; fn(); })
        .finally(() => { cp.busy = false; render(); });
      return;
    }
    setTimeout(() => { cp.busy = false; fn(); render(); }, 1400);
  }
  const api = (workflow, fields) => window.SSLive.call("/api/generate", { workflow, fields }, 90000).then((r) => r.output);

  function stepper() {
    return `<ol class="cp-stepper">${STAGES.map((s, i) => `
      <li class="${i < cp.stage || cp.approved ? "done" : i === cp.stage ? "current" : ""}">
        <span>${i < cp.stage || cp.approved ? "✓" : i + 1}</span>${s}</li>`).join("")}</ol>`;
  }

  function jobCard() {
    const status = cp.approved ? "APPROVED" : ["CREATED", "UPLOAD_RECEIVED", "REVIEW_REQUIRED", "READY_TO_GENERATE", "DRAFT_READY", "MANAGER_REVIEW", "READY_FOR_APPROVAL"][cp.stage];
    return `<div class="cp-job">
      <div><span class="label">Care plan job</span><h3>${esc(D.job.ref)} · ${esc(D.job.su)}</h3>
      <p class="cp-muted">${esc(D.job.location)} · Anonymised test data only</p></div>
      <span class="cp-status ${cp.approved ? "ok" : ""}">${status}</span></div>`;
  }

  function busyBox() {
    return (cp.busy ? `<div class="cp-busy"><span class="cp-spinner"></span>${esc(cp.busy)}</div>` : "")
      + (cp.error ? `<div class="cp-qa warn"><p>${esc(cp.error)}</p></div>` : "");
  }

  // ---- stage views ----
  function vUpload() {
    return `<div class="panel cp-panel">
      <span class="label">Step 1 · Upload source documents</span>
      <h3>Upload the referral pack</h3>
      <p class="cp-muted">Typed, scanned or photographed documents. Each file is read, classified and checked for legibility.</p>
      ${live() ? `<p class="cp-live-note">Live AI is on. Change anything in these fictional documents – for example the allergy line – and the AI will work from your version.</p>
      <div class="cp-srcdocs">${D.sourceDocs.map((d, i) => `<label class="cp-srcdoc"><strong>${esc(d.name)}</strong><textarea data-cp-doc="${i}" rows="9">${esc(d.text)}</textarea></label>`).join("")}</div>` : `
      <div class="cp-docs">${D.docs.map((d) => `
        <div class="cp-doc"><div class="cp-doc-icon">PDF</div><div><strong>${esc(d.name)}</strong>
        <p class="cp-muted">${d.pages} page${d.pages > 1 ? "s" : ""} · uploaded</p></div></div>`).join("")}</div>`}
      ${busyBox()}
      <button class="primary-button" data-cp="extract" ${cp.busy ? "disabled" : ""}>Extract information with AI</button>
    </div>`;
  }

  function vExtract() {
    const kinds = ["all", "Needs verification", "Recommendation", "Opinion", "Unclear"];
    const list = D.facts.filter((f) => cp.factFilter === "all" || f.verification === cp.factFilter || f.kind === cp.factFilter);
    return `<div class="panel cp-panel">
      <span class="label">Step 2 · AI 1 extraction</span>
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
      <span class="label">Step 3 · AI 2 analysis · manager clarifications</span>
      <h3>${D.clarifications.length} questions for the manager · ${openClar()} open</h3>
      <p class="cp-summary">${esc(D.analysis)}</p>
      <div class="cp-clar-list">${D.clarifications.map((c, i) => `
        <div class="cp-clar ${cp.resolved[i] ? "resolved" : ""}">
          <div class="cp-clar-head">
            <span class="cp-pill ${c.reason === "Conflict" ? "bad" : "warn"}">${esc(c.reason)}</span>
            ${c.safety ? '<span class="cp-pill bad">Safety-critical</span>' : ""}
            <span class="cp-muted">${esc(c.section)} · ${esc(c.sources)}</span></div>
          <p>${esc(c.q)}</p>
          ${cp.resolved[i] ? `<div class="cp-answer"><strong>Manager answer:</strong> ${esc(cp.answers[i])}</div>` : `
          <textarea data-cp-answer="${i}" rows="2" placeholder="Manager answer">${esc(cp.answers[i] ?? c.answer ?? "")}</textarea>
          <button class="ghost-button small" data-cp-resolve="${i}">Save answer and resolve</button>`}
        </div>`).join("")}</div>
      ${busyBox()}
      ${cp.liveRun ? `<label class="cp-field wide">What the manager knows (used to answer the questions above)<textarea data-cp-notes rows="5">${esc(cp.notes)}</textarea></label>` : ""}
      <div class="cp-row">
        <button class="ghost-button" data-cp="resolveall" ${openClar() ? "" : "disabled"}>${cp.liveRun ? "Answer all from the manager's notes" : "Resolve all with the suggested answers"}</button>
        <button class="primary-button" data-cp="draft" ${openClar() || cp.busy ? "disabled" : ""}>Generate the 25-section care plan</button>
      </div>
      ${openClar() ? '<p class="cp-muted">Drafting is locked until every question is answered. The AI never guesses to resolve a conflict.</p>' : ""}
    </div>`;
  }

  function sectionViewer(withReview) {
    const s = D.sections.find((x) => x.order === cp.sel);
    const qaHere = D.qa.map((q, i) => ({ ...q, i })).filter((q) => q.regen === s.order && !cp.qaResolved[q.i]);
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
        <div class="cp-text">${mark(sectionText(s))}</div>
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
      <span class="label">Step ${cp.stage === 4 ? "4 · AI 3 draft" : "5–6 · AI 4 quality check and manager review"}</span>
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
      <span class="label">Step 7 · Manager approval gate</span>
      <h3>${cp.approved ? "Care plan approved" : "Approve the care plan"}</h3>
      <ul class="cp-checks">
        <li class="${notReviewed() ? "" : "ok"}">All 25 sections reviewed</li>
        <li class="${openBlocking() ? "" : "ok"}">No open blocking quality findings</li>
        <li class="${openClar() ? "" : "ok"}">All clarifications answered</li>
        <li class="${cp.approver.trim() ? "ok" : ""}">Approver named</li>
        <li class="${cp.declaration ? "ok" : ""}">Approver declaration ticked</li>
      </ul>
      ${cp.approved ? `<p class="cp-summary">Approved by ${esc(cp.approver)} on ${new Date().toLocaleDateString("en-GB")}. Logged to the audit trail. Signatures are added by hand – never generated.</p>
        <div class="cp-row"><a class="primary-button" href="${finalFile}" download>Download approved Word care plan</a>
        <button class="ghost-button" data-cp="back">Back to sections</button></div>` : `
      <label class="cp-field">Approver (registered / service manager)<input data-cp-approver value="${esc(cp.approver)}" placeholder="Name"></label>
      <label class="cp-check"><input type="checkbox" data-cp-decl ${cp.declaration ? "checked" : ""}> I have reviewed this plan against the source documents and confirm it is accurate and appropriate. I understand the AI drafted it and I am responsible for its content.</label>
      ${cp.blockedMsg ? `<div class="cp-qa bad"><strong>Approval blocked</strong><p>${esc(cp.blockedMsg)}</p></div>` : ""}
      <div class="cp-row"><button class="primary-button" data-cp="approve">Approve care plan</button>
        <a class="ghost-button" href="${draftFile}" download>Download draft (watermarked)</a>
        <button class="ghost-button" data-cp="back">Back to sections</button></div>`}
    </div>`;
  }

  function render() {
    const el = document.querySelector("#workflow-layout");
    el.className = "cp-layout";
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
    const b = e.target.closest("[data-cp],[data-cp-filter],[data-cp-resolve],[data-cp-sel],[data-cp-review],[data-cp-regen]");
    if (!b || !document.querySelector(".cp-layout")) return;
    const a = b.dataset.cp;
    if (b.dataset.cpFilter) { cp.factFilter = b.dataset.cpFilter; return render(); }
    if (b.dataset.cpResolve) {
      const i = +b.dataset.cpResolve; const t = document.querySelector(`[data-cp-answer="${i}"]`);
      if (!t.value.trim()) return; cp.answers[i] = t.value; cp.resolved[i] = true;
      if (!openClar()) cp.stage = 3; return render();
    }
    if (b.dataset.cpSel) { cp.sel = +b.dataset.cpSel; if (cp.stage === 6 && !cp.approved) cp.stage = 5; return render(); }
    if (b.dataset.cpReview) { const o = +b.dataset.cpReview; cp.reviewed[o] = !cp.reviewed[o]; return render(); }
    if (b.dataset.cpRegen) {
      const i = +b.dataset.cpRegen; const q = D.qa[i];
      const sec = D.sections.find((x) => x.order === q.regen);
      return work("AI is redrafting the section using your comment…", () => {
        cp.regen[q.regen] = true; if (!cp.liveRun && q.regen === 12) cp.regen[20] = true;
        cp.qaResolved[i] = true; cp.reviewed[q.regen] = false;
      }, sec ? async () => {
        const o = await api("careplan_regen", { title: sec.title, text: sectionText(sec), comment: q.comment, facts: factLines(), answers: answerLines() });
        sec.final = o.text;
      } : null);
    }
    if (a === "extract") return work("AI 1 is reading and classifying the documents…", () => { cp.stage = 1; }, async () => {
      const docs = D.sourceDocs.map((d) => `=== DOCUMENT: ${d.name} ===\n${d.text}`).join("\n\n");
      const o = await api("careplan_extract", { documents: docs });
      D.facts = o.facts;
      D.docs = D.sourceDocs.map((d) => ({ name: d.name, pages: (d.text.match(/\[Page/g) || [1]).length, type: (o.documents.find((x) => x.name === d.name) || {}).type || "Classified", facts: o.facts.filter((f) => f.source.includes(d.name.replace("TEST ", ""))).length }));
    });
    if (a === "analyse") return work("AI 2 is cross-checking facts for gaps and conflicts…", () => { cp.stage = 2; }, async () => {
      const o = await api("careplan_analyse", { facts: factLines() });
      D.analysis = o.analysis_summary;
      D.clarifications = o.clarifications.map((c) => ({ ...c, answer: "" }));
      cp.answers = {}; cp.resolved = {};
    });
    if (a === "resolveall") {
      D.clarifications.forEach((c, i) => { if (!cp.resolved[i]) { cp.answers[i] = cp.answers[i] || c.answer || "See manager notes."; cp.resolved[i] = true; } });
      cp.stage = 3; return render();
    }
    if (a === "draft") return work("AI 3 is drafting all 25 sections from the evidence – about 30 seconds…", () => { cp.stage = 4; cp.sel = 5; }, async () => {
      const o = await api("careplan_draft", { facts: factLines(), answers: answerLines(), reference: D.job.su });
      const byOrder = new Map(o.sections.map((x) => [Math.round(x.order), x]));
      D.sections = D.sections.map((sec) => { const n = byOrder.get(sec.order); return n ? { ...sec, draft: n.text, final: n.text, sources: n.sources } : sec; });
      cp.regen = {};
    });
    if (a === "qa") return work("AI 4 is checking the draft for safety and quality…", () => { cp.stage = 5; }, async () => {
      const draft = D.sections.map((x) => `## ${x.title}\n${sectionText(x)}`).join("\n\n");
      const o = await api("careplan_qa", { facts: factLines(), answers: answerLines(), draft });
      D.qaSummary = o.qa_summary;
      D.qa = o.findings.map((f) => ({ ...f, regen: Math.round(f.regen) || 1, comment: f.action }));
      cp.qaResolved = {};
    });
    if (a === "reviewall") { D.sections.forEach((s) => { cp.reviewed[s.order] = true; }); return render(); }
    if (a === "toapprove") { cp.stage = 6; cp.blockedMsg = ""; return render(); }
    if (a === "back") { cp.stage = 5; return render(); }
    if (a === "approve") {
      const c = checks();
      if (c.length) { cp.blockedMsg = c.join("; "); return render(); }
      cp.approved = true; cp.blockedMsg = ""; return render();
    }
    if (a === "reset") { reset(); return render(); }
  });
  document.addEventListener("input", (e) => {
    if (e.target.matches("[data-cp-doc]")) D.sourceDocs[e.target.dataset.cpDoc].text = e.target.value;
    if (e.target.matches("[data-cp-notes]")) cp.notes = e.target.value;
    if (e.target.matches("[data-cp-approver]")) cp.approver = e.target.value;
    if (e.target.matches("[data-cp-answer]")) cp.answers[e.target.dataset.cpAnswer] = e.target.value;
    if (e.target.matches("[data-cp-comment]")) D.qa[e.target.dataset.cpComment].comment = e.target.value;
  });
  document.addEventListener("change", (e) => {
    if (e.target.matches("[data-cp-decl]")) { cp.declaration = e.target.checked; render(); }
  });

  window.renderCarePlanBuilder = function () {
    const title = document.querySelector("#workflow-title");
    title.textContent = "AI Care Plan Builder";
    document.querySelector("#generate-ai").hidden = true;
    document.querySelector(".actions-panel").hidden = true;
    document.querySelector("#status-strip").hidden = true;
    render();
  };
})();
