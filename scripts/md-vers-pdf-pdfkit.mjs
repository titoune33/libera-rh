// Convertit un guide markdown en PDF (A4) via pdfkit — sans navigateur.
// Usage : node scripts/md-vers-pdf-pdfkit.mjs <entrée.md> <sortie.pdf> ["Titre"] [--compact]
import { readFileSync, createWriteStream } from "node:fs";
import PDFDocument from "pdfkit";

const args = process.argv.slice(2);
const COMPACT = args.includes("--compact");
const [input, output, docTitle] = args.filter((a) => !a.startsWith("--"));
if (!input || !output) {
  console.error("Usage : node scripts/md-vers-pdf-pdfkit.mjs <entrée.md> <sortie.pdf> [titre] [--compact]");
  process.exit(1);
}

// --- Mise en page A4 ---
const PAGE = { w: 595.28, h: 841.89 };
const M = COMPACT
  ? { top: 32, bottom: 38, left: 36, right: 36 }
  : { top: 48, bottom: 56, left: 46, right: 46 };
const CONTENT_W = PAGE.w - M.left - M.right;
const BOTTOM_LIMIT = PAGE.h - M.bottom;

const SZ = COMPACT
  ? { h1: 14, h2: 10.6, h3: 9.4, body: 8.8, quote: 8.4, table: 7.8, list: 8.8 }
  : { h1: 19, h2: 13.5, h3: 11.5, body: 10.5, quote: 10, table: 9, list: 10.5 };

const COULEURS = {
  texte: "#1e293b",
  titre: "#0f172a",
  h2: "#0f172a",
  h3: "#312e81",
  ligne: "#4f46e5",
  cellBorder: "#cbd5e1",
  enteteTable: "#eef2ff",
  citation: "#334155",
  citationBg: "#f8fafc",
};

// --- Remplacements pour les caractères hors WinAnsi ---
const MAP = {
  "\u2192": "->",        // →
  "\u26A0\uFE0F": "[!]", // ⚠️
  "\u26A0": "[!]",       // ⚠
  "\u2705": "[OK]",      // ✅
  "\u1D49": "e",         // ᵉ
  "\u2248": "~",         // ≈
  "\u2713": "v",         // ✓
};
function sanitize(s) {
  let out = s;
  for (const [from, to] of Object.entries(MAP)) out = out.split(from).join(to);
  return out;
}

// --- Découpage inline : **gras** et `code` ---
function inlineRuns(s) {
  const runs = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0, m;
  while ((m = re.exec(s))) {
    if (m.index > last) runs.push({ text: sanitize(s.slice(last, m.index)) });
    const tok = m[0];
    if (tok.startsWith("**")) runs.push({ text: sanitize(tok.slice(2, -2)), bold: true });
    else runs.push({ text: sanitize(tok.slice(1, -1)), mono: true });
    last = m.index + tok.length;
  }
  if (last < s.length) runs.push({ text: sanitize(s.slice(last)) });
  return runs.filter((r) => r.text.length > 0);
}

