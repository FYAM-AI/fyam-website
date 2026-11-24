const workflows = {
  incident: {
    title: "Incident Automation",
    inputHeading: "Report an Incident",
    outputHeading: "Incident AI fields",
    promptName: "Incident Automation Prompt",
    fields: [
      { name: "Residents Involved", value: "Daniel Roberts", type: "text" },
      { name: "Staff Name", value: "Emma Jones", type: "text" },
      { name: "Service Location", value: "Maple House", type: "select", options: ["Maple House", "Oak View", "Rose Court"] },
      { name: "Date & Time of Incident", value: "2026-03-01T16:19", type: "datetime-local" },
      { name: "Incident Description", value: "At approximately 18:45, loud shouting was heard coming from Daniel's room. Staff entered due to health and safety concerns. Daniel appeared distressed, was pacing, and reported that people were trying to harm him. He became verbally aggressive and attempted to leave the property without informing staff.", type: "textarea", prompt: "Describe what happened in detail" },
      { name: "Immediate Actions Taken", value: "Staff contacted the Mental Health Team and were advised to use de-escalation techniques. Staff spoke calmly, offered reassurance, contacted the on-call manager, and continued monitoring. Daniel calmed after approximately 20 minutes.", type: "textarea", prompt: "What actions were taken at the time?" },
      { name: "Cause of Incident", value: "Behavioural", type: "select", options: ["Behavioural", "Environmental", "Medication", "Unknown"] },
      { name: "Injury Type", value: "None", type: "select", options: ["None", "Minor", "Moderate", "Serious"] },
      { name: "Preventive Actions", value: "Review support plan and medication compliance. Consider additional Mental Health Team and PBS input. Staff to refer to PBS plan and use de-escalation techniques.", type: "textarea", prompt: "What can be done to prevent this happening again?" }
    ],
    aiFields: ["AI Summary", "Risk Level", "Suggested Actions / Learning"],
    generate: generateIncident
  },
  referral: {
    title: "Referral Automation",
    inputHeading: "New Referral",
    outputHeading: "Referral AI fields",
    promptName: "Referral Automation Prompt",
    fields: [
      { name: "Service User Name", value: "Daniel Roberts", type: "text" },
      { name: "Date of Birth", value: "1989-05-12", type: "date" },
      { name: "Location", value: "Birmingham", type: "text" },
      { name: "Funding Authority", value: "Birmingham City Council", type: "text" },
      { name: "Referral Category", value: "Mental Health", type: "select", options: ["Mental Health", "Learning Disability", "Complex Care"] },
      { name: "Referrer Contact Details", value: "Sarah Khan, Social Worker. Contact via council referral team.", type: "textarea" },
      { name: "Primary Diagnosis", value: "Schizophrenia", type: "text" },
      { name: "Reason for Referral", value: "Daniel has been struggling to maintain his current tenancy due to worsening mental health. There have been multiple reports from neighbours regarding shouting and distress during the night. He has recently disengaged from community mental health services and requires a structured and supported environment.", type: "textarea", prompt: "Why is the individual being referred?" },
      { name: "Current Support Level", value: "High", type: "select", options: ["Low", "Medium", "High"] },
      { name: "Risk Indicators", value: "Aggression, Self-harm, Non-engagement", type: "multiselect", options: ["Aggression", "Self-harm", "Substance misuse", "Absconding", "Non-engagement"] },
      { name: "Other Information", value: "History of placement breakdowns. Benefits from structured routine and consistent staffing. Referral contact is the social worker, best time afternoons.", type: "textarea" }
    ],
    aiFields: ["AI Summary", "Key Risks", "Recommended Support"],
    generate: generateReferral
  },
  onboarding: {
    title: "Staff Onboarding Automation",
    inputHeading: "Add New Staff Member",
    outputHeading: "Onboarding AI fields",
    promptName: "Staff Onboarding Automation Prompt",
    fields: [
      { name: "Staff Name", value: "Sara Smith", type: "text" },
      { name: "Role", value: "Support Worker", type: "text" },
      { name: "Service Location", value: "Maple House", type: "select", options: ["Maple House", "Oak View", "Rose Court"] },
      { name: "Start Date", value: "2026-03-01", type: "date" },
      { type: "section", label: "Compliance Section" },
      { name: "DBS Status", value: "Not Started", type: "select", options: ["Not Started", "In Progress", "Completed"] },
      { name: "DBS Certificate Number", value: "", type: "text" },
      { name: "ID Verified", value: true, type: "checkbox" },
      { name: "Right to Work Verified", value: true, type: "checkbox" },
      { name: "References Status", value: "None", type: "select", options: ["None", "Pending", "Complete"] },
      { type: "section", label: "Documents Section" },
      { name: "Documents Provided", value: "NI Number, Proof of Address, CV, Application Form", type: "multiselect", options: ["NI Number", "Proof of Address", "CV", "Application Form"] },
      { name: "Forms Signed", value: "Contract, Handbook, Confidentiality, Equal Opportunities", type: "multiselect", options: ["Contract", "Handbook", "Confidentiality", "Equal Opportunities"] }
    ],
    aiFields: ["Missing Requirements", "Training Checklist", "Onboarding Status"],
    generate: generateOnboarding
  },
  compliance: {
    title: "Compliance Checklist Automation",
    inputHeading: "Monthly Compliance Audit",
    outputHeading: "Compliance AI fields",
    promptName: "Compliance Checklist Automation Prompt",
    fields: [
      { name: "Audit Name", value: "March 2026 Audit", type: "text", prompt: "e.g. March 2026 Audit" },
      { name: "Service Location", value: "Rose Court", type: "select", options: ["Maple House", "Oak View", "Rose Court"] },
      { name: "Audit Date", value: "2026-03-31", type: "date" },
      { name: "Client Files Checklist", value: "Contract signed, Care plan signed, Risk assessments up to date", type: "multiselect", options: ["Contract signed", "Care plan signed", "Risk assessments up to date"] },
      { name: "Records Checklist", value: "Records up to date, Entries signed, Incident forms completed", type: "multiselect", options: ["Records up to date", "Entries signed", "Incident forms completed"] },
      { name: "Medication Checklist", value: "MAR sheet up to date, Medication stored correctly, Staff trained", type: "multiselect", options: ["MAR sheet up to date", "Medication stored correctly", "Staff trained"] },
      { name: "Staffing Checklist", value: "Staffing levels adequate, Staff trained", type: "multiselect", options: ["Staffing levels adequate", "Staff trained", "Team meetings held"] },
      { name: "Additional Notes", value: "Additional training required has been identified for some staff.", type: "textarea" }
    ],
    aiFields: ["Review Notes", "Action Required", "Overall Compliance Status"],
    generate: generateCompliance
  },
  cqc: {
    title: "CQC Report Generator",
    inputHeading: "Generate CQC Inspection Report",
    outputHeading: "Generated CQC report",
    promptName: "CQC Report Generator Prompt",
    fields: [
      { name: "Report Name", value: "Jan-March 2026 Report", type: "text", prompt: "e.g. Jan-March 2026 Report" },
      { name: "Service Location", value: "Rose Court", type: "select", options: ["Maple House", "Oak View", "Rose Court"] },
      { name: "Reporting Period", value: "Last 3 months", type: "select", options: ["Last 4 weeks", "Last 3 months", "Last 6 months"] },
      { type: "section", label: "Manager Input Sections" },
      { name: "Improvements Made", value: "Some initial steps have been taken to improve record keeping and staff training.", type: "textarea", prompt: "What improvements have been made during this period?" },
      { name: "Challenges & Actions Taken", value: "The service has faced ongoing staffing shortages and multiple incidents. Actions have been reactive rather than proactive.", type: "textarea", prompt: "What challenges were faced and how were they addressed?" },
      { name: "Safeguarding Actions & Learning", value: "Multiple safeguarding concerns were raised. While these were reported, learning has not been consistently embedded.", type: "textarea" },
      { name: "Governance & Oversight", value: "Audits and supervisions have been inconsistent. Management oversight has been limited.", type: "textarea" },
      { name: "Positive Outcomes", value: "Some improvement in staff awareness, but overall impact remains limited.", type: "textarea" },
      { name: "Additional Inspector Notes", value: "The service requires significant improvement in governance, staffing, and compliance processes.", type: "textarea" },
      { type: "section", label: "Operational Data" },
      { name: "Incidents Summary", value: "", type: "textarea" },
      { name: "Compliance Summary", value: "", type: "textarea" },
      { name: "Staffing Summary", value: "", type: "textarea" }
    ],
    aiFields: ["Generated CQC Report"],
    generate: generateCqc
  }
};

