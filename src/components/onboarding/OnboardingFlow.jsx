import { useEffect, useRef, useState } from 'react';
import { useCurrentUser, useStore } from '../../store/useStore';
import { LIFESTYLE_TIPS } from '../../data/constants';
import { todayISO } from '../../lib/dates';
import { uploadPhotoToSheets } from '../../lib/sheetsSync';
import { toast } from '../../store/useUI';
import { Button, Input, Notice, Progress, Segmented, Switch, Textarea } from '../ui';

/**
 * Entretien de mise en route « une fois pour toute » (2026-09-14).
 * Remplace l'ancien mini-onboarding (3 questions, par utilisatrice) : ici
 * c'est un entretien complet, par boutique (pas par personne), qui fige
 * l'appli tant qu'il n'est pas terminé — voir `AppShell.jsx` pour le
 * branchement et `FrozenScreen` ci-dessous pour l'état figé après coup.
 *
 * Toute réponse s'écrit immédiatement dans `settings.onboarding.reponses`
 * via `updateSettings`, qui pousse vers le Google Sheet par le mécanisme de
 * synchro déjà en place (aucune nouvelle action Apps Script) — rien n'est
 * perdu si l'onglet se ferme en cours de route : `settings.onboarding.step`
 * est relu au prochain chargement, l'entretien reprend pile où il en était.
 */

const QUESTION_STEPS = [
  'nb_pdf', 'pdf_routine', 'pdf_lifestyle', 'lifestyle_contenu', 'lifestyle_envoi_mode', 'questions_diag', 'texte_libre_diag', 'self_edit_mode',
  'email_obligatoire', 'champs_obligatoires', 'plusieurs_diag',
  'besoin_photos', 'delai_photos', 'besoin_notes',
  'delai_relance', 'relance_anticipee', 'relance_texte',
  'modalites', 'envoi_mode', 'tutoiement', 'templates', 'signature',
  'boutique', 'stock_cadence',
  'remarque_finale',
];
const ALL_STEPS = ['welcome', ...QUESTION_STEPS, 'summary'];

const SUMMARY_LABELS = {
  nb_pdf: '2 PDF (Routine + Lifestyle) suffisent',
  pdf_routine: 'PDF Routine',
  pdf_lifestyle: 'PDF Lifestyle',
  lifestyle_contenu: 'Contenu des conseils lifestyle',
  lifestyle_envoi_mode: 'Envoi du PDF lifestyle',
  questions_diag: 'Questions du diagnostic',
  texte_libre_diag: 'Zone de texte libre supplémentaire',
  self_edit_mode: 'Modification des questions par vous-même',
  email_obligatoire: 'Email obligatoire pour créer une fiche',
  champs_obligatoires: 'Téléphone obligatoire',
  plusieurs_diag: 'Plusieurs diagnostics du même type',
  besoin_photos: 'Section photos avant/après',
  delai_photos: 'Délai avant rappel photos',
  besoin_notes: 'Notes internes libres',
  delai_relance: 'Délai avant relance',
  relance_anticipee: 'Relance possible avant échéance',
  relance_texte: 'Texte de relance',
  modalites: 'Boutique / visio',
  envoi_mode: "Mode d'envoi",
  tutoiement: 'Tutoiement ou vouvoiement',
  templates: 'Modèles de message',
  signature: 'Signature',
  boutique: 'Coordonnées boutique',
  stock_cadence: 'Rappel import stock',
  remarque_finale: 'Remarque finale',
};

function isSkipped(id, reponses) {
  if (id === 'delai_photos') return reponses.besoin_photos === false;
  return false;
}

function canProceed(id, reponses) {
  switch (id) {
    case 'nb_pdf': return typeof reponses.nb_pdf_ok === 'boolean' || reponses.nb_pdf_incertain === true;
    case 'lifestyle_contenu': return (typeof reponses.lifestyle_contenu_ok === 'boolean' || reponses.lifestyle_contenu_incertain === true) && typeof reponses.lifestyle_texte_libre === 'boolean';
    case 'lifestyle_envoi_mode': return !!reponses.lifestyle_envoi_mode;
    case 'questions_diag': return typeof reponses.questions_diag_ok === 'boolean' || reponses.questions_diag_incertain === true;
    case 'texte_libre_diag': return !!reponses.texte_libre_diag;
    case 'self_edit_mode': return !!reponses.self_edit_mode;
    case 'email_obligatoire': return typeof reponses.champs_stricts_ok === 'boolean' || reponses.champs_stricts_incertain === true;
    case 'champs_obligatoires': return typeof reponses.telephone_obligatoire === 'boolean';
    case 'plusieurs_diag': return typeof reponses.plusieurs_diag_meme_type_ok === 'boolean';
    case 'besoin_photos': return typeof reponses.besoin_photos === 'boolean';
    case 'delai_photos': return !!reponses.delai_photos_semaines;
    case 'besoin_notes': return typeof reponses.besoin_notes_libres === 'boolean';
    case 'delai_relance': return !!reponses.delai_relance_jours;
    case 'relance_anticipee': return typeof reponses.relance_anticipee_ok === 'boolean';
    case 'modalites': return Array.isArray(reponses.modalites) && reponses.modalites.length > 0;
    case 'envoi_mode':
      if (!reponses.envoi_mode) return false;
      return reponses.envoi_mode === 'auto' ? typeof reponses.envoi_apercu === 'boolean' : typeof reponses.envoi_edition_avant_gmail === 'boolean';
    case 'tutoiement': return !!reponses.tutoiement_mode;
    case 'templates': return typeof reponses.templates_ok === 'boolean' || reponses.templates_incertain === true;
    case 'signature': return !!(reponses.signature || '').trim();
    case 'stock_cadence': return !!reponses.stock_rappel_semaines;
    default: return true;
  }
}

