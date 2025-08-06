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
        console.log('Request from origin:', origin); // Add this for debugging
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            console.log('CORS blocked origin:', origin); // Add this for debugging
            const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
            return callback(new Error(msg), false);
        }
        
        console.log('CORS allowed origin:', origin); // Add this for debugging
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], // Added PATCH
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

app.use(cookieParser(process.env.SECRET));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: process.env.SESSION_URL
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 60
    }
}));

// Serve static files from the uploads directories
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use("/api", authRouter);
app.use("/api/custom-tables", customTableRouter);
app.use("/api/chat",chatRouter);

// Test route
app.get("/api/test", (req, res) => {
    res.status(200).json({ message: "Server is working correctly" });
});

mongoose.connect(process.env.DB_URL)
  .then(() => {
    server.listen(process.env.PORT, () => {
      console.log(`Server running on http://localhost:${process.env.PORT}`);
    });
  })
  .catch(err => {
    console.error("Failed to connect to MongoDB:", err);
  });

export default app;