const state = {
  view: "overview",
  active: "incident",
  values: {},
  outputs: {},
  reviewed: {},
  approved: {},
  actions: [],
  selectedRecord: {}
};

const demoRecords = {
  incident: [
    { title: "Daniel Roberts", location: "Maple House", date: "1 Mar 2026", status: "High", detail: "Behavioural incident, no injury" },
    { title: "Aisha Begum", location: "Rose Court", date: "1 Mar 2026", status: "Medium", detail: "Environmental trigger, property damage" },
    { title: "Michael Turner", location: "Oak View", date: "5 Mar 2026", status: "High", detail: "Alcohol-related concern, investigation required" },
    { title: "David Clarke", location: "Maple House", date: "9 Mar 2026", status: "Medium", detail: "Verbal aggression in communal area" }
  ],
  referral: [
    { title: "Daniel Roberts", location: "Birmingham", date: "March 2026", status: "High", detail: "Mental Health referral" },
    { title: "Aisha Begum", location: "Leicester", date: "March 2026", status: "Medium", detail: "Learning Disability referral" },
    { title: "Michael Turner", location: "Coventry", date: "March 2026", status: "High", detail: "Complex substance misuse support" }
  ],
  onboarding: [
    { title: "Sara Smith", location: "Maple House", date: "Starts 1 Mar", status: "Red", detail: "DBS not started, references incomplete" },
    { title: "James Carter", location: "Oak View", date: "Started 1 Feb", status: "Amber", detail: "DBS in progress, one reference received" },
    { title: "Priya Singh", location: "Rose Court", date: "Started 5 Jan", status: "Green", detail: "Core onboarding complete" }
  ],
  compliance: [
    { title: "March 2026 Audit", location: "Rose Court", date: "31 Mar", status: "Amber", detail: "Training follow-up required" },
    { title: "February 2026 Audit", location: "Oak View", date: "28 Feb", status: "Amber", detail: "Oversight and supervision gaps" },
    { title: "January 2026 Audit", location: "Maple House", date: "31 Jan", status: "Green", detail: "Core checks completed" }
  ],
  cqc: [
    { title: "Jan-March 2026 Report", location: "Rose Court", date: "Last 3 months", status: "Draft", detail: "Governance and staffing improvement focus" },
    { title: "February 2026 Report", location: "Oak View", date: "Last month", status: "Draft", detail: "Training and record keeping evidence" },
    { title: "January 2026 Report", location: "Maple House", date: "Last month", status: "Ready", detail: "Medication and communication improvements" }
  ]
};

for (const [key, workflow] of Object.entries(workflows)) {
  state.values[key] = Object.fromEntries(workflow.fields
    .filter((field) => field.name)
    .map((field) => [field.name, field.value]));
}

let form = document.querySelector("#workflow-form");
let outputsEl = document.querySelector("#outputs");
const workflowTitle = document.querySelector("#workflow-title");
let inputHeading = document.querySelector("#input-heading");
let outputHeading = document.querySelector("#output-heading");
let reviewStatus = document.querySelector("#review-status");
let managerNotes = document.querySelector("#manager-notes");
const workflowLayout = document.querySelector("#workflow-layout");
const statusStrip = document.querySelector("#status-strip");
const actionsPanel = document.querySelector(".actions-panel");
const generateButton = document.querySelector("#generate-ai");

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

generateButton.addEventListener("click", generateActiveWorkflow);
document.querySelector("#reset-demo").addEventListener("click", resetDemo);
document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (button) {
    if (button.dataset.openCareplan) setView("careplan");
    if (button.dataset.go) setView(button.dataset.go);
    if (button.dataset.openForm) setActiveWorkflow(button.dataset.openForm);
    if (button.dataset.openRecords) setView(`records:${button.dataset.openRecords}`);
    if (button.dataset.downloadRecordKey) downloadRecord(button.dataset.downloadRecordKey, Number(button.dataset.downloadRecordIndex));
    if (button.dataset.downloadAllKey) downloadAllRecords(button.dataset.downloadAllKey);
    if (button.id === "upload-incident-image") document.querySelector("#incident-image-upload")?.click();
    if (button.id === "mark-review") {
      state.reviewed[state.active] = true;
      renderReviewStatus();
    }
    if (button.id === "approve-output") {
      if (!state.outputs[state.active]) generateActiveWorkflow();
      state.approved[state.active] = true;
      state.reviewed[state.active] = true;
      renderReviewStatus();
    }
    return;
  }

  const row = event.target.closest("[data-record-key]");
  if (row) {
    state.selectedRecord[row.dataset.recordKey] = Number(row.dataset.recordIndex);
    renderRecordsPage(row.dataset.recordKey);
  }
});

document.addEventListener("change", (event) => {
  if (event.target.id === "incident-image-upload") autofillIncidentFromImage(event.target.files?.[0]);
});

