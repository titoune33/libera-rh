// Convertit un guide markdown en HTML prêt pour l'impression PDF (Chrome headless).
// Usage : node scripts/md-vers-pdf.mjs <entrée.md> <sortie.html>
import { readFileSync } from "node:fs";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("Usage : node scripts/md-vers-pdf.mjs <entrée.md> <sortie.html>");
  process.exit(1);
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s) {
  return escapeHtml(s)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function mdToHtml(md) {
  const lines = md.split("\n");
  let html = "";
  let list = null;
  let inTable = false;
  const closeList = () => {
    if (list) { html += `</${list}>`; list = null; }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line === "---") { closeList(); html += "<hr/>"; continue; }
    if (line.startsWith("# ")) { closeList(); html += `<h1>${inline(line.slice(2))}</h1>`; continue; }
    if (line.startsWith("## ")) { closeList(); html += `<h2>${inline(line.slice(3))}</h2>`; continue; }
    if (line.startsWith("### ")) { closeList(); html += `<h3>${inline(line.slice(4))}</h3>`; continue; }
    if (line.startsWith("> ")) { closeList(); html += `<blockquote>${inline(line.slice(2))}</blockquote>`; continue; }
    if (/^\s*[-*] /.test(line)) {
      if (list !== "ul") { closeList(); html += "<ul>"; list = "ul"; }
      html += `<li>${inline(line.replace(/^\s*[-*] /, ""))}</li>`; continue;
    }
    if (/^\s*\d+\. /.test(line)) {
      if (list !== "ol") { closeList(); html += "<ol>"; list = "ol"; }
      html += `<li>${inline(line.replace(/^\s*\d+\. /, ""))}</li>`; continue;
    }
    if (line.startsWith("|")) {
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue;
      if (!inTable) {
        html += "<table><tr>" + cells.map((c) => `<th>${inline(c)}</th>`).join("") + "</tr>";
        inTable = true;
      } else {
        html += "<tr>" + cells.map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>";
      }
      continue;
    }
    if (inTable && line === "") { html += "</table>"; inTable = false; continue; }
    if (line === "") { closeList(); continue; }
    closeList();
    html += `<p>${inline(line)}</p>`;
  }
  closeList();
  if (inTable) html += "</table>";
  return html;
}

const md = readFileSync(input, "utf8");

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(input.replace(/\.md$/, ""))}</title>
<style>
  @page { size: A4; margin: 16mm 15mm 18mm 15mm; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 10.5pt; line-height: 1.5; color: #1e293b; margin: 0;
  }
  h1 { font-size: 19pt; line-height: 1.25; margin: 0 0 4px 0; color: #0f172a; }
  h1 + p, blockquote p { margin-top: 0; }
  h2 {
    font-size: 13.5pt; margin: 20px 0 8px 0; padding-bottom: 4px;
    border-bottom: 2px solid #4f46e5; color: #0f172a; page-break-after: avoid;
  }
  h3 { font-size: 11.5pt; margin: 14px 0 6px 0; color: #312e81; page-break-after: avoid; }
  p { margin: 6px 0; }
  ul, ol { margin: 6px 0; padding-left: 20px; }
  li { margin: 3px 0; }
  table { border-collapse: collapse; width: 100%; margin: 10px 0; font-size: 9pt; }
  th, td { border: 1px solid #cbd5e1; padding: 5px 7px; text-align: left; vertical-align: top; }
  th { background: #eef2ff; font-weight: 600; }
  tr { page-break-inside: avoid; }
  code { background: #f1f5f9; padding: 1px 4px; border-radius: 3px; font-size: 8.5pt; font-family: "SF Mono", Menlo, monospace; }
  blockquote {
    border-left: 3px solid #4f46e5; background: #f8fafc; color: #334155;
    margin: 10px 0; padding: 6px 12px; border-radius: 0 6px 6px 0;
  }
  blockquote p { margin: 4px 0; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 14px 0; }
  em { color: #475569; }
</style>
</head>
<body>
${mdToHtml(md)}
</body>
</html>`;

import { writeFileSync } from "node:fs";
writeFileSync(output, html);
console.log(`✅ HTML généré : ${output} (${Math.round(html.length / 1024)} Ko)`);
