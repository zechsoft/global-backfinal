import express from "express";
import jwt from "jsonwebtoken";
import { TableHeadersModel } from "../../config/Schema.js";
import { userModel } from "../../config/Schema.js";

const router = express.Router();

// Default table headers configuration
const DEFAULT_HEADERS = [
  { id: "supplierNumber", label: "Supplier Number", visible: true, altKey: "customerNumber" },
  { id: "supplier", label: "Supplier", visible: true, altKey: "Customer" },
  { id: "buyer", label: "Buyer", visible: true, altKey: null },
  { id: "secondOrderClassification", label: "Second-order Classification", visible: true, altKey: "SecondOrderClassification" },
  { id: "status", label: "Status", visible: true, altKey: "Status" },
  { id: "documentStatus", label: "Document Status", visible: true, altKey: "DocumentStatus" },
  { id: "abnormalInfo", label: "Abnormal Info", visible: true, altKey: "AbnormalInfo" },
  { id: "invitee", label: "Invitee", visible: true, altKey: "Invite" },
  { id: "reAuthPerson", label: "Re-auth Person", visible: true, altKey: "ReAuthPerson" },
  { id: "contactInfo", label: "Contact Info", visible: true, altKey: "ContactInfo" },
  { id: "invitationDate", label: "Invitation Date", visible: true, altKey: "InvitationDate" },
];

// Get table headers configuration
router.get("/get", async (req, res) => {
  try {
    const headers = await TableHeadersModel.findOne({ table: "supplierInfo" });
    
    if (!headers) {
      return res.status(200).json({ headers: DEFAULT_HEADERS });
    }
    
    res.status(200).json({ headers: headers.headers });
  } catch (err) {
    console.error("Error getting table headers:", err);
    res.status(500).json({ error: "Failed to retrieve table headers" });
  }
});

// Update table headers configuration
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
      { table: "supplierInfo" },
      { headers: headers },
      { upsert: true, new: true }
    );
    
    console.log("Headers update result:", result);
    res.status(200).json({ message: "Headers updated successfully" });
  } catch (err) {
    console.error("Error updating table headers:", err);
    res.status(500).json({ error: err.message || "Failed to update table headers" });
  }
});

export default router;