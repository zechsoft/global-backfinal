        import express from "express";
        import { materialReplenishmentModel } from "../config/Schema.js";

        const router = express.Router();

        router.post("/add-data", async (req, res) => {
            const orderNumber = req.body[0].orderNumber;
            const materialCategory = req.body[0].materialCategory;
            const vendor = req.body[0].vendor;
            const invitee = req.body[0].invitee;
            const hostInviterContactInfo = req.body[0].hostInviterContactInfo;
            const sender = req.body[0].sender;
            // Add default value for status if empty
            const status = req.body[0].status || "Pending"; // Default to "Pending" if empty
            const supplementTemplate = req.body[0].supplementTemplate;
            const createTime = req.body[0].createTime;
            const updateTime = req.body[0].updateTime;
            const user = req.body[1].user;

            try {
                const data = new materialReplenishmentModel({
                    user: user,
                    OrderNumber: orderNumber,
                    MaterialCategory: materialCategory,
                    Vendor: vendor,
                    Invitee: invitee,
                    Host: hostInviterContactInfo,
                    Sender: sender,
                    Status: status,
                    SupplementTemplate: supplementTemplate,
                    Created: createTime,
                    updated: updateTime
                });

                await data.save();
                res.status(200).json({"message": "Data saved"});
            } catch(err) {
                console.log(err);
                res.status(500).json({"error": err.message});
            }
        });
        // Add this route to handle delete operations
    router.post("/delete-data", async (req, res) => {
        const id = req.body.id;
        const user = req.body.email;
        
        try {
            const result = await materialReplenishmentModel.findOneAndDelete({
                id: id,
                user: user
            });
            
            if (result) {
                res.status(200).json({"message": "Data deleted successfully"});
            } else {
                res.status(404).json({"error": "Record not found or not authorized"});
            }
        } catch(err) {
            console.log(err);
            res.status(500).json({"error": err.message});
        }
    });

        router.post("/get-data", async (req, res) => {
            const user = req.body.email;
            
            try {
                const data = await materialReplenishmentModel.find({user: user});
                res.status(200).json(data);
            } catch(err) {
                res.status(500).json({"Error": "There was some problem in fetching the data"});
            }
        });

        router.get("/get-all", async (req, res) => {
            try {
                const data = await materialReplenishmentModel.find();
                res.status(200).json({"data": data});
            } catch(err) {
                res.status(500).json({"error": err});
            }
        });
        router.post("/update-data", async (req, res) => {
            const { id, data, email } = req.body;
            
            try {
                // Find by a custom id field (not MongoDB's _id)
                // Make sure we're using a field that exists in your schema 
                const updatedData = await materialReplenishmentModel.findOneAndUpdate(
                    { 
                        // Use a numeric ID comparison instead of ObjectId
                        OrderNumber: data.orderNumber,  // Use a reliable unique identifier
                        user: email  // Ensure we only update records for this user
                    }, 
                    { 
                        OrderNumber: data.orderNumber,
                        MaterialCategory: data.materialCategory,
                        Vendor: data.vendor,
                        Invitee: data.invitee,
                        Host: data.hostInviterContactInfo,
                        Sender: data.sender,
                        Status: data.status || "Pending",
                        SupplementTemplate: data.supplementTemplate,
                        updated: data.updateTime 
                    },
                    { new: true, upsert: false }
                );
                
                if (updatedData) {
                    res.status(200).json({"message": "Data updated successfully", data: updatedData});
                } else {
                    res.status(404).json({"error": "Record not found or not authorized"});
                }
            } catch(err) {
                console.log(err);
                res.status(500).json({"error": err.message});
            }
        });

        export default router;