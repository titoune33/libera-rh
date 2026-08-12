#!/usr/bin/env node
// Benchmark PDF Generator — MiMo V2.5 vs DeepSeek V4 Flash 0731
// Run: node scripts/generate-benchmark-pdf.mjs

import PDFDocument from "pdfkit";
import fs from "fs";

const OUTPUT = "Benchmark-MiMo-V2-5-vs-DeepSeek-V4-Flash-0731.pdf";

// ── Color palette ──
const C = {
  bg: "#0f172a",       // dark navy
  card: "#1e293b",     // slightly lighter
  accent: "#38bdf8",   // sky blue
  accent2: "#818cf8",  // indigo
  green: "#34d399",    // emerald
  orange: "#fb923c",   // amber
  red: "#f87171",      // red
  white: "#f8fafc",
  gray: "#94a3b8",
  lightGray: "#cbd5e1",
  tableHead: "#334155",
  tableRow1: "#1e293b",
  tableRow2: "#263044",
  winner: "#065f46",
  winnerBg: "#d1fae5",
};

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 50, bottom: 50, left: 55, right: 55 },
  info: {
    Title: "Benchmark : MiMo V2.5 vs DeepSeek V4 Flash 0731",
    Author: "Codebuff / Freebuff",
    Subject: "Comparaison de modèles LLM — Août 2026",
    CreationDate: new Date(),
  },
});

const stream = fs.createWriteStream(OUTPUT);
doc.pipe(stream);

const W = doc.page.width - 110; // usable width

// ── Helper: draw colored rectangle ──
function rect(x, y, w, h, fill, radius = 6) {
  doc.save();
  doc.roundedRect(x, y, w, h, radius).fill(fill);
  doc.restore();
}

// ── Helper: section title bar ──
function sectionBar(y, num, title) {
  rect(55, y, W, 32, C.accent, 4);
  doc.save();
  doc.fontSize(14).fillColor(C.bg).font("Helvetica-Bold");
  doc.text(`${num}. ${title}`, 65, y + 8, { width: W - 20 });
  doc.restore();
  return y + 42;
}

// ── Helper: table ──
function drawTable(y, headers, rows, colWidths) {
  const x0 = 55;
  const rowH = 26;
  const totalW = colWidths.reduce((a, b) => a + b, 0);

  // Header
  rect(x0, y, totalW, rowH, C.tableHead, 4);
  let cx = x0 + 8;
  doc.save().fontSize(9).fillColor(C.accent).font("Helvetica-Bold");
  headers.forEach((h, i) => {
    doc.text(h, cx, y + 7, { width: colWidths[i] - 12, align: "left" });
    cx += colWidths[i];
  });
  doc.restore();
  y += rowH;

  // Rows
  rows.forEach((row, ri) => {
    const bg = ri % 2 === 0 ? C.tableRow1 : C.tableRow2;
    rect(x0, y, totalW, rowH, bg, 0);
    cx = x0 + 8;
    doc.save().fontSize(8.5).fillColor(C.white).font("Helvetica");
    row.forEach((cell, ci) => {
      // Check if cell starts with ★ (winner marker)
      const isWinner = cell.startsWith("★");
      const cleanCell = isWinner ? cell.slice(1).trim() : cell;
      if (isWinner) {
        doc.font("Helvetica-Bold").fillColor(C.green);
      } else if (ci === 0) {
        doc.font("Helvetica-Bold").fillColor(C.lightGray);
      } else {
        doc.font("Helvetica").fillColor(C.white);
      }
      doc.text(cleanCell, cx, y + 7, { width: colWidths[ci] - 12, align: "left" });
      cx += colWidths[ci];
    });
    doc.restore();
    y += rowH;
  });
  return y + 8;
}

// ═══════════════════════════════════════════════════════════════
// PAGE 1 — Cover
// ═══════════════════════════════════════════════════════════════
rect(0, 0, doc.page.width, doc.page.height, C.bg);

// Top accent line
rect(55, 120, W, 3, C.accent, 2);

doc.save().fontSize(36).fillColor(C.white).font("Helvetica-Bold");
doc.text("BENCHMARK", 55, 145, { width: W, align: "left" });
doc.fontSize(14).fillColor(C.accent).font("Helvetica");
doc.text("Comparaison de modèles LLM open-source", 55, 195, { width: W });
doc.restore();

