import express from "express";
import jwt from "jsonwebtoken";
import { TableHeadersModel } from "../config/Schema.js";
import { userModel } from "../config/Schema.js";

const router = express.Router();

// Default headers configuration for Customer Delivery Notice
const DEFAULT_CUSTOMER_DELIVERY_HEADERS = [
  { id: "OrderNumber", label: "Order Number", visible: true },
  { id: "MaterialCategory", label: "Material Category", visible: true },
  { id: "Vendor", label: "Vendor", visible: true },
  { id: "Invitee", label: "Invitee", visible: true },
  { id: "HostInviterContactInfo", label: "Host/Inviter Contact Info", visible: true },
  { id: "Sender", label: "Sender", visible: true },
  { id: "Status", label: "Status", visible: true },
  { id: "SupplementTemplate", label: "Supplement Template", visible: true },
  { id: "Created", label: "Created", visible: true },
  { id: "Actions", label: "Actions", visible: true },
];

// Helper function to verify JWT token
const verifyToken = async (req) => {
    const token = req.cookies.token;
    if (!token) {
        throw new Error("Authentication required");
    }
    
    try {
        const decoded = jwt.verify(token, process.env.TOKEN);
        const user = await userModel.findOne({ Email: decoded.Email });
        
        if (!user) {
            throw new Error("User not found");
        }
        
        return { decoded, user };
    } catch (err) {
        throw new Error("Invalid authentication token");
    }
};

// GET route for customer delivery notice headers
router.get("/get-customer-delivery", async (req, res) => {
    try {
        const { email } = req.query;
        
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'User email is required' 
            });
        }
        
        // First try to find user-specific headers
        const userHeaders = await TableHeadersModel.findOne({ 
            email: email, 
            table: "customer-delivery-notices" 
        });
        
        if (userHeaders) {
            return res.status(200).json({ 
                success: true,
                headers: userHeaders.headers 
            });
        }
        
        // If no user-specific headers, fetch global headers
        const globalHeaders = await TableHeadersModel.findOne({ 
            table: "customer-delivery-notices",
            email: "global"
        });
        
        if (globalHeaders) {
            return res.status(200).json({ 
                success: true,
                headers: globalHeaders.headers 
            });
        }
        
        // Return default headers if none exist
        return res.status(200).json({ 
            success: true,
            headers: DEFAULT_CUSTOMER_DELIVERY_HEADERS 
        });
    } catch (err) {
        console.error("Error getting customer delivery notice headers:", err);
        res.status(500).json({ 
            success: false,
            message: 'Failed to retrieve customer delivery notice headers',
            error: err.message || 'Unknown error occurred'
        });
    }
});

// POST route for updating customer delivery notice headers
router.post("/update-customer-delivery", async (req, res) => {
    try {
        const { decoded, user } = await verifyToken(req);
        
        const { headers, isGlobal } = req.body;
        
        if (!headers || !Array.isArray(headers)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid headers format. Headers must be an array.' 
            });
        }
        
        const tableType = "customer-delivery-notices";
        
        // For global headers update (admin only)
        if (isGlobal) {
            if (user.role !== "admin") {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Only admins can update global headers' 
                });
            }
            
            const result = await TableHeadersModel.findOneAndUpdate(
                { table: tableType, email: "global" },
                { 
                    table: tableType,
                    email: "global",
                    headers: headers,
                    updatedAt: new Date(),
                    updatedBy: decoded.Email
                },
                { upsert: true, new: true }
            );
            
            console.log(`Global customer delivery notice headers updated by ${decoded.Email}`);
            
            return res.status(200).json({
                success: true,
                message: 'Global table headers updated successfully',
                data: result
            });
        }
        // For user-specific headers
        else {
            const result = await TableHeadersModel.findOneAndUpdate(
                { email: decoded.Email, table: tableType },
                { 
                    email: decoded.Email,
                    table: tableType,
                    headers: headers,
                    updatedAt: new Date(),
                    updatedBy: decoded.Email
                },
                { upsert: true, new: true }
            );
            
            console.log(`Customer delivery notice headers updated for ${decoded.Email}`);
            
            return res.status(200).json({
                success: true,
                message: 'Table headers updated successfully',
                data: result
            });
        }
    } catch (err) {
        console.error("Error updating customer delivery notice headers:", err);
        res.status(500).json({
            success: false,
            message: 'Failed to update customer delivery notice headers',
            error: err.message || 'Unknown error occurred'
        });
    }
});

export default router;