function setView(view) {
  saveFormValues();
  state.view = view;
  if (view.startsWith("records:")) {
    state.active = view.split(":")[1];
  }
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === view);
  });
  renderPage();
}

function setActiveWorkflow(key) {
  saveFormValues();
  state.view = `form:${key}`;
  state.active = key;
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.remove("is-active");
  });
  if (key === "cqc") hydrateCqcSourceFields();
  renderPage();
}

function renderPage() {
  if (state.view === "careplan") {
    window.renderCarePlanBuilder();
    return;
  }
  if (state.view === "overview") {
    renderOverview();
    return;
  }
  if (state.view === "new") {
    renderNewRecordsPage();
    return;
  }
  if (state.view.startsWith("records:")) {
    renderRecordsPage(state.view.split(":")[1]);
    return;
  }
  renderWorkflow();
}

function setCommonPage(title, showAiButton = false) {
  workflowTitle.textContent = title;
  generateButton.hidden = !showAiButton;
  actionsPanel.hidden = !showAiButton;
  statusStrip.hidden = true;
}

function renderWorkflow() {
  workflowLayout.className = "workflow-layout";
  workflowLayout.innerHTML = `
    <div class="panel input-panel">
      <div class="panel-heading">
        <div>
          <span class="label">User input fields</span>
          <h3 id="input-heading"></h3>
        </div>
        <div class="form-tools">
          ${state.active === "incident" ? `
            <button class="ghost-button small" type="button" id="upload-incident-image">Upload image</button>
            <input class="visually-hidden" id="incident-image-upload" type="file" accept="image/*">
          ` : ""}
          <span class="status-pill" id="input-status">Ready for AI</span>
        </div>
      </div>
      <form id="workflow-form"></form>
    </div>

    <div class="panel output-panel">
      <div class="panel-heading">
        <div>
          <span class="label">AI automated fields</span>
          <h3 id="output-heading"></h3>
        </div>
        <span class="status-pill muted" id="review-status">Not generated</span>
      </div>
      <div id="outputs" class="outputs empty-state">AI outputs will appear here after generation.</div>
      <div class="review-box">
        <label for="manager-notes">Manager review notes</label>
        <textarea id="manager-notes" rows="4" placeholder="Add review notes before approving the AI draft."></textarea>
        <div class="review-actions">
          <button class="ghost-button" type="button" id="mark-review">Mark as reviewed</button>
          <button class="primary-button small" type="button" id="approve-output">Approve draft</button>
        </div>
      </div>
    </div>`;
  form = document.querySelector("#workflow-form");
  outputsEl = document.querySelector("#outputs");
  inputHeading = document.querySelector("#input-heading");
  outputHeading = document.querySelector("#output-heading");
  reviewStatus = document.querySelector("#review-status");
  managerNotes = document.querySelector("#manager-notes");
  statusStrip.hidden = true;
  actionsPanel.hidden = false;
  setCommonPage(workflows[state.active].title, true);
  const workflow = workflows[state.active];
  inputHeading.textContent = workflow.inputHeading;
  outputHeading.textContent = workflow.outputHeading;
  form.innerHTML = `<div class="field-grid">${workflow.fields.map(renderField).join("")}</div>`;
  form.querySelectorAll("[data-field]").forEach((control) => {
    control.addEventListener("input", saveFormValues);
    control.addEventListener("change", saveFormValues);
  });
  managerNotes.value = state.values[state.active]["Manager Notes"] || "";
  managerNotes.oninput = () => {
    state.values[state.active]["Manager Notes"] = managerNotes.value;
  };
  renderOutputs();
  renderReviewStatus();
  renderMetrics();
}

function renderOverview() {
  setCommonPage("Overview", false);
  statusStrip.hidden = true;
  actionsPanel.hidden = true;
  workflowLayout.className = "dashboard-grid";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const attention = [
    { tone: "red", tag: "Care plan", text: "Care plan SU-TEST-001 is waiting for your approval", meta: "25 sections drafted · quality check passed", go: "careplan", cta: "Review" },
    { tone: "red", tag: "Incident", text: "2 high-risk incidents need a manager review", meta: "Maple House and Oak View · this month", go: "records:incident", cta: "Open" },
    { tone: "amber", tag: "Onboarding", text: "Sara Smith starts soon with no DBS check started", meta: "References also incomplete", go: "records:onboarding", cta: "Open" },
    { tone: "amber", tag: "Compliance", text: "Rose Court audit is Amber – staff training follow-up", meta: "March 2026 audit", go: "records:compliance", cta: "Open" },
    { tone: "blue", tag: "CQC", text: "Quarterly CQC evidence report is ready to generate", meta: "Pulls from incidents, compliance and onboarding", go: "records:cqc", cta: "Generate" }
  ];
  workflowLayout.innerHTML = `
    <section class="welcome wide">
      <div>
        <p class="welcome-kicker">${greeting}</p>
        <h3>You have ${attention.length} things that need your attention today.</h3>
        <p>Smart Summarise drafts the paperwork. You review, decide and approve.</p>
      </div>
      <div class="welcome-stats">
        <div><strong>4</strong><span>Incidents this month</span></div>
        <div><strong>3</strong><span>Open referrals</span></div>
        <div><strong>1</strong><span>Care plan to approve</span></div>
      </div>
    </section>
    <section class="panel dashboard-panel wide attention">
      <div class="panel-heading"><div><h3>Needs your attention</h3></div></div>
      <ul class="attention-list">
        ${attention.map((a) => `
          <li class="att-${a.tone}">
            <span class="att-tag">${escapeHtml(a.tag)}</span>
            <div><strong>${escapeHtml(a.text)}</strong><p>${escapeHtml(a.meta)}</p></div>
            <button class="ghost-button small" type="button" data-go="${a.go}">${escapeHtml(a.cta)}</button>
          </li>`).join("")}
      </ul>
    </section>
    <section class="panel dashboard-panel">
      <div class="panel-heading"><div><h3>This month</h3></div></div>
      <div class="overview-cards">
        ${renderMetricCard("Incidents", demoRecords.incident.length, "2 high risk", "incident", "coral")}
        ${renderMetricCard("Referrals", demoRecords.referral.length, "2 high support", "referral", "sky")}
        ${renderMetricCard("Staff onboarding", demoRecords.onboarding.length, "1 red item", "onboarding", "mint")}
        ${renderMetricCard("Compliance", "Amber", "Latest audit", "compliance", "amber")}
      </div>
    </section>
    <section class="panel dashboard-panel">
      <div class="panel-heading"><div><h3>Activity by service</h3></div></div>
      <div class="bar-chart">
        ${renderBar("Maple House", 4, 5)}
        ${renderBar("Oak View", 3, 5)}
        ${renderBar("Rose Court", 3, 5)}
      </div>
    </section>`;
  renderMetrics();
}

