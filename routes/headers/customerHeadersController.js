import express from "express";
import jwt from "jsonwebtoken";
import { TableHeadersModel } from "../../config/Schema.js";
import { userModel } from "../../config/Schema.js";

const router = express.Router();

const DEFAULT_CUSTOMER_HEADERS = [
    { id: "customerName", label: "Customer Name", visible: true, altKey: "customerName" },
    { id: "customerNumber", label: "Customer Number", visible: true, altKey: "customerNumber" },
    { id: "status", label: "Status", visible: true, altKey: "Status" },
    { id: "contactPerson", label: "Contact Person", visible: true, altKey: "ContactPerson" },
    { id: "contactEmail", label: "Contact Email", visible: true, altKey: "ContactEmail" },
    { id: "contactPhone", label: "Contact Phone", visible: true, altKey: "ContactPhone" },
    { id: "region", label: "Region", visible: true, altKey: "Region" },
    { id: "address", label: "Address", visible: true, altKey: "Address" },
    { id: "createdDate", label: "Created Date", visible: true, altKey: "CreatedDate" },
    { id: "lastUpdated", label: "Last Updated", visible: true, altKey: "LastUpdated" }
];

router.get("/get", async (req, res) => {
    try {
        const headers = await TableHeadersModel.findOne({ table: "customerInfo" });
        
        if (!headers) {
            return res.status(200).json({ headers: DEFAULT_CUSTOMER_HEADERS });
        }
        
        res.status(200).json({ headers: headers.headers });
    } catch (err) {
        console.error("Error getting customer table headers:", err);
        res.status(500).json({ error: "Failed to retrieve table headers" });
    }
});

router.post("/update", async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ error: "Not authorized" });
        }
        
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.TOKEN);
        } catch (tokenError) {
            console.error("Token verification failed:", tokenError);
            return res.status(401).json({ error: "Invalid token" });
        }
        
        const user = await userModel.findOne({ Email: decoded.Email });
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        if (user.role !== "admin") {
            return res.status(403).json({ error: "Only admins can update global headers" });
        }
        
        const headers = req.body.headers;
        if (!headers || !Array.isArray(headers)) {
            return res.status(400).json({ error: "Invalid headers format" });
        }
        
        const result = await TableHeadersModel.findOneAndUpdate(
            { table: "customerInfo" },
            { headers: headers },
            { upsert: true, new: true }
        );
        
        console.log("Customer headers update result:", result);
        res.status(200).json({ message: "Headers updated successfully" });
    } catch (err) {
        console.error("Error updating customer table headers:", err);
        res.status(500).json({ error: err.message || "Failed to update table headers" });
    }
});

export default router;