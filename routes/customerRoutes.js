import express from "express";
import { customerModel } from "../config/Schema.js";

const router = express.Router();

// Update the add-data route to include creation timestamp and default values
router.post("/add-data", async (req, res) => {
    // Check if we have the required data
    if (!req.body || !req.body[0] || !req.body[1] || !req.body[1].user) {
        return res.status(400).json({ "error": "Missing required data" });
    }

    const customerData = req.body[0];
    const user = req.body[1].user;
    
    try {
        // Set default values for enum fields if they're missing or invalid
        const deliveryStatus = ["Pending", "Complete", "Cancelled", "In Transit", "Delivered"].includes(customerData.deliveryStatus) 
            ? customerData.deliveryStatus 
            : "Pending";
            
        const orderStatus = ["Processing", "Fulfilled", "Delayed", "Cancelled", "New", "Completed"].includes(customerData.orderStatus)
            ? customerData.orderStatus
            : "Processing";
            
        const acceptanceStatus = ["Pending", "Accepted", "Rejected"].includes(customerData.acceptanceStatus)
            ? customerData.acceptanceStatus
            : "Pending";
        
        const userData = new customerModel({
            customerNumber: customerData.customerNumber,
            customer: customerData.customer,
            buyer: customerData.buyer,
            platformNo: customerData.platformNo,
            poNo: customerData.poNo,
            purchaseDate: customerData.purchaseDate,
            orderAmount: customerData.orderAmount,
            currency: customerData.currency,
            purchasingDepartment: customerData.purchasingDepartment,
            purchaser: customerData.purchaser,
            requisitionBusinessGroup: customerData.requisitionBusinessGroup, 
            deliveryStatus: deliveryStatus,
            orderStatus: orderStatus,
            acceptanceStatus: acceptanceStatus,
            statementStatus: customerData.statementStatus || "Pending",
            user: user,
            // Add creation timestamp (createdAt will use default Date.now)
        });
        
        const savedData = await userData.save();
        res.status(200).json({
            "message": "Data saved successfully",
            "id": savedData._id,
            "data": savedData
        });
    } catch(err) {
        console.error("Database save error:", err);
        res.status(500).json({"error": err.message || "An error occurred when saving data"});
    }
});

// Update the update-data route to include default values for required fields
router.post("/update-data", async (req, res) => {
    try {
        const { data, email } = req.body;
        
        if (!data || !data.id || !email) {
            return res.status(400).json({ "error": "Missing required data for update" });
        }
        
        // Ensure the enum fields are valid
        const deliveryStatus = ["Pending", "Complete", "Cancelled", "In Transit", "Delivered"].includes(data.deliveryStatus) 
            ? data.deliveryStatus 
            : "Pending";
            
        const orderStatus = ["Processing", "Fulfilled", "Delayed", "Cancelled", "New", "Completed"].includes(data.orderStatus)
            ? data.orderStatus
            : "Processing";
            
        const acceptanceStatus = ["Pending", "Accepted", "Rejected"].includes(data.acceptanceStatus)
            ? data.acceptanceStatus
            : "Pending";
        
        // Add tracking information
        const updateData = {
            customerNumber: data.customerNumber,
            customer: data.customer,
            buyer: data.buyer,
            platformNo: data.platformNo,
            poNo: data.poNo,
            purchaseDate: data.purchaseDate,
            orderAmount: data.orderAmount,
            currency: data.currency,
            purchasingDepartment: data.purchasingDepartment,
            purchaser: data.purchaser,
            requisitionBusinessGroup: data.requisitionBusinessGroup,
            deliveryStatus: deliveryStatus,
            orderStatus: orderStatus,
            acceptanceStatus: acceptanceStatus,
            statementStatus: data.statementStatus || "Pending",
            // Add update tracking info
            updatedAt: new Date(),
            updatedBy: email
        };
        
        const updatedData = await customerModel.findByIdAndUpdate(
            data.id, 
            { $set: updateData },
            { new: true, runValidators: true }
        );
        
        if (!updatedData) {
            return res.status(404).json({ "error": "Record not found" });
        }
        
        res.status(200).json({
            "message": "Data updated successfully",
            "data": updatedData
        });
    } catch(err) {
        console.error("Update error:", err);
        res.status(500).json({"error": err.message || "An error occurred when updating data"});
    }
});

// Keep the remaining routes unchanged
router.post("/get-data", async (req, res) => {
    const user = req.body.email;
   
    if (!user) {
        return res.status(400).json({ "error": "User email is required" });
    }

    try {
        const data = await customerModel.find({user: user});
        res.status(200).json(data);
    } catch(err) {
        console.error("Database fetch error:", err);
        res.status(500).json({"error": "There was some problem in fetching the data"});
    }
});

router.post("/delete-data", async (req, res) => {
    const { id, email } = req.body;
    
    if (!id || !email) {
        return res.status(400).json({ "error": "ID and email are required" });
    }
    
    try {
        const deletedData = await customerModel.findByIdAndDelete(id);
        
        if (!deletedData) {
            return res.status(404).json({ "error": "Record not found" });
        }
        
        res.status(200).json({ "message": "Data deleted successfully" });
    } catch(err) {
        console.error("Delete error:", err);
        res.status(500).json({"error": err.message || "An error occurred when deleting data"});
    }
});

router.get("/get-all", async (req, res) => {
    try {
        const data = await customerModel.find();
        res.status(200).json({"data": data});
    } catch(err) {
        console.error("Fetch all error:", err);
        res.status(500).json({"error": err.message || "Error fetching all records"});
    }
});

export default router;