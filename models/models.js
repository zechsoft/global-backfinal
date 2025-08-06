import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

// Check if models are already defined to prevent the OverwriteModelError
const modelNames = mongoose.modelNames();

const OTPschema = new mongoose.Schema(
    {
        otp : { type:String,required:true },
        createAt : { type:Date,default:Date.now },
        proof : { type:String,required:true },
        pubId : { type:String,default:uuidv4 }
    }
);

const userSchema = new mongoose.Schema(
    {
        userName : { type:String,required:true },
        password : { type:String,required:true },
        Email : { type:String,required:true,unique:true },
        role : {type:String,required:true},
        pubId: { type:String,default:uuidv4 },
        info : {type:String},
        mobile : {type:String},
        location : {type:String},
    }
);

// Only define the model if it doesn't already exist
export const userModel = modelNames.includes('Users') 
    ? mongoose.model('Users')
    : mongoose.model("Users", userSchema, "Users");

const credsSchema = new mongoose.Schema(
    {
        key : { type:String },
        iv : { type:String }
    }
);

const dataSchema = new mongoose.Schema(
    {
        id : {type:mongoose.Schema.Types.ObjectId,required:true,ref:'userModel'},
        ordNo : {type:Number,required:true},
        product:{type:String,required:true}
    }
);

const MaterialInquirySchema = new mongoose.Schema(
    {
        Suppliermaterial : {type:String,required:true},
        OrderNumber : {type:String,required:true},
        status : {type:String,default:"Pending"},
        explaination : {type:String,required :true},
        createdTime : {type:Date,default:Date.now},
        updateTime : {type:Date,default:Date.now},
        user : {type:String,required:true}
    }
);

const testSchema = new mongoose.Schema(
    {
        name:{type:String,required:true},
        password: {type:String,required:true}
    }
);

// Modified supplier schema to match frontend data structure and column handling
const supplierSchema = new mongoose.Schema(
    {
        id: { type: Number, required: true },
        supplierNumber: { type: String, required: true },
        customerNumber: { type: String, required: true }, // Duplicate for compatibility
        supplier: { type: String, required: true },
        Customer: { type: String, required: true }, // Duplicate for compatibility
        buyer: { type: String, required: true },
        secondOrderClassification: { type: String, required: true },
        SecondOrderClassification: { type: String, required: true }, // Duplicate for compatibility
        status: { type: String, required: true },
        Status: { type: String, required: true }, // Duplicate for compatibility
        documentStatus: { type: String, required: true },
        DocumentStatus: { type: String, required: true }, // Duplicate for compatibility
        abnormalInfo: { type: String, required: true },
        AbnormalInfo: { type: String, required: true }, // Duplicate for compatibility
        invitee: { type: String, required: true },
        Invite: { type: String, required: true }, // Duplicate for compatibility
        reAuthPerson: { type: String, required: true },
        ReAuthPerson: { type: String, required: true }, // Duplicate for compatibility
        contactInfo: { type: String, required: true },
        ContactInfo: { type: String, required: true }, // Duplicate for compatibility
        invitationDate: { type: String, required: true },
        InvitationDate: { type: String, required: true }, // Duplicate for compatibility
        user: { type: String, required: true }
    }
);

// Schema for storing table header configurations
const tableHeaderSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    headers: { type: Array, required: true }
});

const customerSchema = new mongoose.Schema(
    {
        user : {type:String,required:true},
        customer : {type:String,required:true},
        platformNo: {type:String,required:true},
        poNo: {type:String,required:true},
        purchaseDate: {type:String,required:true},
        orderAmount: {type:String,required:true},
        currency: {type:String,required:true},
        purchasingDepartment: {type:String,required:true},
        purchaser: {type:String,required:true},
        requisitionBusinessGroup: {type:String,required:true},
        deliveryStatus: {type:String,required:true},
        orderStatus: {type:String,required:true},
        acceptanceStatus:{type:String,required:true},
        statementStatus: {type:String,required:true},
    }
);

