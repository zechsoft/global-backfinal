import express from "express";
import jwt from "jsonwebtoken";
import { TableHeadersModel } from "../../config/Schema.js";
import { userModel } from "../../config/Schema.js";

const router = express.Router();

const DEFAULT_DAILY_WORK_HEADERS = [
    { id: "date", label: "Date", visible: true, altKey: "Date" },
    { id: "username", label: "Username", visible: true, altKey: "Username" },
    { id: "taskName", label: "Task Name", visible: true, altKey: "TaskName" },
    { id: "taskDescription", label: "Task Description", visible: true, altKey: "TaskDescription" },
    { id: "priority", label: "Priority", visible: true, altKey: "Priority" },
    { id: "status", label: "Status", visible: true, altKey: "Status" },
    { id: "startTime", label: "Start Time", visible: true, altKey: "StartTime" },
    { id: "endTime", label: "End Time", visible: true, altKey: "EndTime" },
    { id: "duration", label: "Duration", visible: true, altKey: "Duration" },
    { id: "notes", label: "Notes", visible: true, altKey: "Notes" }
];

router.get("/get", async (req, res) => {
    try {
        const headers = await TableHeadersModel.findOne({ table: "dailyWork" });
        
        if (!headers) {
            return res.status(200).json({ headers: DEFAULT_DAILY_WORK_HEADERS });
        }
        
        res.status(200).json({ headers: headers.headers });
    } catch (err) {
        console.error("Error getting daily work table headers:", err);
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
                { email: email, table: "dailyWork" },
                { 
                    email: email,
                    table: "dailyWork",
                    headers: headers,
                    updatedAt: new Date(),
                    updatedBy: decoded.Email
                },
                { upsert: true, new: true }
            );
            
            console.log(`Daily work headers updated for ${email} by ${decoded.Email}`);
            
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
        console.error("Error updating daily work table headers:", err);
        res.status(500).json({
            success: false,
            message: 'Failed to update table headers',
            error: err.message || 'Unknown error occurred'
        });
    }
});

export default router;