import express from "express";
import { SupplierModel } from "../config/Schema.js";

const router = express.Router();

/**
 * Add a new supplier
 * POST /api/suppliers/add
 */
router.post("/update", async (req, res) => {
    try {
        // Assuming req.body[0] is supplier data and req.body[1] has user info
        const supplierData = req.body[0];
        const user = req.body[1].user;
        
        if (!supplierData || !supplierData.id) {
            return res.status(400).json({
                success: false,
                message: "Invalid data or missing supplier ID"
            });
        }
        
        // Create update object with tracking info
        const updateData = {
            ...supplierData,
            updatedAt: new Date(),
            updatedBy: user
        };
        
        // Prepare the update with both new and legacy field names
        const updateFields = {};
        Object.entries(updateData).forEach(([key, value]) => {
            // Skip the id field
            if (key === 'id') return;
            
            // Update modern fields
            updateFields[key] = value;
            
            // Map to legacy field names if needed
            const legacyFieldMap = {
                'supplierNumber': 'customerNumber',
                'supplier': 'Customer',
                'status': 'Status',
                'documentStatus': 'DocumentStatus',
                'abnormalInfo': 'AbnormalInfo',
                'invitee': 'Invite',
                'reAuthPerson': 'ReAuthPerson',
                'contactInfo': 'ContactInfo',
                'invitationDate': 'InvitationDate',
                'secondOrderClassification': 'SecondOrderClassification'
            };
            
            if (legacyFieldMap[key]) {
                updateFields[legacyFieldMap[key]] = value;
            }
        });
        
        const updatedSupplier = await SupplierModel.findByIdAndUpdate(
            supplierData.id,
            { $set: updateFields },
            { new: true, runValidators: true }
        );
        
        if (!updatedSupplier) {
            return res.status(404).json({
                success: false,
                message: "Supplier not found"
            });
        }
        
        res.status(200).json({
            success: true,
            message: "Supplier updated successfully",
            data: updatedSupplier
        });
    } catch(err) {
        console.error("Error updating supplier:", err);
        res.status(500).json({
            success: false,
            message: "Failed to update supplier",
            error: err.message
        });
    }
});
router.post("/add", async (req, res) => {
    try {
        // Validate request body structure
        if (!Array.isArray(req.body) || req.body.length < 2 || !req.body[1]?.user) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid request format. Expected array with supplier data and user info." 
            });
        }

        const supplierData = req.body[0];
        const user = req.body[1].user;

        // Check for required fields
        const requiredFields = ['supplierNumber', 'supplier'];
        const missingFields = requiredFields.filter(field => !supplierData[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Create new supplier with consistent field mapping
        const newSupplier = new SupplierModel({
            // Store both the new field names and the legacy field names
            supplierNumber: supplierData.supplierNumber,
            customerNumber: supplierData.supplierNumber,
            supplier: supplierData.supplier,
            Customer: supplierData.supplier,
            status: supplierData.status,
            Status: supplierData.status,
            documentStatus: supplierData.documentStatus,
            DocumentStatus: supplierData.documentStatus,
            abnormalInfo: supplierData.abnormalInfo,
            AbnormalInfo: supplierData.abnormalInfo,
            invitee: supplierData.invitee,
            Invite: supplierData.invitee,
            reAuthPerson: supplierData.reAuthPerson,
            ReAuthPerson: supplierData.reAuthPerson,
            contactInfo: supplierData.contactInfo,
            ContactInfo: supplierData.contactInfo,
            invitationDate: supplierData.invitationDate,
            InvitationDate: supplierData.invitationDate,
            secondOrderClassification: supplierData.secondOrderClassification,
            SecondOrderClassification: supplierData.secondOrderClassification,
            buyer: supplierData.buyer,
            user: user
        });

        await newSupplier.save();
        
        res.status(201).json({
            success: true,
            message: "Supplier added successfully",
            data: newSupplier
        });
    } catch(err) {
        console.error("Error adding supplier:", err);
        res.status(500).json({
            success: false,
            message: "Failed to add supplier",
            error: err.message
        });
    }
});