// Model cards
const cardW = (W - 20) / 2;
const cardY = 250;

// MiMo card
rect(55, cardY, cardW, 160, C.card, 8);
doc.save().fontSize(18).fillColor(C.accent2).font("Helvetica-Bold");
doc.text("MiMo V2.5", 70, cardY + 18, { width: cardW - 30 });
doc.fontSize(10).fillColor(C.gray).font("Helvetica");
doc.text("Xiaomi  •  Avril 2026", 70, cardY + 44, { width: cardW - 30 });
doc.moveDown(0.3);
doc.fontSize(9).fillColor(C.lightGray);
doc.text("310B params / 15B actifs • MoE", 70, cardY + 66, { width: cardW - 30 });
doc.text("Contexte : 1M tokens", 70, cardY + 82, { width: cardW - 30 });
doc.text("Multimodal natif (texte, image, vidéo, audio)", 70, cardY + 98, { width: cardW - 30 });
doc.text("Licence MIT • Open Source", 70, cardY + 114, { width: cardW - 30 });
doc.text("AA Intelligence Index : 38", 70, cardY + 136, { width: cardW - 30 });
doc.restore();

// DeepSeek card
rect(55 + cardW + 20, cardY, cardW, 160, C.card, 8);
doc.save().fontSize(18).fillColor(C.accent).font("Helvetica-Bold");
doc.text("DeepSeek V4 Flash 0731", 70 + cardW + 20, cardY + 18, { width: cardW - 30 });
doc.fontSize(10).fillColor(C.gray).font("Helvetica");
doc.text("DeepSeek  •  Juillet 2026", 70 + cardW + 20, cardY + 44, { width: cardW - 30 });
doc.moveDown(0.3);
doc.fontSize(9).fillColor(C.lightGray);
doc.text("284B params / 13B actifs • MoE", 70 + cardW + 20, cardY + 66, { width: cardW - 30 });
doc.text("Contexte : 1M tokens", 70 + cardW + 20, cardY + 82, { width: cardW - 30 });
doc.text("Texte uniquement (pas d'image)", 70 + cardW + 20, cardY + 98, { width: cardW - 30 });
doc.text("Licence MIT • Open Source", 70 + cardW + 20, cardY + 114, { width: cardW - 30 });
doc.text("AA Intelligence Index : 52", 70 + cardW + 20, cardY + 136, { width: cardW - 30 });
doc.restore();

// VS badge
const vsX = 55 + cardW + 2;
const vsY = cardY + 60;
doc.save().fontSize(22).fillColor(C.orange).font("Helvetica-Bold");
doc.text("VS", vsX, vsY, { width: 16, align: "center" });
doc.restore();

// Date & source
doc.save().fontSize(9).fillColor(C.gray).font("Helvetica");
doc.text("Rapport établi le 12 août 2026 — Sources : Artificial Analysis, BenchLM, Vals.ai, sites officiels", 55, 440, { width: W, align: "center" });
doc.text("Données issues de benchmarks tiers indépendants et des publications officielles des éditeurs.", 55, 456, { width: W, align: "center" });
doc.restore();

// ═══════════════════════════════════════════════════════════════
// PAGE 2 — Architecture & Fiches techniques
// ═══════════════════════════════════════════════════════════════
doc.addPage();
rect(0, 0, doc.page.width, doc.page.height, C.bg);

let y = 55;
y = sectionBar(y, 1, "Fiche technique comparative");

const colW = [170, 175, 175];
const techRows = [
  ["Éditeur", "Xiaomi (Chine)", "DeepSeek (Chine)"],
  ["Date de sortie", "22 avril 2026", "31 juillet 2026"],
  ["Architecture", "MoE — 310B total / 15B actifs", "MoE — 284B total / 13B actifs"],
  ["Contexte", "1 000 000 tokens", "1 000 000 tokens"],
  ["Input image / vidéo / audio", "★ Oui — natif omni-modal", "Non (texte uniquement)"],
  ["Raisonnement (chain-of-thought)", "Oui", "Oui"],
  ["Licence", "MIT (open source)", "MIT (open source)"],
  ["Poids disponibles", "Hugging Face", "Hugging Face"],
];
y = drawTable(y, ["Critère", "MiMo V2.5", "DeepSeek V4 Flash 0731"], techRows, colW);

