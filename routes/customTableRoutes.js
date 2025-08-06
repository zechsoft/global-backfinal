// src/routes/customTableRoutes.js
import express from "express";
import { CustomTableModel, getDynamicModel } from "../config/CustomTableSchema.js";
import { authUser } from "../middleware/tokenVerify.js";
import chatRoutes from "./chatRoutes.js";
const customTableRouter = express.Router();

// Create a new custom table
customTableRouter.post("/create", async (req, res) => {
  try {
    const { name, columns, userEmail, isPublic } = req.body;
    
    if (!name || !columns || columns.length === 0) {
      return res.status(400).json({ error: "Table name and at least one column are required" });
    }
    
    // Create new custom table with user information
    const newTable = new CustomTableModel({
      name,
      columns,
      createdBy: userEmail, // Store the creator's email
      isPublic: !!isPublic, // Set public status (default is false if not provided)
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await newTable.save();
    
    res.status(201).json({ 
      message: "Custom table created successfully",
      table: newTable
    });
  } catch (error) {
    console.error("Error creating custom table:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all custom tables - UPDATED to support user filtering
customTableRouter.post("/get-all", async (req, res) => {
  try {
    const { email, isAdmin } = req.body;
    
    let query = {};
    
    // If not admin, only show tables created by this user or public tables
    if (email && !isAdmin) {
      query = { 
        $or: [
          { createdBy: email },
          { isPublic: true }
        ]
      };
    }
    
    const tables = await CustomTableModel.find(query).sort({ createdAt: -1 });
    res.status(200).json({ tables });
  } catch (error) {
    console.error("Error fetching custom tables:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get a specific custom table by ID
customTableRouter.get("/:id", async (req, res) => {
  try {
    const tableId = req.params.id;
    const table = await CustomTableModel.findById(tableId);
    
    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }
    
    res.status(200).json({ table });
  } catch (error) {
    console.error("Error fetching custom table:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a custom table and its data
customTableRouter.delete("/:id", async (req, res) => {
  try {
    const tableId = req.params.id;
    const { userEmail, isAdmin } = req.body;
    
    const table = await CustomTableModel.findById(tableId);
    
    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }
    
    // Check if user has permission to delete this table
    if (!isAdmin && table.createdBy && table.createdBy !== userEmail) {
      return res.status(403).json({ error: "You do not have permission to delete this table" });
    }
    
    // Get the dynamic model for this table's data
    const DataModel = getDynamicModel(tableId, table.columns);
    
    // Delete all data for this table
    await DataModel.deleteMany({ _tableId: tableId });
    
    // Delete the table configuration
    await CustomTableModel.findByIdAndDelete(tableId);
    
    res.status(200).json({ message: "Table and its data deleted successfully" });
  } catch (error) {
    console.error("Error deleting custom table:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add data to a custom table - UPDATED to store user information
customTableRouter.post("/:id/data", async (req, res) => {
  try {
    const tableId = req.params.id;
    const userData = { ...req.body };
    const userEmail = userData.userEmail; // Extract the user email from the request body
    
    // Check if the request body has content
    if (Object.keys(userData).length === 0) {
      return res.status(400).json({ error: "Data is required" });
    }
    
    const table = await CustomTableModel.findById(tableId);
    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }
    
    // Validate required fields before saving
    const missingRequiredFields = [];
    table.columns.forEach(column => {
      if (column.required && (userData[column.name] === undefined || userData[column.name] === null)) {
        missingRequiredFields.push(column.name);
      }
    });
    
    if (missingRequiredFields.length > 0) {
      return res.status(400).json({ 
        error: "Missing required fields", 
        missingFields: missingRequiredFields 
      });
    }
    
    // Create the data record with the dynamic model
    const DataModel = getDynamicModel(tableId, table.columns);
    
    const newData = new DataModel({
      _tableId: tableId,
      ...userData,
      userEmail, // Store the user email with the record
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await newData.save();
    
    res.status(201).json({ 
      message: "Data added successfully",
      data: newData
    });
  } catch (error) {
    console.error("Error adding data to custom table:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all data for a specific custom table - UPDATED to filter by user email
// Changed to GET method to resolve route conflict
customTableRouter.get("/:id/data", async (req, res) => {
  try {
    const tableId = req.params.id;
    const { email, isAdmin } = req.query; // Changed from req.body to req.query for GET requests
    
    const table = await CustomTableModel.findById(tableId);
    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }
    
    // Get the data with the dynamic model
    const DataModel = getDynamicModel(tableId, table.columns);
    
    // Build query based on user permissions
    let query = { _tableId: tableId };
    
    // If not admin, only show user's own data
    if (email && isAdmin !== 'true') { // Check if isAdmin is the string "true" since query params are strings
      query.userEmail = email;
    }
    
    const data = await DataModel.find(query).sort({ createdAt: -1 });
    
    res.status(200).json({ records: data }); // Changed 'data' to 'records' to match frontend expectations
  } catch (error) {
    console.error("Error fetching custom table data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update a specific record in a custom table - UPDATED with permission check
customTableRouter.put("/:id/data/:recordId", async (req, res) => {
  try {
    const { id: tableId, recordId } = req.params;
    const userData = { ...req.body };
    const userEmail = userData.userEmail;
    const isAdmin = userData.isAdmin;
    
    // Check if the request body has content
    if (Object.keys(userData).length === 0) {
      return res.status(400).json({ error: "Update data is required" });
    }
    
    const table = await CustomTableModel.findById(tableId);
    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }
    
    // Get the dynamic model for this table
    const DataModel = getDynamicModel(tableId, table.columns);
    
    // Find the record
    const record = await DataModel.findById(recordId);
    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }
    
    // Check if user has permission to update this record
    if (!isAdmin && record.userEmail && record.userEmail !== userEmail) {
      return res.status(403).json({ error: "You do not have permission to update this record" });
    }
    
    // Update record fields
    for (const [key, value] of Object.entries(userData)) {
      if (key !== '_id' && key !== '_tableId' && key !== 'createdAt' && key !== 'isAdmin') {
        record[key] = value;
      }
    }
    
    record.updatedAt = new Date();
    await record.save();
    
    res.status(200).json({ 
      message: "Record updated successfully",
      data: record
    });
  } catch (error) {
    console.error("Error updating record:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a specific record from a custom table - UPDATED with permission check
customTableRouter.delete("/:id/data/:recordId", async (req, res) => {
  try {
    const { id: tableId, recordId } = req.params;
    const { userEmail, isAdmin } = req.body;
    
    const table = await CustomTableModel.findById(tableId);
    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }
    
    // Get the dynamic model for this table
    const DataModel = getDynamicModel(tableId, table.columns);
    
    // Find the record first to check permissions
    const record = await DataModel.findById(recordId);
    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }
    
    // Check if user has permission to delete this record
    if (!isAdmin && record.userEmail && record.userEmail !== userEmail) {
      return res.status(403).json({ error: "You do not have permission to delete this record" });
    }
    
    // Delete the record
    await DataModel.findByIdAndDelete(recordId);
    
    res.status(200).json({ message: "Record deleted successfully" });
  } catch (error) {
    console.error("Error deleting record:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update a custom table schema - UPDATED with permission check
customTableRouter.put("/:id", async (req, res) => {
  try {
    const tableId = req.params.id;
    const { name, columns, userEmail, isAdmin, isPublic } = req.body;
    
    if (!name || !columns || columns.length === 0) {
      return res.status(400).json({ error: "Table name and at least one column are required" });
    }
    
    const table = await CustomTableModel.findById(tableId);
    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }
    
    // Check if user has permission to update this table
    if (!isAdmin && table.createdBy && table.createdBy !== userEmail) {
      return res.status(403).json({ error: "You do not have permission to update this table" });
    }
    
    // Update the table
    table.name = name;
    table.columns = columns;
    
    // Update isPublic if provided
    if (isPublic !== undefined) {
      table.isPublic = !!isPublic;
    }
    
    table.updatedAt = new Date();
    
    await table.save();
    
    res.status(200).json({ 
      message: "Table updated successfully",
      table
    });
  } catch (error) {
    console.error("Error updating custom table:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default customTableRouter;