/**
 * Get suppliers for a specific user
 * POST /api/suppliers/get-data
 */
router.post("/get-data", async (req, res) => {
    try {
        // Validate request
        if (!req.body.email) {
            return res.status(400).json({
                success: false, 
                message: "Email is required"
            });
        }

        const user = req.body.email;
        const suppliers = await SupplierModel.find({user: user});
        
        res.status(200).json({
            success: true,
            count: suppliers.length,
            data: suppliers
        });
    } catch(err) {
        console.error("Error fetching suppliers:", err);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve suppliers",
            error: err.message
        });
    }
});

/**
 * Get all suppliers (admin only)
 * GET /api/suppliers
 */
router.get("/", async (req, res) => {
    try {
        // This could be protected with middleware to ensure only admins can access
        const suppliers = await SupplierModel.find();
        
        res.status(200).json({
            success: true,
            count: suppliers.length,
            data: suppliers
        });
    } catch(err) {
        console.error("Error fetching all suppliers:", err);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve all suppliers",
            error: err.message
        });
    }
});

/**
 * Get all suppliers (alternative endpoint)
 * GET /api/suppliers/get-all
 */
router.get("/get-all", async (req, res) => {
    try {
        const suppliers = await SupplierModel.find();
        
        res.status(200).json({
            success: true,
            count: suppliers.length,
            data: suppliers
        });
    } catch(err) {
        console.error("Error fetching all suppliers:", err);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve all suppliers",
            error: err.message
        });
    }
});

/**
 * Update a supplier
 * PUT /api/suppliers/:id
 */
router.put("/:id", async (req, res) => {
    try {
        const supplierId = req.params.id;
        const updateData = req.body.supplierData;
        
        // Validate ID and update data
        if (!supplierId || !updateData) {
            return res.status(400).json({
                success: false,
                message: "Supplier ID and update data are required"
            });
        }
        
        // Prepare the update with both new and legacy field names
        const updateFields = {};
        Object.entries(updateData).forEach(([key, value]) => {
            // Update both modern and legacy field names
            updateFields[key] = value;
            
            // Map to legacy field names if needed
            const legacyFieldMap = {
                'supplierNumber': 'customerNumber',
                'supplier': 'Customer',
                'status': 'Status',
                'documentStatus': 'DocumentStatus',
                'abnormalInfo': 'AbnormalInfo',
                'invitee': 'Invite',
                'reAuthPerson': 'ReAuthPerson',
                'contactInfo': 'ContactInfo',
                'invitationDate': 'InvitationDate',
                'secondOrderClassification': 'SecondOrderClassification'
            };
            
            if (legacyFieldMap[key]) {
                updateFields[legacyFieldMap[key]] = value;
            }
        });
        
        const updatedSupplier = await SupplierModel.findByIdAndUpdate(
            supplierId,
            { $set: updateFields },
            { new: true, runValidators: true }
        );
        
        if (!updatedSupplier) {
            return res.status(404).json({
                success: false,
                message: "Supplier not found"
            });
        }
        
        res.status(200).json({
            success: true,
            message: "Supplier updated successfully",
            data: updatedSupplier
        });
    } catch(err) {
        console.error("Error updating supplier:", err);
        res.status(500).json({
            success: false,
            message: "Failed to update supplier",
            error: err.message
        });
    }
});

/**
 * Delete a supplier
 * DELETE /api/suppliers/:id
 */
router.delete("/:id", async (req, res) => {
    try {
        const supplierId = req.params.id;
        
        const deletedSupplier = await SupplierModel.findByIdAndDelete(supplierId);
        
        if (!deletedSupplier) {
            return res.status(404).json({
                success: false,
                message: "Supplier not found"
            });
        }
        
        res.status(200).json({
            success: true,
            message: "Supplier deleted successfully"
        });
    } catch(err) {
        console.error("Error deleting supplier:", err);
        res.status(500).json({
            success: false,
            message: "Failed to delete supplier",
            error: err.message
        });
    }
});

export default router;