function renderMetricCard(label, value, detail, recordsKey, tone = "sky") {
  return `
    <article class="metric-card tone-${tone}">
      <span>${escapeHtml(label)}</span>
      <strong class="${statusClass(value)}">${escapeHtml(value)}</strong>
      <p>${escapeHtml(detail)}</p>
      <button class="text-link" type="button" data-open-records="${recordsKey}">View all</button>
    </article>`;
}

function renderBar(label, value, max) {
  return `
    <div class="bar-row">
      <span>${escapeHtml(label)}</span>
      <div class="bar-track"><div class="bar-fill" style="width: ${(value / max) * 100}%"></div></div>
      <strong>${escapeHtml(value)}</strong>
    </div>`;
}

function renderRecordLink(label, key) {
  return `<button class="record-link" type="button" data-open-records="${key}">${escapeHtml(label)}</button>`;
}

function renderNewRecordsPage() {
  setCommonPage("Add New Record", false);
  statusStrip.hidden = true;
  actionsPanel.hidden = true;
  workflowLayout.className = "quick-actions-grid";
  workflowLayout.innerHTML = `
    ${renderActionCard("Report an Incident", "Create an incident record and generate summary, risk level, and learning actions.", "incident")}
    ${renderActionCard("New Referral", "Capture referral details and generate needs, risks, and recommended support.", "referral")}
    ${renderActionCard("Staff Onboarding", "Add a new staff member and generate missing requirements, training, and status.", "onboarding")}
    ${renderActionCard("Monthly Compliance Audit", "Complete the monthly checklist and generate review notes, actions, and compliance status.", "compliance")}
    ${renderActionCard("Generate CQC Inspection Report", "Create an inspection-ready report from manager input and operational summaries.", "cqc")}
    <article class="quick-card">
      <span class="label">New</span>
      <h3>Build a Care Plan</h3>
      <p>Upload a referral pack and get a 25-section, person-centred care plan in Word – checked for safety and approved by a manager.</p>
      <button class="primary-button" type="button" data-open-careplan="1">Open builder</button>
    </article>`;
}

function renderActionCard(title, text, workflowKey) {
  return `
    <article class="quick-card">
      <span class="label">Create</span>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(text)}</p>
      <button class="primary-button" type="button" data-open-form="${workflowKey}">Open form</button>
    </article>`;
}

function renderRecordsPage(key) {
  const workflow = workflows[key];
  const cqcDraft = key === "cqc" ? generateCqc(state.values.cqc)["Generated CQC Report"] : "";
  const selectedIndex = state.selectedRecord[key] ?? 0;
  const selectedRecord = demoRecords[key][selectedIndex];
  setCommonPage(recordPageTitle(key), false);
  statusStrip.hidden = true;
  actionsPanel.hidden = true;
  workflowLayout.className = "records-layout";
  workflowLayout.innerHTML = `
    <section class="panel records-panel">
      <div class="panel-heading">
        <div>
          <span class="label">Record view</span>
          <h3>${escapeHtml(recordPageTitle(key))}</h3>
        </div>
        <div class="record-toolbar">
          <button class="ghost-button small" type="button" data-download-all-key="${key}">Download all</button>
          <button class="primary-button small" type="button" data-open-form="${key}">${key === "cqc" ? "Generate report" : "Add new"}</button>
        </div>
      </div>
      <div class="records-table">
        ${demoRecords[key].map((record, index) => renderRecordRow(record, key, index, selectedIndex)).join("")}
      </div>
    </section>
    <section class="panel records-side">
      <span class="label">Selected record</span>
      <h3>${escapeHtml(selectedRecord.title)}</h3>
      <div class="detail-list">
        <p><strong>Location:</strong> ${escapeHtml(selectedRecord.location)}</p>
        <p><strong>Date/Period:</strong> ${escapeHtml(selectedRecord.date)}</p>
        <p><strong>Status:</strong> ${escapeHtml(selectedRecord.status)}</p>
        <p><strong>Summary:</strong> ${escapeHtml(selectedRecord.detail)}</p>
      </div>
      <button class="download-button" type="button" data-download-record-key="${key}" data-download-record-index="${selectedIndex}">Download selected</button>
    </section>
    ${key === "cqc" ? `
      <section class="panel approved-draft-panel">
        <div class="panel-heading">
          <div>
            <span class="label">Latest approved draft</span>
            <h3>Evidence-Led CQC Report Preview</h3>
          </div>
        </div>
        <div class="approved-draft-text">${formatReportText(cqcDraft)}</div>
      </section>
    ` : ""}`;
}

function recordPageTitle(key) {
  return {
    incident: "All Incidents",
    referral: "All Referrals",
    onboarding: "Staff Onboarding Overview",
    compliance: "Compliance Overview",
    cqc: "CQC Evidence Generator"
  }[key];
}

function renderRecordRow(record, key, index, selectedIndex) {
  return `
    <div class="record-row ${index === selectedIndex ? "is-selected" : ""}" data-record-key="${key}" data-record-index="${index}" tabindex="0" role="button" aria-label="Open ${escapeHtml(record.title)}">
      <div>
        <strong>${escapeHtml(record.title)}${record.live ? ' <em class="live-badge">From the room</em>' : ""}</strong>
        <p>${escapeHtml(record.detail)}</p>
      </div>
      <span>${escapeHtml(record.location)}</span>
      <span>${escapeHtml(record.date)}</span>
      <div class="record-actions">
        <span class="record-status ${statusClass(record.status)}">${escapeHtml(record.status)}</span>
        <button class="download-button" type="button" data-download-record-key="${key}" data-download-record-index="${index}">Download</button>
      </div>
    </div>`;
}

