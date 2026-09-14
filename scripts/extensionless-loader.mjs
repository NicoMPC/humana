/**
 * Loader Node ESM utilitaire pour preview-pdf.mjs uniquement : le code
 * applicatif (src/data, src/lib) est écrit pour Vite et importe parfois
 * sans extension (« ../lib/dates »). Ce hook réessaie avec « .js » quand la
 * résolution Node classique échoue, sans toucher au code applicatif.
 */
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (err?.code === 'ERR_MODULE_NOT_FOUND' && !specifier.endsWith('.js') && !specifier.endsWith('.json')) {
      return nextResolve(`${specifier}.js`, context);
    }
    throw err;
  }
}
