import express from "express";
import jwt from "jsonwebtoken";
import { TableHeadersModel } from "../config/Schema.js";
import { userModel } from "../config/Schema.js";

const router = express.Router();

// Default table headers for various tables
const DEFAULT_DAILY_WORK_HEADERS = [
  { id: "id", label: "SR.NO", visible: true, altKey: null },
  { id: "companyName", label: "Company Name", visible: true, altKey: "CompanyName" },
  { id: "projectName", label: "Project Name", visible: true, altKey: "ProjectName" },
  { id: "supervisorName", label: "Supervisor Name", visible: true, altKey: "SupervisorName" },
  { id: "managerName", label: "Manager Name", visible: true, altKey: "ManagerName" },
  { id: "prepaidBy", label: "Prepaid By", visible: true, altKey: "PrepaidBy" },
  { id: "employees", label: "No. of Employee", visible: true, altKey: "Employee" },
  { id: "workType", label: "Nature of Work", visible: true, altKey: "NatureofWork" },
  { id: "progress", label: "Progress (%)", visible: true, altKey: "Progress" },
  { id: "hours", label: "Hour of Work", visible: true, altKey: "HourofWork" },
  { id: "date", label: "Date", visible: true, altKey: "Date" },
];

const DEFAULT_HEADERS = [
    { id: "customerNumber", label: "Customer Number", visible: true, altKey: "customerNumber" },
    { id: "customer", label: "Customer", visible: true, altKey: "Customer" },
    { id: "status", label: "Status", visible: true, altKey: "Status" },
    { id: "documentStatus", label: "Document Status", visible: true, altKey: "DocumentStatus" },
    { id: "abnormalInfo", label: "Abnormal Info", visible: true, altKey: "AbnormalInfo" },
    { id: "invitee", label: "Invitee", visible: true, altKey: "Invite" },
    { id: "reAuthPerson", label: "Re-Auth Person", visible: true, altKey: "ReAuthPerson" },
    { id: "contactInfo", label: "Contact Info", visible: true, altKey: "ContactInfo" },
    { id: "invitationDate", label: "Invitation Date", visible: true, altKey: "InvitationDate" },
    { id: "secondOrderClassification", label: "Second Order Classification", visible: true, altKey: "SecondOrderClassification" },
    { id: "buyer", label: "Buyer", visible: true, altKey: "buyer" }
];

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

const DEFAULT_MATERIAL_INQUIRY_HEADERS = [
    { id: "id", label: "#", visible: true },
    { id: "supplierMaterial", label: "Supplier Material", visible: true, altKey: "Suppliermaterial" },
    { id: "supplementOrderNumber", label: "Supplement Order Number", visible: true, altKey: "OrderNumber" },
    { id: "status", label: "Status", visible: true },
    { id: "explanation", label: "Explanation", visible: true, altKey: "explaination" },
    { id: "createTime", label: "Create Time", visible: true, altKey: "createdTime" },
    { id: "updateTime", label: "Update Time", visible: true }
];

const DEFAULT_CUSTOMER_ORDER_HEADERS = [
    { id: "customerNumber", label: "Customer Number", visible: true, altKey: "customerNumber" },
    { id: "customer", label: "Customer", visible: true, altKey: "customer" },
    { id: "buyer", label: "Buyer", visible: true, altKey: "buyer" },
    { id: "platformNo", label: "Platform No", visible: true, altKey: "platformNo" },
    { id: "poNo", label: "PO No", visible: true, altKey: "poNo" },
    { id: "purchaseDate", label: "Purchase Date", visible: true, altKey: "purchaseDate" },
    { id: "orderAmount", label: "Order Amount", visible: true, altKey: "orderAmount" },
    { id: "currency", label: "Currency", visible: true, altKey: "currency" },
    { id: "purchasingDepartment", label: "Purchasing Department", visible: true, altKey: "purchasingDepartment" },
    { id: "purchaser", label: "Purchaser", visible: true, altKey: "purchaser" },
    { id: "requisitionBusinessGroup", label: "Requisition Business Group", visible: true, altKey: "requisitionBusinessGroup" },
    { id: "deliveryStatus", label: "Delivery Status", visible: true, altKey: "deliveryStatus" },
    { id: "orderStatus", label: "Order Status", visible: true, altKey: "orderStatus" },
    { id: "acceptanceStatus", label: "Acceptance Status", visible: true, altKey: "acceptanceStatus" },
    { id: "statementStatus", label: "Statement Status", visible: true, altKey: "statementStatus" }
];
// Add these routes to your tableHeaders.js file after the existing routes

