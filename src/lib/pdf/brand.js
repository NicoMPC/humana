/**
 * Charte graphique et helpers de mise en page partagés par les PDF Hu'mana
 * (routine et lifestyle) : couleurs, bandeau, barres de section, pied de
 * page, feuillages décoratifs, gestion des sauts de page.
 */

export const FONT_FAMILIES = {
  serif: 'Cormorant',
  sans: 'Quicksand',
};

export const PAGE = { w: 210, h: 297 };
export const MARGIN = { left: 16, right: 16, x0: 16, x1: 194 };
export const CONTENT_W = PAGE.w - MARGIN.left - MARGIN.right; // 178

export const HEADER_H = { first: 34, next: 15 };
export const FOOTER_H = 24;
export const BOTTOM_LIMIT = PAGE.h - FOOTER_H; // 273

/** Palette Hu'mana : sauge / crème / argile. */
export const COLORS = {
  sage: [143, 163, 121],
  sageDark: [100, 118, 83],
  sageLight: [199, 211, 183],
  sageVeryLight: [243, 246, 238],
  cream: [251, 248, 243],
  creamDeep: [232, 217, 196],
  clay: [216, 128, 118],
  clayDark: [164, 84, 74],
  ink: [38, 42, 35],
  inkLight: [111, 116, 106],
  white: [255, 255, 255],
};

const LOGO_RATIO = 363 / 756; // hauteur / largeur du logo blanc/vert détouré

/** Applique une couleur RGB (tableau [r,g,b]) au fill/texte/trait courant. */
export function setFill(doc, rgb) { doc.setFillColor(rgb[0], rgb[1], rgb[2]); }
export function setText(doc, rgb) { doc.setTextColor(rgb[0], rgb[1], rgb[2]); }
export function setDraw(doc, rgb) { doc.setDrawColor(rgb[0], rgb[1], rgb[2]); }

/** Largeur d'un texte en tenant compte d'un espacement de caractères manuel. */
export function spacedTextWidth(doc, text, spacing = 0) {
  const base = doc.getTextWidth(text);
  return base + spacing * Math.max(0, text.length - 1);
}

/** Écrit du texte avec un `charSpace` donné, puis remet l'espacement à 0. */
export function drawSpacedText(doc, text, x, y, { spacing = 0, align = 'left' } = {}) {
  doc.setCharSpace(spacing);
  let drawX = x;
  if (align === 'center') drawX = x - spacedTextWidth(doc, text, spacing) / 2;
  else if (align === 'right') drawX = x - spacedTextWidth(doc, text, spacing);
  doc.text(text, drawX, y);
  doc.setCharSpace(0);
}

/** Découpe un texte en lignes tenant dans `maxWidth`. */
export function wrapText(doc, text, maxWidth) {
  return doc.splitTextToSize(String(text || ''), maxWidth);
}

/**
 * Bandeau haut sauge avec logo blanc centré et éventuel sous-titre
 * (« Beauté naturelle ») ou fil d'Ariane (pages suivantes, bandeau réduit).
 */
export function drawHeaderBand(doc, ctx, { big = true, subtitle, running } = {}) {
  const h = big ? HEADER_H.first : HEADER_H.next;
  setFill(doc, COLORS.sage);
  doc.rect(0, 0, PAGE.w, h, 'F');

  if (ctx.assets?.logoWhite) {
    const logoW = big ? 30 : 17;
    const logoH = logoW * LOGO_RATIO;
    const x = (PAGE.w - logoW) / 2;
    const y = big ? 5.5 : (h - logoH) / 2;
    doc.addImage(ctx.assets.logoWhite, 'PNG', x, y, logoW, logoH);

    if (big && subtitle) {
      doc.setFont(FONT_FAMILIES.sans, 'semibold');
      doc.setFontSize(9.5);
      setText(doc, COLORS.white);
      drawSpacedText(doc, subtitle.toUpperCase(), PAGE.w / 2, y + logoH + 6, { spacing: 1.4, align: 'center' });
    }
  }

  if (!big && running) {
    doc.setFont(FONT_FAMILIES.sans, 'semibold');
    doc.setFontSize(8.5);
    setText(doc, COLORS.white);
    drawSpacedText(doc, running.toUpperCase(), MARGIN.x0, h / 2 + 1.6, { spacing: 0.6, align: 'left' });
  }

  return h;
}

