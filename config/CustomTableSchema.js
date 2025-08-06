import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

// Schema for custom table configurations
const columnSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true, default: 'text' },
  required: { type: Boolean, default: false },
  options: [{ type: String }] // For dropdown/select fields
});

const customTableSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    columns: [columnSchema],
    pubId: { type: String, default: uuidv4 },
    createdBy: { type: String }, // Store the email of the user who created the table
    isPublic: { type: Boolean, default: false }, // Whether the table is accessible to all users
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }
);

// This is a dynamic schema that will be used to create models for custom tables
const createDynamicSchema = (columns) => {
  const schemaDefinition = {
    _tableId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'CustomTable' },
    userEmail: { type: String }, // Store the email of the user who created/owns the record
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  };

  // Add fields from columns
  columns.forEach(column => {
    let fieldType;
    let fieldConfig = {
      required: Boolean(column.required)
    };
    
    switch (column.type) {
      case 'number':
        fieldType = Number;
        break;
      case 'boolean':
        fieldType = Boolean;
        break;
      case 'date':
        fieldType = Date;
        break;
      case 'object':
      case 'json':
        fieldType = Object;
        break;
      case 'array':
        fieldType = Array;
        break;
      case 'select':
      case 'dropdown':
        fieldType = String;
        if (Array.isArray(column.options) && column.options.length > 0) {
          fieldConfig.enum = column.options;
        }
        break;
      default: // text, email, url, etc.
        fieldType = String;
    }

    schemaDefinition[column.name] = {
      type: fieldType,
      ...fieldConfig
    };
  });

  return new mongoose.Schema(schemaDefinition);
};

export const CustomTableModel = mongoose.model("CustomTable", customTableSchema);

// Cache for dynamic models to avoid recreating them
const dynamicModels = {};

// Function to get or create dynamic model for a custom table
export const getDynamicModel = (tableId, columns) => {
  if (dynamicModels[tableId]) {
    return dynamicModels[tableId];
  }

  const schema = createDynamicSchema(columns);
  const modelName = `CustomTableData_${tableId}`;
  
  dynamicModels[tableId] = mongoose.model(modelName, schema);
  return dynamicModels[tableId];
};