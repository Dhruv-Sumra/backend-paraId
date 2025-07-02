import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import Player from '../models/Player.js';
import { generateIdCard } from '../utils/idCardGenerator.js';
import { sendIdCardEmail } from '../utils/emailService.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads with optimized settings
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only allow 1 file
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Request validation middleware
const validatePlayerData = (req, res, next) => {
  const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'primarySport', 'disabilityType'];
  const missingFields = requiredFields.filter(field => !req.body[field]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields',
      missingFields
    });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(req.body.email)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email format'
    });
  }
  
  next();
};

// @desc    Register a new player
// @route   POST /api/players
// @access  Public
router.post('/', upload.single('profilePhoto'), validatePlayerData, async (req, res, next) => {
  try {
    console.log('Received registration request:', {
      body: Object.keys(req.body),
      file: req.file ? req.file.filename : 'No file'
    });
    console.log('Passport Number from form:', req.body.passportNumber);
    console.log('Full request body:', req.body);

    const playerData = req.body;
    
    // Handle profile photo upload
    if (req.file) {
      playerData.profilePhoto = `/uploads/${req.file.filename}`;
    }

    // Check if player already exists with same email
    const existingPlayer = await Player.findOne({ email: playerData.email });
    if (existingPlayer) {
      return res.status(409).json({
        success: false,
        error: 'Player with this email already exists'
      });
    }

    // Create new player
    const player = new Player(playerData);
    
    // Validate the player data
    const validationError = player.validateSync();
    if (validationError) {
      console.error('Validation error:', validationError);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationError.message
      });
    }

    await player.save();
    console.log('Player saved successfully:', player.playerId);

    // Generate ID card asynchronously to not block the response
    generateIdCard(player)
      .then(async (idCardPath) => {
        console.log('ID card generated:', idCardPath);
        
        // Update player with ID card status
        player.idCardGenerated = true;
        player.idCardPath = idCardPath;
        await player.save();

        // Send ID card via email asynchronously
        try {
          const emailResult = await sendIdCardEmail(player, idCardPath);
          if (emailResult && !emailResult.error) {
            player.idCardSent = true;
            await player.save();
            // Delete profile photo after successful email
            if (player.profilePhoto) {
              const fs = await import('fs');
              const path = await import('path');
              const photoPath = path.join(process.cwd(), 'backend', player.profilePhoto);
              fs.unlink(photoPath, (err) => {
                if (err) {
                  console.error('Error deleting profile photo:', err);
                } else {
                  console.log('Profile photo deleted:', photoPath);
                }
              });
            }
          } else {
            console.log('Email not sent:', emailResult?.error || 'Email service not configured');
          }
        } catch (emailError) {
          console.error('Email sending failed:', emailError);
          // Don't fail the registration if email fails
        }
      })
      .catch(async (error) => {
        console.error('ID card generation failed:', error);
        // Update player with error status
        player.idCardGenerated = false;
        player.idCardError = error.message;
        await player.save();
      });

    res.status(201).json({
      success: true,
      data: {
        playerId: player.playerId,
        firstName: player.firstName,
        lastName: player.lastName,
        email: player.email,
        primarySport: player.primarySport
      },
      message: 'Player registered successfully! ID card will be generated and sent to your email shortly.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    next(error);
  }
});

// @desc    Get all players with optimized pagination and caching
// @route   GET /api/players
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, sport, disabilityType, sort = '-createdAt' } = req.query;
    
    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Max 50 items per page
    
    let query = {};
    
    // Search functionality with optimized regex
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { playerId: searchRegex }
      ];
    }
    
    // Filter by sport
    if (sport && sport.trim()) {
      query.$or = [
        { primarySport: sport.trim() },
        { secondarySport: sport.trim() }
      ];
    }
    
    // Filter by disability type
    if (disabilityType && disabilityType.trim()) {
      query.disabilityType = disabilityType.trim();
    }
    
    // Execute query with optimized projection
    const players = await Player.find(query)
      .select('playerId firstName lastName email primarySport secondarySport disabilityType createdAt')
      .sort(sort)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .lean() // Use lean() for better performance
      .exec();
    
    // Get total count with same query
    const total = await Player.countDocuments(query);
    
    // Set cache headers
    res.set('Cache-Control', 'public, max-age=60'); // Cache for 1 minute
    
    res.json({
      success: true,
      data: players,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalPlayers: total,
        hasNextPage: pageNum * limitNum < total,
        hasPrevPage: pageNum > 1,
        limit: limitNum
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single player
// @route   GET /api/players/:id
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.id).lean();
    
    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }
    
    res.json({
      success: true,
      data: player
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update player with validation
// @route   PUT /api/players/:id
// @access  Public
router.put('/:id', upload.single('profilePhoto'), validatePlayerData, async (req, res, next) => {
  try {
    const playerData = req.body;
    
    // Handle profile photo upload
    if (req.file) {
      playerData.profilePhoto = `/uploads/${req.file.filename}`;
    }

    // Check if player exists
    const existingPlayer = await Player.findById(req.params.id);
    if (!existingPlayer) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }

    // Check if email is being changed and if it conflicts
    if (playerData.email && playerData.email !== existingPlayer.email) {
      const emailConflict = await Player.findOne({ 
        email: playerData.email, 
        _id: { $ne: req.params.id } 
      });
      if (emailConflict) {
        return res.status(409).json({
          success: false,
          error: 'Email already in use by another player'
        });
      }
    }

    const updatedPlayer = await Player.findByIdAndUpdate(
      req.params.id,
      playerData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedPlayer,
      message: 'Player updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete player
// @route   DELETE /api/players/:id
// @access  Public
router.delete('/:id', async (req, res, next) => {
  try {
    const player = await Player.findByIdAndDelete(req.params.id);
    
    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Player deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Regenerate ID card
// @route   POST /api/players/:id/regenerate-idcard
// @access  Public
router.post('/:id/regenerate-idcard', async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.id);
    
    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }
    
    // Generate new ID card
    const idCardPath = await generateIdCard(player);
    
    // Update player
    player.idCardGenerated = true;
    player.idCardPath = idCardPath;
    await player.save();
    
    // Send new ID card via email
    try {
      const emailResult = await sendIdCardEmail(player, idCardPath);
      if (emailResult && !emailResult.error) {
        player.idCardSent = true;
        await player.save();
        // Delete profile photo after successful email
        if (player.profilePhoto) {
          const fs = await import('fs');
          const path = await import('path');
          const photoPath = path.join(process.cwd(), 'backend', player.profilePhoto);
          fs.unlink(photoPath, (err) => {
            if (err) {
              console.error('Error deleting profile photo:', err);
            } else {
              console.log('Profile photo deleted:', photoPath);
            }
          });
        }
      } else {
        console.log('Email not sent:', emailResult?.error || 'Email service not configured');
      }
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }
    
    res.json({
      success: true,
      message: 'ID card regenerated and sent to your email!'
    });
  } catch (error) {
    next(error);
  }
});

export default router; 