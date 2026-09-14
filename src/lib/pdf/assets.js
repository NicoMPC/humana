/**
 * Chargement des ressources binaires (polices, logos) pour la génération de
 * PDF côté navigateur. Le module ne référence jamais `import.meta` : l'appelant
 * (l'app Vite) fournit `baseUrl` (typiquement `import.meta.env.BASE_URL`).
 */

/**
 * Fabrique un `loadAsset(relPath)` qui va chercher `${baseUrl}${relPath}`
 * (ex. `relPath = 'fonts/Quicksand-Regular.ttf'`) et renvoie une chaîne base64.
 */
export function browserAssetLoader(baseUrl) {
  return async function loadAsset(relPath) {
    const url = `${baseUrl}${relPath}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Impossible de charger la ressource PDF : ${url} (${res.status})`);
    }
    const buffer = await res.arrayBuffer();
    return arrayBufferToBase64(buffer);
  };
}

/** Convertit un ArrayBuffer en base64 par morceaux (évite les piles trop profondes). */
export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}