/**
 * Barre de section (« MATIN », « SOIR », « HEBDO », « CONSEILS ») : bloc
 * sauge sur ~42 % de la largeur utile, texte blanc capitales espacées,
 * prolongé par un filet fin crème jusqu'au bord droit.
 */
export function drawSectionBar(doc, y, label) {
  const barW = CONTENT_W * 0.42;
  const barH = 8.4;

  setFill(doc, COLORS.sage);
  doc.rect(MARGIN.x0, y, barW, barH, 'F');

  setDraw(doc, COLORS.creamDeep);
  doc.setLineWidth(0.5);
  const lineY = y + barH / 2;
  doc.line(MARGIN.x0 + barW, lineY, MARGIN.x1, lineY);

  doc.setFont(FONT_FAMILIES.serif, 'bold');
  doc.setFontSize(12.5);
  setText(doc, COLORS.white);
  drawSpacedText(doc, label.toUpperCase(), MARGIN.x0 + barW / 2, y + barH / 2 + 3, { spacing: 1.8, align: 'center' });

  return y + barH;
}

/**
 * Pied de page : coordonnées de la boutique + phrase de signature italique,
 * pagination « Page X / {total_pages} » (jeton résolu via doc.putTotalPages).
 */
export function drawFooter(doc, ctx, pageIndex) {
  const { entreprise, signature } = ctx;
  const y0 = PAGE.h - FOOTER_H;

  setDraw(doc, COLORS.creamDeep);
  doc.setLineWidth(0.4);
  doc.line(MARGIN.x0, y0, MARGIN.x1, y0);

  let y = y0 + 6;
  if (signature) {
    doc.setFont(FONT_FAMILIES.serif, 'italic');
    doc.setFontSize(10.5);
    setText(doc, COLORS.clayDark);
    doc.text(signature, PAGE.w / 2, y, { align: 'center' });
    y += 5.4;
  }

  doc.setFont(FONT_FAMILIES.sans, 'normal');
  doc.setFontSize(7.4);
  setText(doc, COLORS.inkLight);
  const line1 = [entreprise?.nom, entreprise?.adresse].filter(Boolean).join('   ·   ');
  const line2 = [entreprise?.telephone, entreprise?.email, entreprise?.instagram].filter(Boolean).join('   ·   ');
  if (line1) doc.text(line1, PAGE.w / 2, y, { align: 'center' });
  if (line2) doc.text(line2, PAGE.w / 2, y + 4, { align: 'center' });

  doc.setFont(FONT_FAMILIES.sans, 'semibold');
  doc.setFontSize(8);
  setText(doc, COLORS.sageDark);
  doc.text(`Page ${pageIndex} / {total_pages}`, PAGE.w - MARGIN.right, PAGE.h - 6.5, { align: 'right' });
}

/**
 * Bloc de clôture décoratif comblant le blanc en bas de la dernière page
 * quand le contenu (peu de produits, peu de conseils) s'arrête loin avant
 * le pied de page — sans lui, la page paraît inachevée. Ne se déclenche que
 * si l'espace restant est franchement disproportionné (`minGap`) : un peu
 * d'air en bas de page est normal et n'a pas besoin d'être comblé.
 */
