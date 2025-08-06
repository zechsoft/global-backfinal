import jwt from 'jsonwebtoken';
import { userModel } from '../config/Schema.js';

export const authenticateUser = async (req, res, next) => {
  try {
    console.log('Auth middleware - Headers:', req.headers.authorization);
    console.log('Auth middleware - Cookies:', req.cookies);
    console.log('Auth middleware - Environment:', process.env.NODE_ENV);
    
    // Multiple token sources for better compatibility
    let token = req.cookies.token;
    
    // Check Authorization header if no cookie
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    // Check x-auth-token header as fallback
    if (!token && req.headers['x-auth-token']) {
      token = req.headers['x-auth-token'];
    }
    
    console.log('Auth middleware - Token found:', !!token);
    
    if (!token) {
      console.log('Auth middleware - No token found in any location');
      return res.status(401).json({ 
        error: "Authentication required - no token",
        tokenSources: {
          cookie: !!req.cookies.token,
          authHeader: !!req.headers.authorization,
          xAuthToken: !!req.headers['x-auth-token']
        }
      });
    }
    
    // Verify token with better error handling
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.TOKEN);
    } catch (jwtError) {
      console.error('Auth middleware - JWT verification failed:', jwtError.message);
      return res.status(401).json({ 
        error: "Invalid token: " + jwtError.message 
      });
    }
    
    console.log('Auth middleware - Decoded token:', decoded);
    
    // Find user by ID
    const user = await userModel.findById(decoded.id).select('-password');
    
    if (!user) {
      console.log('Auth middleware - User not found for ID:', decoded.id);
      return res.status(401).json({ error: "User not found" });
    }
    
    console.log('Auth middleware - User found:', {
      id: user._id,
      email: user.Email,
      name: user.userName,
      role: user.role
    });
    
    // Set user in request object with consistent structure
    req.user = {
      id: user._id.toString(),
      _id: user._id.toString(),
      email: user.Email,
      Email: user.Email,
      name: user.userName,
      userName: user.userName,
      role: user.role
    };
    
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ 
      error: "Authentication failed: " + error.message 
    });
  }
};