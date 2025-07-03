// require('dotenv').config();
// or, if using ES modules:
// import dotenv from 'dotenv';
// dotenv.config(path);
console.log('DEBUG: MONGODB_URI from .env is:', process.env.MONGODB_URI);
process.env.MONGODB_URI = 'mongodb+srv://gujaratparasports:paraSports07@parasports.sc63qgr.mongodb.net/?retryWrites=true&w=majority&appName=ParaSports';

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'fs';

// Import routes
import playerRoutes from './routes/playerRoutes.js';
import idcardRoutes from './routes/idcardRoutes.js';    

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1); // trust first proxy

// Security and performance middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));
app.use(compression()); // Enable gzip compression

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware with optimized limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb'
}));

// Serve static files with caching
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));
app.use('/idcards', express.static(path.join(__dirname, 'idcards'), {
  maxAge: '7d',
  etag: true,
  lastModified: true
}));

// Routes
app.use('/api/players', playerRoutes);
app.use('/api/idcards', idcardRoutes);

// Health check route with caching
app.get('/api/health', (req, res) => {
  res.set('Cache-Control', 'public, max-age=30');
  res.json({ 
    message: 'Para Sports ID Card API is running!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.set('Cache-Control', 'public, max-age=60');
  res.json({ 
    message: 'Server is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root route
app.get('/', (req, res) => {
  res.set('Cache-Control', 'public, max-age=300');
  res.json({ 
    message: 'Para Sports ID Card Generator API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      test: '/api/test',
      players: '/api/players',
      idcards: '/api/idcards'
    }
  });
});

// Favicon handler to prevent 500 errors on /favicon.ico
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No Content
});

// Error handling middleware
app.use(errorHandler);

// Catch-all 404 handler (must be after all other routes)
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Remove or conditionally disable app.listen and server tuning for serverless
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!process.env.MONGODB_URI) {
      console.warn('⚠️  MONGODB_URI not set in .env, using local MongoDB.');
    } else {
      console.log('🌐 Using MongoDB URI from .env:', process.env.MONGODB_URI);
    }
    await mongoose.connect(mongoURI, {
      maxPoolSize: 50,
      minPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 60000,
      bufferCommands: false,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      w: 'majority',
      readPreference: 'secondaryPreferred',
    });
    isConnected = true;
    console.log('✅ Connected to MongoDB successfully!');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
  }
};

// Only start the server if not in a serverless environment
if (process.env.VERCEL !== '1') {
  connectDB().then(() => {
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📊 Optimized for 1500+ concurrent users`);
    });
    server.maxConnections = 1000;
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
  });
} else {
  connectDB();
}

export default app;

