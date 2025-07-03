import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Asset paths
const IDCARDS_DIR = path.join(__dirname, '../idcards');
const LOGO1_PATH = path.join(__dirname, 'logo1.png');
const LOGO2_PATH = path.join(__dirname, 'logo2.png');
const GRADITEXT_PATH = path.join(__dirname, 'graditext---.png');
const GUJARATI_FONT_PATH = path.join(__dirname, '../fonts/NotoSansGujarati-Regular.ttf');

if (!fs.existsSync(IDCARDS_DIR)) {
  fs.mkdirSync(IDCARDS_DIR, { recursive: true });
}

export async function generateIdCard(player) {
  try {
    // Format address
    const addressString = player.address
      ? [player.address.street, player.address.city, player.address.state, player.address.postalCode].filter(Boolean).join(', ')
      : '';
    // Prepare all details for QR code
    const qrData = {
      playerId: player.playerId,
      name: player.firstName + ' ' + (player.lastName || ''),
      gender: player.gender,
      primarySport: player.primarySport,
      dateOfBirth: player.dateOfBirth,
      passportNumber: player.passportNumber,
      address: addressString,
      coachName: player.coachName,
      coachContact: player.coachContact && player.coachContact.phone ? player.coachContact.phone : player.coachContact || '',
      emergencyName: player.emergencyContact && player.emergencyContact.name ? player.emergencyContact.name : '',
      emergencyContact: player.emergencyContact && player.emergencyContact.phone ? player.emergencyContact.phone : player.emergencyContact || ''
    };
    const qrString = JSON.stringify(qrData, null, 2); // Pretty print for readability
    const qrBuffer = await QRCode.toBuffer(qrString);
    // Create PDF
    const doc = new PDFDocument({ size: [650, 400], margins: 0, autoFirstPage: true });
    // Register Unicode font if available
    if (fs.existsSync(GUJARATI_FONT_PATH)) {
      try { doc.registerFont('Unicode', GUJARATI_FONT_PATH); } catch {}
    }
    // Output file
    const idCardFilename = `idcard_${player.playerId}_${Date.now()}.pdf`;
    const idCardPath = path.join(IDCARDS_DIR, idCardFilename);
    const stream = fs.createWriteStream(idCardPath);
    doc.pipe(stream);
    // Draw front and back
    drawFrontSide(doc, player, addressString);
    doc.addPage();
    await drawBackSide(doc, player, qrBuffer);
    doc.end();
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
    return `/idcards/${idCardFilename}`;
  } catch (error) {
    throw new Error(`Failed to generate ID card: ${error.message}`);
  }
}

