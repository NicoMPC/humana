/**
 * Construction du PDF « Ma Routine » (visage ou cheveux) — vectoriel, jsPDF.
 * Pur (pas de dépendance navigateur) : testable en Node via loadAsset injecté.
 */
import { jsPDF } from 'jspdf';
import { registerFonts, FONT_FAMILIES } from './fonts.js';
import {
  PAGE, MARGIN, CONTENT_W, HEADER_H, COLORS,
  setFill, setText, setDraw, wrapText, drawSpacedText, spacedTextWidth,
  drawHeaderBand, drawSectionBar, drawFooter, drawLeaves, drawClosingPanel, ensureSpace,
} from './brand.js';
import { fullName } from '../format.js';
import { formatDateLong } from '../dates.js';

const TYPE_TITLE = { peau: 'VISAGE', cheveux: 'CHEVEUX' };
const MOMENT_LABELS = { matin: 'Matin', soir: 'Soir', hebdo: 'Hebdo' };
const MOMENT_ORDER = ['matin', 'soir', 'hebdo'];

const HELP_LINE = {
  peau: "Appliquer dans l'ordre indiqué, sur peau propre.",
  cheveux: 'Sur cheveux humides, essorés.',
};

const GENERIC_TIPS = {
  peau: [
    "Protégez votre peau du soleil chaque jour, même par temps couvert.",
    "Buvez suffisamment d'eau dans la journée pour soutenir l'hydratation de la peau.",
  ],
  cheveux: [
    "Rincez à l'eau tiède plutôt que chaude, pour préserver la fibre capillaire.",
    'Limitez la chaleur du sèche-cheveux ou du lisseur, ou protégez toujours vos longueurs avant.',
  ],
};

function praticienneLabel(praticienne) {
  if (!praticienne) return '';
  if (typeof praticienne === 'string') return praticienne;
  return fullName(praticienne);
}

function toProductMap(produits) {
  const list = Array.isArray(produits) ? produits : Object.values(produits || {});
  return new Map(list.map((p) => [p.id, p]));
}

function drawRoutineHeaderAndTitle(doc, ctx, { client, praticienne, typeLabel, dateLabel }) {
  drawHeaderBand(doc, ctx, { big: true, subtitle: ctx.entreprise?.slogan || 'Beauté naturelle' });

  const titleX = MARGIN.x0;
  doc.setFont(FONT_FAMILIES.serif, 'italic');
  doc.setFontSize(27);
  setText(doc, COLORS.clay);
  doc.text('Ma Routine', titleX, HEADER_H.first + 18);

  doc.setFont(FONT_FAMILIES.serif, 'bold');
  doc.setFontSize(32);
  setText(doc, COLORS.sageDark);
  drawSpacedText(doc, typeLabel, titleX, HEADER_H.first + 32.5, { spacing: 3.1, align: 'left' });

  // Cartouche « préparée pour » en haut à droite
  const boxW = 60;
  const boxH = 25;
  const boxX = PAGE.w - MARGIN.right - boxW;
  const boxY = HEADER_H.first + 6;
  setFill(doc, COLORS.sageVeryLight);
  doc.roundedRect(boxX, boxY, boxW, boxH, 1.6, 1.6, 'F');

  const padX = boxX + 5;
  doc.setFont(FONT_FAMILIES.sans, 'semibold');
  doc.setFontSize(9);
  setText(doc, COLORS.ink);
  const nameLine = wrapText(doc, `Préparée pour ${fullName(client)}`, boxW - 10);
  let ly = boxY + 7.5;
  nameLine.slice(0, 2).forEach((line) => {
    doc.text(line, padX, ly);
    ly += 4.2;
  });

  doc.setFont(FONT_FAMILIES.sans, 'normal');
  doc.setFontSize(8);
  setText(doc, COLORS.inkLight);
  if (praticienne) {
    doc.text(`par ${praticienne}`, padX, ly);
    ly += 4;
  }
  doc.text(`le ${dateLabel}`, padX, ly);

  drawLeaves(doc, 'top-right', { x: PAGE.w - 22, y: HEADER_H.first + 2, count: 6 });

  return HEADER_H.first + 40;
}

function drawReducedChrome(doc, ctx, pageNumber) {
  drawHeaderBand(doc, ctx, { big: false, running: `Ma Routine ${ctx.typeLabel} · ${ctx.clientName}` });
  return HEADER_H.next + 12;
}

function drawProductNumber(doc, x, y, index) {
  doc.setFont(FONT_FAMILIES.serif, 'bold');
  doc.setFontSize(13.5);
  setText(doc, COLORS.clay);
  doc.text(String(index + 1).padStart(2, '0'), x, y);
}

function measureItemHeight(doc, product, item, contentWidth) {
  let h = 4.2 + 4.2; // ligne nom + ligne catégorie/réf
  if (item.conseil) {
    const lines = wrapText(doc, item.conseil, contentWidth);
    h += lines.length * 4.1 + 1.2;
  }
  return h + 4; // marge basse
}

