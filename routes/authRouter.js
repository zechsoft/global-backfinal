import express from "express";
import authController from "./authController.js";
import materialInquiry from "./materialInquiry.js";
import supplierRoutes from "./supplierRoutes.js";
import customerRoutes from "./customerRoutes.js";
import customerDelivery from "./customerDelivery.js";
import customerDeliveryNoticeRoutes from "./customerDeliveryNoticeRoutes.js";
import materialReplenishment from "./materialReplenishment.js";
import dailyWork from "./dailyWork.js";

import tableHeaders from "./tableHeaders.js";
import chatRoutes from "./chatRoutes.js";
import dashboardTableRoutes from "./dashboardTableRoutes.js";



const router = express.Router();

// Authentication routes
router.use("/", authController);

// Material Inquiry routes
router.use("/material-inquiry", materialInquiry);

// Supplier routes - updated to use plural form for consistency with frontend
router.use("/suppliers", supplierRoutes);
// Keep the original route for backward compatibility
router.use("/supplier", supplierRoutes);
router.use("/dashboard-tables", dashboardTableRoutes);

// Customer routes
router.use("/customer", customerRoutes);

// Customer Delivery routes
router.use("/customer-delivery-notices", customerDeliveryNoticeRoutes);

// Material Replenishment routes
router.use("/material-replenishment", materialReplenishment);

// Daily Work routes
router.use("/dailywork", dailyWork);

// Table Headers routes
router.use("/table-headers", tableHeaders);

// Test route
router.post("/test", async (req, res) => {
    console.log("Test endpoint called");
    res.status(200).json({ message: "Test endpoint working" });
});

export default router;