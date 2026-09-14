/**
 * Construction du PDF « Mes conseils lifestyle » — vectoriel, jsPDF.
 * Pur (pas de dépendance navigateur) : testable en Node via loadAsset injecté.
 */
import { jsPDF } from 'jspdf';
import { registerFonts, FONT_FAMILIES } from './fonts.js';
import {
  PAGE, MARGIN, CONTENT_W, HEADER_H, COLORS,
  setFill, setText, wrapText, drawSpacedText,
  drawHeaderBand, drawFooter, drawLeaves, drawClosingPanel,
} from './brand.js';
import { fullName } from '../format.js';
import { formatDateLong } from '../dates.js';

function praticienneLabel(praticienne) {
  if (!praticienne) return '';
  if (typeof praticienne === 'string') return praticienne;
  return fullName(praticienne);
}

function drawLifestyleHeaderAndTitle(doc, ctx, { client, praticienne, dateLabel }) {
  drawHeaderBand(doc, ctx, { big: true, subtitle: ctx.entreprise?.slogan || 'Beauté naturelle' });

  const titleX = MARGIN.x0;
  doc.setFont(FONT_FAMILIES.serif, 'italic');
  doc.setFontSize(27);
  setText(doc, COLORS.clay);
  doc.text('Mes conseils', titleX, HEADER_H.first + 18);

  doc.setFont(FONT_FAMILIES.serif, 'bold');
  doc.setFontSize(32);
  setText(doc, COLORS.sageDark);
  drawSpacedText(doc, 'LIFESTYLE', titleX, HEADER_H.first + 32.5, { spacing: 3.1, align: 'left' });

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
  const nameLines = wrapText(doc, `Préparée pour ${fullName(client)}`, boxW - 10);
  let ly = boxY + 7.5;
  nameLines.slice(0, 2).forEach((line) => {
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

  return HEADER_H.first + 42;
}

function drawReducedChrome(doc, ctx, pageNumber) {
  drawHeaderBand(doc, ctx, { big: false, running: `Mes Conseils Lifestyle · ${ctx.clientName}` });
  return HEADER_H.next + 12;
}

function measureCardHeight(doc, tip, colW) {
  const textW = colW - 16;
  doc.setFont(FONT_FAMILIES.sans, 'normal');
  doc.setFontSize(9.4);
  const lines = wrapText(doc, tip.texte || '', textW);
  return 9 + 7 + 5.2 + lines.length * 4.3 + 8;
}

function drawCard(doc, x, y, w, h, tip, index) {
  setFill(doc, COLORS.sageVeryLight);
  doc.roundedRect(x, y, w, h, 2, 2, 'F');

  const cx = x + 13;
  const cy = y + 13;
  setFill(doc, COLORS.clay);
  doc.circle(cx, cy, 4.3, 'F');
  doc.setFont(FONT_FAMILIES.sans, 'bold');
  doc.setFontSize(9.5);
  setText(doc, COLORS.white);
  doc.text(String(index + 1).padStart(2, '0'), cx, cy + 1.3, { align: 'center' });

  doc.setFont(FONT_FAMILIES.sans, 'bold');
  doc.setFontSize(11);
  setText(doc, COLORS.ink);
  doc.text(tip.titre || '', x + 21, cy + 1.3);

  doc.setFont(FONT_FAMILIES.sans, 'normal');
  doc.setFontSize(9.4);
  setText(doc, COLORS.inkLight);
  const textW = w - 16;
  const lines = wrapText(doc, tip.texte || '', textW);
  let ty = y + 9 + 7 + 5.2;
  lines.forEach((line) => {
    doc.text(line, x + 8, ty);
    ty += 4.3;
  });
}

/**
 * Construit le PDF lifestyle (retourne l'instance jsPDF, pas encore
 * enregistrée / téléchargée). `tips` : objets LIFESTYLE_TIPS déjà filtrés.
 */
export async function buildLifestylePdf({ diag, client, praticienne, settings, tips, loadAsset }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  await registerFonts(doc, loadAsset);

  const logoWhite = await loadAsset('brand/logo-blanc-crop.png');
  const ctxBase = {
    assets: { logoWhite },
    entreprise: settings?.entreprise,
    signature: settings?.signature_pdf,
    clientName: fullName(client),
  };

  const dateLabel = formatDateLong(diag?.date_rdv || diag?.date_creation);
  const startY = drawLifestyleHeaderAndTitle(doc, ctxBase, {
    client,
    praticienne: praticienneLabel(praticienne),
    dateLabel,
  });

  const list = tips || [];
  const columns = list.length >= 4 ? 2 : 1;
  const colGap = 8;
  const colW = columns === 2 ? (CONTENT_W - colGap) / 2 : CONTENT_W;
  const colX = [MARGIN.x0, MARGIN.x0 + colW + colGap];
  let colY = [startY, startY];
  let page = 1;

  list.forEach((tip, i) => {
    const col = columns === 2 ? i % 2 : 0;
    const h = measureCardHeight(doc, tip, colW);
    if (colY[col] + h > 273) {
      doc.addPage();
      page += 1;
      const newY = drawReducedChrome(doc, ctxBase, page);
      colY = [newY, newY];
    }
    drawCard(doc, colX[col], colY[col], colW, h, tip, i);
    colY[col] += h + 6;
  });

  const lastY = Math.max(...colY);
  drawClosingPanel(doc, lastY);

  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p += 1) {
    doc.setPage(p);
    drawFooter(doc, ctxBase, p);
  }
  doc.putTotalPages('{total_pages}');

  return doc;
}
