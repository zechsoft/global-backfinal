import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

// ===== User Related Schemas =====

// OTP Schema for authentication
const OTPschema = new mongoose.Schema({
  otp: { 
    type: String, 
    required: true 
  },
  createAt: { 
    type: Date, 
    default: Date.now,
    expires: 300 // Auto-expire after 5 minutes
  },
  proof: { 
    type: String, 
    required: true 
  },
  pubId: { 
    type: String, 
    default: uuidv4 
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    email: { type: String },
    type: { type: String, enum: ['registration', 'password_reset'], default: 'registration' },
});


// User Schema
const userSchema = new mongoose.Schema({
  userName: { 
    type: String, 
    required: true,
    trim: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  Email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true 
  },
  role: { 
    type: String, 
    required: true,
    enum: ['admin', 'user', 'manager', 'client'] 
  },
  pubId: { 
    type: String, 
    default: uuidv4 
  },
  info: { 
    type: String 
  },
  mobile: { 
    type: String,
    trim: true 
  },
  location: { 
    type: String,
    trim: true 
  },
  profileImage: { 
    type: String 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

// Pre-save middleware to update timestamps
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});
const dashboardTableSchema = new mongoose.Schema({
  tableName: {
    type: String,
    required: true,
    enum: [
      "Material Inquiry",
      "Supplier Information", 
      "Customer Delivery",
      "Customer Order",
      "Material Replenishment"
    ]
  },
  project: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ["Pending", "In Progress", "Processing", "Completed", "Cancelled", "Active"],
    default: "Pending"
  },
  date: {
    type: Date,
    default: Date.now
  },
  user: {
    type: String,
    required: true
  },
  updatedBy: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
dashboardTableSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Update the updatedAt field before updating
dashboardTableSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// ===== Project Schema =====

const projectSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Users', 
    required: true 
  },
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  description: { 
    type: String, 
    required: true,
    trim: true 
  },
  image: { 
    type: String 
  },
  team: [{ 
    type: String 
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

// ===== Security Related Schemas =====

const credsSchema = new mongoose.Schema({
  key: { 
    type: String,
    required: true 
  },
  iv: { 
    type: String,
    required: true 
  }
}, { timestamps: true });

// ===== Business Data Schemas =====

const dataSchema = new mongoose.Schema({
  id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Users'
  },
  ordNo: {
    type: Number,
    required: true
  },
  product: {
    type: String,
    required: true
  }
}, { timestamps: true });

// ===== Material Management Schemas =====

const MaterialInquirySchema = new mongoose.Schema({
  Suppliermaterial: {
    type: String, 
    required: true
  },
  OrderNumber: {
    type: String, 
    required: true
  },
  status: {
    type: String, 
    default: 'Active',
    enum: ['Active', 'Inactive', 'Pending', 'Completed'],   
  },
  explaination: {
    type: String, 
    required: true
  },
  createdTime: {
    type: Date, 
    default: Date.now
  },
  updateTime: {
    type: Date, 
    default: Date.now
  },
  user: {
    type: String, 
    required: true
  },
  updatedBy: {
    type: String
  },
  createdAt: {
    type: Date, 
    default: Date.now
  },
  updatedAt: {
    type: Date
  }
}, { timestamps: true });

// ===== Testing Schema =====

const testSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  }
});


// ===== Supplier Schema =====

const supplierSchema = new mongoose.Schema({
  // Modern field names (primary)
  supplierNumber: {
    type: String,
    required: true,
    trim: true
  },
  supplier: {
    type: String,
    required: true,
    trim: true
  },
  buyer: {
    type: String,
    required: false,
    trim: true
  },
  secondOrderClassification: {
    type: String,
    required: false,
    trim: true
  },
  status: {
    type: String,
    required: false,
    trim: true,
    // Remove strict enum validation to allow any status value
    // This gives flexibility for custom status values
  },
  documentStatus: {
    type: String,
    required: false,
    trim: true,
    // Remove strict enum validation to allow any document status value
  },
  abnormalInfo: {
    type: String,
    required: false,
    trim: true
  },
  invitee: {
    type: String,
    required: false,
    trim: true
  },
  reAuthPerson: {
    type: String,
    required: false,
    trim: true
  },
  contactInfo: {
    type: String,
    required: false,
    trim: true
  },
  invitationDate: {
    type: Date,
    required: false
  },

  // Legacy field names (for backward compatibility)
  customerNumber: {
    type: String,
    required: false,
    trim: true
  },
  Customer: {
    type: String,
    required: false,
    trim: true
  },
  SecondOrderClassification: {
    type: String,
    required: false,
    trim: true
  },
  Status: {
    type: String,
    required: false,
    trim: true,
    // Remove enum validation to allow flexible status values
  },
  DocumentStatus: {
    type: String,
    required: false,
    trim: true
  },
  AbnormalInfo: {
    type: String,
    required: false,
    trim: true
  },
  Invite: {
    type: String,
    required: false,
    trim: true
  },
  ReAuthPerson: {
    type: String,
    required: false,
    trim: true
  },
  ContactInfo: {
    type: String,
    required: false,
    trim: true
  },
  InvitationDate: {
    type: Date,
    required: false
  },

  // Metadata fields
  user: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  },
  updatedBy: {
    type: String,
    trim: true
  }
}, { 
  timestamps: true,
  // This will automatically handle createdAt and updatedAt
  strict: false // Allow additional fields that might be added dynamically
});