const customerDeliverySchema = new mongoose.Schema(
    {
        user:{type:String,required:true},
        OrderNumber:{type:String,required:true},
        MaterialCategory:{type:String,required:true},
        Vendor:{type:String,required:true},
        Invitee:{type:String,required:true},
        Host:{type:String,required:true},
        Sender:{type:String,required:true},	
        Status:{type:String,required:true},
        SupplementTemplate:{type:String,required:true}, 	
        Created:{type:String,required:true},
        Actions:{type:String,required:true} 
    }
);

const materialReplenishmentSchema = new mongoose.Schema(
    {
        user:{type:String,required:true},
        OrderNumber:{type:String,required:true},
        MaterialCategory:{type:String,required:true},
        Vendor:{type:String,required:true},
        Invitee:{type:String,required:true},
        Host:{type:String,required:true},
        Sender:{type:String,required:true},	
        Status:{type:String,required:true},
        SupplementTemplate:{type:String,required:true}, 	
        Created:{type:Date,required:true},
        updated : {type:Date,required:true},
    }
);

const dailWorkSchema = new mongoose.Schema(
    {
        user:{type:String,required:true},
        CompanyName:{type:String,required:true},
        ProjectName:{type:String,required:true},
        SupervisorName:{type:String,required:true},
        ManagerName:{type:String,required:true},
        PrepaidBy:{type:String,required:true},
        Employee:{type:String,required:true},
        NatureofWork:{type:String,required:true},
        Progress:{type:String,required:true},
        HourofWork:{type:String,required:true},
        Charges:{type:String,required:true},
        Date:{type:Date,required:true}
    }
);

// Define all models conditionally to prevent duplicate model errors
export const OTPmodel = modelNames.includes('OTP') 
    ? mongoose.model('OTP') 
    : mongoose.model("OTP", OTPschema, "OTP");

export const credsModel = modelNames.includes('creds') 
    ? mongoose.model('creds') 
    : mongoose.model("creds", credsSchema, "creds");

export const dataModel = modelNames.includes('Data') 
    ? mongoose.model('Data') 
    : mongoose.model("Data", dataSchema, "Data");

export const MaterialInquiryModel = modelNames.includes('MaterialInquiry') 
    ? mongoose.model('MaterialInquiry') 
    : mongoose.model("MaterialInquiry", MaterialInquirySchema, "MaterialInquiry");

export const testModel = modelNames.includes('testData') 
    ? mongoose.model('testData') 
    : mongoose.model("testData", testSchema, "testData");

export const SupplierModel = modelNames.includes('SupplierInformation') 
    ? mongoose.model('SupplierInformation') 
    : mongoose.model("SupplierInformation", supplierSchema, "SupplierInformation");

export const TableHeaderModel = modelNames.includes('TableHeaders') 
    ? mongoose.model('TableHeaders') 
    : mongoose.model("TableHeaders", tableHeaderSchema, "TableHeaders");

export const customerModel = modelNames.includes('CustomerOrderInformation') 
    ? mongoose.model('CustomerOrderInformation') 
    : mongoose.model("CustomerOrderInformation", customerSchema, "CustomerOrderInformation");

export const customerDeliveryModel = modelNames.includes('CustomerDelivery') 
    ? mongoose.model('CustomerDelivery') 
    : mongoose.model("CustomerDelivery", customerDeliverySchema, "CustomerDelivery");

export const materialReplenishmentModel = modelNames.includes('MaterialReplenishment') 
    ? mongoose.model('MaterialReplenishment') 
    : mongoose.model("MaterialReplenishment", materialReplenishmentSchema, "MaterialReplenishment");

export const dailyWorkModel = modelNames.includes('DailyWorks') 
    ? mongoose.model('DailyWorks') 
    : mongoose.model("DailyWorks", dailWorkSchema, "DailyWork");