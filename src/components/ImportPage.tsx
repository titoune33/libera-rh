import { useRef, useState } from "react";
import type { JeuDeDonnees } from "../lib/types";
import { importerCSV, telechargerTemplate } from "../lib/importCsv";
import { SAMPLE_DATA } from "../lib/sampleData";
import { analyser } from "../lib/engine";
import type { PageId } from "../AppShell";
import type { Utilisateur } from "../lib/authClient";
import { Banner, Section, StatCard, Badge } from "./ui";
import { IconUpload, IconDownload, IconCheck, IconAlert, IconInfo } from "./icons";

interface SauvegardeCloud {
  id: string;
  nom: string;
  exercice: string;
  maj: string;
  payload?: unknown;
}

export function ImportPage({
  jeu,
  onJeuChange,
  onNavigate,
  utilisateur,
  apiIndisponible,
}: {
  jeu: JeuDeDonnees;
  onJeuChange: (j: JeuDeDonnees) => void;
  onNavigate: (p: PageId) => void;
  utilisateur: Utilisateur | null;
  apiIndisponible: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const [erreurs, setErreurs] = useState<{ ligne: number; message: string }[]>([]);
  const [dernierImport, setDernierImport] = useState<string | null>(null);
  const [sauvegardes, setSauvegardes] = useState<SauvegardeCloud[]>([]);
  const [chargementCloud, setChargementCloud] = useState(false);
  const [messageCloud, setMessageCloud] = useState<{ niveau: "ok" | "attention" | "critique"; texte: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const traiterFichier = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setErreurs([{ ligne: 0, message: `« ${file.name} » n'est pas un fichier CSV.` }]);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const texte = String(reader.result ?? "");
      const resultat = importerCSV(texte);
      if (resultat.erreurs.length > 0) {
        setErreurs(resultat.erreurs.slice(0, 12));
        return;
      }
      if (resultat.employes.length === 0) {
        setErreurs([{ ligne: 0, message: "Aucun salarié exploitable dans ce fichier." }]);
        return;
      }
      setErreurs([]);
      onJeuChange({
        societe: { ...jeu.societe, effectif: resultat.employes.length },
        employes: resultat.employes,
      });
      setDernierImport(`${file.name} — ${resultat.employes.length} salariés importés`);
    };
    reader.readAsText(file, "utf-8");
  };

  const utiliserExemple = () => {
    setErreurs([]);
    onJeuChange(SAMPLE_DATA);
    setDernierImport("Jeu de données de démonstration « Novamétal SAS » chargé (36 salariés)");
  };

  const resultatActuel = analyser(jeu.employes);

  return (
    <>
      <header className="page-head">
        <h1>Données & import</h1>
        <p>
          Importez votre fichier de paie (export CSV de votre SIRH) ou utilisez le jeu de données de démonstration. Les données restent
          dans votre navigateur : rien n'est envoyé sur un serveur.
        </p>
      </header>

      <div className="grid-stats">
        <StatCard label="Salariés chargés" value={jeu.employes.length} sub={`Société : ${jeu.societe.nom}`} />
        <StatCard label="Score d'égalité" value={`${resultatActuel.pointsEcart}/100`} sub="Recalculé en temps réel" />
        <StatCard label="Écart moyen" value={`${resultatActuel.global.ecartMoyenPct.toFixed(1).replace(".", ",")} %`} sub="Femmes vs hommes" />
      </div>

      <Section title="Importer un fichier CSV">
        <div
          className="dropzone"
          data-active={dragging ? "true" : undefined}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) traiterFichier(file);
          }}
          role="button"
          tabIndex={0}
          aria-label="Déposer un fichier CSV ou cliquer pour sélectionner"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
        >
          <div style={{ display: "grid", placeItems: "center", gap: 8 }}>
            <IconUpload size={32} className="muted" />
            <div style={{ fontWeight: 650 }}>Glissez votre fichier CSV ici, ou cliquez pour le sélectionner</div>
            <p>Colonnes attendues : nom, genre (F/H), categorie, salaire_annuel, poste, anciennete, age, part_variable</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: "none" }}
            aria-hidden="true"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) traiterFichier(file);
              e.target.value = "";
            }}
          />
        </div>

        <div className="mt-4" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button className="btn" onClick={telechargerTemplate}>
            <IconDownload size={16} /> Télécharger le modèle CSV
          </button>
          <button className="btn" onClick={utiliserExemple}>
            Utiliser le jeu de démonstration
          </button>
          {dernierImport && (
            <Badge niveau="ok">
              <IconCheck size={14} /> {dernierImport}
            </Badge>
          )}
        </div>

        {erreurs.length > 0 && (
          <div className="mt-4">
            <Banner niveau="critique" icon={<IconAlert size={20} />} title="Le fichier n'a pas pu être importé">
              {erreurs.length} erreur{erreurs.length > 1 ? "s" : ""} détectée{erreurs.length > 1 ? "s" : ""}. Corrigez puis réimportez.
            </Banner>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Ligne</th>
                    <th>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {erreurs.map((e, i) => (
                    <tr key={i}>
                      <td className="num">{e.ligne || "—"}</td>
                      <td>{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Section>

      <Section title="Sauvegarde dans le cloud (Airtable)">
        <p className="muted small" style={{ marginBottom: 12 }}>
          Sauvegardez votre jeu de données (données anonymisées) sur votre base Airtable via l'API Vercel, et rechargez-le plus tard sur
          n'importe quel poste. Chaque compte ne voit que ses propres sauvegardes.
        </p>
        {!utilisateur ? (
          <>
            <Banner niveau="attention" icon={<IconInfo size={20} />} title="Connectez-vous pour sauvegarder dans le cloud">
              {apiIndisponible
                ? "L'API n'est pas accessible en mode démo locale. Ouvrez la version déployée (freebuf.vercel.app) et connectez-vous."
                : "Créez un compte gratuit ou connectez-vous : vos sauvegardes seront rattachées à votre compte et accessibles depuis tous vos postes."}
            </Banner>
            {!apiIndisponible && (
              <div className="mt-3">
                <button className="btn btn-primary" onClick={() => onNavigate("connexion")}>
                  Se connecter / Créer un compte
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="muted small" style={{ marginBottom: 12 }}>
              Connecté en tant que <strong>{utilisateur.nom}</strong> ({utilisateur.email}).
            </p>
            <div className="rapport-actions">
          <button
            className="btn btn-primary"
            disabled={chargementCloud}
            onClick={async () => {
              setChargementCloud(true);
              setMessageCloud(null);
              try {
                const rep = await fetch("/api/sauvegarde", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    id: `${jeu.societe.nom}-${jeu.societe.exercice}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                    nom: jeu.societe.nom,
                    exercice: jeu.societe.exercice,
                    payload: jeu,
                  }),
                });
                const data = (await rep.json().catch(() => null)) as { ok?: boolean; erreur?: string; aide?: string } | null;
                if (rep.ok && data?.ok) {
                  setMessageCloud({ niveau: "ok", texte: "Données sauvegardées dans Airtable." });
                } else {
                  setMessageCloud({
                    niveau: "attention",
                    texte: data?.erreur ?? "La sauvegarde a échoué.",
                  });
                  if (data?.aide) setMessageCloud({ niveau: "attention", texte: data.aide });
                }
              } catch {
                setMessageCloud({ niveau: "attention", texte: "API de sauvegarde indisponible (mode démo locale). Déployez sur Vercel pour activer Airtable." });
              } finally {
                setChargementCloud(false);
              }
            }}
          >
            <IconUpload size={16} /> {chargementCloud ? "Sauvegarde…" : "Sauvegarder le jeu actuel"}
          </button>
          <button
            className="btn"
            disabled={chargementCloud}
            onClick={async () => {
              setChargementCloud(true);
              setMessageCloud(null);
              try {
                const rep = await fetch("/api/sauvegarde");
                const data = (await rep.json().catch(() => null)) as { liste?: SauvegardeCloud[]; erreur?: string; aide?: string } | null;
                if (rep.ok && data?.liste) {
                  setSauvegardes(data.liste);
                  setMessageCloud({ niveau: "ok", texte: `${data.liste.length} sauvegarde(s) trouvée(s).` });
                } else {
                  setMessageCloud({ niveau: "attention", texte: data?.erreur ?? "Impossible de lister les sauvegardes." });
                  if (data?.aide) setMessageCloud({ niveau: "attention", texte: data.aide });
                }
              } catch {
                setMessageCloud({ niveau: "attention", texte: "API de sauvegarde indisponible (mode démo locale)." });
              } finally {
                setChargementCloud(false);
              }
            }}
          >
            <IconDownload size={16} /> Charger mes sauvegardes
          </button>
            </div>
          </>
        )}

        {messageCloud && (
          <div className="mt-3">
            <Banner niveau={messageCloud.niveau} icon={<IconInfo size={20} />} title="Sauvegarde cloud">
              {messageCloud.texte}
            </Banner>
          </div>
        )}

        {sauvegardes.length > 0 && (
          <div className="table-wrap mt-4">
            <table className="data">
              <thead>
                <tr>
                  <th>Société</th>
                  <th className="num">Exercice</th>
                  <th>Dernière mise à jour</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sauvegardes.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.nom}</td>
                    <td className="num">{s.exercice}</td>
                    <td>{s.maj ? new Date(s.maj).toLocaleString("fr-FR") : "—"}</td>
                    <td>
                      <button
                        className="btn"
                        onClick={() => {
                          if (s.payload && typeof s.payload === "object") {
                            onJeuChange(s.payload as JeuDeDonnees);
                            setDernierImport(`Sauvegarde « ${s.nom} » (${s.exercice}) rechargée`);
                          } else {
                            setMessageCloud({ niveau: "critique", texte: "Cette sauvegarde ne contient pas de données exploitables." });
                          }
                        }}
                      >
                        <IconDownload size={14} /> Recharger
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Format du fichier attendu">
        <p className="muted small" style={{ marginBottom: 12 }}>
          Le fichier doit contenir une ligne d'en-tête puis une ligne par salarié. Les colonnes « categorie » acceptent : Cadres, Agents
          de maîtrise, Techniciens, Employés, Ouvriers. Le salaire est annuel brut en euros (équivalent temps plein).
        </p>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Colonne</th>
                <th>Obligatoire</th>
                <th>Exemple</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>nom</td>
                <td>Oui</td>
                <td>Dupont Marie</td>
              </tr>
              <tr>
                <td>genre</td>
                <td>Oui</td>
                <td>F ou H</td>
              </tr>
              <tr>
                <td>categorie</td>
                <td>Oui</td>
                <td>Cadres</td>
              </tr>
              <tr>
                <td>salaire_annuel</td>
                <td>Oui</td>
                <td>82000</td>
              </tr>
              <tr>
                <td>poste</td>
                <td>Recommandé</td>
                <td>Directrice R&D</td>
              </tr>
              <tr>
                <td>anciennete</td>
                <td>Non</td>
                <td>12</td>
              </tr>
              <tr>
                <td>age</td>
                <td>Non</td>
                <td>45</td>
              </tr>
              <tr>
                <td>part_variable</td>
                <td>Non</td>
                <td>0.2</td>
              </tr>
              <tr>
                <td>augmentation</td>
                <td>Non</td>
                <td>1 (a reçu une augmentation individuelle)</td>
              </tr>
              <tr>
                <td>promotion</td>
                <td>Non</td>
                <td>0 ou 1</td>
              </tr>
              <tr>
                <td>conge_maternite</td>
                <td>Non</td>
                <td>1 (retour de congé maternité sur l'exercice)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <button className="btn btn-primary" onClick={() => onNavigate("analyse")}>
            Continuer vers l'analyse des écarts →
          </button>
        </div>
      </Section>
    </>
  );
}
