// Envoi ponctuel du guide ChatGPT Business par Gmail SMTP.
// Lit les secrets depuis .env (ignoré par git) :
//   GMAIL_ADDRESS       adresse Gmail expéditrice (à compléter)
//   GMAIL_APP_PASSWORD  mot de passe d'application Gmail
//   GUIDE_EMAIL_TO      destinataire (défaut: helenemarty@icloud.com)
// Usage : node scripts/envoyer-guide.mjs
import { readFileSync, existsSync } from "node:fs";
import nodemailer from "nodemailer";

// --- Lecture de .env (sans dépendance dotenv) ---
const env = {};
const envPath = new URL("../.env", import.meta.url).pathname;
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^"(.*)"$/, "$1");
  }
}

const GMAIL = env.GMAIL_ADDRESS || process.env.GMAIL_ADDRESS;
const PASS = env.GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD;
const TO = env.GUIDE_EMAIL_TO || "helenemarty@icloud.com";

if (!GMAIL || !PASS) {
  console.error("❌ Il manque GMAIL_ADDRESS ou GMAIL_APP_PASSWORD dans .env");
  process.exit(1);
}

// --- Markdown minimal → HTML (pour le guide) ---
function inline(s) {
  return s
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

// --- Contenu du mail ---
const guide = readFileSync(new URL("../GUIDE-CHATGPT-BUSINESS-DRH.md", import.meta.url), "utf8");

const corps = `Bonjour Hélène 👋

Ton guide ChatGPT Business est prêt ! Il est joint à ce mail (fichier .md), et aussi mis en forme ci-dessous pour une lecture directe.

Au programme :
• le décor : ce qui a changé avec ChatGPT (le passage au « agent qui exécute ») et ton enjeu de DRH externalisée multi-clients ;
• la méthode pour cadrer chaque demande ;
• les 6 fonctionnalités clés, avec deux usages chacune ;
• 12 scénarios métier prêts à copier-coller (entretien préalable, inaptitude, NAO, BDESE, audit d'entrée…) ;
• les garde-fous RH.

Bonne lecture !`;

const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>Ton guide est prêt</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#1e293b;line-height:1.55;">
  <p>Bonjour Hélène 👋</p>
  <p>Ton guide ChatGPT Business est <strong>prêt</strong> ! Il est joint à ce mail (fichier <code>.md</code>), et aussi mis en forme ci-dessous pour une lecture directe.</p>
  <p>Au programme : le décor sur ce qui a changé avec ChatGPT (le passage à un « agent qui exécute ») et ton enjeu de DRH externalisée multi-clients, la méthode pour cadrer chaque demande, les 6 fonctionnalités clés avec deux usages chacune, 12 scénarios métier prêts à copier-coller, et les garde-fous RH.</p>
  <p>Bonne lecture !</p>
  <hr/>
  ${mdToHtml(guide)}
</body></html>`;

// --- Envoi ---
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: { user: GMAIL, pass: PASS },
});

try {
  const info = await transporter.sendMail({
    from: GMAIL,
    to: TO,
    subject: "Ton guide ChatGPT Business est prêt ✅",
    html,
    text: corps,
    attachments: [{ filename: "GUIDE-CHATGPT-BUSINESS-DRH.md", content: guide }],
  });
  console.log("✅ Mail envoyé à", TO);
  console.log("   messageId:", info.messageId);
} catch (err) {
  console.error("❌ Échec de l'envoi :", err.message);
  process.exit(1);
}
