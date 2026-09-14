import { forwardRef } from 'react';

/**
 * Bouton générique.
 * variant: primary | accent | soft | ghost | danger | premium | default
 * size: sm | md | lg
 */
export const Button = forwardRef(function Button(
  { variant = 'default', size = 'md', icon, iconRight, loading = false, block = false, round = false, className = '', children, type = 'button', ...rest },
  ref
) {
  const cls = [
    'btn',
    variant !== 'default' && `btn-${variant}`,
    size === 'sm' && 'btn-sm',
    size === 'lg' && 'btn-lg',
    block && 'btn-block',
    round && 'btn-round',
    !children && icon && 'btn-icon',
    loading && 'is-loading',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button ref={ref} type={type} className={cls} disabled={rest.disabled || loading} {...rest}>
      {icon && <i className={icon} aria-hidden="true" />}
      {children}
      {iconRight && <i className={iconRight} aria-hidden="true" />}
    </button>
  );
});
