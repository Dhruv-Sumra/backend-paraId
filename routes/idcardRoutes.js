import express from 'express';
import { generateIdCard, getIdCard } from '../controllers/idcardController.js';
import Player from '../models/Player.js';
import { sendEmail } from '../utils/emailService.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();

// In-memory OTP store: { email: { otp, expiresAt } }
const otpStore = {};

router.post('/generate', generateIdCard);
router.get('/:id', getIdCard);

// Download ID card endpoint
router.get('/download/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    
    if (!playerId) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    // Find the player
    const player = await Player.findOne({ playerId });
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Check if ID card exists
    if (!player.idCardGenerated || !player.idCardPath) {
      return res.status(404).json({ error: 'ID card not generated for this player' });
    }

    // Construct the file path
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const idCardPath = path.join(__dirname, '..', player.idCardPath);

    // Check if file exists
    if (!fs.existsSync(idCardPath)) {
      return res.status(404).json({ error: 'ID card file not found' });
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Para_Sports_ID_Card_${playerId}.pdf"`);
    res.setHeader('Content-Length', fs.statSync(idCardPath).size);

    // Stream the file
    const fileStream = fs.createReadStream(idCardPath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download ID card' });
  }
});

// Send OTP endpoint
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  // Check if email exists in any player
  const player = await Player.findOne({ email });
  if (!player) return res.status(404).json({ error: 'No player found with this email' });

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  otpStore[email] = { otp, expiresAt };

  // Send OTP email
  try {
    await sendEmail({
      to: email,
      subject: 'Your OTP for Para Sports ID Card Details',
      text: `Your OTP is: ${otp}. It is valid for 5 minutes.`
    });
    res.json({ message: 'OTP sent to email' });
  } catch (err) {
    console.error('Failed to send OTP email:', err);
    res.status(500).json({ error: 'Failed to send OTP email' });
  }
});

// Search with OTP verification
router.post('/search', async (req, res) => {
  try {
    const { playerId, email, otp } = req.body;
    if (!playerId || !email || !otp) return res.status(400).json({ error: 'Player ID, email, and OTP required' });

    // Verify OTP
    const otpEntry = otpStore[email];
    if (!otpEntry || otpEntry.otp !== otp) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }
    if (Date.now() > otpEntry.expiresAt) {
      delete otpStore[email];
      return res.status(401).json({ error: 'OTP expired' });
    }
    // OTP is valid, remove it
    delete otpStore[email];

    let player;
    try {
      player = await Player.findOne({ playerId, email });
    } catch (dbErr) {
      console.error('Database error:', dbErr);
      return res.status(500).json({ error: 'Database error', details: dbErr.message, stack: dbErr.stack });
    }
    if (!player) return res.status(404).json({ error: 'Player not found or email does not match' });

    // Return all player details
    res.json({
      player: player
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message, stack: err.stack });
  }
});

export default router; 