function drawProductItem(doc, x, y, index, product, item, contentWidth) {
  const textX = x + 12;
  drawProductNumber(doc, x, y + 4.3, index);

  doc.setFont(FONT_FAMILIES.sans, 'bold');
  doc.setFontSize(11);
  setText(doc, COLORS.ink);
  const name = product ? product.nom : `Produit ${item.produit_id}`;
  doc.text(name, textX, y + 4.3);

  doc.setFont(FONT_FAMILIES.sans, 'normal');
  doc.setFontSize(8);
  setText(doc, COLORS.inkLight);
  const meta = product ? `${product.categorie}  ·  Réf. ${product.reference}` : '';
  if (meta) doc.text(meta, textX, y + 8.6);

  let cursorY = y + 8.6;
  if (item.conseil) {
    doc.setFont(FONT_FAMILIES.serif, 'italic');
    doc.setFontSize(9.8);
    setText(doc, COLORS.clayDark);
    const lines = wrapText(doc, item.conseil, contentWidth);
    lines.forEach((line) => {
      cursorY += 4.1;
      doc.text(line, textX, cursorY);
    });
  }
  return cursorY;
}

/**
 * Construit le PDF de routine (retourne l'instance jsPDF, pas encore
 * enregistrée / téléchargée).
 */
export async function buildRoutinePdf({ diag, client, praticienne, produits, settings, loadAsset }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  await registerFonts(doc, loadAsset);

  const logoWhite = await loadAsset('brand/logo-blanc-crop.png');
  const ctxBase = {
    assets: { logoWhite },
    entreprise: settings?.entreprise,
    signature: settings?.signature_pdf,
    typeLabel: TYPE_TITLE[diag.type] || 'VISAGE',
    clientName: fullName(client),
  };

  const productMap = toProductMap(produits);
  const dateLabel = formatDateLong(diag.date_rdv || diag.date_creation);

  const state = { y: 0, page: 1 };
  state.y = drawRoutineHeaderAndTitle(doc, ctxBase, {
    client,
    praticienne: praticienneLabel(praticienne),
    typeLabel: ctxBase.typeLabel,
    dateLabel,
  });

  const redraw = (d, pageNumber) => drawReducedChrome(d, ctxBase, pageNumber);
  const itemContentWidth = CONTENT_W - 12;

  MOMENT_ORDER.forEach((moment) => {
    const items = (diag.routine || []).filter((it) => (it.moments || []).includes(moment));
    if (!items.length) return;

    const firstProduct = productMap.get(items[0].produit_id);
    const firstItemHeight = measureItemHeight(doc, firstProduct, items[0], itemContentWidth);
    ensureSpace(doc, state, 8.4 + 6 + firstItemHeight, redraw);
    state.y = drawSectionBar(doc, state.y, MOMENT_LABELS[moment]);
    state.y += 6;

    items.forEach((item, idx) => {
      const product = productMap.get(item.produit_id);
      const needed = measureItemHeight(doc, product, item, itemContentWidth);
      ensureSpace(doc, state, needed, redraw);
      const bottom = drawProductItem(doc, MARGIN.x0, state.y, idx, product, item, itemContentWidth);
      state.y = bottom + 5.4;
    });

    if (moment === 'matin' || moment === 'soir') {
      ensureSpace(doc, state, 6, redraw);
      doc.setFont(FONT_FAMILIES.serif, 'italic');
      doc.setFontSize(9.5);
      setText(doc, COLORS.inkLight);
      doc.text(HELP_LINE[diag.type] || '', MARGIN.x0, state.y);
      state.y += 6;
    }

    state.y += 4;
  });

  // Section CONSEILS (toujours affichée)
  const customLines = String(diag.conseils || '')
    .split(/\r?\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const genericLines = GENERIC_TIPS[diag.type] || [];
  const bulletWidth = CONTENT_W - 8;
  const allBullets = [...customLines, ...genericLines];

  doc.setFont(FONT_FAMILIES.sans, 'normal');
  doc.setFontSize(9.6);
  const firstBulletLines = allBullets.length ? wrapText(doc, allBullets[0], bulletWidth) : [];
  const firstBulletHeight = firstBulletLines.length ? firstBulletLines.length * 4.6 + 3.4 : 0;
  ensureSpace(doc, state, 8.4 + 7 + firstBulletHeight, redraw);
  state.y = drawSectionBar(doc, state.y, 'Conseils');
  state.y += 7;

  const drawBullet = (text) => {
    const lines = wrapText(doc, text, bulletWidth);
    const needed = lines.length * 4.8 + 2.6;
    ensureSpace(doc, state, needed, redraw);
    doc.setFont(FONT_FAMILIES.sans, 'bold');
    doc.setFontSize(10);
    setText(doc, COLORS.clay);
    doc.text('•', MARGIN.x0, state.y + 3.6);
    doc.setFont(FONT_FAMILIES.sans, 'normal');
    doc.setFontSize(9.6);
    setText(doc, COLORS.ink);
    let cy = state.y + 3.6;
    lines.forEach((line, i) => {
      doc.text(line, MARGIN.x0 + 6, cy + (i === 0 ? 0 : 4.6));
    });
    state.y += lines.length * 4.6 + 3.4;
  };

  allBullets.forEach(drawBullet);

  drawClosingPanel(doc, state.y);

  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p += 1) {
    doc.setPage(p);
    drawFooter(doc, ctxBase, p);
  }
  doc.putTotalPages('{total_pages}');

  return doc;
}