// --- Analyse markdown en blocs ---
function parse(md) {
  const blocks = [];
  let list = null;
  let table = null;
  const closeList = () => {
    if (list) { blocks.push({ kind: "list", ...list }); list = null; }
  };
  const closeTable = () => {
    if (table) { blocks.push({ kind: "table", ...table }); table = null; }
  };
  for (const raw of md.split("\n")) {
    const line = raw.trimEnd();
    if (line === "---") { closeList(); closeTable(); blocks.push({ kind: "hr" }); continue; }
    if (line.startsWith("# ")) { closeList(); closeTable(); blocks.push({ kind: "h1", runs: inlineRuns(line.slice(2)) }); continue; }
    if (line.startsWith("## ")) { closeList(); closeTable(); blocks.push({ kind: "h2", runs: inlineRuns(line.slice(3)) }); continue; }
    if (line.startsWith("### ")) { closeList(); closeTable(); blocks.push({ kind: "h3", runs: inlineRuns(line.slice(4)) }); continue; }
    if (line.startsWith("> ")) { closeList(); closeTable(); blocks.push({ kind: "quote", runs: inlineRuns(line.slice(2)) }); continue; }
    if (/^\s*[-*] /.test(line)) {
      closeTable();
      if (!list || list.type !== "ul") { closeList(); list = { type: "ul", items: [] }; }
      list.items.push(inlineRuns(line.replace(/^\s*[-*] /, "")));
      continue;
    }
    if (/^\s*\d+\. /.test(line)) {
      closeTable();
      if (!list || list.type !== "ol") { closeList(); list = { type: "ol", items: [], n: parseInt(line, 10) }; }
      list.items.push({ num: list.n++, runs: inlineRuns(line.replace(/^\s*\d+\. /, "")) });
      continue;
    }
    if (line.startsWith("|")) {
      closeList();
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue;
      if (!table) table = { header: cells.map(inlineRuns), rows: [] };
      else table.rows.push(cells.map(inlineRuns));
      continue;
    }
    if (line === "") { closeList(); closeTable(); continue; }
    closeList(); closeTable();
    blocks.push({ kind: "p", runs: inlineRuns(line) });
  }
  closeList(); closeTable();
  return blocks;
}

// --- Rendu PDF ---
const doc = new PDFDocument({
  size: "A4",
  margins: M,
  info: { Title: docTitle || input.replace(/\.md$/, ""), Author: "Équitia", Language: "fr" },
});
doc.pipe(createWriteStream(output));

const FONT = { normal: "Helvetica", bold: "Helvetica-Bold", mono: "Courier" };

function styleFor(run, baseSize) {
  return {
    font: run.mono ? FONT.mono : run.bold ? FONT.bold : FONT.normal,
    size: run.mono ? baseSize - 0.6 : baseSize,
  };
}

function ensureSpace(needed) {
  if (doc.y + needed > BOTTOM_LIMIT) doc.addPage();
}

const GAP = COMPACT ? 1.2 : 2;

function drawRuns(runs, size, opts = {}) {
  const { width = CONTENT_W, x = M.left, gap = GAP, color = COULEURS.texte } = opts;
  const styled = runs.map((r) => {
    const s = styleFor(r, size);
    return { text: r.text, font: s.font, fontSize: s.size, lineGap: gap, color };
  });
  doc.text(styled, x, doc.y, { width, lineGap: gap });
}

