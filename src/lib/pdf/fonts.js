/**
 * Enregistrement des polices maison (Cormorant Garamond, Quicksand) dans les
 * documents jsPDF. Les fichiers TTF sont chargés une seule fois par process
 * (cache module, en base64) puis injectés dans chaque instance jsPDF via
 * `addFileToVFS` / `addFont` — jsPDF ne partage pas les polices entre
 * instances, il faut donc rejouer l'enregistrement à chaque document créé.
 */

const FONT_FILES = [
  { path: 'fonts/CormorantGaramond-Regular.ttf', vfs: 'CormorantGaramond-Regular.ttf', family: 'Cormorant', style: 'normal' },
  { path: 'fonts/CormorantGaramond-SemiBold.ttf', vfs: 'CormorantGaramond-SemiBold.ttf', family: 'Cormorant', style: 'bold' },
  { path: 'fonts/CormorantGaramond-Italic.ttf', vfs: 'CormorantGaramond-Italic.ttf', family: 'Cormorant', style: 'italic' },
  { path: 'fonts/Quicksand-Regular.ttf', vfs: 'Quicksand-Regular.ttf', family: 'Quicksand', style: 'normal' },
  { path: 'fonts/Quicksand-SemiBold.ttf', vfs: 'Quicksand-SemiBold.ttf', family: 'Quicksand', style: 'semibold' },
  { path: 'fonts/Quicksand-Bold.ttf', vfs: 'Quicksand-Bold.ttf', family: 'Quicksand', style: 'bold' },
];

/** Cache module : les TTF (base64) ne sont chargés qu'une fois par process. */
let fontsPromise = null;

function loadAllFonts(loadAsset) {
  if (!fontsPromise) {
    fontsPromise = Promise.all(
      FONT_FILES.map(async (font) => ({ ...font, base64: await loadAsset(font.path) })),
    );
  }
  return fontsPromise;
}

/**
 * Enregistre les 6 polices sur l'instance jsPDF fournie.
 * `loadAsset(relPath)` doit renvoyer une chaîne base64 (sans préfixe data:).
 */
export async function registerFonts(doc, loadAsset) {
  const fonts = await loadAllFonts(loadAsset);
  for (const font of fonts) {
    doc.addFileToVFS(font.vfs, font.base64);
    doc.addFont(font.vfs, font.family, font.style);
  }
  return doc;
}

export const FONT_FAMILIES = {
  serif: 'Cormorant',
  sans: 'Quicksand',
};
