import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateIdCard = async (req, res) => {
  // ID card generation logic here
  res.json({ message: 'ID card generated' });
};

export const getIdCard = async (req, res) => {
  // Fetch ID card logic here
  res.json({ message: 'ID card fetched' });
};

// After sending mail logic (e.g., after await sendEmail(...))
const idcardsDir = path.join(__dirname, '../idcards');
const uploadsDir = path.join(__dirname, '../uploads');
for (const dir of [idcardsDir, uploadsDir]) {
  if (fs.existsSync(dir)) {
    for (const file of fs.readdirSync(dir)) {
      try {
        fs.unlinkSync(path.join(dir, file));
      } catch (e) {
        // Ignore errors if file is busy or locked
      }
    }
  }
}