y += 8;
y = sectionBar(y, 2, "Tarification API");

const priceRows = [
  ["Input (cache miss)", "0,14 $ / M tokens", "0,14 $ / M tokens"],
  ["Input (cache hit)", "★ 0,0028 $ / M tokens", "0,0028 $ / M tokens"],
  ["Output", "0,28 $ / M tokens", "0,28 $ / M tokens"],
  ["Coût moyen pondéré", "~0,06 $ / M tokens", "~0,06 $ / M tokens"],
  ["Gratuit via OpenRouter", "Oui (rate-limité)", "Oui (rate-limité)"],
];
y = drawTable(y, ["Type de tokens", "MiMo V2.5", "DeepSeek V4 Flash 0731"], priceRows, colW);

y += 8;
y = sectionBar(y, 3, "Performance brute");

const perfRows = [
  ["Vitesse de sortie", "~80 tokens/s", "★ ~125 tokens/s"],
  ["Latence (TTFT)", "2,84 s", "★ 1,43 s"],
  ["Réponse 500 tokens", "~9 s", "★ ~5,4 s"],
];
y = drawTable(y, ["Métrique", "MiMo V2.5", "DeepSeek V4 Flash 0731"], perfRows, colW);

// ═══════════════════════════════════════════════════════════════
// PAGE 3 — Benchmarks Intelligence & Coding
// ═══════════════════════════════════════════════════════════════
doc.addPage();
rect(0, 0, doc.page.width, doc.page.height, C.bg);

y = 55;
y = sectionBar(y, 4, "Benchmarks d'intelligence (Artificial Analysis v4.1.1)");

const intelRows = [
  ["Intelligence Index (AA)", "38", "★ 52"],
  ["GDPval-AA v2 (tâches agentic réelles)", "—", "★ Élevé"],
  ["τ³-Banking (tool use)", "—", "★ Élevé"],
  ["Humanity's Last Exam", "—", "Élevé"],
  ["GPQA Diamond (raisonnement scientifique)", "Classé 57/130", "Élevé"],
  ["AA-Omniscience (connaissance)", "—", "Élevé"],
  ["AA-LCR (long context reasoning)", "—", "Élevé"],
];
y = drawTable(y, ["Benchmark", "MiMo V2.5", "DeepSeek V4 Flash 0731"], intelRows, colW);

y += 8;
y = sectionBar(y, 5, "Benchmarks de codage & agents");

const codeRows = [
  ["SWE-bench Verified", "71,0 %", "★ 79,0 %"],
  ["SWE-bench Pro", "56,1 %", "★ Pro non publié (Flash prioritaire)"],
  ["Terminal-Bench 2.1", "60,7 %", "★ 82,7 %"],
  ["NL2Repo", "—", "★ 54,2 %"],
  ["DeepSWE", "—", "★ 54,4 %"],
  ["CyberGym", "—", "★ 76,7 %"],
  ["Toolathlon", "—", "★ 70,3 %"],
  ["ClawEval Pass³ (interne Xiaomi)", "—", "Non évalué"],
  ["MiMo Coding Bench (interne Xiaomi)", "Compétitif", "Non évalué"],
];
y = drawTable(y, ["Benchmark", "MiMo V2.5", "DeepSeek V4 Flash 0731"], codeRows, colW);

y += 8;
y = sectionBar(y, 6, "Autres évaluations");

const otherRows = [
  ["BenchLM Score public", "58,3 / 100 (rang #74)", "Non classé (pas de score public)"],
  ["Vals Index (domaine juridique/finance)", "51,6 %", "Non évalué"],
  ["MMLU Pro", "Classé 69/130", "Non évalué"],
  ["LiveCodeBench", "Classé 55/135", "Non évalué"],
  ["MMMU (raisonnement visuel)", "Classé 40/88", "Non applicable (text-only)"],
];
y = drawTable(y, ["Benchmark", "MiMo V2.5", "DeepSeek V4 Flash 0731"], otherRows, colW);

// ═══════════════════════════════════════════════════════════════
// PAGE 4 — Analyse & Recommandations
// ═══════════════════════════════════════════════════════════════
doc.addPage();
rect(0, 0, doc.page.width, doc.page.height, C.bg);

