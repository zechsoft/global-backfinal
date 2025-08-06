import express from "express";
import { CustomerDeliveryNoticeModel } from "../config/Schema.js";

const router = express.Router();

// Add a new delivery notice
router.post("/add", async (req, res) => {
    try {
        if (!Array.isArray(req.body) || req.body.length < 2 || !req.body[1]?.user) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid request format." 
            });
        }

        const noticeData = req.body[0];
        const user = req.body[1].user;

        const requiredFields = ['OrderNumber', 'MaterialCategory', 'Vendor'];
        const missingFields = requiredFields.filter(field => !noticeData[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        const newNotice = new CustomerDeliveryNoticeModel({
            ...noticeData,
            user: user
        });

        await newNotice.save();
        
        res.status(201).json({
            success: true,
            message: "Delivery notice added successfully",
            data: newNotice
        });
    } catch(err) {
        console.error("Error adding delivery notice:", err);
        res.status(500).json({
            success: false,
            message: "Failed to add delivery notice",
            error: err.message
        });
    }
});

// Get notices for a specific user
router.post("/get-data", async (req, res) => {
    try {
        if (!req.body.email) {
            return res.status(400).json({
                success: false, 
                message: "Email is required"
            });
        }

        const user = req.body.email;
        const notices = await CustomerDeliveryNoticeModel.find({user: user});
        
        res.status(200).json({
            success: true,
            count: notices.length,
            data: notices
        });
    } catch(err) {
        console.error("Error fetching delivery notices:", err);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve delivery notices",
            error: err.message
        });
    }
});

// Delete a delivery notice by ID
router.delete("/:id", async (req, res) => {
    try {
      const noticeId = req.params.id;
      const user = req.body.user;
      
      // Check if noticeId is valid
      if (!noticeId || noticeId === "undefined") {
        return res.status(400).json({
          success: false,
          message: "Invalid notice ID provided"
        });
      }
      
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User email is required"
        });
      }
      
      // Validate ObjectId format to prevent MongoDB errors
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(noticeId);
      if (!isValidObjectId) {
        return res.status(400).json({
          success: false,
          message: "Invalid notice ID format"
        });
      }
      
      // Find the notice first to verify it exists and belongs to the user
      const notice = await CustomerDeliveryNoticeModel.findOne({ 
        _id: noticeId,
        user: user 
      });
      
      if (!notice) {
        return res.status(404).json({
          success: false,
          message: "Notice not found or you don't have permission to delete it"
        });
      }
      
      // Delete the notice
      await CustomerDeliveryNoticeModel.findByIdAndDelete(noticeId);
      
      res.status(200).json({
        success: true,
        message: "Delivery notice deleted successfully"
      });
    } catch(err) {
      console.error("Error deleting delivery notice:", err);
      res.status(500).json({
        success: false,
        message: "Failed to delete delivery notice",
        error: err.message
      });
    }
});

// Update a delivery notice
router.put("/:id", async (req, res) => {
  try {
    const noticeId = req.params.id;
    const updateData = req.body.data;
    const user = req.body.user;
    
    if (!noticeId || !updateData || !user) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters: notice ID, update data, or user email"
      });
    }
    
    // Validate ObjectId format
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(noticeId);
    if (!isValidObjectId) {
      return res.status(400).json({
        success: false,
        message: "Invalid notice ID format"
      });
    }
    
    // Find the notice first to verify it exists and belongs to the user
    const notice = await CustomerDeliveryNoticeModel.findOne({ 
      _id: noticeId,
      user: user 
    });
    
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: "Notice not found or you don't have permission to update it"
      });
    }
    
    // Check required fields
    const requiredFields = ['OrderNumber', 'MaterialCategory', 'Vendor'];
    const missingFields = requiredFields.filter(field => !updateData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    // Update the notice
    const updatedNotice = await CustomerDeliveryNoticeModel.findByIdAndUpdate(
      noticeId,
      { $set: updateData },
      { new: true } // This option returns the updated document
    );
    
    res.status(200).json({
      success: true,
      message: "Delivery notice updated successfully",
      data: updatedNotice
    });
  } catch(err) {
    console.error("Error updating delivery notice:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update delivery notice",
      error: err.message
    });
  }
});

export default router;