// Updated DEFAULT_HEADERS to match what's used in SupplierInfo component
const DEFAULT_SUPPLIER_HEADERS = [
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

// Replace the existing DEFAULT_HEADERS with DEFAULT_SUPPLIER_HEADERS in the supplier routes
// And update the supplier routes to use the correct table name:

// Supplier Info routes - FIXED to match frontend expectations
router.get("/get", (req, res) => getHeaders(req, res, "supplierInfo", DEFAULT_SUPPLIER_HEADERS));
router.post("/update", (req, res) => updateHeaders(req, res, "supplierInfo", DEFAULT_SUPPLIER_HEADERS));
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
    { id: "Actions", label: "Actions", visible: true }
];

// Improved verifyToken function with better error handling
const verifyToken = async (req) => {
    // Check for token in multiple places
    const token = req.cookies.token || 
                 (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') 
                    ? req.headers.authorization.slice(7) : null);
    
    if (!token) {
        throw new Error("Authentication required");
    }
    
    try {
        const decoded = jwt.verify(token, process.env.TOKEN);
        
        if (!decoded || !decoded.Email) {
            throw new Error("Invalid token format");
        }
        
        const user = await userModel.findOne({ Email: decoded.Email });
        
        if (!user) {
            throw new Error("User not found");
        }
        
        return { decoded, user };
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            throw new Error("Authentication token has expired");
        } else if (err.name === 'JsonWebTokenError') {
            throw new Error("Invalid authentication token");
        }
        throw err;
    }
};

// Generic function to handle header updates
// Modify your updateHeaders function in router.js
const updateHeaders = async (req, res, tableName, _defaultHeaders) => {
    try {
        const { headers, email, isGlobal } = req.body;
        
        if (!headers || !Array.isArray(headers)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid headers format. Headers must be an array.' 
            });
        }
        
        // Verify authentication 
        let decoded, user;
        try {
            const auth = await verifyToken(req);
            decoded = auth.decoded;
            user = auth.user;
        } catch (authError) {
            return res.status(401).json({ 
                success: false, 
                message: authError.message || 'Authentication failed' 
            });
        }
        
        // Handle global updates (admin only)
        if (isGlobal === true) {
            if (user.role !== "admin") {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Only admins can update global headers' 
                });
            }
            
            // Save global headers
            const globalResult = await TableHeadersModel.findOneAndUpdate(
                { table: tableName, email: "global" },
                { 
                    table: tableName,
                    email: "global",
                    headers: headers,
                    updatedAt: new Date(),
                    updatedBy: decoded.Email
                },
                { upsert: true, new: true }
            );
            
            // IMPORTANT: Also update/remove the admin's personal headers
            // so they see the global ones immediately
            await TableHeadersModel.findOneAndDelete({
                email: decoded.Email,
                table: tableName
            });
            
            console.log(`Global ${tableName} headers updated by ${decoded.Email}, admin personal headers cleared`);
            
            return res.status(200).json({
                success: true,
                message: `Global ${tableName} headers updated successfully`,
                data: globalResult,
                adminPersonalHeadersCleared: true
            });
        } 
        // User-specific headers
        else {
            const targetEmail = email || decoded.Email;
            
            // Only admins can update other users' headers
            if (targetEmail !== decoded.Email && user.role !== "admin") {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You can only update your own headers unless you are an admin' 
                });
            }
            
            const result = await TableHeadersModel.findOneAndUpdate(
                { email: targetEmail, table: tableName },
                { 
                    email: targetEmail,
                    table: tableName,
                    headers: headers,
                    updatedAt: new Date(),
                    updatedBy: decoded.Email
                },
                { upsert: true, new: true }
            );
            
            console.log(`${tableName} headers updated for ${targetEmail} by ${decoded.Email}`);
            
            return res.status(200).json({
                success: true,
                message: `${tableName} headers updated successfully`,
                data: result
            });
        }
    } catch (err) {
        console.error(`Error updating ${tableName} headers:`, err);
        res.status(500).json({
            success: false,
            message: `Failed to update ${tableName} headers`,
            error: err.message || 'Unknown error occurred'
        });
    }
};  

// Generic function to get headers