/** Champ texte qui n'écrit dans le store qu'à la perte de focus (pas à chaque frappe). */
/**
 * Champ texte qui n'écrit dans le store (et le Sheet) qu'à la perte de
 * focus, pour ne pas pousser une écriture à chaque frappe — mais qui
 * remonte quand même chaque frappe via `onDraftChange`, pour que l'état
 * "activable" du bouton Suivant (voir `canProceed`/`effectiveReponses`)
 * reflète ce qui est tapé tout de suite, pas seulement ce qui a été
 * sauvegardé. Sans ça, taper une réponse valide peut laisser le bouton
 * visuellement désactivé jusqu'à la perte de focus (bug constaté).
 */
function AutoSaveTextarea({ value, onCommit, onDraftChange, ...rest }) {
  const [draft, setDraft] = useState(value || '');
  useEffect(() => { setDraft(value || ''); }, [value]);
  const update = (v) => { setDraft(v); onDraftChange?.(v); };
  return <Textarea value={draft} onChange={(e) => update(e.target.value)} onBlur={() => { if (draft !== (value || '')) onCommit(draft); }} {...rest} />;
}
function AutoSaveInput({ value, onCommit, onDraftChange, ...rest }) {
  const [draft, setDraft] = useState(value ?? '');
  useEffect(() => { setDraft(value ?? ''); }, [value]);
  const update = (v) => { setDraft(v); onDraftChange?.(v); };
  return <Input value={draft} onChange={(e) => update(e.target.value)} onBlur={() => { if (draft !== (value ?? '')) onCommit(draft); }} {...rest} />;
}

const OuiNon = ({ value, onChange }) => (
  <Segmented value={value === true ? 'oui' : value === false ? 'non' : ''} onChange={(v) => onChange(v === 'oui')} options={[{ value: 'oui', label: 'Oui' }, { value: 'non', label: 'Non' }]} />
);

/** Bouton discret pour les questions qui demandent un jugement plutôt qu'un fait — n'a jamais à bloquer « Suivant ». */
const IncertainButton = ({ active, onClick }) => (
  <Button variant={active ? 'soft' : 'ghost'} size="sm" className="mt-2" icon="fa-regular fa-circle-question" onClick={onClick}>Je ne sais pas, on en reparle</Button>
);

/**
 * Pièce jointe optionnelle (photo ou PDF) envoyée pendant l'entretien —
 * réutilise le même dépôt Drive que les photos avant/après clientes
 * (`uploadPhotoToSheets`), avec un identifiant qui ne peut collisionner
 * avec un vrai diagnostic. `items` : [{ nom, url }].
 */
function AttachmentUploader({ items = [], onChange }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const type = `onboarding-diag-${Date.now()}`;
      const url = await uploadPhotoToSheets('onboarding', type, dataUrl, file.name);
      if (url) onChange([...items, { nom: file.name, url }]);
      else toast('Échec de l’envoi du fichier, réessayez.', { type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="stack" style={{ gap: '.5rem' }}>
      {items.map((it, i) => (
        <div key={i} className="flex" style={{ gap: '.5rem' }}>
          <a href={it.url} target="_blank" rel="noreferrer" className="small"><i className="fa-solid fa-paperclip" /> {it.nom}</a>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Retirer"><i className="fa-solid fa-xmark" /></button>
        </div>
      ))}
      <Button variant="soft" size="sm" icon="fa-solid fa-paperclip" loading={uploading} onClick={() => inputRef.current?.click()}>Joindre un fichier</Button>
      <input ref={inputRef} type="file" accept="image/*,.pdf" hidden onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }} />
    </div>
  );
}