function renderField(field) {
  if (field.type === "section") {
    return `<div class="form-section"><h4>${escapeHtml(field.label)}</h4></div>`;
  }

  const name = field.name;
  const rawValue = state.values[state.active][name] ?? field.value ?? "";
  const value = escapeHtml(rawValue);
  const prompt = field.prompt ? `<p class="field-help">${escapeHtml(field.prompt)}</p>` : "";
  let control = "";

  if (field.type === "textarea") {
    control = `<textarea data-field="${escapeHtml(name)}" rows="4" placeholder="${escapeHtml(field.prompt || "")}">${value}</textarea>`;
  } else if (field.type === "select") {
    control = `<select data-field="${escapeHtml(name)}">${field.options.map((option) => {
      const selected = String(rawValue) === option ? " selected" : "";
      return `<option${selected}>${escapeHtml(option)}</option>`;
    }).join("")}</select>`;
  } else if (field.type === "checkbox") {
    const checked = rawValue === true || rawValue === "checked" || rawValue === "true" ? " checked" : "";
    control = `<label class="single-check"><input data-field="${escapeHtml(name)}" type="checkbox"${checked}> <span>${escapeHtml(name)}</span></label>`;
    return `<div class="field checkbox-field">${control}${prompt}</div>`;
  } else if (field.type === "multiselect") {
    const selectedValues = splitList(rawValue);
    control = `<div class="checkbox-list">${field.options.map((option) => {
      const checked = selectedValues.includes(option) ? " checked" : "";
      return `<label><input data-field="${escapeHtml(name)}" type="checkbox" value="${escapeHtml(option)}"${checked}> <span>${escapeHtml(option)}</span></label>`;
    }).join("")}</div>`;
  } else if (field.type === "date" || field.type === "datetime-local") {
    control = `<input data-field="${escapeHtml(name)}" type="${field.type}" value="${value}">`;
  } else {
    control = `<input data-field="${escapeHtml(name)}" value="${value}">`;
  }

  return `<div class="field"><label>${escapeHtml(name)}</label>${control}${prompt}</div>`;
}

function saveFormValues() {
  if (!form) return;
  const fieldNames = [...new Set([...form.querySelectorAll("[data-field]")].map((input) => input.dataset.field))];
  fieldNames.forEach((fieldName) => {
    const controls = [...form.querySelectorAll(`[data-field="${cssEscape(fieldName)}"]`)];
    const checkboxes = controls.filter((control) => control.type === "checkbox");
    if (checkboxes.length > 1) {
      state.values[state.active][fieldName] = checkboxes
        .filter((control) => control.checked)
        .map((control) => control.value)
        .join(", ");
    } else if (checkboxes.length === 1) {
      state.values[state.active][fieldName] = checkboxes[0].checked;
    } else if (controls[0]) {
      state.values[state.active][fieldName] = controls[0].value;
    }
  });
}

let generating = false;
async function generateActiveWorkflow() {
  if (generating) return;
  saveFormValues();
  const key = state.active;
  if (key === "cqc") hydrateCqcSourceFields();
  const workflow = workflows[key];
  let output;
  if (window.SSLive && window.SSLive.isLive()) {
    generating = true;
    generateButton.disabled = true;
    generateButton.textContent = "AI is working…";
    if (outputsEl) {
      outputsEl.className = "outputs empty-state ai-working";
      outputsEl.innerHTML = `<span class="ai-spinner"></span>${key === "cqc" ? "Smart Summarise is reading every incident, audit and staff record to write the report…" : "Smart Summarise is reading the record…"}`;
    }
    try {
      output = await window.SSLive.generate(key, state.values[key]);
    } catch (error) {
      window.SSLive.toast("Live AI unavailable – showing offline demo answer");
      output = workflow.generate(state.values[key]);
    } finally {
      generating = false;
      generateButton.disabled = false;
      generateButton.textContent = "Generate AI outputs";
    }
  } else {
    output = workflow.generate(state.values[key]);
  }
  state.outputs[key] = output;
  state.reviewed[key] = false;
  state.approved[key] = false;
  rebuildActions();
  if (state.active === key && state.view.startsWith("form:")) renderWorkflow();
  else renderActions();
}

function renderOutputs() {
  const output = state.outputs[state.active];
  if (!output) {
    outputsEl.className = "outputs empty-state";
    outputsEl.textContent = "AI outputs will appear here after generation.";
    return;
  }
  outputsEl.className = "outputs";
  outputsEl.innerHTML = Object.entries(output)
    .filter(([key]) => key !== "_actions")
    .map(([key, value]) => renderOutputCard(key, value))
    .join("");
}

