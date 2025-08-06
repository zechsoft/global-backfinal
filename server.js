import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import session from "express-session";
import path from "path";
import clearOTP from "./middleware/passwordClear.js";
import { credEnc, credDec } from "./middleware/passwordSec.js";
import { routeVerify, authUser } from "./middleware/tokenVerify.js";
import authRouter from "./routes/authRouter.js";
import chatRouter from "./routes/chatRoutes.js"
import MongoStore from "connect-mongo";
import customTableRouter from "./routes/customTableRoutes.js";
import cors from "cors";
const app = express();
import { fileURLToPath } from "url";
import { initializeSocket } from './socketService.js';

const server = initializeSocket(app);
// Get current directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Increase the payload size limit for JSON and URL-encoded data
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Updated CORS configuration for your backend
const allowedOrigins = [
    "http://localhost:3000",
    "http://192.168.29.21:3000",
    "https://global-india-corporation-r9ad.vercel.app",
    "https://global-frontfinal.vercel.app"
];

app.use(cors({
    origin: function(origin, callback) {
        console.log('Request from origin:', origin);
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            console.log('CORS blocked origin:', origin);
            const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
            return callback(new Error(msg), false);
        }
        
        console.log('CORS allowed origin:', origin);
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers'
    ]
}));

// Add explicit OPTIONS handler for preflight requests
app.options('*', cors());

// Add this middleware to handle preflight requests manually if needed
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.sendStatus(200);
    } else {
        next();
    }
});

// Enhanced cookie configuration for production
app.use(cookieParser(process.env.SECRET));

app.use(session({
    secret: process.env.SECRET,
    name: 'sessionId', // Custom session name for security
    resave: false,
    saveUninitialized: false, // Changed to false for production security
    rolling: true, // Reset expiration on activity
    store: MongoStore.create({
        mongoUrl: process.env.SESSION_URL,
        touchAfter: 24 * 3600, // Lazy session update (once per day)
        ttl: 24 * 60 * 60, // Session TTL in seconds (24 hours)
        autoRemove: 'native', // Let MongoDB handle expired session removal
        stringify: false // Better performance
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 24 hours (instead of 60 hours)
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true, // Prevent XSS attacks
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Critical for cross-origin
        domain: process.env.NODE_ENV === 'production' ? undefined : undefined // Let browser set automatically
    }
}));

// Trust proxy for production deployments (Vercel, Heroku, etc.)
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Security headers middleware
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
        res.header('X-Content-Type-Options', 'nosniff');
        res.header('X-Frame-Options', 'DENY');
        res.header('X-XSS-Protection', '1; mode=block');
        res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    }
    next();
});

// Serve static files from the uploads directories
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use("/api", authRouter);
app.use("/api/custom-tables", customTableRouter);
app.use("/api/chat", chatRouter);

// Test route
app.get("/api/test", (req, res) => {
    res.status(200).json({ 
        message: "Server is working correctly",
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});

mongoose.connect(process.env.DB_URL)
  .then(() => {
    server.listen(process.env.PORT, () => {
      console.log(`Server running on http://localhost:${process.env.PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch(err => {
    console.error("Failed to connect to MongoDB:", err);
  });

export default app;