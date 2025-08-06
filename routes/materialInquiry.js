import express from "express";
import { MaterialInquiryModel } from "../config/Schema.js";

const router = express.Router();

// Modified backend route for updating materials

// Update the add-material route to track who created/updated the entry

router.post("/add-material", async (req, res) => {
    const materialData = req.body[0];
    const user = req.body[1].user;

    try {
        // Check if this is an update to an existing record (has ID)
        if (materialData.id) {
            console.log("Updating existing record with ID:", materialData.id);
            
            // Find and update existing record
            const updatedMaterial = await MaterialInquiryModel.findByIdAndUpdate(
                materialData.id,
                {
                    $set: {
                        Suppliermaterial: materialData.supplierMaterial,
                        OrderNumber: materialData.supplementOrderNumber,
                        status: materialData.status,
                        explaination: materialData.explanation,
                        updateTime: materialData.updateTime,
                        user: user,
                        // Added tracking fields
                        updatedBy: user,
                        updatedAt: new Date()
                    }
                },
                { new: true } // Return the updated document
            );

            if (!updatedMaterial) {
                console.log("Material not found with ID:", materialData.id);
                return res.status(404).json({ "error": "Material not found" });
            }

            console.log("Successfully updated material:", updatedMaterial);
            return res.status(200).json({
                "mssg": "Material updated successfully",
                "data": updatedMaterial
            });
        } else {
            // Create new record
            console.log("Creating new material record");
            const MaterialInquiryData = new MaterialInquiryModel({
                Suppliermaterial: materialData.supplierMaterial,
                OrderNumber: materialData.supplementOrderNumber,
                status: materialData.status,
                explaination: materialData.explanation,
                createdTime: materialData.createTime,
                updateTime: materialData.updateTime,
                user: user,
                // Added tracking fields
                createdAt: new Date()
            });
        
            const savedMaterial = await MaterialInquiryData.save();
            console.log("Successfully created material:", savedMaterial);
            return res.status(201).json({
                "mssg": "Material created successfully",
                "data": savedMaterial
            });
        }
    } catch(err) {
        console.error("Error in add-material:", err);
        return res.status(500).json({"error": err.message});
    } 
});

router.post("/delete-material", async (req, res) => {
    try {
        const { id, email } = req.body;
        
        // Find the material by ID and delete it
        // Note: MongoDB uses _id, not id
        const material = await MaterialInquiryModel.findByIdAndDelete(id);
        
        if (!material) {
            return res.status(404).json({ "error": "Material not found" });
        }
        
        // Optional: You could add a check here to verify the user email matches
        // if (material.user !== email) {
        //     return res.status(403).json({ "error": "You don't have permission to delete this material" });
        // }
        
        res.status(200).json({ 
            "mssg": "Material deleted successfully",
            "deletedId": id
        });
    } catch(err) {
        console.log(err);
        res.status(500).json({"error": err.message});
    }
});
router.post("/get-data", async (req, res) => {
    try {
        const user = req.body.email;
        const data = await MaterialInquiryModel.find({user: user});
        res.status(200).json({"data": data});
    } catch(err) {
        res.status(500).json({"error": err.message});
    }
});

router.get("/get-all", async (req, res) => {
    try {
        const data = await MaterialInquiryModel.find();
        res.status(200).json({"data": data});
    } catch(err) {
        res.status(500).json({"error": err.message});
    }
});

export default router;