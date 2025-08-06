// routes/dashboardTableRoutes.js

import express from "express";
import { DashboardTableModel } from "../config/Schema.js";

const router = express.Router();

// Function to create default data
const createDefaultData = async () => {
  const currentDate = new Date();
  
  const defaultData = [
    // Material Inquiry
    { 
      tableName: "Material Inquiry", 
      project: "Steel Procurement", 
      status: "Pending", 
      date: currentDate,
      user: "system",
      createdAt: currentDate,
      updatedAt: currentDate
    },
    { 
      tableName: "Material Inquiry", 
      project: "Aluminum Order", 
      status: "In Progress", 
      date: currentDate,
      user: "system",
      createdAt: currentDate,
      updatedAt: currentDate
    },
    { 
      tableName: "Material Inquiry", 
      project: "Copper Wire Inquiry", 
      status: "Completed", 
      date: currentDate,
      user: "system",
      createdAt: currentDate,
      updatedAt: currentDate
    },
    { 
      tableName: "Material Inquiry", 
      project: "Plastic Components", 
      status: "Pending", 
      date: currentDate,
      user: "system",
      createdAt: currentDate,
      updatedAt: currentDate
    },
    { 
      tableName: "Material Inquiry", 
      project: "Electronic Parts", 
      status: "In Progress", 
      date: currentDate,
      user: "system",
      createdAt: currentDate,
      updatedAt: currentDate
    },
    
    // Supplier Information
    { 
      tableName: "Supplier Information", 
      project: "ABC Steel Works", 
      status: "Active", 
      date: currentDate,
      user: "system",
      createdAt: currentDate,
      updatedAt: currentDate
    },
    { 
      tableName: "Supplier Information", 
      project: "Metal Masters Ltd", 
      status: "Pending", 
      date: currentDate,
      user: "system",
      createdAt: currentDate,
      updatedAt: currentDate
    },
    { 
      tableName: "Supplier Information", 
      project: "Quality Components", 
      status: "Active", 
      date: currentDate,
      user: "system",
      createdAt: currentDate,
      updatedAt: currentDate
    },
    { 
      tableName: "Supplier Information", 
      project: "Industrial Supply Co", 
      status: "In Progress", 
      date: currentDate,
      user: "system",
      createdAt: currentDate,
      updatedAt: currentDate
    },
    { 
      tableName: "Supplier Information", 
      project: "Global Materials", 
      status: "Active", 
      date: currentDate,
      user: "system",
      createdAt: currentDate,
      updatedAt: currentDate
    },
    
    // Customer Delivery
    { 
      tableName: "Customer Delivery", 
      project: "Order #12345", 
      status: "In Progress", 
      date: currentDate,
      user: "system",
      createdAt: currentDate,
      updatedAt: currentDate
    },
    { 
      tableName: "Customer Delivery", 
      project: "Order #12346", 
      status: "Completed", 
      date: currentDate,
      user: "system",
      createdAt: currentDate,
      updatedAt: currentDate
    },
    { 
      tableName: "Customer Delivery", 
      project: "Order #12347", 
      status: "Pending", 
      date: currentDate,
      user: "system",
      createdAt: currentDate,
      updatedAt: currentDate
    },
    { 
      tableName: "Customer Delivery", 
      project: "Order #12348", 
      status: "In Progress", 
      date: currentDate,
      user: "system",
      createdAt: currentDate,
      updatedAt: currentDate
    },
    { 
      tableName: "Customer Delivery", 
      project: "Order #12349", 
      status: "Pending", 
      date: currentDate,
      user: "system",
      createdAt: currentDate,
      updatedAt: currentDate
    },
    
    // Customer Order
    { 
      tableName: "Customer Order", 
      project: "Project Alpha", 
      status: "Processing", 
      date: currentDate,
      user: "system",
      createdAt: currentDate,
      updatedAt: currentDate
    },
    { 
      tableName: "Customer Order", 
      project: "Project Beta", 
      status: "Completed", 
      date: currentDate,
      user: "system",
      createdAt: currentDate,
      updatedAt: currentDate
    },
    { 
      tableName: "Customer Order", 
      project: "Project Gamma", 
      status: "Pending", 
      date: currentDate,
      user: "system",
      createdAt: currentDate,
      updatedAt: currentDate
    },
    { 
      tableName: "Customer Order", 
      project: "Project Delta", 
      status: "In Progress", 
      date: currentDate,
      user: "system",
      createdAt: currentDate,
      updatedAt: currentDate
    },
    { 
      tableName: "Customer Order", 
      project: "Project Omega", 
      status: "Processing", 
      date: currentDate,
      user: "system",
      createdAt: currentDate,
      updatedAt: currentDate
    },
    
    // Material Replenishment
    { 
      tableName: "Material Replenishment", 
      project: "Inventory Restock", 
      status: "Pending", 
      date: currentDate,
      user: "system",
      createdAt: currentDate,
      updatedAt: currentDate
    },
    { 
      tableName: "Material Replenishment", 
      project: "Emergency Supply", 
      status: "In Progress", 
      date: currentDate,
      user: "system",
      createdAt: currentDate,
      updatedAt: currentDate
    },
    { 
      tableName: "Material Replenishment", 
      project: "Monthly Refill", 
      status: "Completed", 
      date: currentDate,
      user: "system",
      createdAt: currentDate,
      updatedAt: currentDate
    },
    { 
      tableName: "Material Replenishment", 
      project: "Seasonal Stock", 
      status: "Pending", 
      date: currentDate,
      user: "system",
      createdAt: currentDate,
      updatedAt: currentDate
    },
    { 
      tableName: "Material Replenishment", 
      project: "Special Order", 
      status: "In Progress", 
      date: currentDate,
      user: "system",
      createdAt: currentDate,
      updatedAt: currentDate
    }
  ];
  
  return await DashboardTableModel.insertMany(defaultData);
};

