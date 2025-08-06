import express from "express";
import jwt from "jsonwebtoken";
import { TableHeadersModel } from "../../config/Schema.js";
import { userModel } from "../../config/Schema.js";

const router = express.Router();

const DEFAULT_MATERIAL_HEADERS = [
    { id: "orderNumber", label: "Order Number", visible: true, altKey: "OrderNumber" },
    { id: "materialCategory", label: "Material Category", visible: true, altKey: "MaterialCategory" },
    { id: "vendor", label: "Vendor", visible: true, altKey: "Vendor" },
    { id: "invitee", label: "Invitee", visible: true, altKey: "Invitee" },
    { id: "hostInviterContactInfo", label: "Host/Inviter Contact Information", visible: true, altKey: "Host" },
    { id: "sender", label: "Sender", visible: true, altKey: "Sender" },
    { id: "status", label: "Status", visible: true, altKey: "Status" },
    { id: "supplementTemplate", label: "Supplement Template", visible: true, altKey: "SupplementTemplate" },
    { id: "createTime", label: "Create Time", visible: true, altKey: "Created" },
    { id: "updateTime", label: "Update Time", visible: true, altKey: "updated" }
];

router.get("/get", async (req, res) => {
    try {
        const headers = await TableHeadersModel.findOne({ table: "materialReplenishment" });
        
        if (!headers) {
            return res.status(200).json({ headers: DEFAULT_MATERIAL_HEADERS });
        }
        
        res.status(200).json({ headers: headers.headers });
    } catch (err) {
        console.error("Error getting material table headers:", err);
        res.status(500).json({ error: "Failed to retrieve table headers" });
    }
});

router.post("/update", async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required' 
            });
        }
        
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.TOKEN);
        } catch (tokenError) {
            console.error("Token verification failed:", tokenError);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid authentication token' 
            });
        }
        
        const { headers, email } = req.body;
        
        if (!headers || !Array.isArray(headers)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid headers format. Headers must be an array.' 
            });
        }
        
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'User email is required' 
            });
        }
        
        const user = await userModel.findOne({ Email: decoded.Email });
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        const isAdmin = user.role === "admin";
        const isOwnHeaders = decoded.Email === email;
        
        if (!isAdmin && !isOwnHeaders) {
            return res.status(403).json({ 
                success: false, 
                message: 'You can only update your own headers unless you are an admin' 
            });
        }
        
        try {
            const result = await TableHeadersModel.findOneAndUpdate(
                { email: email, table: "materialReplenishment" },
                { 
                    email: email,
                    table: "materialReplenishment",
                    headers: headers,
                    updatedAt: new Date(),
                    updatedBy: decoded.Email
                },
                { upsert: true, new: true }
            );
            
            console.log(`Material headers updated for ${email} by ${decoded.Email}`);
            
            res.status(200).json({
                success: true,
                message: 'Table headers updated successfully',
                data: result
            });
        } catch (dbError) {
            console.error("Database operation failed:", dbError);
            res.status(500).json({ 
                success: false, 
                message: 'Database operation failed', 
                error: dbError.message 
            });
        }
    } catch (err) {
        console.error("Error updating material table headers:", err);
        res.status(500).json({
            success: false,
            message: 'Failed to update table headers',
            error: err.message || 'Unknown error occurred'
        });
    }
});

export default router;