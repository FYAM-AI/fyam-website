/* FYAM care plan template: the fields each section must contain.
   Used by the AI drafting step (sent to the server), the on-screen viewer and the Word download.
   kind: "fields" = label/value table; "list" = bullet list; "text" = short paragraph;
         "plan" = the standard support-plan box (capacity, outcomes, how to support, cross-references);
         "risks" = risk assessment matrix; "signatures" = blank signature table. */
(function () {
  const PLAN = [
    "Does the person have capacity to agree to this plan?",
    "What are the person's key outcomes in this area of support?",
    "How should staff best support this person?",
    "What other documents does this plan cross-reference to?"
  ];
  const T = [
    { order: 1, title: "Cover page", part: "A", kind: "fields", fields: ["Name", "Likes to be called", "Service", "Plan type"] },
    { order: 2, title: "My Personal Details", part: "A", kind: "fields", fields: [
      "Person's name", "Likes to be called", "Date of birth", "Date moved in", "Address", "Contact numbers",
      "Religion / faith / beliefs", "Relationship status", "Protected characteristics", "My keyworkers",
      "National Insurance number", "NHS number", "Next of kin name", "Next of kin address and contact numbers",
      "Care manager name and funding authority", "Care manager address and contact numbers",
      "GP name and surgery", "GP address and contact numbers", "Pharmacist name and pharmacy", "Pharmacy address and contact numbers"] },
    { order: 3, title: "My Support Plan", part: "A", kind: "fields", fields: ["Why I am supported", "Support I receive", "Funded support hours", "My main outcomes"] },
    { order: 4, title: "What people like and admire about me", part: "A", kind: "list" },
    { order: 5, title: "What's important to me", part: "A", kind: "list" },
    { order: 6, title: "How to best support me", part: "A", kind: "list" },
    { order: 7, title: "My Communication Plan", part: "A", kind: "plan", fields: PLAN },
    { order: 8, title: "My Typical Day", part: "A", kind: "fields", fields: [
      "All about me", "Morning routine (when I get up / support I need)", "Afternoon routine (what I like to do)",
      "Night routine (when I go to bed / support during the night)", "Personal care (support I need)",
      "Medication (support I need)", "My likes", "My dislikes"] },
    { order: 9, title: "Personal Care", part: "A", kind: "plan", fields: PLAN },
    { order: 10, title: "Medication Support", part: "A", kind: "plan", fields: ["Allergies", "Current medication and doses", ...PLAN] },
    { order: 11, title: "Health and Wellbeing", part: "A", kind: "plan", fields: ["Diagnoses / health conditions", "Health professionals involved", ...PLAN] },
    { order: 12, title: "Personal Development and Goals", part: "A", kind: "fields", fields: ["Short-term aims and goals", "Medium-term aims and goals", "Long-term aims and goals", "How staff will support me"] },
    { order: 13, title: "Community and Daily Living", part: "A", kind: "plan", fields: PLAN },
    { order: 14, title: "Consent and Decision-Making", part: "A", kind: "fields", fields: [
      "Capacity to consent to this plan", "Decision-specific capacity assessments", "Best interest decisions",
      "Appointee / LPA / deputy", "ReSPECT form in place", "How I like to be involved in decisions"] },
    { order: 15, title: "Review and Signatures", part: "A", kind: "signatures", fields: ["Review frequency", "Next review date"] },
    { order: 16, title: "Initial Assessment", part: "B", kind: "fields", fields: [
      "Name of person being assessed", "Person completing assessment", "Job role", "Proposed service", "Date completed", "Summary of assessed needs"] },
    { order: 17, title: "Communication Assessment", part: "B", kind: "fields", fields: ["Expressive communication", "Receptive communication", "Reading and writing", "Aids and preferred methods", "Barriers and triggers"] },
    { order: 18, title: "Risk Assessment", part: "B", kind: "risks" },
    { order: 19, title: "Personal Emergency Evacuation Plan", part: "B", kind: "fields", fields: [
      "Room number / address", "Disability and support needs",
      "1) Does the person fully understand the evacuation procedure?",
      "2) Is the person aware of the consequences of refusing to evacuate?",
      "3) Will a standard audible fire alarm notify the person?",
      "4) Is the person able to exit the building unassisted?",
      "5) Have people been arranged to assist in an emergency?",
      "6) Assistance needed from staff or fire service",
      "7) Actions people assisting should NOT do",
      "8) How the person communicates with emergency services",
      "9) Medication or special requirements to be available",
      "10) Egress procedure (step by step from the first alarm)",
      "11) Evacuation equipment provided"] },
    { order: 20, title: "Personal Development & Support Needs Assessment", part: "B", kind: "fields", fields: [
      "Short-term aims and goals", "Medium-term aims and goals", "Long-term aims and goals",
      "1:1 hours funded per day / week", "Funded support specified to cover", "Information source",
      "Medical / forensic history", "Current diagnosis", "Allergies", "Brief life story"] },
    { order: 21, title: "Referral and Approval Record", part: "B", kind: "fields", fields: [
      "Referral source", "Date referral received", "Initial assessment completed", "Risk screening tool (forensic & behaviours of concern) completed",
      "Approval level (Standard - Regional Manager / Enhanced Intensive Support)", "Clarifications raised with referrer / funder", "Approved by", "Date approved"] },
    { order: 22, title: "Service User Consent Record", part: "B", kind: "fields", fields: [
      "Involved in planning my support package", "Aware of risk assessments in my plan", "Given Statement of Purpose",
      "Given Service User Guide", "Needs assessed before care started", "Agree staff entering my home",
      "Agree file kept in my home", "Agree records kept at the branch office", "Agree sharing with professionals for inspection",
      "Photography and video consent", "Signed by / on behalf of (NOK / LPA)"] },
    { order: 23, title: "Agreement to Support", part: "B", kind: "fields", fields: ["Support agreed", "What I can expect from the service", "What is expected from me", "How I can raise concerns"] },
    { order: 24, title: "Signature Record", part: "B", kind: "signatures", fields: ["Statement"] },
    { order: 25, title: "Supporting Information Index", part: "B", kind: "list" }
  ];
  window.CAREPLAN_TEMPLATE = T;
  // Text form sent to the AI so it fills exactly these fields.
  window.CAREPLAN_TEMPLATE_TEXT = T.map((s) => {
    const head = `${String(s.order).padStart(2, "0")} ${s.title} [${s.kind}]`;
    if (s.kind === "list") return `${head}: fields = ["Items"] (one point per line, starting "- ")`;
    if (s.kind === "risks") return `${head}: leave fields empty and fill "risks" - one entry per risk in the evidence`;
    return `${head}: fields = ${JSON.stringify(s.fields)}`;
  }).join("\n");
})();
