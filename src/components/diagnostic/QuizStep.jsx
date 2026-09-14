import { useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';
import { answerIsFilled, quizProgress } from '../../store/selectors';
import { Button, Progress, Textarea, Tooltip } from '../ui';

/**
 * Questionnaire de diagnostic : une question à la fois (carrousel), puis
 * récapitulatif éditable. Chaque réponse est enregistrée au fil de la saisie.
 */
export function QuizStep({ diag, questions, onDone }) {
  const setAnswer = useStore((s) => s.setAnswer);
  const setObservation = useStore((s) => s.setObservation);
  const [index, setIndex] = useState(() => {
    const firstUnanswered = questions.findIndex((q) => !answerIsFilled(diag.reponses[q.id]));
    return firstUnanswered === -1 ? 0 : firstUnanswered;
  });
  const [summary, setSummary] = useState(() => quizProgress(diag, questions).complete);
  const [dir, setDir] = useState('fwd');
  const [showObs, setShowObs] = useState(false);

  const progress = quizProgress(diag, questions);
  const question = questions[index];
  const answer = diag.reponses[question?.id];

  const goto = (i, direction = 'fwd') => {
    if (i < 0 || i >= questions.length) return;
    setDir(direction);
    setIndex(i);
    setShowObs(!!diag.observations[questions[i].id]);
  };

  const finish = () => { setSummary(true); onDone?.(); };

  if (summary) {
    return (
      <div className="quiz">
        <p className="muted small">Vérifiez les réponses avant de passer à la routine. Ces informations restent internes et n’apparaissent pas dans le PDF.</p>
        <div className="summary-list">
          {questions.map((q) => {
            const a = diag.reponses[q.id];
            const filled = answerIsFilled(a);
            return (
              <div key={q.id} className="summary-item">
                <div>
                  <div className="q">{q.texte}</div>
                  <div className={`a ${filled ? '' : 'empty'}`}>{filled ? (Array.isArray(a) ? a.join(', ') : a) : 'Non renseigné'}</div>
                  {diag.observations[q.id] && <div className="obs"><i className="fa-regular fa-note-sticky" /> {diag.observations[q.id]}</div>}
                </div>
                <Button variant="ghost" size="sm" icon="fa-solid fa-pen" onClick={() => { setSummary(false); goto(questions.indexOf(q)); }}>Modifier</Button>
              </div>
            );
          })}
        </div>
        <div className="quiz-nav">
          <Button variant="default" icon="fa-solid fa-rotate-left" onClick={() => { setSummary(false); goto(0); }}>Revoir les réponses</Button>
          <Button variant="primary" iconRight="fa-solid fa-arrow-down" onClick={onDone}>Passer à la routine</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz">
      <div className="quiz-progress">
        <span>Question {index + 1}/{questions.length}</span>
        <Progress value={(progress.answered / progress.total) * 100} />
        <span>{progress.answered}/{progress.total}</span>
      </div>
      <div className="quiz-dots">
        {questions.map((q, i) => (
          <button key={q.id} type="button" className={`quiz-dot ${answerIsFilled(diag.reponses[q.id]) ? 'is-answered' : ''} ${i === index ? 'is-current' : ''}`} onClick={() => goto(i, i > index ? 'fwd' : 'back')} title={q.texte}>
            {answerIsFilled(diag.reponses[q.id]) && i !== index ? <i className="fa-solid fa-check" /> : i + 1}
          </button>
        ))}
      </div>

      <div className="card quiz-card">
        <div key={question.id} className={`quiz-body ${dir === 'back' ? 'back' : ''}`}>
          <div className="question-kicker">
            Question {index + 1} {question.obligatoire && <Tooltip text="Réponse recommandée pour un diagnostic complet"><span className="badge badge-outline xs">Recommandée</span></Tooltip>}
          </div>
          <h3 className="question-text">{question.texte}</h3>
          {question.aide && <p className="muted small mb-2">{question.aide}</p>}

          <AnswerField question={question} value={answer} onChange={(v) => setAnswer(diag.id, question.id, v)} />

          <div className="observation-toggle">
            {!showObs ? (
              <Button variant="ghost" size="sm" icon="fa-regular fa-note-sticky" onClick={() => setShowObs(true)}>Ajouter une observation</Button>
            ) : (
              <div className="field">
                <label>Observation (optionnelle)</label>
                <Textarea rows={2} placeholder="Une note visible dans le suivi de la praticienne…" value={diag.observations[question.id] || ''} onChange={(e) => setObservation(diag.id, question.id, e.target.value)} />
              </div>
            )}
          </div>
        </div>
        <div className="quiz-nav">
          <Button variant="default" icon="fa-solid fa-arrow-left" disabled={index === 0} onClick={() => goto(index - 1, 'back')}>Précédent</Button>
          {index === questions.length - 1
            ? <Button variant="primary" iconRight="fa-solid fa-list-check" onClick={finish}>Voir le récapitulatif</Button>
            : <Button variant="primary" iconRight="fa-solid fa-arrow-right" onClick={() => goto(index + 1, 'fwd')}>Suivant</Button>}
        </div>
      </div>
    </div>
  );
}

function AnswerField({ question, value, onChange }) {
  const list = useMemo(() => (Array.isArray(value) ? value : value ? [value] : []), [value]);
  if (question.type === 'choix_multiple') {
    return (
      <div className="options-grid">
        {question.options.map((opt) => {
          const checked = list.includes(opt);
          return (
            <label key={opt} className={`option ${checked ? 'is-checked' : ''}`}>
              <input type="checkbox" checked={checked} onChange={() => onChange(checked ? list.filter((o) => o !== opt) : [...list, opt])} />
              <span className="box">{checked && <i className="fa-solid fa-check" />}</span>
              <span>{opt}</span>
            </label>
          );
        })}
      </div>
    );
  }
  if (question.type === 'choix_unique') {
    return (
      <div className="options-grid">
        {question.options.map((opt) => {
          const checked = value === opt;
          return (
            <label key={opt} className={`option radio ${checked ? 'is-checked' : ''}`}>
              <input type="radio" name={question.id} checked={checked} onChange={() => onChange(opt)} />
              <span className="box">{checked && <i className="fa-solid fa-check" />}</span>
              <span>{opt}</span>
            </label>
          );
        })}
      </div>
    );
  }
  if (question.type === 'oui_non') {
    return (
      <div className="options-row">
        {['Oui', 'Non'].map((opt) => {
          const checked = value === opt;
          return (
            <label key={opt} className={`option radio ${checked ? 'is-checked' : ''}`}>
              <input type="radio" name={question.id} checked={checked} onChange={() => onChange(opt)} />
              <span className="box">{checked && <i className="fa-solid fa-check" />}</span>
              <span>{opt}</span>
            </label>
          );
        })}
      </div>
    );
  }
  return <Textarea rows={3} placeholder="Notez la réponse…" value={value || ''} onChange={(e) => onChange(e.target.value)} />;
}