function renderOutputCard(key, value) {
  const statusClass = String(value).toLowerCase();
  const className = statusClass.includes("high") || statusClass.includes("red")
    ? "risk-high"
    : statusClass.includes("medium") || statusClass.includes("amber")
      ? "risk-medium"
      : statusClass.includes("low") || statusClass.includes("green")
        ? "risk-low"
        : "";
  const body = Array.isArray(value)
    ? `<ul>${value.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : key === "Generated CQC Report"
      ? `<div class="report-text">${formatReportText(value)}</div>`
    : `<p class="${className}">${escapeHtml(value).replace(/\n/g, "<br>")}</p>`;
  return `<article class="output-card"><h4>${escapeHtml(key)}</h4>${body}</article>`;
}

function formatReportText(value) {
  return String(value || "")
    .split("\n")
    .map((line) => {
      const escaped = escapeHtml(line);
      if (!line.trim()) return "<br>";
      if (isReportHeading(line)) return `<div class="report-heading">${escaped}</div>`;
      return `<div class="report-line">${escaped}</div>`;
    })
    .join("");
}

function isReportHeading(line) {
  return [
    "Areas for Improvement",
    "Recommended Manager Actions",
    "Evidence Gaps",
    "Executive Summary",
    "Evidence Snapshot",
    "Safe",
    "Key Themes",
    "Learning Identified",
    "Impact",
    "Effective",
    "Findings",
    "Training Compliance:",
    "Supervisions:",
    "Onboarding:",
    "Recommendation",
    "Caring",
    "Positive Outcomes",
    "Evidence Sources",
    "Responsive",
    "Actions Taken",
    "Outcomes",
    "Outstanding Actions",
    "Well-Led",
    "Governance Themes",
    "Leadership Actions",
    "Compliance Score",
    "Areas for Improvement",
    "Recommended Manager Actions"
  ].includes(line.trim());
}

function renderReviewStatus() {
  const status = reviewStatus;
  status.className = "status-pill muted";
  if (state.approved[state.active]) {
    status.textContent = "Approved";
    return;
  }
  if (state.reviewed[state.active]) {
    status.textContent = "Reviewed";
    return;
  }
  if (state.outputs[state.active]) {
    status.textContent = "Needs review";
    status.classList.add("amber");
    return;
  }
  status.textContent = "Not generated";
}

function rebuildActions() {
  state.actions = [];
  for (const [workflowKey, output] of Object.entries(state.outputs)) {
    if (output && Array.isArray(output._actions)) {
      output._actions.forEach((action) => {
        state.actions.push({ workflow: workflows[workflowKey].title, ...action });
      });
    }
  }
  renderActions();
  renderMetrics();
}

function renderActions() {
  const list = document.querySelector("#actions-list");
  if (!state.actions.length) {
    list.innerHTML = `<p class="empty-line">No actions generated yet.</p>`;
    return;
  }
  list.innerHTML = state.actions.map((action) => `
    <div class="action-row">
      <div class="action-source">${escapeHtml(action.workflow)}</div>
      <div class="action-title">${escapeHtml(action.title)}</div>
      <div class="action-priority">${escapeHtml(action.priority)}</div>
    </div>
  `).join("");
}

function renderMetrics() {
  document.querySelector("#metric-generated").textContent = Object.keys(state.outputs).length;
  document.querySelector("#metric-actions").textContent = state.actions.length;
}

function hydrateCqcSourceFields() {
  const incident = state.outputs.incident;
  const compliance = state.outputs.compliance;
  const onboarding = state.outputs.onboarding;
  if (incident) {
    state.values.cqc["Incidents Summary"] = `${incident["AI Summary"]} Risk level: ${incident["Risk Level"]}.`;
  }
  if (compliance) {
    state.values.cqc["Compliance Summary"] = `${compliance["Review Notes"]} Overall status: ${compliance["Overall Compliance Status"]}.`;
  }
  if (onboarding) {
    state.values.cqc["Staffing Summary"] = `Staff onboarding review for ${state.values.onboarding["Staff Name"]}: ${onboarding["Onboarding Status"]}. Missing requirements: ${onboarding["Missing Requirements"].join(", ")}.`;
  }
}

function resetDemo() {
  state.outputs = {};
  state.reviewed = {};
  state.approved = {};
  state.actions = [];
  for (const [key, workflow] of Object.entries(workflows)) {
    state.values[key] = Object.fromEntries(workflow.fields
      .filter((field) => field.name)
      .map((field) => [field.name, field.value]));
  }
  renderActions();
  renderPage();
}

function generateIncident(v) {
  const description = v["Incident Description"];
  const risk = /hallucinat|attempted to leave|aggressive|safeguard|self-harm|harm/i.test(description + v["Cause of Incident"]) ? "High" : "Medium";
  const actions = [
    "Review the support plan and update risk guidance following manager review.",
    "Share learning with the staff team, including de-escalation and PBS guidance.",
    "Consider follow-up with external professionals where mental health or safeguarding concerns remain."
  ];
  return {
    "AI Summary": `${v["Residents Involved"]} was involved in a ${lower(v["Cause of Incident"])} incident at ${v["Service Location"]}. ${String(v["Incident Description"] || "").split(/(?<=\.)\s/).slice(0, 2).join(" ")} Immediate response: ${v["Immediate Actions Taken"]} Injury recorded: ${lower(v["Injury Type"])}. Preventive actions have been identified for manager follow-up.`,
    "Risk Level": risk,
    "Suggested Actions / Learning": actions,
    _actions: actions.map((title, index) => ({ title, priority: index === 0 ? "High" : "Medium" }))
  };
}

function generateReferral(v) {
  const risks = splitList(v["Risk Indicators"]);
  const support = [
    "Complete a full pre-admission assessment before any placement decision.",
    "Plan a structured routine with consistent staffing and clear escalation guidance.",
    "Coordinate with the referrer and relevant clinical or social care professionals."
  ];
  return {
    "AI Summary": `${v["Service User Name"]} has been referred for ${lower(v["Referral Category"])} support. The primary diagnosis is ${v["Primary Diagnosis"]}. Reason for referral: ${v["Reason for Referral"]} The current support level is recorded as ${lower(v["Current Support Level"])}. The placement should be considered through a structured assessment and manager review.`,
    "Key Risks": risks.length ? risks : ["Risk information requires further clarification."],
    "Recommended Support": support,
    _actions: support.slice(0, 2).map((title) => ({ title, priority: "Medium" }))
  };
}

function generateOnboarding(v) {
  const missing = [];
  if (!/complete/i.test(v["DBS Status"])) missing.push("DBS must be completed before the staff member is fully compliant.");
  if (!isChecked(v["Right to Work Verified"])) missing.push("Right to work verification is still required.");
  if (!isChecked(v["ID Verified"])) missing.push("ID verification is still required.");
  if (!/complete|2 received|two/i.test(v["References Status"])) missing.push("References are incomplete and need manager follow-up.");
  const training = [
    "Safeguarding adults",
    "Medication awareness",
    "Incident reporting",
    "Health and safety",
    "Positive behaviour support",
    "Service-specific care plan induction"
  ];
  const status = missing.some((item) => /DBS|Right to work|ID/.test(item)) ? "Red" : missing.length ? "Amber" : "Green";
  return {
    "Missing Requirements": missing.length ? missing : ["No major missing requirements identified from the information provided."],
    "Training Checklist": training,
    "Onboarding Status": status,
    _actions: missing.map((title) => ({ title, priority: status === "Red" ? "High" : "Medium" }))
  };
}

function generateCompliance(v) {
  const allText = Object.values(v).join(" ");
  const hasGaps = /additional training|required|missing|overdue|incident/i.test(allText);
  const status = hasGaps ? "Amber" : "Green";
  const actions = hasGaps
    ? [
      "Create an action plan for identified training gaps.",
      "Review incident and medication recording for recurring themes.",
      "Set a date for follow-up audit and manager sign-off."
    ]
    : ["Maintain monthly audit schedule and retain evidence for inspection."];
  return {
    "Review Notes": `The ${v["Audit Name"]} audit for ${v["Service Location"]} shows a generally structured compliance position across client files, records, medication, and staffing. The evidence indicates that core records and checks are in place. Some improvement actions remain around training follow-up and continued monitoring. The audit should be reviewed by the manager and linked to a clear action plan.`,
    "Key Issues Identified": hasGaps ? ["Additional training needs identified.", "Medication and incident themes should continue to be monitored."] : ["No significant gaps identified from the provided checklist."],
    "Action Required": actions,
    "Overall Compliance Status": status,
    _actions: actions.map((title) => ({ title, priority: status === "Amber" ? "Medium" : "Low" }))
  };
}

function generateCqc(v) {
  const evidence = {
    incidents: 48,
    safeguarding: 12,
    medicationErrors: 8,
    falls: 6,
    behaviour: 4,
    agencySafeguardingPercent: 67,
    riskAssessmentGaps: 5,
    marTranscriptionErrors: 3,
    medicationJanuary: 5,
    medicationMarch: 1,
    staffRecords: 34,
    supervisions: 28,
    trainingRecords: 31,
    newStarters: 12,
    medicationTraining: 96,
    safeguardingTraining: 100,
    mcaTraining: 87,
    supervisionsOnTime: 24,
    supervisionsOverdue: 4,
    startersMissingCompetency: 2,
    compliments: 6,
    complaints: 1,
    dignitySafeguarding: 0,
    feedbackIncrease: 50,
    fallsReduction: 40,
    audits: 12,
    teamMeetings: 8,
    safeScore: 82,
    effectiveScore: 87,
    caringScore: 91,
    responsiveScore: 84,
    wellLedScore: 79,
    previousQuarterReduction: 23,
    communicationFactor: 42
  };

  const report = [
    "Executive Summary",
    `This draft report covers ${v["Reporting Period"]} for ${v["Service Location"]}. Smart Summarise reviewed ${evidence.incidents} incidents, ${evidence.audits} audits, ${evidence.staffRecords} staff records, ${evidence.supervisions} supervisions, ${evidence.trainingRecords} training records and ${evidence.newStarters} new starter records. The evidence shows progress in training, audit follow-up and incident learning, but governance requires stronger oversight where action completion, competency checks and recurring incident themes remain inconsistent.`,
    "",
    "Evidence Snapshot",
    `- ${evidence.incidents} incidents reviewed across the reporting period`,
    `- ${evidence.safeguarding} safeguarding concerns identified`,
    `- ${evidence.medicationErrors} medication errors reviewed`,
    `- ${evidence.falls} falls recorded`,
    `- ${evidence.behaviour} behaviour-related incidents identified`,
    `- ${evidence.previousQuarterReduction}% reduction in overall incident trend compared with the previous quarter`,
    "",
    "Safe",
    `Analysis of ${evidence.incidents} incidents recorded during the reporting period identified:`,
    `- ${evidence.safeguarding} safeguarding concerns`,
    `- ${evidence.medicationErrors} medication errors`,
    `- ${evidence.falls} falls`,
    `- ${evidence.behaviour} episodes of behaviour that challenged the service`,
    "",
    "Key Themes",
    `- ${evidence.agencySafeguardingPercent}% of safeguarding concerns occurred during agency staff shifts`,
    `- ${evidence.riskAssessmentGaps} incidents involved inconsistent risk assessment implementation`,
    `- ${evidence.marTranscriptionErrors} medication errors related to MAR transcription`,
    `- Staff communication was the most common contributing factor, appearing in ${evidence.communicationFactor}% of reviewed incidents`,
    "",
    "Learning Identified",
    "- Refresher medication competency introduced",
    "- Agency induction checklist implemented",
    "- Weekly safeguarding review added to management meetings",
    "- PBS guidance and risk assessment implementation to be reviewed in team meetings",
    "",
    "Impact",
    `Medication errors reduced from ${evidence.medicationJanuary} in January to ${evidence.medicationMarch} in March. Safeguarding actions and learning recorded by the manager: ${v["Safeguarding Actions & Learning"]}`,
    "",
    "Effective",
    "Smart Summarise reviewed:",
    `- ${evidence.staffRecords} staff records`,
    `- ${evidence.supervisions} supervisions`,
    `- ${evidence.trainingRecords} training records`,
    `- ${evidence.newStarters} new starters`,
    "",
    "Findings",
    "Training Compliance:",
    `- Medication = ${evidence.medicationTraining}%`,
    `- Safeguarding = ${evidence.safeguardingTraining}%`,
    `- Mental Capacity Act = ${evidence.mcaTraining}%`,
    "",
    "Supervisions:",
    `- ${evidence.supervisionsOnTime} completed on time`,
    `- ${evidence.supervisionsOverdue} overdue`,
    "",
    "Onboarding:",
    `- ${evidence.startersMissingCompetency} new starters missing competency assessments`,
    `- Staffing summary: ${v["Staffing Summary"] || "No staffing summary was provided."}`,
    "",
    "Recommendation",
    "Schedule competency assessments before staff complete probation and prioritise the 4 overdue supervisions.",
    "",
    "Caring",
    "Review of incidents, compliments and feedback identified:",
    `- ${evidence.compliments} compliments received`,
    `- ${evidence.complaints} complaint received`,
    `- ${evidence.dignitySafeguarding} safeguarding concerns relating to dignity`,
    "",
    "Positive Outcomes",
    `Residents and families reported better communication from staff, increased choice in activities, and improved consistency of support. Manager-recorded outcomes: ${v["Positive Outcomes"]}`,
    "",
    "Evidence Sources",
    "- Resident meetings",
    "- Family feedback forms",
    "- Compliments log",
    "- Incident and safeguarding review notes",
    "",
    "Impact",
    `Positive feedback increased by ${evidence.feedbackIncrease}% compared with the previous quarter.`,
    "",
    "Responsive",
    "Review of incidents identified recurring themes:",
    "Theme | Incidents",
    `Falls | ${evidence.falls}`,
    `Medication | ${evidence.medicationErrors}`,
    `Behaviour | ${evidence.behaviour}`,
    "",
    "Actions Taken",
    "- Falls risk assessments updated",
    "- Medication audits increased to weekly",
    "- PBS review completed",
    "- Support plans reviewed where repeated themes were identified",
    "",
    "Outcomes",
    `Falls reduced by ${evidence.fallsReduction}% during the following month. Three incidents shared common themes, suggesting an organisational learning opportunity around communication, handover and consistent risk assessment use.`,
    "",
    "Outstanding Actions",
    `- Night-time environmental audit pending completion`,
    `- Challenges and actions recorded by the manager: ${v["Challenges & Actions Taken"]}`,
    "",
    "Well-Led",
    "Smart Summarise reviewed:",
    `- ${evidence.audits} audits`,
    `- ${evidence.teamMeetings} team meetings`,
    `- ${evidence.supervisions} supervisions`,
    `- ${evidence.incidents} incidents`,
    "",
    "Governance Themes",
    "1. Medication recording inconsistencies",
    "2. Delayed action completion",
    "3. Training compliance gaps",
    "4. Inconsistent embedding of safeguarding learning",
    "",
    "Leadership Actions",
    "- Introduced governance dashboard",
    "- Assigned audit ownership",
    "- Monthly action tracking implemented",
    "- Weekly review of high-risk incidents added to management meetings",
    "",
    "Compliance Score",
    "Domain | Score",
    `Safe | ${evidence.safeScore}%`,
    `Effective | ${evidence.effectiveScore}%`,
    `Caring | ${evidence.caringScore}%`,
    `Responsive | ${evidence.responsiveScore}%`,
    `Well-Led | ${evidence.wellLedScore}%`,
    "",
    `Governance and oversight recorded by the manager: ${v["Governance & Oversight"]} Compliance summary: ${v["Compliance Summary"] || "No compliance summary was provided."}`,
    "",
    "Areas for Improvement",
    "1. Complete the 4 overdue supervisions",
    "2. Complete competency assessments for the 2 new starters missing evidence",
    "3. Improve audit completion and action closure rate",
    "4. Increase management observations during agency staff shifts",
    "5. Evidence the impact of safeguarding learning in future incident reviews",
    "",
    "Recommended Manager Actions",
    "- Review all medication incidents at the next governance meeting",
    "- Add agency induction compliance to the monthly audit dashboard",
    "- Track whether MAR transcription errors reduce after competency refreshers",
    "- Use the common incident themes as a team learning exercise",
    "",
    `Additional inspector notes: ${v["Additional Inspector Notes"]}`
  ].join("\n");
  return {
    "Generated CQC Report": report,
    _actions: [
      { title: "Review governance action plan and assign owners.", priority: "High" },
      { title: "Evidence learning from safeguarding and incident themes.", priority: "High" },
      { title: "Attach audit, staffing, and feedback evidence to the report.", priority: "Medium" }
    ]
  };
}

function downloadRecord(key, index) {
  const record = demoRecords[key]?.[index];
  if (!record) return;
  const report = buildRecordReport(key, record);
  downloadPdf(`${slugify(record.title)}.pdf`, [{ title: record.title, text: report }]);
}

function downloadAllRecords(key) {
  const records = demoRecords[key] || [];
  const reports = records.map((record) => ({
    title: record.title,
    text: buildRecordReport(key, record)
  }));
  downloadPdf(`smart-summarise-${key}-records.pdf`, reports);
}

function buildRecordReport(key, record) {
  if (key === "cqc") return buildCqcReportForRecord(record);

  const label = recordPageTitle(key);
  const sections = {
    incident: [
      "Incident Record",
      `Resident Involved: ${record.title}`,
      `Service Location: ${record.location}`,
      `Date: ${record.date}`,
      `Risk Level: ${record.status}`,
      `Incident Type: ${record.detail}`,
      "",
      "AI Review",
      "The record should be reviewed by the manager, checked against the support plan, and linked to any follow-up actions or learning identified.",
      "",
      "Suggested Actions",
      "- Review risk assessment and support plan",
      "- Confirm immediate actions were recorded",
      "- Share relevant learning with the staff team"
    ],
    referral: [
      "Referral Record",
      `Service User: ${record.title}`,
      `Location: ${record.location}`,
      `Period: ${record.date}`,
      `Risk/Support Level: ${record.status}`,
      `Referral Summary: ${record.detail}`,
      "",
      "Recommended Support",
      "- Complete pre-admission assessment",
      "- Review risk indicators and current support needs",
      "- Confirm funding and referrer details before placement decision"
    ],
    onboarding: [
      "Staff Onboarding Record",
      `Staff Member: ${record.title}`,
      `Service Location: ${record.location}`,
      `Start Date: ${record.date}`,
      `Onboarding Status: ${record.status}`,
      `Compliance Summary: ${record.detail}`,
      "",
      "Required Follow Up",
      "- Check DBS, right to work, ID and references",
      "- Confirm mandatory training completion",
      "- Manager to sign off before full compliance status is approved"
    ],
    compliance: [
      "Compliance Audit Record",
      `Audit: ${record.title}`,
      `Service Location: ${record.location}`,
      `Audit Date: ${record.date}`,
      `Compliance Status: ${record.status}`,
      `Audit Summary: ${record.detail}`,
      "",
      "Actions Required",
      "- Review audit evidence",
      "- Assign action owner and due date",
      "- Recheck outstanding items at the next governance review"
    ]
  };

  return [`${label}`, "", ...(sections[key] || [])].join("\n");
}

function buildCqcReportForRecord(record) {
  const base = { ...state.values.cqc };
  base["Report Name"] = record.title;
  base["Service Location"] = record.location;
  base["Reporting Period"] = record.date;
  return generateCqc(base)["Generated CQC Report"];
}

function autofillIncidentFromImage(file) {
  if (!file) return;
  state.values.incident = {
    ...state.values.incident,
    "Residents Involved": "Daniel Roberts",
    "Staff Name": "Emma Jones",
    "Service Location": "Maple House",
    "Date & Time of Incident": "2026-03-01T16:19",
    "Incident Description": `Extracted from uploaded report image (${file.name}): Staff identified a period of distress and verbal aggression. The resident appeared unsettled, reported concerns about people trying to harm him, and attempted to leave the property without informing staff.`,
    "Immediate Actions Taken": "Staff used de-escalation, offered reassurance, contacted the on-call manager, and continued monitoring until the resident settled.",
    "Cause of Incident": "Behavioural",
    "Injury Type": "None",
    "Preventive Actions": "Review support plan, medication compliance, PBS guidance, and staff de-escalation learning."
  };
  state.outputs.incident = null;
  renderWorkflow();
  const status = document.querySelector("#input-status");
  if (status) status.textContent = "Image uploaded";
}

function downloadPdf(filename, reports) {
  const pages = [];
  reports.forEach((report, reportIndex) => {
    const lines = [`${report.title}`, "", ...String(report.text).split("\n")];
    const wrapped = lines.flatMap((line) => wrapPdfLine(line, 92));
    for (let i = 0; i < wrapped.length; i += 42) {
      const pageLines = wrapped.slice(i, i + 42);
      if (reportIndex > 0 && i === 0) pages.push([""]);
      pages.push(pageLines);
    }
  });

  const pdf = createPdf(pages);
  const blob = new Blob([pdf], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function createPdf(pages) {
  const objects = [];
  const addObject = (body) => {
    objects.push(body);
    return objects.length;
  };
  const catalogId = addObject("");
  const pagesId = addObject("");
  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pageIds = [];

  pages.forEach((lines) => {
    const content = [
      "BT",
      "/F1 10 Tf",
      "50 792 Td",
      "14 TL",
      ...lines.map((line) => `(${escapePdfText(line)}) Tj T*`),
      "ET"
    ].join("\n");
    const contentId = addObject(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  });

  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}

function wrapPdfLine(line, maxLength) {
  const clean = String(line || " ").replace(/[^\x20-\x7E]/g, "-");
  if (clean.length <= maxLength) return [clean];
  const words = clean.split(" ");
  const lines = [];
  let current = "";
  words.forEach((word) => {
    if (`${current} ${word}`.trim().length > maxLength) {
      lines.push(current);
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  });
  if (current) lines.push(current);
  return lines;
}

function escapePdfText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function slugify(value) {
  return String(value || "report")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function splitList(value) {
  return String(value || "")
    .split(/,|\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isChecked(value) {
  return value === true || /checked|yes|verified|true/i.test(String(value));
}

function lower(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cssEscape(value) {
  if (window.CSS && window.CSS.escape) return window.CSS.escape(value);
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function statusClass(status) {
  const value = String(status).toLowerCase();
  if (value.includes("high") || value.includes("red")) return "risk-high";
  if (value.includes("medium") || value.includes("amber") || value.includes("draft")) return "risk-medium";
  if (value.includes("low") || value.includes("green") || value.includes("ready")) return "risk-low";
  return "";
}

window.SS_RECORDS = demoRecords;
document.addEventListener("ss-feed", () => {
  if (state.view === "records:incident" || state.view === "overview") renderPage();
});
renderPage();
if (window.SSLive) window.SSLive.init();
