import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import QRCode from 'qrcode';
// import { getRandomPlayer } from '../generateFakeData.js';   

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure directories exist
const idCardsDir = path.join(__dirname, '../idcards');
if (!fs.existsSync(idCardsDir)) {
  fs.mkdirSync(idCardsDir, { recursive: true });
}

// Path to a Unicode font that supports Gujarati (you'll need to provide this)
const unicodeFontPath = path.join(__dirname, '../fonts/NotoSansGujarati-Regular.ttf');

export const generateIdCard = async (player) => {
  try {
    console.log(`Starting ID card generation for player: ${player.playerId}`);
    
    // Create PDF document (first page is created automatically)
    const doc = new PDFDocument({
      size: [650, 400],
      margins: 0,
      autoFirstPage: true // default is true
    });
    
    // Register Unicode font if available
    let unicodeFontAvailable = false;
    if (fs.existsSync(unicodeFontPath)) {
      try {
        doc.registerFont('Unicode', unicodeFontPath);
        unicodeFontAvailable = true;
      } catch (e) {
        console.error('Error registering Unicode font:', e);
      }
    }
    
    // Generate filename
    const idCardFilename = `idcard_${player.playerId}_${Date.now()}.pdf`;
    const idCardPath = path.join(idCardsDir, idCardFilename);
    
    // Pipe to file
    const stream = fs.createWriteStream(idCardPath);
    doc.pipe(stream);
    
    // Draw front on the first page
    drawFrontSide(doc, player, unicodeFontAvailable);
    
    // Add a second page for the back (only once)
    doc.addPage();
    await drawBackSide(doc, player, unicodeFontAvailable);
    
    // Finalize the document
    doc.end();
    
    // Wait for the stream to finish
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
    
    console.log(`ID card generated successfully: ${idCardFilename}`);
    
    // Return relative path for database storage
    return `/idcards/${idCardFilename}`;
    
  } catch (error) {
    console.error('Error generating ID card:', error);
    throw new Error(`Failed to generate ID card: ${error.message}`);
  }
};

