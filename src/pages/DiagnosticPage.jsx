import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCurrentUser, useStore } from '../store/useStore';
import { diagnosticStep, getClient, getDiagnostic, getUser, quizProgress, routineIsValid } from '../store/selectors';
import { fullName } from '../lib/format';
import { formatDate } from '../lib/dates';
import { Button, Dropdown, EmptyState, Segmented, Stepper, TypeBadge, StatusBadge } from '../components/ui';
import { QuizStep } from '../components/diagnostic/QuizStep';
import { RoutineBuilder } from '../components/diagnostic/RoutineBuilder';
import { LifestyleStep } from '../components/diagnostic/LifestyleStep';
import { SendStep } from '../components/diagnostic/SendStep';
import { JournalTimeline } from '../components/diagnostic/JournalTimeline';
import { ClientFormModal } from '../components/clients/ClientFormModal';
import { usePdfActions } from '../hooks/usePdfActions';
import { confirmDialog, toast } from '../store/useUI';

const STEPS = ['Questionnaire', 'Routine', 'PDF & envoi', 'Suivi'];

export default function DiagnosticPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const state = useStore();
  const diag = getDiagnostic(state, id);
  const validateRoutine = useStore((s) => s.validateRoutine);
  const updateDiagnostic = useStore((s) => s.updateDiagnostic);
  const deleteDiagnostic = useStore((s) => s.deleteDiagnostic);
  const reopen = useStore((s) => s.reopen);
  const cloturer = useStore((s) => s.cloturer);
  const [editClient, setEditClient] = useState(false);

  if (!diag) {
    return <EmptyState icon="fa-regular fa-face-frown" title="Diagnostic introuvable" action={<Button variant="primary" onClick={() => navigate('/')}>Retour à l’accueil</Button>} />;
  }

  const client = getClient(state, diag.client_id);
  const praticienne = getUser(state, diag.praticienne_id);
  const questions = state.questions[diag.type];
  const step = diagnosticStep(diag, questions);
  const quiz = quizProgress(diag, questions);
  const routineOk = routineIsValid(diag);
  const { generate } = usePdfActions(diag);

  const scrollTo = (n) => document.getElementById(`section-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const onQuizDone = () => setTimeout(() => scrollTo(2), 150);
  const onValidateRoutine = async () => {
    validateRoutine(diag.id, user.id);
    toast('Routine enregistrée');
    const doc = await generate('routine', { auteurId: user.id });
    setTimeout(() => scrollTo(doc ? 3 : 2), 150);
  };

  const handleDelete = async () => {
    const ok = await confirmDialog({ title: 'Supprimer ce diagnostic ?', message: 'Cette action est définitive.', confirmLabel: 'Supprimer', danger: true });
    if (ok) { deleteDiagnostic(diag.id); toast('Diagnostic supprimé'); navigate(`/clientes/${diag.client_id}`); }
  };

  return (
    <>
      <button type="button" className="btn btn-ghost btn-sm mb-2" onClick={() => navigate(`/clientes/${diag.client_id}`)}><i className="fa-solid fa-arrow-left" /> {fullName(client)}</button>

      <div className="diag-head">
        <div className="grow">
          <div className="eyebrow">Diagnostic {diag.type === 'peau' ? 'peau' : 'cheveux'}</div>
          <h1>{fullName(client)}</h1>
          <div className="head-sub">
            <TypeBadge type={diag.type} />
            <StatusBadge diag={diag} />
            <span><i className="fa-regular fa-calendar" /> {formatDate(diag.date_rdv)}</span>
            {praticienne && <span><i className="fa-regular fa-user" /> {fullName(praticienne)}</span>}
          </div>
          <Segmented
            size="sm"
            className="mt-2"
            value={diag.modalite || 'boutique'}
            onChange={(v) => updateDiagnostic(diag.id, { modalite: v })}
            options={[
              { value: 'boutique', label: 'En boutique', icon: 'fa-solid fa-shop' },
              { value: 'visio', label: 'En visio', icon: 'fa-solid fa-video' },
            ]}
          />
        </div>
        <Dropdown trigger={<Button variant="ghost" icon="fa-solid fa-ellipsis-vertical" aria-label="Plus d’actions" />} items={[
          diag.statut === 'termine' && { label: 'Rouvrir le diagnostic', icon: 'fa-solid fa-rotate-left', onClick: () => { reopen(diag.id, user.id); toast('Diagnostic rouvert'); } },
          diag.statut !== 'termine' && { label: 'Clôturer sans relance', icon: 'fa-regular fa-circle-check', onClick: () => { cloturer(diag.id, user.id); toast('Diagnostic clôturé'); } },
          { label: 'Modifier la fiche cliente', icon: 'fa-solid fa-user-pen', onClick: () => setEditClient(true) },
          { label: 'Supprimer ce diagnostic', icon: 'fa-solid fa-trash-can', danger: true, onClick: handleDelete },
        ]} />
      </div>

      <Stepper steps={STEPS} current={step} onSelect={scrollTo} done={[1, 2, 3, 4].filter((n) => n < step || (n === 1 && quiz.complete) || (n === 2 && routineOk))} />

      <section className="card section-card" id="section-1">
        <div className="section-head"><div><div className="eyebrow">Étape 1</div><h2>Questionnaire</h2></div></div>
        <QuizStep diag={diag} questions={questions} onDone={onQuizDone} />
      </section>

      <section className="card section-card mt-3" id="section-2">
        <div className="section-head"><div><div className="eyebrow">Étape 2</div><h2>Routine &amp; conseils</h2></div></div>
        <RoutineBuilder diag={diag} onValidate={onValidateRoutine} />
      </section>

      <section className="card section-card mt-3" id="section-2b">
        <div className="section-head"><div><div className="eyebrow accent">Option</div><h2>Conseils lifestyle</h2></div></div>
        <LifestyleStep diag={diag} onGenerate={() => generate('lifestyle', { auteurId: user.id })} />
      </section>

      <section className="card section-card mt-3" id="section-3">
        <div className="section-head"><div><div className="eyebrow">Étape 3</div><h2>PDF &amp; envoi</h2></div></div>
        <SendStep diag={diag} client={client} onEditClient={() => setEditClient(true)} />
      </section>

      <section className="card mt-3" id="section-4">
        <div className="section-head"><div><div className="eyebrow">Étape 4</div><h2>Journal de suivi</h2></div></div>
        <JournalTimeline diag={diag} onGoToSend={() => scrollTo(3)} />
      </section>

      <ClientFormModal open={editClient} onClose={() => setEditClient(false)} client={client} />
    </>
  );
}