// ===== Customer Schema =====

 const customerSchema = new mongoose.Schema({
  customerNumber: { 
    type: String, 
    required: true,
    trim: true 
  },
  buyer: { 
    type: String, 
    required: true 
  },
  user: { 
    type: String, 
    required: true 
  },
  customer: { 
    type: String, 
    required: true 
  },
  platformNo: { 
    type: String, 
    required: true 
  },
  poNo: { 
    type: String, 
    required: true 
  },
  purchaseDate: { 
    type: String, 
    required: true 
  },
  orderAmount: { 
    type: String, 
    required: true 
  },
  currency: { 
    type: String, 
    required: true 
  },
  purchasingDepartment: { 
    type: String, 
    required: true 
  },
  purchaser: { 
    type: String, 
    required: true 
  },
  requisitionBusinessGroup: { 
    type: String, 
    required: true 
  },
  deliveryStatus: { 
    type: String, 
    required: true,
    enum: ["Pending", "Complete", "Cancelled", "In Transit", "Delivered"] // Updated to match frontend
  },
  orderStatus: { 
    type: String, 
    required: true,
    enum: ["Processing", "Fulfilled", "Delayed", "Cancelled", "New", "Completed"] // Updated to match frontend
  },
  acceptanceStatus: { 
    type: String, 
    required: true,
    enum: ["Pending", "Accepted", "Rejected"]
  },
  statementStatus: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date 
  },
  updatedBy: { 
    type: String 
  }
}, { timestamps: true });
// ===== Customer Delivery Schema =====

const customerDeliverySchema = new mongoose.Schema({
  user: {
    type: String, 
    required: true
  },
  OrderNumber: {
    type: String, 
    required: true
  },
  MaterialCategory: {
    type: String, 
    required: true
  },
  Vendor: {
    type: String, 
    required: true
  },
  Invitee: {
    type: String, 
    required: true
  },
  Host: {
    type: String, 
    required: true
  },
  Sender: {
    type: String, 
    required: true
  },
  Status: {
    type: String, 
    required: true,
    enum: ["Pending", "In Transit", "Delivered", "Canceled"]
  },
  SupplementTemplate: {
    type: String, 
    required: true
  },
  Created: {
    type: Date, 
    required: true, 
    default: Date.now
  },
  Actions: {
    type: Array, 
    required: true, 
    default: []
  },
  isMonitored: {
    type: Boolean, 
    default: false
  }
}, { timestamps: true });

// ===== Material Replenishment Schema =====

const materialReplenishmentSchema = new mongoose.Schema({
  user: { 
    type: String, 
    required: true 
  },
  OrderNumber: { 
    type: String, 
    required: true 
  },
  MaterialCategory: { 
    type: String, 
    required: true 
  },
  Vendor: { 
    type: String, 
    required: true 
  },
  Invitee: { 
    type: String, 
    required: true 
  },
  Host: { 
    type: String, 
    required: true 
  },
  Sender: { 
    type: String, 
    required: true 
  },
  Status: { 
    type: String, 
    required: true, 
    default: "Pending",
    enum: ["Pending", "In Progress", "Completed", "Canceled"]
  },
  SupplementTemplate: { 
    type: String, 
    required: true 
  },
  Created: { 
    type: Date, 
    required: true,
    default: Date.now 
  },
  updated: { 
    type: Date, 
    required: true,
    default: Date.now 
  },
  createdBy: { 
    type: String 
  },
  updatedBy: { 
    type: String 
  }
}, { timestamps: true });