function drawFrontSide(doc, player, unicodeFontAvailable) {
  // Smooth gradient from light orange to light blue
  const gradient = doc.linearGradient(0, 0, 650, 400);
  gradient.stop(0, '#FFE4B5');   // Light orange
  gradient.stop(1, '#B0E0E6');   // Light blue
  doc.save();
  doc.opacity(0.85);
  doc.roundedRect(0, 0, 650, 400, 20).fill(gradient);
  doc.opacity(1);
  doc.restore();

  // Title section with logos
  const logoPath = path.join(__dirname, 'logo1.png');
  const logoPath2 = path.join(__dirname, 'logo2.png');
  const logoSize = 60;
  const logoHeight = 80;
  const logoMargin = 24;
  const titleY = 18;
  try {
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, logoMargin, titleY, { width: logoSize, height: logoSize });
    } else {
      console.error('Left logo not found:', logoPath);
    }
    if (fs.existsSync(logoPath2)) {
      doc.image(logoPath2, 650 - logoMargin - logoSize, titleY, { width: logoSize, height: logoHeight });
    } else {
      console.error('Right logo not found:', logoPath2);
    }
  } catch (e) { console.error('Logo rendering error:', e); }

  const titleX = logoMargin + logoSize;
  const titleWidth = 650 - 2 * (logoMargin + logoSize);
  doc.font('Helvetica-Bold').fontSize(29).fill('#191970')
    .text('PARA SPORTS ASSOCIATION OF GUJARAT', titleX + 5, titleY + 7, { width: titleWidth, align: 'center' });

  // --- Profile Photo and Info Section ---
  // Center the profile photo vertically on the left
  const photoSize = 130;
  const photoX = 40;
  const photoY = (400 - photoSize) / 2;
  doc.save();
  doc.roundedRect(photoX, photoY, photoSize, photoSize, 16).clip();
  try {
    if (player.profilePhoto) {
      // Remove leading slash if present
      let photoPath = player.profilePhoto.startsWith('/') ? player.profilePhoto.slice(1) : player.profilePhoto;
      // If path is relative to uploads, resolve from project root
      const absPhotoPath = path.isAbsolute(photoPath)
        ? photoPath
        : path.join(__dirname, '../', photoPath);
      if (fs.existsSync(absPhotoPath)) {
        doc.image(absPhotoPath, photoX, photoY, { width: photoSize, height: photoSize });
      } else {
        // fallback to gray box
        doc.rect(photoX, photoY, photoSize, photoSize).fill('#cccccc');
      }
    } else {
      doc.rect(photoX, photoY, photoSize, photoSize).fill('#cccccc');
    }
  } catch (e) {
    doc.rect(photoX, photoY, photoSize, photoSize).fill('#cccccc');
  }
  doc.restore();

  // Arrange details in two columns for better use of space
  const infoStartY = photoY;
  const labelColor = '#1976D2';
  const valueColor = '#111111';
  const labelFont = 'Helvetica-Bold';
  const valueFont = 'Helvetica';
  const labelSize = 13;
  const valueSize = 13;
  const col1X = photoX + photoSize + 30;
  const col2X = col1X + 220;
  const rowHeight = 38;
  let yRow = infoStartY;

  // Split fields for two columns
  const profileFields = [
    ['Name', player.firstName + ' ' + player.lastName],
    ['DOB', player.dateOfBirth ? formatDate(player.dateOfBirth) : ''],
    ['Gender', player.gender || ''],
    ['Passport Number', player.passportNumber || ''],
    ['Primary Sport', player.primarySport || ''],
    ['Address', `${player.address?.street || ''}, ${player.address?.city || ''}, ${player.address?.state || ''}, ${player.address?.postalCode || ''}`],
  ];
  
  // Handle fields with special layout
  for (let i = 0; i < profileFields.length; i++) {
    const [label, value] = profileFields[i];
    
    // Special handling for Address field - make it span full width
    if (label === 'Address') {
      doc.font(labelFont).fontSize(labelSize).fill(labelColor)
        .text(label + ':', col1X, yRow, { width: 110, align: 'left' });
      doc.font(valueFont).fontSize(valueSize).fill(valueColor)
        .text(value, col1X + 115, yRow, { width: 300, align: 'left' });
      yRow += rowHeight;
      continue;
    }
    
    // For other fields, use two-column layout
    if (i % 2 === 0) {
      // Left column
      doc.font(labelFont).fontSize(labelSize).fill(labelColor)
        .text(label + ':', col1X, yRow, { width: 110, align: 'left' });
      doc.font(valueFont).fontSize(valueSize).fill(valueColor)
        .text(value, col1X + 115, yRow, { width: 90, align: 'left' });
      
      // Right column (if next field exists and is not Address)
      if (i + 1 < profileFields.length && profileFields[i + 1][0] !== 'Address') {
        const [label2, value2] = profileFields[i + 1];
        doc.font(labelFont).fontSize(labelSize).fill(labelColor)
          .text(label2 + ':', col2X, yRow, { width: 110, align: 'left' });
        doc.font(valueFont).fontSize(valueSize).fill(valueColor)
          .text(value2, col2X + 115, yRow, { width: 90, align: 'left' });
        i++; // Skip the next field since we've already processed it
      }
      yRow += rowHeight;
    }
  }

  // Player ID number above Gujarati footer, centered
  const playerIdText = player.playerId || 'PS000000';
  // Add spaces between characters for better readability
  const spacedPlayerId = playerIdText.split('').join(' ');
  
  doc.font('Helvetica-Bold').fontSize(30).fill('#000000')
    .text(spacedPlayerId, 0, 320, { width: 650, align: 'center' });

  // Gujarati footer at the bottom, centered
  const footerGradient = doc.linearGradient(0, 370, 650, 400);
  footerGradient.stop(0, '#FF8C00'); // Orange
  footerGradient.stop(1, '#000080'); // Dark blue
  try {
    if (unicodeFontAvailable) {
      doc.font('Unicode').fontSize(32).fill(footerGradient)
        .text('મારી ડિજિટલ ઓળખ', 0, 350, { width: 650, align: 'center' });
    } else {
      doc.font('Helvetica').fontSize(32).fill(footerGradient)
        .text('મારી ડિજિટલ ઓળખ', 0, 350, { width: 650, align: 'center' });
    }
  } catch (e) { console.error('Unicode font rendering error:', e); }

  // Add faded background logo (watermark)
  try {
    const bgLogoPath = path.join(__dirname, 'logo1.png');
    if (fs.existsSync(bgLogoPath)) {
      doc.save();
      doc.opacity(0.10);
      doc.image(bgLogoPath, 150, 80, { width: 350, align: 'center' });
      doc.opacity(1);
      doc.restore();
    }
  } catch (e) { /* ignore bg logo errors */ }
}

