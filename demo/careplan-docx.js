/* Builds the FYAM care plan as a real Word (.docx) file in the browser.
   No external libraries: writes WordprocessingML and packs it into a (stored) zip. */
(function () {
  const NAVY = "10243A", TEAL = "137A73", LABEL = "EEF4FA", RED = "B42318", MUTED = "5B6B7B", GAP = "8A5300", GAPFILL = "FFF6E0", BORDER = "C9D6E3", BASE = 12;
  const x = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const MARK = /(\[(?:TO BE VERIFIED|INFORMATION REQUIRED)[^\]]*\])/;

  function run(text, o = {}) {
    const rpr = `<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>${o.b ? "<w:b/>" : ""}${o.i ? "<w:i/>" : ""}${o.color ? `<w:color w:val="${o.color}"/>` : ""}<w:sz w:val="${(o.size || BASE) * 2}"/></w:rPr>`;
    return String(text).split("\n").map((line, i) => `${i ? "<w:r><w:br/></w:r>" : ""}<w:r>${rpr}<w:t xml:space="preserve">${x(line)}</w:t></w:r>`).join("");
  }
  function runsMarked(text, o = {}) {
    return String(text ?? "").split(MARK).filter(Boolean).map((part) => MARK.test(part) && /^\[/.test(part) ? run(gapText(part), { ...o, i: true, b: false, color: GAP }) : /^Completed by the service/.test(part) ? run("To be completed by the service", { ...o, i: true, color: MUTED }) : run(part, o)).join("");
  }
  // "[INFORMATION REQUIRED: preferred name]" -> "To complete: preferred name"
  function gapText(m) { const t = m.replace(/^\[|\]$/g, "").replace(/^(INFORMATION REQUIRED|TO BE VERIFIED)\s*:?\s*/i, ""); return (/^TO BE VERIFIED/i.test(m) ? "To check: " : "To complete: ") + (t || "information needed"); }
  const isGap = (v) => MARK.test(String(v || "")) && !String(v).replace(MARK, "").replace(/[\s.\-]/g, "");
  function p(content, o = {}) {
    const ppr = `<w:pPr>${o.keep ? "<w:keepNext/>" : ""}${o.pageBreak ? '<w:pageBreakBefore/>' : ""}${o.shade ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.shade}"/>` : ""}${o.ind ? `<w:ind w:left="${o.ind}" w:right="${o.ind}"/>` : ""}<w:spacing w:before="${o.before || 0}" w:after="${o.after ?? 100}" w:line="${o.line || 276}" w:lineRule="auto"/>${o.center ? '<w:jc w:val="center"/>' : ""}</w:pPr>`;
    return `<w:p>${ppr}${content}</w:p>`;
  }
  const para = (text, o = {}) => p(runsMarked(text, o), o);
  function cell(inner, o = {}) {
    const tcpr = `<w:tcPr><w:tcW w:w="${o.w || 0}" w:type="${o.w ? "dxa" : "auto"}"/>${o.span ? `<w:gridSpan w:val="${o.span}"/>` : ""}${o.fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.fill}"/>` : ""}<w:tcMar><w:top w:w="110" w:type="dxa"/><w:left w:w="140" w:type="dxa"/><w:bottom w:w="110" w:type="dxa"/><w:right w:w="140" w:type="dxa"/></w:tcMar>${o.gap ? `<w:tcBorders><w:left w:val="single" w:sz="24" w:color="E0A030"/></w:tcBorders>` : ""}</w:tcPr>`;
    return `<w:tc>${tcpr}${inner || p("")}</w:tc>`;
  }
  function table(rows, widths) {
    const grid = `<w:tblGrid>${widths.map((w) => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>`;
    const b = `<w:tblBorders>${["top", "left", "bottom", "right", "insideH", "insideV"].map((s) => `<w:${s} w:val="single" w:sz="6" w:color="${BORDER}"/>`).join("")}</w:tblBorders>`;
    return `<w:tbl><w:tblPr><w:tblW w:w="${widths.reduce((a, c) => a + c, 0)}" w:type="dxa"/>${b}<w:tblLayout w:type="fixed"/></w:tblPr>${grid}${rows.map((r) => `<w:tr><w:trPr><w:cantSplit/></w:trPr>${r}</w:tr>`).join("")}</w:tbl>${p("", { after: 200, line: 240 })}`;
  }
  const FULL = 9638;
  function headerBar(sec, br) {
    return p(run(`  ${String(sec.order).padStart(2, "0")}   ${sec.title}`, { b: true, color: "FFFFFF", size: 15 }), { shade: NAVY, keep: true, pageBreak: br, before: br ? 0 : 240, after: 160, line: 360 });
  }
  function fieldRows(fields, kind) {
    if (kind === "plan") {
      return table(fields.flatMap((f) => [
        cell(para(f.label, { b: true, color: NAVY, after: 0, keep: true }), { w: FULL, fill: LABEL }),
        cell(para(f.value || "", { after: 0 }), { w: FULL, fill: isGap(f.value) ? GAPFILL : undefined, gap: isGap(f.value) })
      ]), [FULL]);
    }
    return table(fields.map((f) => cell(para(f.label, { b: true, color: NAVY, after: 0 }), { w: 3300, fill: LABEL }) + cell(para(f.value || "", { after: 0 }), { w: FULL - 3300, fill: isGap(f.value) ? GAPFILL : undefined, gap: isGap(f.value) })), [3300, FULL - 3300]);
  }
  function listBlock(fields) {
    const items = (fields.find((f) => /items/i.test(f.label)) || fields[0] || { value: "" }).value.split("\n").map((s) => s.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
    return items.map((t) => p(run("•  ", { color: TEAL, b: true }) + runsMarked(t), { after: 120, ind: 200 })).join("") + p("", { after: 160 });
  }
  function riskBlock(risks) {
    if (!risks || !risks.length) return para("[INFORMATION REQUIRED: no risks recorded]");
    return risks.map((r, i) => {
      const L = (t) => cell(para(t, { b: true, color: NAVY, after: 0 }), { w: 3300, fill: LABEL });
      const V = (t) => cell(para(t, { after: 0 }), { w: FULL - 3300 });
      const calc = "Likelihood ____ (1 Rare - 5 Almost certain)  x  Consequence ____ (1 Insignificant - 5 Catastrophic)  =  Score ____\nRating: Low 1-3 / Moderate 4-7 / High 8-12 / Extreme 15-25   (to be scored by the manager)";
      return p(run(`Risk ${i + 1}: ${r.risk}`, { b: true, color: TEAL, size: 13 }), { before: 160, keep: true }) + table([
        L("1. Description of activity / risk") + V(r.risk),
        L("2. Who or what is at risk?") + V(r.who_at_risk),
        L("3. Possible consequences") + V(r.consequences),
        L("4. Measures currently in place") + V(r.current_measures),
        L("5. Risk calculation") + V(calc),
        L("6. Additional actions to reduce the risk") + V(r.additional_actions),
        L("7. Final risk calculation") + V(calc)
      ], [3300, FULL - 3300]);
    }).join("");
  }
  function signatureTable(roles) {
    const head = ["Date", "Name", "Signature"].map((h) => cell(para(h, { b: true, color: "FFFFFF", after: 0 }), { w: FULL / 3, fill: NAVY })).join("");
    const rows = (roles || Array(6).fill("")).map((r) => [r ? `${r}` : "", "", ""].map((t, i) => cell(para(i === 1 ? t : "", { after: 320 }), { w: FULL / 3 })).join(""));
    return table([head, ...rows], [FULL / 3, FULL / 3, FULL / 3]) + para("Signatures are added by hand (or an approved e-signature process). They are never generated by the system.", { i: true, color: MUTED, size: 10 });
  }

  function documentXml(data, hasPhoto) {
    const { job, sections } = data;
    const approved = job.status === "APPROVED";
    const name = job.name || job.su;
    let body = "";
    // ---------- cover ----------
    body += para("My Support Plan", { b: true, color: "2F78B7", size: 30, center: true, before: 600, after: 300 });
    body += hasPhoto
      ? p(`<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="2520000" cy="2520000"/><wp:docPr id="1" name="Photo"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="photo.jpg"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdPhoto"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="2520000" cy="2520000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:ln w="12700"><a:solidFill><a:srgbClr val="9DB4C8"/></a:solidFill></a:ln></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`, { center: true, after: 200 })
      : para("[PHOTO - add the person's photo with their consent]", { center: true, color: MUTED, before: 1200, after: 1200 });
    body += para(`Name:  ${name}`, { b: true, size: 26, center: true, after: 300 });
    const info = [["Service", job.location], ["Plan reference", job.ref], ["Document status", approved ? "APPROVED" : "DRAFT - awaiting manager approval"], ["Version", String(job.version || 1)], ["Review date", job.review || "________"], ["Approved by", approved ? job.approver || "________" : "________"]];
    body += table(info.map(([k, v]) => cell(para(k, { b: true, color: NAVY, after: 0 }), { w: 3300, fill: LABEL }) + cell(para(v, { after: 0, b: k === "Document status", color: k === "Document status" && !approved ? RED : undefined }), { w: FULL - 3300 })), [3300, FULL - 3300]);
    body += para("Drafted with AI assistance from the source documents listed in section 25 and checked, edited and approved by a named manager. AI does not make care, clinical, consent, capacity, medication or risk decisions.", { i: true, color: MUTED, size: 9 });
    // ---------- contents ----------
    body += para("Contents", { b: true, color: NAVY, size: 18, pageBreak: true });
    body += para("Part A - My care plan", { b: true, color: TEAL, size: 12, before: 120 });
    sections.filter((s) => s.order <= 15).forEach((s) => { body += para(`${String(s.order).padStart(2, "0")}   ${s.title}`, { after: 40 }); });
    body += para("Part B - Supporting assessments and records", { b: true, color: TEAL, size: 12, before: 160 });
    sections.filter((s) => s.order > 15).forEach((s) => { body += para(`${String(s.order).padStart(2, "0")}   ${s.title}`, { after: 40 }); });
    // ---------- still to complete (draft only) ----------
    const gaps = [];
    sections.filter((s) => s.order > 1).forEach((s) => {
      (s.fields || []).forEach((f) => String(f.value || "").split(MARK).filter((m) => /^\[/.test(m) && MARK.test(m)).forEach((m) => gaps.push([s, f.label, gapText(m).replace(/^To (complete|check): /, "")])));
      (s.risks || []).forEach((r, i) => ["risk", "who_at_risk", "consequences", "current_measures", "additional_actions"].forEach((k) => { if (MARK.test(String(r[k] || ""))) gaps.push([s, `Risk ${i + 1}`, gapText(String(r[k]).match(MARK)[1]).replace(/^To (complete|check): /, "")]); }));
    });
    if (!approved && gaps.length) {
      body += para("Still to complete", { b: true, color: NAVY, size: 20, pageBreak: true, after: 60 });
      body += para(`${gaps.length} item(s) in ${new Set(gaps.map((g) => g[0].order)).size} sections were not in the source documents, so the AI left them for you rather than guessing. Complete them at the plan meeting. They are shown in the plan as "To complete" in an amber box. The plan should not be approved until this list is clear.`, { color: MUTED, size: 11, after: 200 });
      const bySec = new Map();
      gaps.forEach(([sec, label, need]) => { if (!bySec.has(sec.order)) bySec.set(sec.order, { sec, needs: [] }); const n = bySec.get(sec.order).needs; if (!n.includes(need)) n.push(need); });
      const W = [900, 3300, FULL - 4200];
      const head = ["Done", "Section", "What is needed"].map((h, i) => cell(para(h, { b: true, color: "FFFFFF", after: 0, size: 11 }), { w: W[i], fill: NAVY })).join("");
      body += table([head, ...[...bySec.values()].map(({ sec, needs }) => cell(para("\u2610", { size: 14, center: true, after: 0 }), { w: W[0] }) + cell(para(`${String(sec.order).padStart(2, "0")}  ${sec.title}`, { b: true, color: NAVY, after: 0, size: 11 }), { w: W[1] }) + cell(para(needs.map((n) => n.charAt(0).toUpperCase() + n.slice(1)).join("; "), { after: 0, size: 11 }), { w: W[2] }))], W);
    }
    // ---------- sections (flow on; new page only where a form starts) ----------
    const tpl = window.CAREPLAN_TEMPLATE || [];
    const NEW_PAGE = new Set([2, 16, 18, 19, 22, 24]);
    sections.filter((s) => s.order > 1).forEach((s) => {
      const t = tpl.find((q) => q.order === s.order) || {};
      if (s.order === 16) body += para("Part B - Supporting assessments and records", { b: true, color: TEAL, size: 16, pageBreak: true, keep: true, after: 120 });
      else if (s.order === 2) body += para("Part A - My care plan", { b: true, color: TEAL, size: 16, pageBreak: true, keep: true, after: 120 });
      body += headerBar(s, NEW_PAGE.has(s.order) && s.order !== 2 && s.order !== 16);
      const fields = s.fields || [];
      if (t.kind === "list") body += listBlock(fields);
      else if (t.kind === "risks") body += riskBlock(s.risks);
      else if (t.kind === "signatures") {
        if (fields.length) body += fieldRows(fields, "fields");
        body += s.order === 15 ? signatureTable(["Person receiving support", "Representative / advocate", "Registered / service manager", "Key worker"]) : signatureTable();
      } else body += fieldRows(fields, t.kind);
      if (!approved && s.sources) body += para(`Evidence: ${s.sources}`, { i: true, color: MUTED, size: 10, after: 200 });
    });
    const sect = `<w:sectPr><w:headerReference w:type="default" r:id="rIdHdr"/><w:footerReference w:type="default" r:id="rIdFtr"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr>`;
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>${body}${sect}</w:body></w:document>`;
  }
  function headerXml(job) {
    const approved = job.status === "APPROVED";
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${p(run(`FYAM  |  My Support Plan  |  ${job.name || job.su}`, { b: true, color: NAVY, size: 9 }), { after: 0 })}${approved ? "" : p(run("DRAFT - NOT APPROVED - NOT FOR USE IN CARE DELIVERY", { b: true, color: RED, size: 9 }), { after: 0 })}</w:hdr>`;
  }
  function footerXml(job) {
    const fld = (code) => `<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> ${code} </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r>`;
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:jc w:val="center"/></w:pPr>${run(`Version ${job.version || 1}  ·  Review date ${job.review || "________"}  ·  Page `, { size: 8, color: MUTED })}${fld("PAGE")}${run(" of ", { size: 8, color: MUTED })}${fld("NUMPAGES")}</w:p>${p(run("CONFIDENTIAL - contains personal care information. Store and share in line with UK GDPR.", { i: true, size: 8, color: MUTED }), { center: true, after: 0 })}</w:ftr>`;
  }

  // ---------- minimal zip (stored, no compression) ----------
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(files) {
    const enc = new TextEncoder(); const parts = []; const central = []; let offset = 0;
    for (const f of files) {
      const name = enc.encode(f.name); const data = typeof f.data === "string" ? enc.encode(f.data) : f.data; const crc = crc32(data);
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
      c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, offset, true);
      central.push(new Uint8Array(c.buffer), name);
      offset += 30 + name.length + data.length;
    }
    const csize = central.reduce((a, b) => a + b.length, 0);
    const e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csize, true); e.setUint32(16, offset, true);
    return new Blob([...parts, ...central, new Uint8Array(e.buffer)], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  }
  function dataUrlBytes(url) { const b = atob(url.split(",")[1]); const a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }

  window.buildCarePlanDocx = function (data) {
    const hasPhoto = Boolean(data.photo);
    const files = [
      { name: "[Content_Types].xml", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>` },
      { name: "_rels/.rels", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>` },
      { name: "word/_rels/document.xml.rels", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdHdr" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="rIdFtr" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>${hasPhoto ? '<Relationship Id="rIdPhoto" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/photo.jpg"/>' : ""}</Relationships>` },
      { name: "word/document.xml", data: documentXml(data, hasPhoto) },
      { name: "word/header1.xml", data: headerXml(data.job) },
      { name: "word/footer1.xml", data: footerXml(data.job) }
    ];
    if (hasPhoto) files.push({ name: "word/media/photo.jpg", data: dataUrlBytes(data.photo) });
    return zip(files);
  };
})();