const getHeaders = async (req, res, tableName, defaultHeaders) => {
    try {
        const { email } = req.query;
        
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'User email is required' 
            });
        }
        
        // Check if user is admin
        let isAdmin = false;
        try {
            const auth = await verifyToken(req);
            isAdmin = auth.user.role === "admin";
        } catch (authError) {
            // If auth fails, continue as regular user
            console.log("Auth check failed, continuing as regular user");
        }
        
        // For admin users, check if they want to see global headers
        // by checking if they have user-specific headers
        let userHeaders = null;
        let globalHeaders = null;
        
        // First get user-specific headers (if any)
        userHeaders = await TableHeadersModel.findOne({ 
            email: email, 
            table: tableName 
        });
        
        // Always get global headers for comparison
        globalHeaders = await TableHeadersModel.findOne({ 
            table: tableName,
            email: "global"
        });
        
        // If user is admin and has just saved global settings,
        // prioritize global headers over user-specific ones
        // Check if global headers were updated more recently than user headers
        if (isAdmin && globalHeaders) {
            if (!userHeaders || 
                (globalHeaders.updatedAt > userHeaders.updatedAt) ||
                (globalHeaders.updatedBy === email)) { // Admin just updated global
                
                console.log(`Admin ${email} viewing global ${tableName} headers`);
                return res.status(200).json({ 
                    success: true,
                    headers: globalHeaders.headers,
                    source: 'global'
                });
            }
        }
        
        // Return user-specific headers if they exist
        if (userHeaders) {
            console.log(`User ${email} viewing personal ${tableName} headers`);
            return res.status(200).json({ 
                success: true,
                headers: userHeaders.headers,
                source: 'user'
            });
        }
        
        // Return global headers if they exist
        if (globalHeaders) {
            console.log(`User ${email} viewing global ${tableName} headers`);
            return res.status(200).json({ 
                success: true,
                headers: globalHeaders.headers,
                source: 'global'
            });
        }
        
        // Return default headers if none exist
        console.log(`User ${email} viewing default ${tableName} headers`);
        return res.status(200).json({ 
            success: true,
            headers: defaultHeaders,
            source: 'default'
        });
    } catch (err) {
        console.error(`Error getting ${tableName} headers:`, err);
        res.status(500).json({ 
            success: false,
            message: `Failed to retrieve ${tableName} headers`,
            error: err.message || 'Unknown error occurred'
        });
    }
};

// Supplier Info routes
// router.get("/get", (req, res) => getHeaders(req, res, "supplierInfo", DEFAULT_HEADERS));
// router.post("/update", (req, res) => updateHeaders(req, res, "supplierInfo", DEFAULT_HEADERS));

// Daily Work Report routes
router.get("/get-daily-work", (req, res) => getHeaders(req, res, "dailyWork", DEFAULT_DAILY_WORK_HEADERS));
router.post("/update-daily-work", (req, res) => updateHeaders(req, res, "dailyWork", DEFAULT_DAILY_WORK_HEADERS));

// Material Replenishment routes
router.get("/get-material", (req, res) => getHeaders(req, res, "materialReplenishment", DEFAULT_MATERIAL_HEADERS));
router.post("/update-material", (req, res) => updateHeaders(req, res, "materialReplenishment", DEFAULT_MATERIAL_HEADERS));

// Material Inquiry routes
// Updated tableHeaders.js - Only the corrected parts

