import { useEffect, useState } from 'react';
import { useCurrentUser, useStore } from '../store/useStore';
import { isPatronne } from '../store/selectors';
import { toast } from '../store/useUI';
import { Button, Field, Input, Notice, Textarea, Tabs } from '../components/ui';
import { QuestionsEditorModal } from '../components/settings/QuestionsEditorModal';

export default function ParametresPage() {
  const user = useCurrentUser();
  const admin = isPatronne(user);
  const [tab, setTab] = useState('general');

  return (
    <>
      <div className="page-head"><div><div className="eyebrow">Configuration</div><h1>Paramètres</h1></div></div>
      <Tabs value={tab} onChange={setTab} items={[
        { value: 'general', label: 'Général', icon: 'fa-solid fa-sliders' },
        { value: 'questions', label: 'Questionnaires', icon: 'fa-regular fa-circle-question' },
        admin && { value: 'entreprise', label: 'Boutique', icon: 'fa-solid fa-shop' },
      ].filter(Boolean)} />
      <div className="mt-3">
        {tab === 'general' && <GeneralTab admin={admin} />}
        {tab === 'questions' && <QuestionsTab />}
        {tab === 'entreprise' && admin && <EntrepriseTab />}
      </div>
    </>
  );
}

function GeneralTab({ admin }) {
  const signature = useStore((s) => s.settings.signature_pdf);
  const code = useStore((s) => s.settings.securite?.code || '');
  const updateSettings = useStore((s) => s.updateSettings);

  return (
    <div className="stack-lg">
      <div className="card">
        <div className="card-header"><div className="card-title-row"><span className="card-icon accent"><i className="fa-solid fa-file-pdf" /></span><h3>Signature des PDF</h3></div></div>
        <Field label="Phrase de fin" hint="Affichée en pied de chaque PDF envoyé.">{(id) => <Input id={id} value={signature} onChange={(e) => updateSettings({ signature_pdf: e.target.value })} />}</Field>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title-row"><span className="card-icon"><i className="fa-solid fa-lock" /></span><h3>Sécurité</h3></div></div>
        <Field label="Code d’accès partagé" hint="Demandé à l’écran de connexion avant de choisir un profil.">
          {(id) => <Input id={id} value={code} disabled={!admin} onChange={(e) => updateSettings((s) => ({ securite: { ...s.securite, code: e.target.value } }))} />}
        </Field>
      </div>
    </div>
  );
}

/** Repère les éléments {xxx} présents dans un texte de template. */
const extractTokens = (text) => [...new Set((text || '').match(/\{[a-zA-Z]+\}/g) || [])];

function EmailsTab() {
  const templates = useStore((s) => s.settings.templates);
  const delai = useStore((s) => s.settings.delai_relance_jours);
  const updateSettings = useStore((s) => s.updateSettings);
  const commit = (key, field) => (value) => updateSettings((s) => ({ templates: { ...s.templates, [key]: { ...s.templates[key], [field]: value } } }));

  const blocks = [
    { key: 'peau', label: 'Diagnostic peau' },
    { key: 'cheveux', label: 'Diagnostic cheveux' },
    { key: 'relance', label: `Relance de suivi (J+${delai})` },
  ];

  return (
    <div className="stack-lg">
      <Notice icon="fa-solid fa-code">
        Ces éléments s’insèrent automatiquement à l’envoi : <span className="kbd">{'{prenom}'}</span> <span className="kbd">{'{praticienne}'}</span> <span className="kbd">{'{boutique}'}</span> <span className="kbd">{'{contexte_visite}'}</span> <span className="kbd">{'{delai_relance}'}</span> — ils ne peuvent pas être retirés du message.
      </Notice>
      {blocks.map((b) => (
        <div key={b.key} className="card">
          <h4 className="mb-2">{b.label}</h4>
          <Field label="Sujet">{(id) => <ProtectedTemplateField id={id} value={templates[b.key].sujet} onCommit={commit(b.key, 'sujet')} />}</Field>
          <Field label="Message" className="mt-2">{(id) => <ProtectedTemplateField id={id} value={templates[b.key].corps} onCommit={commit(b.key, 'corps')} multiline rows={5} />}</Field>
        </div>
      ))}
    </div>
  );
}

/**
 * Champ de template protégé : les éléments {xxx} déjà présents ne peuvent
 * pas être supprimés (validé à la perte de focus, pas à chaque frappe, pour
 * ne pas bloquer la saisie en cours de modification).
 */
function ProtectedTemplateField({ id, value, onCommit, multiline = false, rows }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);

  const handleBlur = () => {
    const missing = extractTokens(value).filter((t) => !extractTokens(draft).includes(t));
    if (missing.length) {
      toast(`Impossible de retirer ${missing.join(', ')} du message : cet élément se remplace automatiquement à l’envoi.`, { type: 'error' });
      setDraft(value);
      return;
    }
    if (draft !== value) onCommit(draft);
  };

  return multiline
    ? <Textarea id={id} rows={rows} value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={handleBlur} />
    : <Input id={id} value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={handleBlur} />;
}

function QuestionsTab() {
  const [editing, setEditing] = useState(null);
  return (
    <div className="stack-lg">
      <div className="grid-2">
        {[{ type: 'peau', label: 'Questionnaire peau', icon: 'fa-solid fa-spa' }, { type: 'cheveux', label: 'Questionnaire cheveux', icon: 'fa-solid fa-wind' }].map((t) => (
          <div key={t.type} className="card">
            <div className="card-title-row mb-2"><span className="card-icon"><i className={t.icon} /></span><h3>{t.label}</h3></div>
            <p className="small muted mb-2">Ajoutez, réordonnez ou retirez des questions présentées à la praticienne.</p>
            <Button variant="soft" icon="fa-solid fa-pen" onClick={() => setEditing(t.type)}>Modifier les questions</Button>
          </div>
        ))}
      </div>
      <QuestionsEditorModal open={!!editing} type={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function EntrepriseTab() {
  const entreprise = useStore((s) => s.settings.entreprise);
  const updateSettings = useStore((s) => s.updateSettings);
  const set = (field) => (e) => updateSettings((s) => ({ entreprise: { ...s.entreprise, [field]: e.target.value } }));

  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <div className="card-title-row mb-3"><span className="card-icon"><i className="fa-solid fa-shop" /></span><h3>Informations de la boutique</h3></div>
      <div className="stack">
        <Field label="Nom">{(id) => <Input id={id} value={entreprise.nom} onChange={set('nom')} />}</Field>
        <Field label="Slogan">{(id) => <Input id={id} value={entreprise.slogan} onChange={set('slogan')} />}</Field>
        <div className="form-row">
          <Field label="Email">{(id) => <Input id={id} type="email" value={entreprise.email} onChange={set('email')} />}</Field>
          <Field label="Téléphone">{(id) => <Input id={id} value={entreprise.telephone} onChange={set('telephone')} />}</Field>
        </div>
        <Field label="Adresse">{(id) => <Input id={id} value={entreprise.adresse} onChange={set('adresse')} />}</Field>
        <div className="form-row">
          <Field label="Site web">{(id) => <Input id={id} value={entreprise.site} onChange={set('site')} />}</Field>
          <Field label="Instagram">{(id) => <Input id={id} value={entreprise.instagram} onChange={set('instagram')} />}</Field>
        </div>
      </div>
    </div>
  );
}