for (const b of parse(readFileSync(input, "utf8"))) {
  switch (b.kind) {
    case "h1": {
      ensureSpace(40);
      doc.y += COMPACT ? 1 : 6;
      drawRuns(b.runs, SZ.h1, { color: COULEURS.titre, gap: GAP });
      doc.y += COMPACT ? 3 : 8;
      break;
    }
    case "h2": {
      ensureSpace(52);
      doc.y += COMPACT ? 4 : 10;
      drawRuns(b.runs, SZ.h2, { color: COULEURS.h2 });
      const y = doc.y + 2.5;
      doc.moveTo(M.left, y).lineTo(M.left + CONTENT_W, y).lineWidth(1.4).strokeColor(COULEURS.ligne).stroke();
      doc.y = y + (COMPACT ? 4 : 8);
      break;
    }
    case "h3": {
      ensureSpace(34);
      doc.y += COMPACT ? 2 : 6;
      drawRuns(b.runs, SZ.h3, { color: COULEURS.h3 });
      doc.y += COMPACT ? 1.5 : 3;
      break;
    }
    case "p": {
      const h = doc.heightOfString(
        b.runs.map((r) => ({ text: r.text, font: styleFor(r, SZ.body).font, fontSize: styleFor(r, SZ.body).size })),
        { width: CONTENT_W }
      );
      ensureSpace(h + 4);
      drawRuns(b.runs, SZ.body, { gap: GAP });
      doc.y += COMPACT ? 2 : 6;
      break;
    }
    case "list": {
      let num = b.type === "ol" ? (b.items[0]?.num ?? 1) : 0;
      for (const item of b.items) {
        const runsOfItem = b.type === "ol" ? item.runs : item;
        const label = b.type === "ol" ? `${num++}. ` : "•  ";
        const runs = [{ text: label, bold: true }, ...runsOfItem];
        const h = doc.heightOfString(
          runs.map((r) => ({ text: r.text, font: styleFor(r, SZ.list).font, fontSize: styleFor(r, SZ.list).size })),
          { width: CONTENT_W - 14 }
        );
        ensureSpace(h + 3);
        doc.text(
          runs.map((r) => ({ text: r.text, font: styleFor(r, SZ.list).font, fontSize: styleFor(r, SZ.list).size, lineGap: GAP })),
          M.left + 2, doc.y, { width: CONTENT_W - 14, lineGap: GAP }
        );
        doc.y += COMPACT ? 2 : 4;
      }
      doc.y += COMPACT ? 0.5 : 2;
      break;
    }
    case "quote": {
      const h = doc.heightOfString(
        b.runs.map((r) => ({ text: r.text, font: styleFor(r, SZ.quote).font, fontSize: styleFor(r, SZ.quote).size })),
        { width: CONTENT_W - 24 }
      );
      ensureSpace(h + 10);
      doc.y += COMPACT ? 1 : 2;
      const qx = M.left, qy = doc.y, qw = CONTENT_W;
      doc.rect(qx, qy, qw, h + 8).fill(COULEURS.citationBg);
      doc.rect(qx, qy, 3, h + 8).fill(COULEURS.ligne);
      doc.text(
        b.runs.map((r) => ({ text: r.text, font: styleFor(r, SZ.quote).font, fontSize: styleFor(r, SZ.quote).size, lineGap: 1 })),
        qx + 12, qy + 4, { width: qw - 24, lineGap: 1, color: COULEURS.citation }
      );
      doc.x = M.left;
      doc.y = qy + h + 10;
      break;
    }
    case "hr": {
      doc.moveTo(M.left, doc.y + 3).lineTo(M.left + CONTENT_W, doc.y + 3).lineWidth(0.7).strokeColor("#e2e8f0").stroke();
      doc.y += COMPACT ? 5 : 10;
      break;
    }
    case "table": {
      const n = b.header.length;
      const colW = CONTENT_W / n;
      const cellSize = SZ.table;
      const rowHeight = (runsArr) => {
        let max = 0;
        for (const cell of runsArr) {
          const h = doc.heightOfString(
            cell.map((r) => ({ text: r.text, font: styleFor(r, cellSize).font, fontSize: styleFor(r, cellSize).size })),
            { width: colW - 8 }
          );
          max = Math.max(max, h);
        }
        return max + 6;
      };
      const drawRow = (cells, isHeader) => {
        const h = rowHeight(cells);
        ensureSpace(h + 2);
        const y = doc.y;
        for (let i = 0; i < n; i++) {
          const x = M.left + i * colW;
          if (isHeader) doc.rect(x, y, colW, h).fill(COULEURS.enteteTable);
          else doc.rect(x, y, colW, h).fill("#ffffff");
          doc.rect(x, y, colW, h).lineWidth(0.6).strokeColor(COULEURS.cellBorder).stroke();
          doc.text(
            cells[i].map((r) => ({
              text: r.text,
              font: isHeader ? FONT.bold : styleFor(r, cellSize).font,
              fontSize: cellSize,
              lineGap: 0.8,
            })),
            x + 4, y + 3, { width: colW - 8, lineGap: 0.8 }
          );
        }
        doc.y = y + h;
      };
      if (doc.y + rowHeight(b.header) > BOTTOM_LIMIT) doc.addPage();
      drawRow(b.header, true);
      for (const row of b.rows) drawRow(row, false);
      doc.y += COMPACT ? 2 : 6;
      break;
    }
  }
}

doc.end();
console.log(`✅ PDF généré : ${output}`);