// Material Inquiry routes - CORRECTED
router.get("/get-material-inquiry", async (req, res) => {
    try {
        const { email } = req.query;
        
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'User email is required' 
            });
        }
        
        // Check if user is admin
        let isAdmin = false;
        try {
            const auth = await verifyToken(req);
            isAdmin = auth.user.role === "admin";
        } catch (authError) {
            console.log("Auth check failed, continuing as regular user");
        }
        
        // Get user-specific headers
        let userHeaders = await TableHeadersModel.findOne({ 
            email: email, 
            table: "materialInquiry" 
        });
        
        // Get global headers
        let globalHeaders = await TableHeadersModel.findOne({ 
            table: "materialInquiry",
            email: "global"
        });
        
        // Priority logic for material inquiry headers
        if (isAdmin && globalHeaders) {
            if (!userHeaders || 
                (globalHeaders.updatedAt > userHeaders.updatedAt) ||
                (globalHeaders.updatedBy === email)) {
                
                console.log(`Admin ${email} viewing global materialInquiry headers`);
                return res.status(200).json({ 
                    success: true,
                    headers: globalHeaders.headers,
                    source: 'global'
                });
            }
        }
        
        // Return user-specific headers if they exist
        if (userHeaders) {
            console.log(`User ${email} viewing personal materialInquiry headers`);
            return res.status(200).json({ 
                success: true,
                headers: userHeaders.headers,
                source: 'user'
            });
        }
        
        // Return global headers if they exist
        if (globalHeaders) {
            console.log(`User ${email} viewing global materialInquiry headers`);
            return res.status(200).json({ 
                success: true,
                headers: globalHeaders.headers,
                source: 'global'
            });
        }
        
        // Return default headers if none exist
        console.log(`User ${email} viewing default materialInquiry headers`);
        return res.status(200).json({ 
            success: true,
            headers: DEFAULT_MATERIAL_INQUIRY_HEADERS,
            source: 'default'
        });
    } catch (err) {
        console.error("Error getting materialInquiry headers:", err);
        res.status(500).json({ 
            success: false,
            message: "Failed to retrieve materialInquiry headers",
            error: err.message || 'Unknown error occurred'
        });
    }
});

router.post("/update-material-inquiry", async (req, res) => {
    try {
        const { headers, email, isGlobal } = req.body;
        
        if (!headers || !Array.isArray(headers)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid headers format. Headers must be an array.' 
            });
        }
        
        // Verify authentication 
        let decoded, user;
        try {
            const auth = await verifyToken(req);
            decoded = auth.decoded;
            user = auth.user;
        } catch (authError) {
            return res.status(401).json({ 
                success: false, 
                message: authError.message || 'Authentication failed' 
            });
        }
        
        // Handle global updates (admin only)
        if (isGlobal === true) {
            if (user.role !== "admin") {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Only admins can update global headers' 
                });
            }
            
            // Save global headers for material inquiry
            const globalResult = await TableHeadersModel.findOneAndUpdate(
                { table: "materialInquiry", email: "global" },
                { 
                    table: "materialInquiry",
                    email: "global",
                    headers: headers,
                    updatedAt: new Date(),
                    updatedBy: decoded.Email
                },
                { upsert: true, new: true }
            );
            
            // Clear admin's personal headers so they see global ones
            await TableHeadersModel.findOneAndDelete({
                email: decoded.Email,
                table: "materialInquiry"
            });
            
            console.log(`Global materialInquiry headers updated by ${decoded.Email}`);
            
            return res.status(200).json({
                success: true,
                message: "Global materialInquiry headers updated successfully",
                data: globalResult,
                adminPersonalHeadersCleared: true
            });
        } 
        // User-specific headers
        else {
            const targetEmail = email || decoded.Email;
            
            // Only admins can update other users' headers
            if (targetEmail !== decoded.Email && user.role !== "admin") {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You can only update your own headers unless you are an admin' 
                });
            }
            
            const result = await TableHeadersModel.findOneAndUpdate(
                { email: targetEmail, table: "materialInquiry" },
                { 
                    email: targetEmail,
                    table: "materialInquiry",
                    headers: headers,
                    updatedAt: new Date(),
                    updatedBy: decoded.Email
                },
                { upsert: true, new: true }
            );
            
            console.log(`MaterialInquiry headers updated for ${targetEmail} by ${decoded.Email}`);
            
            return res.status(200).json({
                success: true,
                message: "MaterialInquiry headers updated successfully",
                data: result
            });
        }
    } catch (err) {
        console.error("Error updating materialInquiry headers:", err);
        res.status(500).json({
            success: false,
            message: "Failed to update materialInquiry headers",
            error: err.message || 'Unknown error occurred'
        });
    }
});
// Customer Order routes
router.get("/get-customer-order", (req, res) => getHeaders(req, res, "customerOrder", DEFAULT_CUSTOMER_ORDER_HEADERS));
router.post("/update-customer-order", (req, res) => updateHeaders(req, res, "customerOrder", DEFAULT_CUSTOMER_ORDER_HEADERS));

// Customer Delivery routes
router.get("/get-customer-delivery", (req, res) => getHeaders(req, res, "customerDelivery", DEFAULT_CUSTOMER_DELIVERY_HEADERS));
router.post("/update-customer-delivery", (req, res) => updateHeaders(req, res, "customerDelivery", DEFAULT_CUSTOMER_DELIVERY_HEADERS));

export default router;