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
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'ID parameter is required' });
    }
    // Example: Replace with actual fetch logic
    // const idCard = await IdCard.findById(id);
    // if (!idCard) {
    //   return res.status(404).json({ error: 'ID card not found' });
    // }
    // res.json(idCard);
    res.json({ message: 'ID card fetched', id });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
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