export function drawClosingPanel(doc, y, { minGap = 55 } = {}) {
  const remaining = BOTTOM_LIMIT - y;
  if (remaining < minGap) return;

  const panelY = y + 6;
  const panelH = remaining - 10;
  setFill(doc, COLORS.sageVeryLight);
  doc.roundedRect(MARGIN.x0, panelY, CONTENT_W, panelH, 3, 3, 'F');

  const centerX = MARGIN.x0 + CONTENT_W / 2;
  const centerY = panelY + panelH / 2;

  doc.setFont(FONT_FAMILIES.serif, 'italic');
  doc.setFontSize(14);
  setText(doc, COLORS.sageDark);
  doc.text('Merci pour votre confiance.', centerX, centerY - 3, { align: 'center' });

  doc.setFont(FONT_FAMILIES.sans, 'normal');
  doc.setFontSize(9);
  setText(doc, COLORS.inkLight);
  doc.text('Toute l’équipe est là pour vous accompagner au quotidien.', centerX, centerY + 5, { align: 'center' });

  drawLeaves(doc, 'bottom-left', { x: MARGIN.x0 + 16, y: panelY + panelH - 8, count: 6 });
}

/**
 * S'assure qu'il reste `needed` mm avant le pied de page ; sinon ajoute une
 * page et appelle `redraw(doc, pageNumber)` qui doit dessiner le chrome de
 * la nouvelle page (bandeau réduit, feuillages…) et renvoyer le nouveau `y`.
 */
export function ensureSpace(doc, state, needed, redraw) {
  if (state.y + needed > BOTTOM_LIMIT) {
    doc.addPage();
    state.page += 1;
    state.y = redraw(doc, state.page);
  }
  return state.y;
}

/** Dessine un leaf (feuille pointue) centré en (0,0), pointant vers le haut. */
function leafPath(c2d, length, width) {
  c2d.beginPath();
  c2d.moveTo(0, 0);
  c2d.bezierCurveTo(width / 2, -length * 0.32, width / 2, -length * 0.72, 0, -length);
  c2d.bezierCurveTo(-width / 2, -length * 0.72, -width / 2, -length * 0.32, 0, 0);
  c2d.closePath();
  c2d.fill();
}

/**
 * Feuillage décoratif vectoriel sobre (teintes crème / sauge très pâle),
 * dans l'esprit du gabarit papier mais sans doré, tracé avec context2d.
 * `corner` : 'top-right' | 'bottom-left'.
 */
export function drawLeaves(doc, corner, opts = {}) {
  const c2d = doc.context2d;
  const mirror = corner === 'bottom-left' ? -1 : 1;
  const anchor = corner === 'bottom-left'
    ? { x: opts.x ?? MARGIN.x0 - 4, y: opts.y ?? PAGE.h - FOOTER_H - 6 }
    : { x: opts.x ?? PAGE.w - 30, y: opts.y ?? HEADER_H.first + 4 };
  const stemAngle = corner === 'bottom-left' ? -55 : 125; // degrés, direction de la tige
  const leafCount = opts.count ?? 6;
  const colors = opts.colors || [COLORS.sageVeryLight, COLORS.creamDeep];

  c2d.save();
  c2d.translate(anchor.x, anchor.y);
  c2d.rotate((stemAngle * Math.PI) / 180);

  // tige fine
  c2d.strokeStyle = `rgb(${COLORS.sageLight.join(',')})`;
  c2d.lineWidth = 0.35;
  c2d.beginPath();
  c2d.moveTo(0, 0);
  c2d.bezierCurveTo(2 * mirror, -8, -1 * mirror, -18, 3 * mirror, -30);
  c2d.stroke();

  for (let i = 0; i < leafCount; i += 1) {
    const t = i / (leafCount - 1);
    const dist = 2 + t * 26;
    const side = i % 2 === 0 ? 1 : -1;
    const size = 7 - t * 3.2;
    c2d.save();
    c2d.translate(side * mirror * 1.2, -dist);
    c2d.rotate(((side * 32 + 8) * Math.PI) / 180);
    c2d.fillStyle = `rgb(${colors[i % colors.length].join(',')})`;
    leafPath(c2d, size, size * 0.46);
    c2d.restore();
  }

  c2d.restore();
}