// ===== Daily Work Schema =====

const dailyWorkSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  CompanyName: {
    type: String,
    required: true,
    trim: true
  },
  ProjectName: {
    type: String,
    required: true,
    trim: true
  },
  SupervisorName: {
    type: String,
    required: true,
    trim: true
  },
  ManagerName: {
    type: String,
    required: true,
    trim: true
  },
  PrepaidBy: {
    type: String,
    required: true
  },
  Employee: {
    type: String,
    required: true
  },
  NatureofWork: {
    type: String,
    required: true
  },
  Progress: {
    type: String,
    required: true,
    enum: ["Not Started", "In Progress", "Completed", "Delayed"]
  },
  HourofWork: {
    type: String,
    required: true
  },
  Charges: {
    type: String,
    required: true
  },
  Date: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date, 
    default: Date.now
  },
  updatedAt: {
    type: Date
  },
  updatedBy: {
    type: String
  }
}, { timestamps: true });

// ===== Table Headers Schema =====

const tableHeadersSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true,
    trim: true,
    lowercase: true
  },
  table: { 
    type: String, 
    required: true 
  },
  headers: [{ 
    id: String,
    label: String,
    visible: Boolean,
    altKey: String
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedBy: { 
    type: String 
  }
}, { timestamps: true });

// Create a compound index on email and table to ensure uniqueness
tableHeadersSchema.index({ email: 1, table: 1 }, { unique: true });

// ===== Customer Delivery Notice Schema =====

const customerDeliveryNoticeSchema = new mongoose.Schema({
  user: {
    type: String, 
    required: true
  },
  OrderNumber: {
    type: String, 
    required: true
  },
  MaterialCategory: {
    type: String, 
    required: true
  },
  Vendor: {
    type: String, 
    required: true
  },
  Invitee: {
    type: String, 
    required: true
  },
  HostInviterContactInfo: {
    type: String, 
    required: true
  },
  Sender: {
    type: String, 
    required: true
  },
  Status: {
    type: String, 
    required: true, 
    default: "Pending",
    enum: ["Pending", "Sent", "Received", "Accepted", "Rejected"]
  },
  SupplementTemplate: {
    type: String, 
    required: true
  },
  Created: {
    type: Date, 
    default: Date.now
  },
  Actions: {
    type: Array, 
    default: []
  }
}, { timestamps: true });

// ===== Create and Export Models =====

// User related models
export const OTPmodel = mongoose.model("OTP", OTPschema, "OTP");
export const userModel = mongoose.model("Users", userSchema, "Users");

// Project model
export const ProjectModel = mongoose.model("Projects", projectSchema, "Projects");

// Security related model
export const credsModel = mongoose.model("creds", credsSchema, "creds");

// Business data model
export const dataModel = mongoose.model("Data", dataSchema, "Data");

// Material management models
export const MaterialInquiryModel = mongoose.model("MaterialInquiry", MaterialInquirySchema, "MaterialInquiry");
export const materialReplenishmentModel = mongoose.model("MaterialReplenishment", materialReplenishmentSchema, "MaterialReplenishment");

// Testing model
export const testModel = mongoose.model("testData", testSchema, "testData");

// Supplier and customer models
export const SupplierModel = mongoose.model("SupplierInformation", supplierSchema, "SupplierInformation");
export const customerModel = mongoose.model("CustomerOrderInformation", customerSchema, "CustomerOrderInformation");

// Delivery related models
export const customerDeliveryModel = mongoose.model("CustomerDelivery", customerDeliverySchema, "CustomerDelivery");
export const CustomerDeliveryNoticeModel = mongoose.model("CustomerDeliveryNotice", customerDeliveryNoticeSchema, "CustomerDeliveryNotice");

// Work tracking model
export const dailyWorkModel = mongoose.model("DailyWorks", dailyWorkSchema, "DailyWork");
export const DashboardTableModel = mongoose.model("DashboardTable", dashboardTableSchema);
// UI customization model
export const TableHeadersModel = mongoose.model("TableHeaders", tableHeadersSchema, "TableHeaders");

// Add validation hooks to all schemas with timestamps
[userSchema, projectSchema, MaterialInquirySchema, supplierSchema, 
 customerSchema, materialReplenishmentSchema, dailyWorkSchema].forEach(schema => {
  schema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
  });
});