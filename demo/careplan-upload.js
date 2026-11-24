/* Reads uploaded care plan source files in the browser.
   - PDF: text layer read with pdf.js; pages with no text (scans) are sent as images to the AI to read.
   - Word (.docx): text read from the file directly.
   - Photos / scans (JPG, PNG, HEIC exported as JPG): sent to the AI, which transcribes typed or handwritten text.
   - Plain text: read directly.
   Nothing is uploaded anywhere except, for images and scanned pages, to the AI service via the FYAM server. */
(function () {
  const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
  const PDFJS_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  let pdfReady = null;
  function loadPdfJs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (!pdfReady) pdfReady = new Promise((res, rej) => {
      const s = document.createElement("script"); s.src = PDFJS;
      s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; res(window.pdfjsLib); };
      s.onerror = () => { pdfReady = null; rej(new Error("Could not load the PDF reader (needs internet).")); };
      document.head.appendChild(s);
    });
    return pdfReady;
  }

  const kindOf = (f) => {
    const n = f.name.toLowerCase();
    if (n.endsWith(".pdf") || f.type === "application/pdf") return "PDF";
    if (n.endsWith(".docx")) return "Word";
    if (n.endsWith(".txt")) return "Text";
    if ((f.type || "").startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp)$/.test(n)) return "Photo";
    return "Other";
  };

  // Downscale an image (or canvas) to a JPEG data URL the AI can read clearly.
  function toJpeg(src, max = 1700, q = 0.85) {
    const w = src.naturalWidth || src.width, h = src.naturalHeight || src.height;
    const s = Math.min(1, max / Math.max(w, h));
    const c = document.createElement("canvas"); c.width = Math.round(w * s); c.height = Math.round(h * s);
    const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(src, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", q);
  }
  function loadImage(file) {
    return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("This image type can't be opened – save it as JPG or PNG.")); i.src = URL.createObjectURL(file); });
  }

  async function readPdf(file, ai) {
    const lib = await loadPdfJs();
    const pdf = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages = []; const scans = []; let thumb = "";
    for (let n = 1; n <= Math.min(pdf.numPages, 12); n++) {
      const page = await pdf.getPage(n);
      const tc = await page.getTextContent();
      let text = ""; let lastY = null;
      for (const it of tc.items) { const y = it.transform[5]; if (lastY !== null && Math.abs(y - lastY) > 4) text += "\n"; else if (text && !text.endsWith(" ")) text += " "; text += it.str; lastY = y; }
      text = text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
      if (n === 1 || text.length < 40) {
        const vp = page.getViewport({ scale: text.length < 40 ? 2 : 0.5 });
        const c = document.createElement("canvas"); c.width = vp.width; c.height = vp.height;
        await page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
        if (n === 1) thumb = toJpeg(c, 260, 0.7);
        if (text.length < 40) { scans.push({ n, img: toJpeg(c) }); continue; }
      }
      pages.push({ n, text });
    }
    let handwritten = false;
    if (scans.length) {
      if (!ai) throw new Error("This PDF is a scan – reading it needs Live AI.");
      const o = await ai(scans.map((s) => s.img), file.name);
      handwritten = o.handwritten;
      o.pages.forEach((p, i) => pages.push({ n: scans[i] ? scans[i].n : p.page, text: p.text }));
    }
    pages.sort((a, b) => a.n - b.n);
    return { text: pages.map((p) => `[Page ${p.n}]\n${p.text}`).join("\n"), pages: pdf.numPages, thumb, handwritten, how: scans.length ? "Scanned pages read by AI" : "Text read from PDF" };
  }

  // Minimal .docx reader: find word/document.xml in the zip and inflate it.
  async function readDocx(file) {
    const buf = new Uint8Array(await file.arrayBuffer()); const dv = new DataView(buf.buffer);
    let eocd = -1; for (let i = buf.length - 22; i >= 0; i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error("This Word file looks damaged.");
    let p = dv.getUint32(eocd + 16, true); const count = dv.getUint16(eocd + 10, true);
    for (let k = 0; k < count; k++) {
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
      const name = new TextDecoder().decode(buf.slice(p + 46, p + 46 + nlen));
      if (name === "word/document.xml") {
        const lnlen = dv.getUint16(off + 26, true), lxlen = dv.getUint16(off + 28, true);
        const data = buf.slice(off + 30 + lnlen + lxlen, off + 30 + lnlen + lxlen + csize);
        let xml;
        if (method === 0) xml = new TextDecoder().decode(data);
        else xml = await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text();
        const text = xml.replace(/<w:tab\/>/g, "\t").replace(/<\/w:p>/g, "\n").replace(/<w:br[^>]*\/>/g, "\n").replace(/<\/w:tc>/g, " | ").replace(/<[^>]+>/g, "")
          .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/\n{3,}/g, "\n\n").trim();
        return { text: `[Page 1]\n${text}`, pages: 1, thumb: "", handwritten: false, how: "Text read from Word file" };
      }
      p += 46 + nlen + xlen + clen;
    }
    throw new Error("No text found in this Word file.");
  }

  async function readPhoto(file, ai) {
    const img = await loadImage(file);
    const thumb = toJpeg(img, 260, 0.7);
    if (!ai) throw Object.assign(new Error("Reading photos needs Live AI."), { thumb });
    const o = await ai([toJpeg(img)], file.name);
    return { text: o.pages.map((p, i) => `[Page ${i + 1}]\n${p.text}`).join("\n"), pages: o.pages.length || 1, thumb, handwritten: o.handwritten, type: o.document_type, how: o.handwritten ? "Handwriting read by AI" : "Photo read by AI" };
  }

  window.CPUpload = {
    kindOf,
    async read(file, ai) {
      const k = kindOf(file);
      if (k === "PDF") return readPdf(file, ai);
      if (k === "Word") return readDocx(file);
      if (k === "Photo") return readPhoto(file, ai);
      if (k === "Text") return { text: `[Page 1]\n${await file.text()}`, pages: 1, thumb: "", handwritten: false, how: "Text file" };
      throw new Error("Use PDF, Word (.docx), a photo (JPG/PNG) or a text file.");
    }
  };
})();
