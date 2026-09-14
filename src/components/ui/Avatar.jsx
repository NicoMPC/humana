import { initials } from '../../lib/format';

/** Avatar à initiales, couleur optionnelle (utilisatrices). */
export function Avatar({ person, size = 'md', color, tone, className = '' }) {
  const style = color ? { background: color, color: '#fff' } : undefined;
  const cls = ['avatar', size !== 'md' && size, tone, className].filter(Boolean).join(' ');
  return (
    <span className={cls} style={style} aria-hidden="true">
      {initials(person)}
    </span>
  );
}
