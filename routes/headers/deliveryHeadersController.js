import express from "express";
import jwt from "jsonwebtoken";
import { TableHeadersModel } from "../../config/Schema.js";
import { userModel } from "../../config/Schema.js";

const router = express.Router();

const DEFAULT_DELIVERY_HEADERS = [
    { id: "orderNumber", label: "Order Number", visible: true, altKey: "OrderNumber" },
    { id: "customerName", label: "Customer Name", visible: true, altKey: "CustomerName" },
    { id: "deliveryDate", label: "Delivery Date", visible: true, altKey: "DeliveryDate" },
    { id: "deliveryAddress", label: "Delivery Address", visible: true, altKey: "DeliveryAddress" },
    { id: "deliveryStatus", label: "Delivery Status", visible: true, altKey: "DeliveryStatus" },
    { id: "carrier", label: "Carrier", visible: true, altKey: "Carrier" },
    { id: "trackingNumber", label: "Tracking Number", visible: true, altKey: "TrackingNumber" },
    { id: "estimatedArrival", label: "Estimated Arrival", visible: true, altKey: "EstimatedArrival" },
    { id: "actualArrival", label: "Actual Arrival", visible: true, altKey: "ActualArrival" },
    { id: "notes", label: "Notes", visible: true, altKey: "Notes" }
];

router.get("/get", async (req, res) => {
    try {
        const headers = await TableHeadersModel.findOne({ table: "customerDelivery" });
        
        if (!headers) {
            return res.status(200).json({ headers: DEFAULT_DELIVERY_HEADERS });
        }
        
        res.status(200).json({ headers: headers.headers });
    } catch (err) {
        console.error("Error getting delivery table headers:", err);
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
            { table: "customerDelivery" },
            { headers: headers },
            { upsert: true, new: true }
        );
        
        console.log("Delivery headers update result:", result);
        res.status(200).json({ message: "Headers updated successfully" });
    } catch (err) {
        console.error("Error updating delivery table headers:", err);
        res.status(500).json({ error: err.message || "Failed to update table headers" });
    }
});

export default router;