import express from "express";
import { dailyWorkModel } from "../config/Schema.js";

const router = express.Router();

// Helper function to map numeric progress to enum values
const mapProgressToEnum = (progress) => {
  // Convert progress percentage to one of the enum values
  if (progress === null || progress === undefined || progress === "") {
    return "Not Started";
  }
  
  const numProgress = Number(progress);
  
  if (isNaN(numProgress)) {
    return "Not Started";
  } else if (numProgress === 0) {
    return "Not Started";
  } else if (numProgress === 100) {
    return "Completed";
  } else if (numProgress < 100) {
    return "In Progress";
  } else {
    return "Delayed"; // For values > 100
  }
};

router.post("/add-data", async (req, res) => {
  try {
    // Map numeric progress to enum value
    const progressEnum = mapProgressToEnum(req.body[0].Progress);
    
    const data = new dailyWorkModel({
      user: req.body[1].user,
      CompanyName: req.body[0].CompanyName,
      ProjectName: req.body[0].ProjectName,
      SupervisorName: req.body[0].SupervisorName,
      ManagerName: req.body[0].ManagerName,
      PrepaidBy: req.body[0].PrepaidBy,
      Employee: req.body[0].Employee,
      NatureofWork: req.body[0].NatureofWork,
      Progress: progressEnum, // Use the mapped enum value
      HourofWork: req.body[0].HourofWork,
      Charges: req.body[0].Charges,
      Date: req.body[0].Date,
      // createdAt will be added automatically by the schema
    });
    const savedData = await data.save();
    res.status(200).json({
      success: true,
      message: "Data saved successfully",
      data: savedData
    });
  } catch(err) {
    console.log(err);
    res.status(500).json({
      success: false, 
      message: "Failed to save data",
      error: err.message
    });
  }
});

router.post("/get-data", async (req, res) => {
    const user = req.body.email;
    
    try {
        const data = await dailyWorkModel.find({user: user});
        res.status(200).json(data);
    } catch(err) {
        res.status(500).json({"Error": "There was some problem in fetching the data"});
    }
});

router.get("/get-all", async (req, res) => {
    try {
        const data = await dailyWorkModel.find();
        res.status(200).json({"data": data});
    } catch(err) {
        res.status(500).json({"error": err.message});
    }
});

// Update a daily work entry
router.put("/update/:id", async (req, res) => {
    try {
        const { id } = req.params;
        
        // Map numeric progress to enum value
        const progressEnum = mapProgressToEnum(req.body.Progress);
        
        const updateData = {
            CompanyName: req.body.CompanyName,
            ProjectName: req.body.ProjectName,
            SupervisorName: req.body.SupervisorName,
            ManagerName: req.body.ManagerName,
            PrepaidBy: req.body.PrepaidBy,
            Employee: req.body.Employee,
            NatureofWork: req.body.NatureofWork,
            Progress: progressEnum, // Use the mapped enum value
            HourofWork: req.body.HourofWork,
            Charges: req.body.Charges,
            Date: req.body.Date
        };
        
        const updatedData = await dailyWorkModel.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true, runValidators: true }
        );
        
        if (!updatedData) {
            return res.status(404).json({"message": "Daily work entry not found"});
        }
        
        res.status(200).json({"message": "Data updated successfully", "data": updatedData});
    } catch(err) {
        console.log(err);
        res.status(500).json({"error": err.message});
    }
});

router.post("/update-data", async (req, res) => {
  try {
    const updateData = req.body[0];
    const user = req.body[1].user;
    
    if (!updateData || !updateData.id) {
      return res.status(400).json({
        success: false,
        message: "Invalid data or missing ID"
      });
    }
    
    // Find the record by array index (id - 1) and user
    const records = await dailyWorkModel.find({ user: user });
    
    if (!records || records.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No records found for this user"
      });
    }
    
    if (updateData.id > 0 && updateData.id <= records.length) {
      const recordToUpdate = records[updateData.id - 1];
      
      // Remove the id field from updateData
      const { id, ...updateFields } = updateData;
      
      // Map numeric progress to enum value
      updateFields.Progress = mapProgressToEnum(updateFields.Progress);
      
      // Add tracking info
      updateFields.updatedAt = new Date();
      updateFields.updatedBy = user;
      
      const updatedData = await dailyWorkModel.findByIdAndUpdate(
        recordToUpdate._id,
        updateFields,
        { new: true, runValidators: true }
      );
      
      if (!updatedData) {
        return res.status(404).json({
          success: false,
          message: "Daily work entry not found"
        });
      }
      
      res.status(200).json({
        success: true,
        message: "Data updated successfully",
        data: updatedData
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid record ID"
      });
    }
  } catch(err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Failed to update data",
      error: err.message
    });
  }
});

// Delete a daily work entry
router.delete("/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deletedData = await dailyWorkModel.findByIdAndDelete(id);
        
        if (!deletedData) {
            return res.status(404).json({"message": "Daily work entry not found"});
        }
        
        res.status(200).json({"message": "Data deleted successfully"});
    } catch(err) {
        console.log(err);
        res.status(500).json({"error": err.message});
    }
});

// Get daily work entry by ID
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const data = await dailyWorkModel.findById(id);
        
        if (!data) {
            return res.status(404).json({"message": "Daily work entry not found"});
        }
        
        res.status(200).json(data);
    } catch(err) {
        console.log(err);
        res.status(500).json({"error": err.message});
    }
});

// Add this route to handle the delete action from the frontend
router.post("/delete-data", async (req, res) => {
    try {
        const { id, user } = req.body;
        
        // Find the record by its array index (id - 1) and user email
        const records = await dailyWorkModel.find({ user: user });
        
        if (!records || records.length === 0) {
            return res.status(404).json({"message": "No records found for this user"});
        }
        
        // Since the frontend is using an array index as ID, we need to find the actual MongoDB ID
        if (id > 0 && id <= records.length) {
            const recordToDelete = records[id - 1];
            const deletedData = await dailyWorkModel.findByIdAndDelete(recordToDelete._id);
            
            if (!deletedData) {
                return res.status(404).json({"message": "Daily work entry not found"});
            }
            
            res.status(200).json({"message": "Data deleted successfully"});
        } else {
            res.status(400).json({"message": "Invalid record ID"});
        }
    } catch(err) {
        console.log(err);
        res.status(500).json({"error": err.message});
    }
});

export default router;