function drawFrontSide(doc, player, addressString) {
  const CARD_W = 650, CARD_H = 400;
  const LOGO_SIZE = 60, LOGO_MARGIN = 24, TITLE_Y = 18;
  // --- Background gradient ---
  const gradient = doc.linearGradient(0, 0, CARD_W, CARD_H);
  gradient.stop(0, '#FFE4B5'); gradient.stop(1, '#B0E0E6');
  doc.save(); doc.opacity(0.85);
  doc.roundedRect(0, 0, CARD_W, CARD_H, 20).fill(gradient);
  doc.opacity(1); doc.restore();
  // --- Centered watermark logo ---
  try {
    if (fs.existsSync(LOGO1_PATH)) {
      doc.save(); doc.opacity(0.13);
      doc.image(LOGO1_PATH, (CARD_W-400)/2, (CARD_H-270)/2, { width: 400, height: 270 });
      doc.opacity(0.13); doc.restore();
    }
  } catch {}
  // --- Top logos ---
  try {
    if (fs.existsSync(LOGO1_PATH)) doc.image(LOGO1_PATH, LOGO_MARGIN, TITLE_Y, { width: LOGO_SIZE, height: LOGO_SIZE });
    if (fs.existsSync(LOGO2_PATH)) doc.image(LOGO2_PATH, CARD_W - LOGO_MARGIN - LOGO_SIZE, TITLE_Y, { width: LOGO_SIZE, height: 80 });
  } catch {}
  // --- Title ---
  const titleX = LOGO_MARGIN + LOGO_SIZE, titleW = CARD_W - 2 * (LOGO_MARGIN + LOGO_SIZE);
  doc.font('Helvetica-Bold').fontSize(29).fill('#191970')
    .text('PARA SPORTS ASSOCIATION OF GUJARAT', titleX + 5, TITLE_Y + 7, { width: titleW, align: 'center' });
  // --- Profile photo on left, vertically centered with info fields ---
  const photoSize = 130;
  const photoX = 40;
  const photoY = 130;
  doc.save();
  doc.roundedRect(photoX, photoY, photoSize, photoSize, 16).clip();
  try {
    if (player.profilePhoto) {
      let photoPath = player.profilePhoto.startsWith('/') ? player.profilePhoto.slice(1) : player.profilePhoto;
      const absPhotoPath = path.isAbsolute(photoPath) ? photoPath : path.join(__dirname, '../', photoPath);
      if (fs.existsSync(absPhotoPath)) {
        doc.image(absPhotoPath, photoX, photoY, { width: photoSize, height: photoSize });
      } else {
        doc.rect(photoX, photoY, photoSize, photoSize).fill('#cccccc');
      }
    } else {
      doc.rect(photoX, photoY, photoSize, photoSize).fill('#cccccc');
    }
  } catch { doc.rect(photoX, photoY, photoSize, photoSize).fill('#cccccc'); }
  doc.restore();
  // --- Info fields layout ---
  const infoStartY = 110;
  const labelColor = '#1976D2', valueColor = '#111111', labelFont = 'Helvetica-Bold', valueFont = 'Helvetica', labelSize = 14, valueSize = 14;
  let y = infoStartY;
  const rowGap = 12;
  const col1X = photoX + photoSize + 20;
  const col2X = col1X + 210 + 70;
  // Name
  doc.font(labelFont).fontSize(labelSize).fill(labelColor).text('Name:', col1X, y, { width: 90 });
  doc.font(valueFont).fontSize(valueSize).fill(valueColor).text(player.firstName ? player.firstName + ' ' + (player.lastName || '') : '', col1X + 95, y, { width: 160 });
  // Gender
  doc.font(labelFont).fontSize(labelSize).fill(labelColor).text('Gender:', col2X, y, { width: 65 });
  doc.font(valueFont).fontSize(valueSize).fill(valueColor).text(player.gender || '', col2X + 75, y, { width: 90 });
  y += 28 + rowGap;
  // Primary Sport
  doc.font(labelFont).fontSize(labelSize).fill(labelColor).text('Primary Sport:', col1X, y, { width: 110 });
  doc.font(valueFont).fontSize(valueSize).fill(valueColor).text(player.primarySport || '', col1X + 115, y, { width: 140 });
  // DOB
  doc.font(labelFont).fontSize(labelSize).fill(labelColor).text('DOB:', col2X, y, { width: 65 });
  doc.font(valueFont).fontSize(valueSize).fill(valueColor).text(player.dateOfBirth ? formatDate(player.dateOfBirth) : '', col2X + 75, y, { width: 90 });
  y += 28 + rowGap;
  // Passport Number
  doc.font(labelFont).fontSize(labelSize).fill(labelColor).text('Passport Number:', col1X, y, { width: 130 });
  doc.font(valueFont).fontSize(valueSize).fill(valueColor).text(player.passportNumber || '', col1X + 135, y, { width: 120 });
  y += 28 + rowGap;
  // Address (wider)
  doc.font(labelFont).fontSize(labelSize).fill(labelColor).text('Address:', col1X, y, { width: 90 });
  doc.font(valueFont).fontSize(valueSize).fill(valueColor).text(addressString, col1X + 95, y, { width: 350 });
  y += 28 + rowGap;
  // --- graditext image at bottom center ---
  try {
    if (fs.existsSync(GRADITEXT_PATH)) {
      const graditextWidth = 460;
      doc.image(GRADITEXT_PATH, 100, 280, { width: graditextWidth });
    }
  } catch {}
  // --- Large spaced ID number ---
  const spacedPlayerId = (player.playerId || '').split('').join(' ');
  doc.fontSize(35).font('Helvetica-Bold').fill('#111111')
    .text(spacedPlayerId, 0, 310, { align: 'center', width: CARD_W, height: 40 });
}