export function OnboardingFlow() {
  const user = useCurrentUser();
  const state = useStore();
  const updateSettings = useStore((s) => s.updateSettings);
  const settings = state.settings;
  const onboarding = settings.onboarding || { complete: false, locked: true, step: 0, reponses: {} };
  const reponses = onboarding.reponses || {};
  const currentIndex = Math.min(onboarding.step ?? 0, ALL_STEPS.length - 1);
  const currentId = ALL_STEPS[currentIndex];

  const [previewUrls, setPreviewUrls] = useState({ routine: null, lifestyle: null });
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  // Frappe en cours sur les champs texte/nombre, pas encore poussée au
  // store (voir `AutoSaveTextarea`/`AutoSaveInput`) — sert uniquement à ce
  // que « Suivant » réagisse à ce qui est tapé tout de suite plutôt qu'à
  // ce qui a déjà été sauvegardé (le vrai enregistrement reste au blur).
  const [drafts, setDrafts] = useState({});
  const draftPatch = (key) => (v) => setDrafts((d) => ({ ...d, [key]: v }));
  const effectiveReponses = { ...reponses, ...drafts };

  const save = (patch) => updateSettings((s) => ({ onboarding: { ...s.onboarding, reponses: { ...s.onboarding.reponses, ...patch } } }));
  const saveStep = (idx) => updateSettings((s) => ({ onboarding: { ...s.onboarding, step: idx } }));

  const goTo = (idx) => saveStep(Math.max(0, Math.min(ALL_STEPS.length - 1, idx)));
  const next = () => {
    let i = currentIndex + 1;
    while (i < ALL_STEPS.length && isSkipped(ALL_STEPS[i], reponses)) i++;
    goTo(i);
  };
  const prev = () => {
    let i = currentIndex - 1;
    while (i > 0 && isSkipped(ALL_STEPS[i], reponses)) i--;
    goTo(i);
  };

  useEffect(() => {
    let cancelled = false;
    async function gen() {
      const kind = currentId === 'pdf_routine' ? 'routine' : currentId === 'pdf_lifestyle' ? 'lifestyle' : null;
      if (!kind || previewUrls[kind]) return;
      setPreviewLoading(true);
      try {
        const pdfLib = await import('../../lib/pdf');
        const loadAsset = pdfLib.browserAssetLoader(import.meta.env.BASE_URL);
        const fakeClient = { id: 'apercu', prenom: 'Camille', nom: 'Exemple', email: '' };
        const previewProduits = state.produits.slice(0, 2);
        const fakeDiag = {
          type: 'peau', modalite: 'boutique', date_rdv: todayISO(), date_creation: todayISO(),
          routine: previewProduits.map((p, i) => ({ produit_id: p.id, moments: i === 0 ? ['matin'] : ['soir'], conseil: '' })),
          conseils: '', lifestyle: LIFESTYLE_TIPS.slice(0, 4).map((t) => t.id),
        };
        const result = kind === 'routine'
          ? await pdfLib.generateRoutinePdf({ diag: fakeDiag, client: fakeClient, praticienne: user, produits: state.produits, settings, loadAsset })
          : await pdfLib.generateLifestylePdf({ diag: fakeDiag, client: fakeClient, praticienne: user, settings, tips: LIFESTYLE_TIPS.slice(0, 4), loadAsset });
        if (!cancelled) setPreviewUrls((u) => ({ ...u, [kind]: result.url }));
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    }
    gen();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  const confirmAll = async () => {
    setConfirming(true);
    updateSettings((s) => ({ onboarding: { ...s.onboarding, complete: true, locked: true } }));
  };

  const qPosition = QUESTION_STEPS.filter((id) => !isSkipped(id, reponses)).indexOf(currentId) + 1;
  const qTotal = QUESTION_STEPS.filter((id) => !isSkipped(id, reponses)).length;
  const progressPct = currentId === 'welcome' ? 0 : currentId === 'summary' ? 100 : (qPosition / qTotal) * 100;

  const wrap = (title, body, { optional = false } = {}) => (
    <div className="onboarding-card">
      <h2>{title}</h2>
      <div className="mt-3">{body}</div>
      <div className="onboarding-nav mt-4">
        <Button variant="ghost" onClick={prev} disabled={currentIndex === 0}>Précédent</Button>
        <Button variant="primary" onClick={next} disabled={!optional && !canProceed(currentId, effectiveReponses)}>Suivant</Button>
      </div>
    </div>
  );

  if (currentId === 'welcome') {
    return (
      <div className="onboarding-flow">
        <div className="onboarding-card onboarding-welcome">
          <img src="./brand/logo-vert-crop.png" alt="Hu'mana" className="onboarding-logo" />
          <h1>Avant de démarrer pour de bon</h1>
          <p className="lead">Quelques questions pour qu'on configure tout exactement comme vous en avez besoin — vos réponses sont enregistrées au fur et à mesure, vous pouvez fermer et reprendre plus tard sans rien perdre.</p>
          <Button variant="primary" size="lg" onClick={next}>Commencer</Button>
        </div>
      </div>
    );
  }

  if (currentId === 'summary') {
    return (
      <div className="onboarding-flow">
        <div className="onboarding-card onboarding-summary">
          <div className="onboarding-progress"><Progress value={100} /></div>
          <h2>Récapitulatif</h2>
          <p className="muted small mb-2">Une remarque à changer ? Cliquez sur le crayon pour y revenir directement.</p>
          <div className="stack">
            {QUESTION_STEPS.filter((id) => !isSkipped(id, reponses)).map((id) => (
              <div key={id} className="onboarding-summary-row">
                <span>{SUMMARY_LABELS[id]}</span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => goTo(ALL_STEPS.indexOf(id))}><i className="fa-solid fa-pen" /></button>
              </div>
            ))}
          </div>
          <div className="onboarding-nav mt-4">
            <Button variant="ghost" onClick={prev}>Précédent</Button>
            <Button variant="primary" icon="fa-solid fa-check" loading={confirming} onClick={confirmAll}>Confirmer mes réponses</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-flow">
      <div className="onboarding-progress-wrap">
        <span className="xs muted">Question {qPosition} sur {qTotal}</span>
        <Progress value={progressPct} accent />
      </div>
      {renderQuestion(currentId)}
    </div>
  );

  function renderQuestion(id) {
    switch (id) {
      case 'nb_pdf':
        return wrap('2 documents possibles aujourd’hui', (
          <>
            <p>Le <b>PDF Routine</b> (systématique, à chaque diagnostic) et le <b>PDF Conseils lifestyle</b> (optionnel). Ça suffit ?</p>
            <OuiNon value={reponses.nb_pdf_ok} onChange={(v) => save({ nb_pdf_ok: v, nb_pdf_incertain: false })} />
            <IncertainButton active={!!reponses.nb_pdf_incertain} onClick={() => save({ nb_pdf_ok: undefined, nb_pdf_incertain: true })} />
            {reponses.nb_pdf_ok === false && (
              <div className="mt-3"><AutoSaveTextarea rows={3} placeholder="Quel autre document faudrait-il ?" value={reponses.nb_pdf_remarque} onCommit={(v) => save({ nb_pdf_remarque: v })} /></div>
            )}
          </>
        ));

      case 'pdf_routine':
        return wrap('Voici le PDF Routine', (
          <>
            <p className="muted small mb-2">Généré avec des données d'exemple, pour que vous voyiez le rendu réel.</p>
            {previewLoading && !previewUrls.routine ? <Notice icon="fa-solid fa-spinner fa-spin">Génération de l'aperçu…</Notice> : previewUrls.routine && (
              <div className="doc-preview"><iframe title="Aperçu PDF Routine" src={previewUrls.routine} /></div>
            )}
            <div className="mt-3"><AutoSaveTextarea rows={2} placeholder="Une remarque sur ce PDF ? (optionnel)" value={reponses.pdf_routine_remarque} onCommit={(v) => save({ pdf_routine_remarque: v })} /></div>
          </>
        ), { optional: true });

      case 'pdf_lifestyle':
        return wrap('Voici le PDF Conseils lifestyle', (
          <>
            <p className="muted small mb-2">Même principe, avec quelques conseils d'exemple.</p>
            {previewLoading && !previewUrls.lifestyle ? <Notice icon="fa-solid fa-spinner fa-spin">Génération de l'aperçu…</Notice> : previewUrls.lifestyle && (
              <div className="doc-preview"><iframe title="Aperçu PDF Lifestyle" src={previewUrls.lifestyle} /></div>
            )}
            <div className="mt-3"><AutoSaveTextarea rows={2} placeholder="Une remarque sur ce PDF ? (optionnel)" value={reponses.pdf_lifestyle_remarque} onCommit={(v) => save({ pdf_lifestyle_remarque: v })} /></div>
          </>
        ), { optional: true });

      case 'lifestyle_contenu':
        return wrap('Le contenu des conseils lifestyle', (
          <>
            <p className="mb-2">Voici les {LIFESTYLE_TIPS.length} conseils tout prêts, proposés à cocher pendant le diagnostic :</p>
            <div className="stack" style={{ gap: '.5rem', maxHeight: 260, overflowY: 'auto' }}>
              {LIFESTYLE_TIPS.map((t) => (
                <div key={t.id} className="notice" style={{ fontSize: 'var(--fs-sm)' }}>
                  <i className={t.icon} /> <b>{t.titre}</b> — <span className="muted">{t.texte}</span>
                </div>
              ))}
            </div>
            <p className="mt-3">Ça vous convient tel quel, ou voulez-vous en ajouter/retirer/reformuler ?</p>
            <Segmented
              value={reponses.lifestyle_contenu_ok === true ? 'ok' : reponses.lifestyle_contenu_ok === false ? 'ajuster' : ''}
              onChange={(v) => save({ lifestyle_contenu_ok: v === 'ok', lifestyle_contenu_incertain: false })}
              options={[{ value: 'ok', label: 'Oui, ça convient' }, { value: 'ajuster', label: 'Non, à ajuster' }]}
            />
            <IncertainButton active={!!reponses.lifestyle_contenu_incertain} onClick={() => save({ lifestyle_contenu_ok: undefined, lifestyle_contenu_incertain: true })} />
            <p className="mt-3">Souhaitez-vous en plus une zone de texte libre, pour ajouter un conseil personnalisé au cas par cas sur un diagnostic ?</p>
            <OuiNon value={reponses.lifestyle_texte_libre} onChange={(v) => save({ lifestyle_texte_libre: v })} />
            <div className="mt-3"><AutoSaveTextarea rows={3} placeholder="Remarque sur les conseils lifestyle (optionnel)" value={reponses.lifestyle_remarque} onCommit={(v) => save({ lifestyle_remarque: v })} /></div>
          </>
        ));

      case 'lifestyle_envoi_mode':
        return wrap('Envoi du PDF lifestyle', (
          <>
            <p>Le PDF Conseils lifestyle : toujours envoyé en même temps que le PDF de routine, ou est-ce qu'il peut arriver que vous vouliez l'envoyer séparément, plus tard (par exemple lors d'un rendez-vous de suivi) ?</p>
            <Segmented
              value={reponses.lifestyle_envoi_mode || ''}
              onChange={(v) => save({ lifestyle_envoi_mode: v })}
              options={[
                { value: 'ensemble', label: 'Toujours ensemble' },
                { value: 'separe', label: 'Parfois séparément' },
                { value: 'ne_sait_pas', label: 'Je ne sais pas, on en reparle' },
              ]}
            />
          </>
        ));

      case 'questions_diag':
        return wrap('Le questionnaire du diagnostic', (
          <>
            <p className="mb-2">Voici les questions posées aujourd'hui, telles quelles :</p>
            <div className="grid-2" style={{ gap: 'var(--sp-4)' }}>
              {['peau', 'cheveux'].map((type) => (
                <div key={type} className="card" style={{ background: 'var(--bg-muted)' }}>
                  <h4 className="mb-2" style={{ textTransform: 'capitalize' }}>{type}</h4>
                  <ol style={{ margin: 0, paddingLeft: '1.1rem', display: 'grid', gap: '.5rem' }}>
                    {(state.questions?.[type] || []).map((q) => (
                      <li key={q.id} className="small">
                        {q.texte}
                        {q.options?.length ? <span className="muted"> — {q.options.join(', ')}</span> : null}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
            <p className="mt-3">Ça vous convient tel quel, ou faut-il ajuster ?</p>
            <Segmented
              value={reponses.questions_diag_ok === true ? 'ok' : reponses.questions_diag_ok === false ? 'ajuster' : ''}
              onChange={(v) => save({ questions_diag_ok: v === 'ok', questions_diag_incertain: false })}
              options={[{ value: 'ok', label: 'Oui, ça convient' }, { value: 'ajuster', label: 'Non, il faut ajuster' }]}
            />
            <IncertainButton active={!!reponses.questions_diag_incertain} onClick={() => save({ questions_diag_ok: undefined, questions_diag_incertain: true })} />
            {reponses.questions_diag_ok === false && (
              <div className="mt-3"><AutoSaveTextarea rows={3} placeholder="Qu'est-ce qu'il faudrait ajouter, retirer ou reformuler ?" value={reponses.questions_diag_remarque} onCommit={(v) => save({ questions_diag_remarque: v })} /></div>
            )}
            <div className="mt-3">
              <p className="small muted mb-1">Si vous avez votre trame de diagnostic actuelle sur papier, ou des routines types que vous donnez à la main, vous pouvez les joindre ici (facultatif).</p>
              <AttachmentUploader items={reponses.pieces_jointes_diag || []} onChange={(items) => save({ pieces_jointes_diag: items })} />
            </div>
          </>
        ));

      case 'texte_libre_diag':
        return wrap('Zone de texte libre supplémentaire', (
          <>
            <p className="mb-2">En plus des observations déjà présentes sur chaque question, faut-il une zone de texte libre ?</p>
            <div className="card" style={{ background: 'var(--bg-muted)' }}>
              <div className="xs muted mb-1">Exemple de ce à quoi ça ressemblerait :</div>
              <div className="small" style={{ fontWeight: 600, marginBottom: '.4rem' }}>Quel type de peau observez-vous ?</div>
              <Textarea rows={2} disabled placeholder="Notes libres sur cette question…" style={{ opacity: .6 }} />
            </div>
            <div className="mt-3">
              <Segmented
                value={reponses.texte_libre_diag || ''}
                onChange={(v) => save({ texte_libre_diag: v })}
                options={[
                  { value: 'non', label: 'Non' },
                  { value: 'fin', label: 'Oui, une seule zone à la fin' },
                  { value: 'chaque_question', label: 'Oui, une zone sur chaque question' },
                ]}
              />
            </div>
          </>
        ));

      case 'self_edit_mode':
        return wrap('Modifier vous-même les questions, plus tard', (
          <>
            <p>Souhaitez-vous pouvoir modifier vous-mêmes les questions du diagnostic et les conseils lifestyle plus tard, ou préférez-vous nous le demander à chaque fois ?</p>
            <Segmented
              value={reponses.self_edit_mode || ''}
              onChange={(v) => save({ self_edit_mode: v })}
              options={[
                { value: 'moi_meme', label: 'Je veux pouvoir modifier moi-même' },
                { value: 'demander', label: 'Je préfère vous le demander' },
                { value: 'ne_sait_pas', label: 'Je ne sais pas' },
              ]}
            />
          </>
        ));

      case 'email_obligatoire':
        return wrap('Email obligatoire pour créer une fiche', (
          <>
            <p>Aujourd'hui, impossible de créer une fiche cliente sans prénom, nom <b>et email</b>. C'est voulu, ou une cliente doit pouvoir être créée avec juste un prénom (le reste à compléter plus tard) ?</p>
            <Segmented
              value={reponses.champs_stricts_ok === true ? 'garder' : reponses.champs_stricts_ok === false ? 'assouplir' : ''}
              onChange={(v) => save({ champs_stricts_ok: v === 'garder', champs_stricts_incertain: false })}
              options={[
                { value: 'garder', label: 'Garder les 3 champs obligatoires' },
                { value: 'assouplir', label: 'Autoriser la création avec juste un prénom' },
              ]}
            />
            <IncertainButton active={!!reponses.champs_stricts_incertain} onClick={() => save({ champs_stricts_ok: undefined, champs_stricts_incertain: true })} />
          </>
        ));

      case 'champs_obligatoires':
        return wrap('Le téléphone, obligatoire lui aussi ?', (
          <>
            <p>Le téléphone n'est aujourd'hui pas obligatoire. Doit-il le devenir ?</p>
            <OuiNon value={reponses.telephone_obligatoire} onChange={(v) => save({ telephone_obligatoire: v })} />
          </>
        ));

      case 'plusieurs_diag':
        return wrap('Plusieurs diagnostics du même type', (
          <>
            <p>Une cliente peut avoir plusieurs diagnostics du même type dans le temps (ex : 2 diagnostics cheveux à 6 mois d'écart) — confirmé ?</p>
            <OuiNon value={reponses.plusieurs_diag_meme_type_ok} onChange={(v) => save({ plusieurs_diag_meme_type_ok: v })} />
          </>
        ));

      case 'besoin_photos':
        return wrap('Photos avant/après', (
          <>
            <p>Une section photos avant/après par diagnostic est-elle nécessaire ?</p>
            <OuiNon value={reponses.besoin_photos} onChange={(v) => save({ besoin_photos: v })} />
          </>
        ));

      case 'delai_photos':
        return wrap('Délai avant rappel photos', (
          <>
            <p>Après combien de semaines faut-il vous rappeler de prendre les photos avant/après ?</p>
            <AutoSaveInput type="number" min={1} max={26} style={{ maxWidth: 140 }} value={reponses.delai_photos_semaines} onCommit={(v) => save({ delai_photos_semaines: Number(v) || 6 })} onDraftChange={draftPatch('delai_photos_semaines')} />
          </>
        ));

      case 'besoin_notes':
        return wrap('Notes internes libres', (
          <>
            <p>Une zone de notes internes libres par diagnostic (visible par vous seules, jamais par la cliente) — nécessaire ?</p>
            <OuiNon value={reponses.besoin_notes_libres} onChange={(v) => save({ besoin_notes_libres: v })} />
          </>
        ));

      case 'delai_relance':
        return wrap('Délai avant relance', (
          <>
            <p>Après combien de jours faut-il vous rappeler de relancer une cliente après un diagnostic ?</p>
            <AutoSaveInput type="number" min={1} max={30} style={{ maxWidth: 140 }} value={reponses.delai_relance_jours} onCommit={(v) => save({ delai_relance_jours: Number(v) || 7 })} onDraftChange={draftPatch('delai_relance_jours')} />
          </>
        ));

      case 'relance_anticipee':
        return wrap('Relance avant l’échéance', (
          <>
            <p>Une relance envoyée avant la date prévue, à votre initiative, doit-elle rester possible ?</p>
            <OuiNon value={reponses.relance_anticipee_ok} onChange={(v) => save({ relance_anticipee_ok: v })} />
          </>
        ));

      case 'relance_texte':
        return wrap('Le texte de la relance', (
          <>
            <p className="muted small mb-2">Le message tel qu'il est réellement configuré aujourd'hui :</p>
            <Notice icon="fa-regular fa-envelope"><div style={{ whiteSpace: 'pre-wrap' }}>{settings.templates?.relance?.corps}</div></Notice>
            <p className="mt-3">Ça vous convient, ou voulez-vous le reformuler ?</p>
            <AutoSaveTextarea rows={3} placeholder="Votre reformulation, ou une remarque (optionnel)" value={reponses.relance_texte_remarque} onCommit={(v) => save({ relance_texte_remarque: v })} />
            <IncertainButton active={!!reponses.relance_texte_incertain} onClick={() => save({ relance_texte_incertain: !reponses.relance_texte_incertain })} />
          </>
        ), { optional: true });

      case 'modalites': {
        const modalites = reponses.modalites || [];
        const toggle = (m) => save({ modalites: modalites.includes(m) ? modalites.filter((x) => x !== m) : [...modalites, m] });
        return wrap('Boutique et visio', (
          <>
            <p>Vous recevez vos clientes :</p>
            <div className="flex" style={{ gap: '1rem' }}>
              <Switch checked={modalites.includes('boutique')} onChange={() => toggle('boutique')} label="En boutique" />
              <Switch checked={modalites.includes('visio')} onChange={() => toggle('visio')} label="En visio" />
            </div>
            <div className="mt-3"><AutoSaveTextarea rows={2} placeholder="Une autre situation à prévoir ? (optionnel)" value={reponses.autre_modalite} onCommit={(v) => save({ autre_modalite: v })} /></div>
          </>
        ));
      }

      case 'envoi_mode':
        return wrap('Comment envoyer le PDF à la cliente', (
          <>
            <p>Envoi automatique (un clic, tout part), ou onglet Gmail pré-rempli (vous relisez et envoyez vous-même) ?</p>
            <Segmented value={reponses.envoi_mode || ''} onChange={(v) => save({ envoi_mode: v })} options={[{ value: 'auto', label: 'Automatique' }, { value: 'gmail', label: 'Onglet Gmail' }]} />
            {reponses.envoi_mode === 'auto' && (
              <div className="mt-3"><p>Voulez-vous quand même un aperçu juste avant l'envoi définitif, ou faire confiance direct ?</p><Segmented value={reponses.envoi_apercu === true ? 'apercu' : reponses.envoi_apercu === false ? 'direct' : ''} onChange={(v) => save({ envoi_apercu: v === 'apercu' })} options={[{ value: 'apercu', label: 'Avec aperçu' }, { value: 'direct', label: 'Confiance directe' }]} /></div>
            )}
            {reponses.envoi_mode === 'gmail' && (
              <div className="mt-3"><p>Le texte doit-il être modifiable avant que l'onglet Gmail s'ouvre ?</p><OuiNon value={reponses.envoi_edition_avant_gmail} onChange={(v) => save({ envoi_edition_avant_gmail: v })} /></div>
            )}
          </>
        ));

      case 'tutoiement':
        return wrap('Tutoiement ou vouvoiement', (
          <>
            <Segmented
              value={reponses.tutoiement_mode || ''}
              onChange={(v) => save({ tutoiement_mode: v, tutoiement: v === 'tu' })}
              options={[
                { value: 'tu', label: 'Tutoiement' },
                { value: 'vous', label: 'Vouvoiement' },
                { value: 'depend', label: 'Ça dépend selon la cliente' },
              ]}
            />
            {reponses.tutoiement_mode === 'depend' && (
              <div className="mt-3">
                <AutoSaveTextarea rows={3} placeholder="Précisez comment vous géreriez ça (ex. tutoiement pour vos habituées, vouvoiement pour les nouvelles) :" value={reponses.tutoiement_remarque} onCommit={(v) => save({ tutoiement_remarque: v })} />
              </div>
            )}
          </>
        ));

      case 'templates':
        return wrap('Les modèles de message', (
          <>
            <p className="muted small mb-2">Les messages tels qu'ils sont réellement configurés aujourd'hui :</p>
            <div className="stack" style={{ gap: '.6rem' }}>
              <Notice icon="fa-regular fa-envelope"><b>Diagnostic peau :</b><div style={{ whiteSpace: 'pre-wrap', marginTop: '.3rem' }}>{settings.templates?.peau?.corps}</div></Notice>
              <Notice icon="fa-regular fa-envelope"><b>Diagnostic cheveux :</b><div style={{ whiteSpace: 'pre-wrap', marginTop: '.3rem' }}>{settings.templates?.cheveux?.corps}</div></Notice>
              <Notice icon="fa-regular fa-envelope"><b>Conseils lifestyle :</b><div style={{ whiteSpace: 'pre-wrap', marginTop: '.3rem' }}>{settings.templates?.lifestyle?.corps}</div></Notice>
            </div>
            <p className="mt-3">Ce type de message vous convient, ou on le retravaille ensemble ?</p>
            <Segmented
              value={reponses.templates_ok === true ? 'ok' : reponses.templates_ok === false ? 'retravailler' : ''}
              onChange={(v) => save({ templates_ok: v === 'ok', templates_incertain: false })}
              options={[{ value: 'ok', label: 'Oui, ça convient' }, { value: 'retravailler', label: 'Non, à retravailler ensemble' }]}
            />
            <IncertainButton active={!!reponses.templates_incertain} onClick={() => save({ templates_ok: undefined, templates_incertain: true })} />
            <div className="mt-3"><AutoSaveTextarea rows={3} placeholder="Remarque sur le ton, le contenu... (optionnel)" value={reponses.templates_remarque} onCommit={(v) => save({ templates_remarque: v })} /></div>
          </>
        ));

      case 'signature':
        return wrap('Comment signez-vous vos messages ?', (
          <AutoSaveInput placeholder="Ex : L'équipe Hu'mana" value={reponses.signature} onCommit={(v) => save({ signature: v })} onDraftChange={draftPatch('signature')} />
        ));

      case 'boutique': {
        const entreprise = settings.entreprise || {};
        const setEntreprise = (field) => (e) => updateSettings((s) => ({ entreprise: { ...s.entreprise, [field]: e.target.value } }));
        return wrap('Coordonnées de la boutique', (
          <>
            <p className="muted small mb-2">Elles apparaissent sur le PDF et dans les emails — corrigez si besoin.</p>
            <div className="stack">
              <Input placeholder="Nom" value={entreprise.nom || ''} onChange={setEntreprise('nom')} />
              <Input placeholder="Adresse" value={entreprise.adresse || ''} onChange={setEntreprise('adresse')} />
              <Input placeholder="Téléphone" value={entreprise.telephone || ''} onChange={setEntreprise('telephone')} />
              <Input placeholder="Email" value={entreprise.email || ''} onChange={setEntreprise('email')} />
              <Input placeholder="Instagram" value={entreprise.instagram || ''} onChange={setEntreprise('instagram')} />
            </div>
          </>
        ), { optional: true });
      }

      case 'stock_cadence':
        return wrap('Rappel d’import du stock', (
          <>
            <p>Tous les combien de semaines faut-il vous rappeler d'importer le stock depuis Planity ?</p>
            <AutoSaveInput type="number" min={1} max={12} style={{ maxWidth: 140 }} value={reponses.stock_rappel_semaines} onCommit={(v) => save({ stock_rappel_semaines: Number(v) || 1 })} onDraftChange={draftPatch('stock_rappel_semaines')} />
          </>
        ));

      case 'remarque_finale':
        return wrap('Dernière chose ?', (
          <>
            <AutoSaveTextarea rows={4} placeholder="Un besoin important qu'on n'a pas couvert ? (optionnel)" value={reponses.remarque_finale} onCommit={(v) => save({ remarque_finale: v })} />
            <div className="mt-3">
              <p className="small muted mb-1">Un document ou une photo à nous montrer avant de conclure ? (facultatif)</p>
              <AttachmentUploader items={reponses.pieces_jointes_finales || []} onChange={(items) => save({ pieces_jointes_finales: items })} />
            </div>
          </>
        ), { optional: true });

      default:
        return null;
    }
  }
}

/** Écran figé affiché tant que `settings.onboarding.locked` est vrai — joue une entrée animée une fois au montage, puis reste statique. */
export function FrozenScreen() {
  return (
    <div className="onboarding-flow onboarding-frozen">
      <div className="onboarding-thanks">
        <img src="./brand/logo-blanc-crop.png" alt="Hu'mana" className="onboarding-thanks-mark" />
        <h1>Merci beaucoup !</h1>
        <p>On a fait le tour, et vos réponses sont bien transmises à Nicolas.<br />Il n'y a plus rien à faire de votre côté : on configure tout sur mesure, et on revient vers vous dès que votre version définitive est prête.</p>
      </div>
    </div>
  );
}