y = 55;
y = sectionBar(y, 7, "Analyse comparative — Points forts & faiblesses");

// MiMo strengths/weaknesses
const halfW = (W - 15) / 2;

rect(55, y, halfW, 190, C.card, 6);
doc.save().fontSize(12).fillColor(C.accent2).font("Helvetica-Bold");
doc.text("MiMo V2.5 — Points forts", 68, y + 12, { width: halfW - 26 });
doc.fontSize(9).fillColor(C.lightGray).font("Helvetica");
doc.text("✦ Multimodal natif : texte, image, vidéo, audio\n✦ Architecture 310B / 15B actifs — grande capacité brute\n✦ ClawEval Pass³ = 64 % (~70K tokens/traj.)\n✦ Bon score BenchLM (58,3/100)\n✦ Xiaomi MiMo Code intégré (agent de codage)\n✦ Token Plan Xiaomi abordable\n✦ Open source (MIT)", 68, y + 32, { width: halfW - 26, lineGap: 3 });
doc.restore();

rect(55 + halfW + 15, y, halfW, 190, C.card, 6);
doc.save().fontSize(12).fillColor(C.orange).font("Helvetica-Bold");
doc.text("DeepSeek V4 Flash 0731 — Points forts", 68 + halfW + 15, y + 12, { width: halfW - 26 });
doc.fontSize(9).fillColor(C.lightGray).font("Helvetica");
doc.text("✦ Intelligence Index = 52 (vs 38 pour MiMo)\n✦ Terminal-Bench 2.1 = 82,7 % (record)\n✦ SWE-bench Verified = 79 %\n✦ 56 % plus rapide en sortie (125 vs 80 t/s)\n✦ 50 % plus faible latence (1,43 s vs 2,84 s)\n✦ Tarification identique à MiMo V2.5\n✦ Communauté locale très active\n✦ Open source (MIT)", 68 + halfW + 15, y + 32, { width: halfW - 26, lineGap: 3 });
doc.restore();

y += 200;
y = sectionBar(y, 8, "Quand utiliser quoi ?");

const useCaseW = (W - 10) / 2;

rect(55, y, useCaseW, 155, C.card, 6);
doc.save().fontSize(11).fillColor(C.accent2).font("Helvetica-Bold");
doc.text("Choisir MiMo V2.5 si…", 68, y + 12, { width: useCaseW - 26 });
doc.fontSize(9).fillColor(C.lightGray).font("Helvetica");
doc.text("→ Tu as besoin d'analyser des images, vidéos ou audio\n→ Tu veux un modèle multimodal natif\n→ Tu utilises l'écosystème Xiaomi (MiMo Code, Claw)\n→ Le score BenchLM généraliste compte plus\n→ Tu veux un modèle plus gros (310B vs 284B)\n→ Le Token Plan Xiaomi t'intéresse", 68, y + 32, { width: useCaseW - 26, lineGap: 4 });
doc.restore();

rect(55 + useCaseW + 10, y, useCaseW, 155, C.card, 6);
doc.save().fontSize(11).fillColor(C.accent).font("Helvetica-Bold");
doc.text("Choisir DeepSeek V4 Flash 0731 si…", 68 + useCaseW + 10, y + 12, { width: useCaseW - 26 });
doc.fontSize(9).fillColor(C.lightGray).font("Helvetica");
doc.text("→ La vitesse et la latence sont critiques\n→ Tu fais du codage agent / SWE intensif\n→ Tu veux le meilleur rapport intelligence/prix\n→ Le contexte long (1M) est ton cas d'usage\n→ Tu veux un modèle text-only efficace\n→ Tu préfères une communauté plus large", 68 + useCaseW + 10, y + 32, { width: useCaseW - 26, lineGap: 4 });
doc.restore();

y += 168;
y = sectionBar(y, 9, "Verdict");

