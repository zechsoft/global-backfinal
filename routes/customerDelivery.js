import express from "express";
import { customerDeliveryModel } from "../config/Schema.js";

const router = express.Router();

router.post("/add-data", async (req, res) => {
    const orderNumber = req.body[0].orderNumber;
    const materialCategory = req.body[0].materialCategory;
    const vendor = req.body[0].vendor;
    const invitee = req.body[0].invitee;
    const hostInviterContactInfo = req.body[0].hostInviterContactInfo;
    const sender = req.body[0].sender;
    const status = req.body[0].status;
    const supplementTemplate = req.body[0].supplementTemplate;
    const isMonitored = req.body[0].isMonitored;
    const user = req.body[1].user;

    try {
        const newData = new customerDeliveryModel({
            user: user,
            OrderNumber: orderNumber,
            MaterialCategory: materialCategory,
            Vendor: vendor,
            Invitee: invitee,
            Host: hostInviterContactInfo,
            Sender: sender,
            Status: status,
            SupplementTemplate: supplementTemplate,
            Actions: isMonitored
        });

        await newData.save();
        res.status(200).json({"mssg": "data saved"});
    } catch(err) {
        res.status(500).json({"error": err.message});
    }
});

router.post("/get-data", async (req, res) => {
    const user = req.body.email;
    
    try {
        const data = await customerDeliveryModel.find({user: user});
        res.status(200).json(data);
    } catch(err) {
        res.status(500).json({"Error": "There was some problem in fetching the data"});
    }
});

router.get("/get-all", async (req, res) => {
    try {
        const data = await customerDeliveryModel.find();
        res.status(200).json({"data": data});
    } catch(err) {
        res.status(500).json({"error": err.message});
    }
});

// Update a customer delivery entry
router.put("/update/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {
            OrderNumber: req.body.orderNumber,
            MaterialCategory: req.body.materialCategory,
            Vendor: req.body.vendor,
            Invitee: req.body.invitee,
            Host: req.body.hostInviterContactInfo,
            Sender: req.body.sender,
            Status: req.body.status,
            SupplementTemplate: req.body.supplementTemplate,
            Actions: req.body.isMonitored
        };
        
        const updatedData = await customerDeliveryModel.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true, runValidators: true }
        );
        
        if (!updatedData) {
            return res.status(404).json({"message": "Customer delivery entry not found"});
        }
        
        res.status(200).json({"message": "Data updated successfully", "data": updatedData});
    } catch(err) {
        console.log(err);
        res.status(500).json({"error": err.message});
    }
});

// Delete a customer delivery entry
router.delete("/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deletedData = await customerDeliveryModel.findByIdAndDelete(id);
        
        if (!deletedData) {
            return res.status(404).json({"message": "Customer delivery entry not found"});
        }
        
        res.status(200).json({"message": "Data deleted successfully"});
    } catch(err) {
        console.log(err);
        res.status(500).json({"error": err.message});
    }
});

// Get customer delivery entry by ID
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const data = await customerDeliveryModel.findById(id);
        
        if (!data) {
            return res.status(404).json({"message": "Customer delivery entry not found"});
        }
        
        res.status(200).json(data);
    } catch(err) {
        console.log(err);
        res.status(500).json({"error": err.message});
    }
});

export default router;