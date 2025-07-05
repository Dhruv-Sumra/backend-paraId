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
import userRoutes from './routes/userRoutes.js';

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

// Database connection for Render and other cloud platforms
let isConnected = false;
let isConnecting = false;

const connectDB = async () => {
  if (isConnected) return true;
  if (isConnecting) {
    // Wait for existing connection attempt
    while (isConnecting) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return isConnected;
  }
  
  isConnecting = true;
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.warn('⚠️  MONGODB_URI not set, cannot connect to database.');
      throw new Error('MONGODB_URI not configured');
    }
    
    console.log('🌐 Connecting to MongoDB...');
    
    // Optimized connection options for cloud deployment
    const connectionOptions = {
      maxPoolSize: 50,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 60000,
      bufferCommands: false, // Changed to false to prevent the error
      maxIdleTimeMS: 30000,
      retryWrites: true,
      w: 'majority',
      readPreference: 'primary',
    };
    
    await mongoose.connect(mongoURI, connectionOptions);
    isConnected = true;
    console.log('✅ Connected to MongoDB successfully!');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    isConnected = false;
    throw error;
  } finally {
    isConnecting = false;
  }
};

// Middleware to ensure database connection - MOVED BEFORE ROUTES
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection failed for request:', req.path, error.message);
    return res.status(503).json({ 
      success: false, 
      error: 'Database connection failed',
      message: 'Please try again later'
    });
  }
});

// Routes
app.use('/api/players', playerRoutes);
app.use('/api/idcards', idcardRoutes);
app.use('/api/users', userRoutes);

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
      idcards: '/api/idcards',
      users: '/api/users'
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

// Start server
connectDB()
  .then(() => {
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Optimized for cloud deployment`);
    });
    
    // Optimized server settings
    server.maxConnections = 1000;
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🔄 SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('✅ Process terminated');
        mongoose.connection.close();
        process.exit(0);
      });
    });
  })
  .catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });

export default app;