async function drawBackSide(doc, player, unicodeFontAvailable) {
  // Create gradient background from light orange to light blue with rounded corners, with reduced opacity
  const gradient = doc.linearGradient(0, 0, 650, 400);
  gradient.stop(0, '#FFE4B5');   // Light orange
  gradient.stop(1, '#B0E0E6');   // Light blue
  doc.save();
  doc.opacity(0.85);
  doc.roundedRect(0, 0, 650, 400, 20).fill(gradient);
  doc.opacity(1);
  doc.restore();

  // Title section with logos (same as front)
  const logoPath = path.join(__dirname, 'logo1.png');
  const logoPath2 = path.join(__dirname, 'logo2.png');
  const logoSize = 60;
  const logoHeight = 80;
  const logoMargin = 24;
  const titleY = 18;
  try {
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, logoMargin, titleY, { width: logoSize, height: logoSize });
    } else {
      console.error('Left logo not found:', logoPath);
    }
    if (fs.existsSync(logoPath2)) {
      doc.image(logoPath2, 650 - logoMargin - logoSize, titleY, { width: logoSize, height: logoHeight });
    } else {
      console.error('Right logo not found:', logoPath2);
    }
  } catch (e) { console.error('Logo rendering error:', e); }

  // Center the title between the logos
  const titleX = logoMargin + logoSize;
  const titleWidth = 650 - 2 * (logoMargin + logoSize);
  doc.font('Helvetica-Bold').fontSize(29).fill('#191970')
    .text('PARA SPORTS ASSOCIATION OF GUJARAT', titleX + 5, 25 , { width: titleWidth, align: 'center' });

  // Arrange back details in a single column (left side)
  const sectionX = 30, sectionY = 160;
  let y = sectionY;
  const labelColorB = '#1976D2';
  const valueColorB = '#111111';
  const labelFontB = 'Helvetica-Bold';
  const valueFontB = 'Helvetica';
  const labelSizeB = 13;
  const valueSizeB = 13;
  const rowHeightB = 38;

  const backFields = [
    ['Coach Name', player.coachName || ''],
    ['Coach Contact', player.coachContact || ''],
    ['Emergency Name', player.emergencyContact?.name || ''],
    ['Emergency Phone', player.emergencyContact?.phone || ''],
  ];
  for (const [label, value] of backFields) {
    doc.font(labelFontB).fontSize(labelSizeB).fill(labelColorB)
      .text(label + ':', sectionX, y, { width: 120, align: 'left' });
    doc.font(valueFontB).fontSize(valueSizeB).fill(valueColorB)
      .text(value, sectionX + 130, y, { width: 300, align: 'left' });
    y += rowHeightB;
  }

  // Generate QR code with all player details as plain text for note app
  try {
    const qrText = [
      `Player ID: ${player.playerId || ''}`,
      `Name: ${player.firstName || ''} ${player.lastName || ''}`,
      `DOB: ${player.dateOfBirth ? formatDate(player.dateOfBirth) : ''}`,
      `Gender: ${player.gender || ''}`,
      `Passport: ${player.passportNumber || ''}`,
      `Primary Sport: ${player.primarySport || ''}`,
      `Address: ${(player.address?.street || '')}, ${(player.address?.city || '')}, ${(player.address?.state || '')}, ${(player.address?.postalCode || '')}`,
      `Coach: ${player.coachName || ''}`,
      `Coach Contact: ${player.coachContact || ''}`,
      `Emergency: ${player.emergencyContact?.name || ''} (${player.emergencyContact?.phone || ''})`
    ].join('\n');
    const qrImageDataUrl = await QRCode.toDataURL(qrText, {
      margin: 1,
      width: 140,
      errorCorrectionLevel: 'M'
    });
    // Place QR code at right side of back ID
    const qrX = 470, qrY = 160;
    doc.image(Buffer.from(qrImageDataUrl.split(",")[1], 'base64'), qrX, qrY, {
      width: 140,
      height: 140
    });
    // Add label below QR code
    doc.font('Helvetica-Bold').fontSize(12).fill('#000080')
      .text('Scan for player details', qrX, qrY + 145, {
        width: 140,
        align: 'center'
      });
  } catch (e) {
    console.error('QR code generation error:', e);
    // Fallback: Just show player ID in QR code if full details fail
    const qrImageDataUrl = await QRCode.toDataURL(`Player ID: ${player.playerId}`, {
      margin: 1,
      width: 140
    });
    doc.image(Buffer.from(qrImageDataUrl.split(",")[1], 'base64'), 470, 160, {
      width: 140,
      height: 140
    });
  }

  // Player ID number above Gujarati footer, centered (back side)
  const playerIdText = player.playerId || 'PS000000';
  // Add spaces between characters for better readability
  const spacedPlayerId = playerIdText.split('').join(' ');
  
  doc.font('Helvetica-Bold').fontSize(30).fill('#000000')
    .text(spacedPlayerId, 0, 320, { width: 650, align: 'center' });

  // Footer text with gradient and Gujarati font (bolder)
  const footerGradient = doc.linearGradient(0, 370, 650, 400);
  footerGradient.stop(0, '#FF8C00'); // Orange
  footerGradient.stop(1, '#000080'); // Dark blue
  try {
    if (unicodeFontAvailable) {
      doc.font('Unicode').fontSize(32).fill(footerGradient)
          .text('મારી ડિજિટલ ઓળખ', 0, 350, { width: 650, align: 'center' });
    } else {
      doc.font('Helvetica').fontSize(32).fill(footerGradient)
        .text('મારી ડિજિટલ ઓળખ', 0, 350, { width: 650, align: 'center' });
    }
  } catch (e) { console.error('Unicode font rendering error:', e); }

  // Add faded background logo (watermark) to back
  try {
    const bgLogoPath = path.join(__dirname, 'logo1.png');
    if (fs.existsSync(bgLogoPath)) {
      doc.save();
      doc.opacity(0.10);
      doc.image(bgLogoPath, 150, 80, { width: 350, align: 'center' });
      doc.opacity(1);
      doc.restore();
    }
  } catch (e) { /* ignore bg logo errors */ }
}

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
};

// Remove demo/test code below
// const demoPlayer = { ... };
// if (import.meta.url === `file://${process.argv[1]}`) { ... }
// async function main() { ... }
// main(); 