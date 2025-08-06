// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import { userModel } from '../config/Schema.js';

// Fixed authentication middleware
export const authenticateUser = async (req, res, next) => {
  try {
    console.log('Auth middleware - Headers:', req.headers.authorization);
    console.log('Auth middleware - Cookies:', req.cookies);
    
    // Get token from header or cookie
    const token = req.cookies.token || 
                  (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    
    console.log('Auth middleware - Token found:', !!token);
    
    if (!token) {
      return res.status(401).json({ error: "Authentication required - no token" });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.TOKEN);
    console.log('Auth middleware - Decoded token:', decoded);
    
    // Find user by ID (the login route now includes both id and Email in token)
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
    return res.status(401).json({ error: "Authentication failed: " + error.message });
  }
};