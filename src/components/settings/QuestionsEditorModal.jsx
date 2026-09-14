import { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { QUESTION_TYPES } from '../../data/constants';
import { uid } from '../../lib/ids';
import { toast } from '../../store/useUI';
import { Button, Input, Modal, Select } from '../ui';

const NEW_Q = () => ({ id: uid('q'), texte: 'Nouvelle question', type: 'texte', options: [], obligatoire: false, aide: '' });

export function QuestionsEditorModal({ open, onClose, type }) {
  const questions = useStore((s) => s.questions[type]);
  const setQuestions = useStore((s) => s.setQuestions);
  const [list, setList] = useState([]);

  useEffect(() => { if (open) setList(questions.map((q) => ({ ...q, options: [...q.options] }))); }, [open, questions]);

  const patch = (i, p) => setList((l) => l.map((q, idx) => (idx === i ? { ...q, ...p } : q)));
  const remove = (i) => setList((l) => l.filter((_, idx) => idx !== i));
  const move = (i, dir) => setList((l) => { const n = [...l]; const j = i + dir; if (j < 0 || j >= n.length) return l; [n[i], n[j]] = [n[j], n[i]]; return n; });

  const save = () => {
    if (list.some((q) => !q.texte.trim())) return toast('Chaque question doit avoir un texte', { type: 'warning' });
    setQuestions(type, list);
    toast('Questionnaire mis à jour');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} size="lg" title={`Questionnaire ${type === 'peau' ? 'peau' : 'cheveux'}`} subtitle="Modifiez, réordonnez ou ajoutez des questions."
      actions={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button variant="primary" icon="fa-solid fa-check" onClick={save}>Enregistrer</Button></>}>
      <div className="stack">
        {list.map((q, i) => (
          <div key={q.id} className="subtle-card stack" style={{ gap: '.6rem' }}>
            <div className="flex">
              <Input value={q.texte} onChange={(e) => patch(i, { texte: e.target.value })} placeholder="Texte de la question" className="grow" />
              <Button variant="ghost" size="sm" icon="fa-solid fa-arrow-up" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Monter" />
              <Button variant="ghost" size="sm" icon="fa-solid fa-arrow-down" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label="Descendre" />
              <Button variant="ghost" size="sm" icon="fa-solid fa-trash-can" onClick={() => remove(i)} aria-label="Supprimer" />
            </div>
            <div className="flex wrap">
              <Select size="sm" value={q.type} onChange={(e) => patch(i, { type: e.target.value })} style={{ maxWidth: 180 }}>
                {Object.entries(QUESTION_TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </Select>
              <label className="flex xs" style={{ gap: '.4rem' }}><input type="checkbox" checked={q.obligatoire} onChange={(e) => patch(i, { obligatoire: e.target.checked })} /> Recommandée</label>
            </div>
            {(q.type === 'choix_multiple' || q.type === 'choix_unique') && (
              <Input size="sm" value={q.options.join(', ')} onChange={(e) => patch(i, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} placeholder="Options séparées par des virgules" />
            )}
          </div>
        ))}
        <Button variant="soft" icon="fa-solid fa-plus" onClick={() => setList((l) => [...l, NEW_Q()])}>Ajouter une question</Button>
      </div>
    </Modal>
  );
}