async function drawBackSide(doc, player, qrBuffer) {
  const CARD_W = 650, CARD_H = 400;
  const LOGO_SIZE = 60, LOGO_MARGIN = 24, TITLE_Y = 18;
  // --- Background gradient ---
  const gradient = doc.linearGradient(0, 0, CARD_W, CARD_H);
  gradient.stop(0, '#FFE4B5'); gradient.stop(1, '#B0E0E6');
  doc.save(); doc.opacity(0.85);
  doc.roundedRect(0, 0, CARD_W, CARD_H, 20).fill(gradient);
  doc.opacity(1); doc.restore();
  // --- Centered watermark logo ---
  try {
    if (fs.existsSync(LOGO1_PATH)) {
      doc.save(); doc.opacity(0.13);
      doc.image(LOGO1_PATH, (CARD_W-400)/2, (CARD_H-270)/2, { width: 400, height: 270 });
      doc.opacity(1); doc.restore();
    }
  } catch {}
  // --- Top logos ---
  try {
    if (fs.existsSync(LOGO1_PATH)) doc.image(LOGO1_PATH, LOGO_MARGIN, TITLE_Y, { width: LOGO_SIZE, height: LOGO_SIZE });
    if (fs.existsSync(LOGO2_PATH)) doc.image(LOGO2_PATH, CARD_W - LOGO_MARGIN - LOGO_SIZE, TITLE_Y, { width: LOGO_SIZE, height: 80 });
  } catch {}
  // --- Title ---
  const titleX = LOGO_MARGIN + LOGO_SIZE, titleW = CARD_W - 2 * (LOGO_MARGIN + LOGO_SIZE);
  doc.font('Helvetica-Bold').fontSize(29).fill('#191970')
    .text('PARA SPORTS ASSOCIATION OF GUJARAT', titleX + 5, TITLE_Y + 7, { width: titleW, align: 'center' });
  // --- QR code (right) ---
  const qrSize = 120, qrX = CARD_W - qrSize - 40, qrY = 120;
  doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
  // --- Info fields (coach/emergency) on left ---
  const infoStartY = 120;
  const labelColor = '#1976D2', valueColor = '#111111', labelFont = 'Helvetica-Bold', valueFont = 'Helvetica', labelSize = 13, valueSize = 13;
  let y = infoStartY;
  const rowGap = 14;
  const leftMargin = 60;
  // Coach Name
  doc.font(labelFont).fontSize(labelSize).fill(labelColor).text('Coach Name:', leftMargin, y, { width: 120 });
  doc.font(valueFont).fontSize(valueSize).fill(valueColor).text(player.coachName || '', leftMargin + 125, y, { width: 180 });
  y += 24 + rowGap;
  // Coach Contact
  doc.font(labelFont).fontSize(labelSize).fill(labelColor).text('Coach Contact:', leftMargin, y, { width: 120 });
  doc.font(valueFont).fontSize(valueSize).fill(valueColor).text(player.coachContact && player.coachContact.phone ? player.coachContact.phone : player.coachContact || '', leftMargin + 125, y, { width: 180 });
  y += 24 + rowGap;
  // Emergency Name
  doc.font(labelFont).fontSize(labelSize).fill(labelColor).text('Emergency Name:', leftMargin, y, { width: 120 });
  doc.font(valueFont).fontSize(valueSize).fill(valueColor).text(player.emergencyContact && player.emergencyContact.name ? player.emergencyContact.name : '', leftMargin + 125, y, { width: 180 });
  y += 24 + rowGap;
  // Emergency Contact
  doc.font(labelFont).fontSize(labelSize).fill(labelColor).text('Emergency Contact:', leftMargin, y, { width: 120 });
  doc.font(valueFont).fontSize(valueSize).fill(valueColor).text(player.emergencyContact && player.emergencyContact.phone ? player.emergencyContact.phone : player.emergencyContact || '', leftMargin + 125, y, { width: 180 });
  y += 24 + rowGap;
  // --- graditext image at bottom center ---
  try {
    if (fs.existsSync(GRADITEXT_PATH)) {
      const graditextWidth = 460;
    //   const graditextX = (CARD_W - graditextWidth) / 2;
    //   const graditextY = CARD_H - 80; // 80px from bottom
      doc.image(GRADITEXT_PATH, 100, 280, {width: graditextWidth });
    }
  } catch {}
  // --- Large spaced ID number ---
  const spacedPlayerId = (player.playerId || '').split('').join(' ');
  doc.fontSize(35).font('Helvetica-Bold').fill('#111111')
    .text(spacedPlayerId, 0, 310, { align: 'center', width: CARD_W, height: 40 });
}

function formatDate(dateString) {
  try {
    return new Date(dateString).toLocaleDateString('en-GB');
  } catch {
    return dateString;
  }
}