// Get all dashboard table data
router.get("/get-all", async (req, res) => {
  try {
    let data = await DashboardTableModel.find().sort({ createdAt: -1 });
    
    // If no data exists, create default data
    if (data.length === 0) {
      console.log("No dashboard data found, creating default data...");
      await createDefaultData();
      data = await DashboardTableModel.find().sort({ createdAt: -1 });
    }
    
    // Group data by table name
    const groupedData = {
      "Material Inquiry": [],
      "Supplier Information": [],
      "Customer Delivery": [],
      "Customer Order": [],
      "Material Replenishment": []
    };
    
    data.forEach(item => {
      if (groupedData[item.tableName]) {
        groupedData[item.tableName].push(item);
      }
    });
    
    // Limit each table to 5 rows
    Object.keys(groupedData).forEach(key => {
      groupedData[key] = groupedData[key].slice(0, 5);
    });
    
    res.status(200).json({
      success: true,
      data: groupedData,
      message: "Dashboard table data fetched successfully"
    });
  } catch (error) {
    console.error("Error fetching dashboard table data:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard table data",
      error: error.message
    });
  }
});

// Get data for specific table
router.get("/get/:tableName", async (req, res) => {
  try {
    const { tableName } = req.params;
    let data = await DashboardTableModel.find({ tableName })
      .sort({ createdAt: -1 })
      .limit(5);
    
    // If no data exists for this table, initialize default data
    if (data.length === 0) {
      const allData = await DashboardTableModel.find();
      if (allData.length === 0) {
        await createDefaultData();
        data = await DashboardTableModel.find({ tableName })
          .sort({ createdAt: -1 })
          .limit(5);
      }
    }
    
    res.status(200).json({
      success: true,
      data: data,
      message: `${tableName} data fetched successfully`
    });
  } catch (error) {
    console.error("Error fetching table data:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching table data",
      error: error.message
    });
  }
});

// Create new entry
router.post("/create", async (req, res) => {
  try {
    const { tableName, project, status, date, user } = req.body;
    
    if (!tableName || !project || !user) {
      return res.status(400).json({
        success: false,
        message: "Table name, project, and user are required"
      });
    }
    
    const newEntry = new DashboardTableModel({
      tableName,
      project,
      status: status || "Pending",
      date: date || new Date(),
      user,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const savedEntry = await newEntry.save();
    
    res.status(201).json({
      success: true,
      data: savedEntry,
      message: "Entry created successfully"
    });
  } catch (error) {
    console.error("Error creating entry:", error);
    res.status(500).json({
      success: false,
      message: "Error creating entry",
      error: error.message
    });
  }
});

// Update entry
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { project, status, date, updatedBy } = req.body;
    
    // Find the existing entry first
    const existingEntry = await DashboardTableModel.findById(id);
    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        message: "Entry not found"
      });
    }

    // Update only provided fields
    const updateData = {
      updatedBy: updatedBy || "admin",
      updatedAt: new Date()
    };

    if (project !== undefined) updateData.project = project;
    if (status !== undefined) updateData.status = status;
    if (date !== undefined) updateData.date = new Date(date);

    const updatedEntry = await DashboardTableModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: updatedEntry,
      message: "Entry updated successfully"
    });
  } catch (error) {
    console.error("Error updating entry:", error);
    res.status(500).json({
      success: false,
      message: "Error updating entry",
      error: error.message
    });
  }
});

// Delete entry
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedEntry = await DashboardTableModel.findByIdAndDelete(id);
    
    if (!deletedEntry) {
      return res.status(404).json({
        success: false,
        message: "Entry not found"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Entry deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting entry:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting entry",
      error: error.message
    });
  }
});

// Initialize default data (manual endpoint - optional)
router.post("/initialize", async (req, res) => {
  try {
    const { user } = req.body;
    
    // Check if data already exists
    const existingData = await DashboardTableModel.findOne();
    if (existingData) {
      return res.status(200).json({
        success: true,
        message: "Data already initialized"
      });
    }
    
    const createdEntries = await createDefaultData();
    
    res.status(201).json({
      success: true,
      data: createdEntries,
      message: "Default data initialized successfully"
    });
  } catch (error) {
    console.error("Error initializing data:", error);
    res.status(500).json({
      success: false,
      message: "Error initializing data",
      error: error.message
    });
  }
});

// Clear all data (for testing purposes)
router.delete("/clear-all", async (req, res) => {
  try {
    await DashboardTableModel.deleteMany({});
    res.status(200).json({
      success: true,
      message: "All data cleared successfully"
    });
  } catch (error) {
    console.error("Error clearing data:", error);
    res.status(500).json({
      success: false,
      message: "Error clearing data",
      error: error.message
    });
  }
});

export default router;