rect(55, y, W, 80, "#1e3a5f", 6);
doc.save().fontSize(11).fillColor(C.white).font("Helvetica-Bold");
doc.text("Conclusion", 68, y + 12, { width: W - 26 });
doc.fontSize(9).fillColor(C.lightGray).font("Helvetica");
doc.text(
  "DeepSeek V4 Flash 0731 domine sur l'intelligence pure (52 vs 38), la vitesse (125 vs 80 t/s), et les benchmarks de codage agents (Terminal-Bench 82,7 %). MiMo V2.5 compense par son multimodal natif et son architecture légèrement plus grosse. Au même prix, DeepSeek est le meilleur choix pour du texte/codage ; MiMo pour du multimodal.",
  68, y + 30, { width: W - 26, lineGap: 3 }
);
doc.restore();

// ═══════════════════════════════════════════════════════════════
// PAGE 5 — Sources
// ═══════════════════════════════════════════════════════════════
doc.addPage();
rect(0, 0, doc.page.width, doc.page.height, C.bg);

y = 55;
y = sectionBar(y, 10, "Sources & Références");

doc.save().fontSize(8).fillColor(C.lightGray).font("Helvetica");
const sources = [
  "Artificial Analysis — Comparaison DeepSeek V4 Flash 0731 vs MiMo-V2.5 (index v4.1.1) :",
  "  artificialanalysis.ai/models/comparisons/deepseek-v4-flash-vs-mimo-v2-5-0424",
  "",
  "BenchLM — Fiche MiMo-V2.5 (score public 58,28/100, rang #74/218) :",
  "  benchlm.ai/models/mimo-v2-5",
  "",
  "BenchLM — Fiche DeepSeek V4 Flash (22 benchmarks sources) :",
  "  benchlm.ai/models/deepseek-v4-flash",
  "",
  "Vals.ai — MiMo V2.5 (Vals Index 51,6 %, SWE-bench 71 %, Terminal-Bench 2.1 60,7 %) :",
  "  vals.ai/models/xiaomi_mimo-v2.5",
  "",
  "Xiaomi — Page officielle MiMo-V2.5-Pro (benchmarks internes, specs) :",
  "  mimo.xiaomi.com/mimo-v2-5-pro/",
  "",
  "Xiaomi — Modèles MiMo (tarification, features) :",
  "  mimo.mi.com/models/mimo-v2.5",
  "",
  "DeepSeek — Changelog officiel API (release V4-Flash-0731, 31/07/2026) :",
  "  api-docs.deepseek.com/updates/",
  "",
  "DeepSeek — Tarifs API officiels :",
  "  api-docs.deepseek.com/quick_start/pricing/",
  "",
  "Reddit r/LocalLLaMA — « DeepSeek V4 Flash 0731 hits 82.7 % on Terminal-Bench 2.1 » :",
  "  reddit.com/r/LocalLLaMA/comments/1vjklwo/",
  "",
  "Reddit r/opencodeCLI — « MiMo V2.5 is actually better deal than DeepSeek V4 Flash » :",
  "  reddit.com/r/opencodeCLI/comments/1tzh5rr/",
  "",
  "OpenRouter — Comparaison DeepSeek V4 Flash vs MiMo-V2.5 :",
  "  openrouter.ai/compare/deepseek/deepseek-v4-flash/xiaomi/mimo-v2.5",
  "",
  "Hugging Face — XiaomiMiMo/MiMo-V2.5-Pro (modèle open source) :",
  "  huggingface.co/XiaomiMiMo/MiMo-V2.5-Pro",
  "",
  "Hugging Face — deepseek-ai/DeepSeek-V4-Flash (modèle open source) :",
  "  huggingface.co/deepseek-ai/DeepSeek-V4-Flash",
];
sources.forEach((line, i) => {
  doc.text(line, 65, y + i * 14, { width: W - 20 });
});
doc.restore();

// Footer on all pages
doc.save().fontSize(7).fillColor(C.gray).font("Helvetica");
doc.text("Rapport généré le 12 août 2026 — Codebuff / Freebuff", 55, doc.page.height - 35, { width: W, align: "center" });
doc.restore();

// ═══════════════════════════════════════════════════════════════
// Finalize
// ═══════════════════════════════════════════════════════════════
doc.end();

stream.on("finish", () => {
  console.log(`✅ PDF généré : ${OUTPUT}`);
  const stats = fs.statSync(OUTPUT);
  console.log(`   Taille : ${(stats.size / 1024).toFixed(1)} Ko`);
  console.log(`   Pages : 5`);
});

stream.on("error", (err) => {
  console.error("❌ Erreur :", err);
  process.exit(1);
});
