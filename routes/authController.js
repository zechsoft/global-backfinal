import express from "express";
import jwt from "jsonwebtoken";
import { checkUserAvailability, checkUser } from "../middleware/userCheck.js";
import { OTPmodel, userModel, ProjectModel } from "../config/Schema.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import moment from "moment";
import clearOTP from "../middleware/passwordClear.js";
import genotp from "../middleware/randomOTP.js";
import sendMail from "../middleware/mailer.js";
import multer from "multer";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { uploadToCloudinary, deleteFromCloudinary, extractPublicId } from "../middleware/cloudinaryUpload.js";

const router = express.Router();

// Configure multer to use memory storage for Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// OTP and Authentication Routes
router.post("/sendotp", async (req, res) => {
    clearOTP();
    const OTP = genotp();

    try {
        const hash = crypto.randomBytes(32).toString('hex');
        const OTPsave = new OTPmodel({ otp: OTP, proof: hash });
        await OTPsave.save();

        try {
            sendMail(OTP, "zechsoft.it@gmail.com");
            res.status(200).json({ 
                mssg: `OTP has been sent to admin`,
                secret: hash 
            });
        } catch(err) {
            console.log(err);
            res.status(500).json({"error": "Failed to send OTP"});
        } 
    } catch (e) {
        console.log("OTP error => " + e);
        res.status(500).json({"error": "OTP generation failed"});
    }
});

// Logout route
router.post("/logout", (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    });
    
    res.status(200).json({ message: "Logged out successfully" });
});

router.post("/check-user", async (req, res) => {
    const email = req.body.email;

    try {
        const response = await userModel.findOne({Email: email});
        if(!response) {
            res.status(200).json({"Success": "User not found"});
        } else {
            res.status(406).json({"error": "User already exists"});
        }
    } catch(err) {
        res.status(500).json({"error": "Internal server error"});
    }
});

router.post("/registerUser", async (req, res) => {
    const OTP = req.body.newUser.otp;
    const secret = req.body.newUser.secret;

    if (!secret || !OTP) {
        res.status(401).json({ error: "Not authorized" });
    } else {
        try {
            const salt = parseInt(process.env.SALT);
            const userName = req.body.newUser.name;
            const passwd = req.body.newUser.password;
            const mail = req.body.newUser.email;
            const role = req.body.newUser.role;

            const db_otp = await OTPmodel.findOne({ proof: secret });

            if (db_otp && db_otp.otp === OTP) {
                const passwdHash = await bcrypt.hash(passwd, salt);
                const new_user = new userModel({ 
                    userName: userName, 
                    password: passwdHash, 
                    Email: mail, 
                    role: role 
                });
                await new_user.save();
                res.status(200).json({ mssg: "Success" });
            } else {
                res.status(403).json({error: "OTP mismatch"});
            }
        } catch(err) {
            res.status(500).json({error: "Registration failed"});
        }
    }
    clearOTP();
});

router.post("/super-register", async (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const role = req.body.role;
    const salt = parseInt(process.env.SALT);

    try {
        if(!name || !email || !password || !role) {
            return res.status(406).json({"error": "Data missing"});
        }

        const userExists = await userModel.findOne({Email: email});
        if(userExists) {
            return res.status(409).json({"error": "User already exists"});
        }

        const passwdHash = await bcrypt.hash(password, salt);
        const newUser = new userModel({
            userName: name,
            Email: email,
            password: passwdHash,
            role: role
        });

        await newUser.save();
        res.status(200).json({"success": "New user created"});
    } catch(err) {
        res.status(500).json({"error": "Failed to create user"});
    }
});

// Updated login route
router.post("/login", async (req, res) => {
    const Email = req.body.email;
    const passwd = req.body.password;
    
    try {
        const result = await checkUser(Email, passwd);
        const verification = result.map(r => r.msg ? true : false);
        const creds = await userModel.findOne({ Email: Email });

        if (verification.includes(true)) {
            const token = jwt.sign(
                {
                    id: creds._id,
                    Email: creds.Email
                },
                process.env.TOKEN,
                {expiresIn: '24h'}                
            );

            res.cookie("token", token, {
                maxAge: 1000 * 60 * 60 * 24 
            });

            res.status(200).json({
                mssg: "Logged in successfully",
                id: creds._id.toString(),
                _id: creds._id.toString(),
                displayName: creds.userName,
                displayMail: creds.Email,
                role: creds.role,
                mobile: creds.mobile,
                location: creds.location,
                bio: creds.info,
                profileImage: creds.profileImage, // Cloudinary URL doesn't need timestamp
                token: token,
                isAuthenticated: true
            });
        } else {
            const mssg = result.map(r => r.error);
            res.status(403).json({ error: mssg });
        }
    } catch(err) {
        console.error("Login error:", err);
        res.status(500).json({"error": "Login failed"});
    }
});

// User listing endpoints
router.get("/get-clients", authenticateUser, async (req, res) => {
    try {
        const users = await userModel.find({role: "client"}).select('_id userName Email role mobile location info profileImage');
        res.status(200).json({"users": users});
    } catch(err) {
        console.error("Get clients error:", err);
        res.status(500).json({"error": err.message || "Failed to get clients"});
    }
});

router.get("/get-admin", authenticateUser, async (req, res) => {
    try {
        const users = await userModel.find({role: "admin"}).select('_id userName Email role mobile location info profileImage');
        res.status(200).json({"users": users});
    } catch(err) {
        console.error("Get admins error:", err);
        res.status(500).json({"error": err.message || "Failed to get admins"});
    }
});

router.get("/get-all-users", authenticateUser, async (req, res) => {
    try {
        const users = await userModel.find({
            _id: { $ne: req.user.id }
        }).select('_id userName Email role mobile location info profileImage');
        
        res.status(200).json({"users": users});
    } catch(err) {
        console.error("Get all users error:", err);
        res.status(500).json({"error": err.message || "Failed to get users"});
    }
});

router.post("/userAuth", async (req, res) => {
    const receivedOTP = req.body.logOTP;
    const sessionHash = req.session.userVerify;

    if (!sessionHash) {
        res.status(401).json({ error: "User not authorized" });
    } else {
        try {
            const otp = await OTPmodel.findOne({ proof: sessionHash });
            if (!otp) {
                return res.status(401).json({ error: "Invalid session" });
            }

            const current_time = moment();
            const otp_time = moment(otp.createAt);
            const difference = current_time.diff(otp_time, "minutes");

            if (otp.otp === receivedOTP && difference < 2) {
                req.session.dataUserActual = req.session.dataUser;
                res.status(200).json({ mssg: "User authorized" });
            } else {
                res.status(401).json({ error: "OTP mismatch or time exceeded" });
            }
        } catch(err) {
            res.status(500).json({ error: "Authorization failed" });
        }
    }
});

// User Profile Management Routes
router.post("/edit-user", async (req, res) => {
    const email = req.body.data.email;
    const name = req.body.data.fullName;
    const mobile = req.body.data.mobile;
    const location = req.body.data.location;
    const bio = req.body.data.bio;

    try {
        const userExists = await userModel.findOne({Email: email});
        if(userExists) {
            await userModel.updateOne({Email: email}, {
                $set: {
                    userName: name,
                    mobile: mobile,
                    location: location,
                    info: bio
                }
            });
            res.status(200).json({"success": "Data updated"});
        } else {
            res.status(404).json({"error": "User not found"});
        }
    } catch(err) {
        res.status(500).json({"error": err.message});
    }
});

// Updated profile image upload route with Cloudinary
router.post("/upload-profile-image", upload.single('profileImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ "error": "No file uploaded" });
        }

        const email = req.body.email;
        if (!email) {
            return res.status(400).json({ "error": "Email is required" });
        }

        // Find the existing user
        const existingUser = await userModel.findOne({ Email: email });
        
        if (!existingUser) {
            return res.status(404).json({ "error": "User not found" });
        }

        // Delete old image from Cloudinary if it exists
        if (existingUser.profileImage) {
            const oldPublicId = extractPublicId(existingUser.profileImage);
            if (oldPublicId) {
                try {
                    await deleteFromCloudinary(oldPublicId);
                } catch (deleteError) {
                    console.warn('Could not delete old image:', deleteError);
                    // Continue with upload even if deletion fails
                }
            }
        }

        // Upload new image to Cloudinary
        const folder = 'profile-images';
        const publicId = `user_${existingUser._id}_${Date.now()}`;
        
        const cloudinaryResult = await uploadToCloudinary(
            req.file.buffer, 
            folder, 
            publicId
        );

        // Update user in database with Cloudinary URL
        const updatedUser = await userModel.findOneAndUpdate(
            { Email: email },
            { 
                $set: { 
                    profileImage: cloudinaryResult.secure_url,
                    updatedAt: new Date()
                }
            },
            { new: true }
        );

        res.status(200).json({
            "success": "Profile image updated successfully",
            "imageUrl": cloudinaryResult.secure_url,
            "user": {
                userName: updatedUser.userName,
                Email: updatedUser.Email,
                role: updatedUser.role,
                mobile: updatedUser.mobile,
                location: updatedUser.location,
                bio: updatedUser.info,
                profileImage: cloudinaryResult.secure_url
            }
        });
    } catch (err) {
        console.error("Error uploading profile image:", err);
        res.status(500).json({
            "error": err.message || "Failed to upload profile image"
        });
    }
});

// Get user profile route
router.post("/get-user-profile", async (req, res) => {
    try {
        const email = req.body.email;
        
        if (!email) {
            return res.status(400).json({ "error": "Email is required" });
        }
        
        const user = await userModel.findOne({ Email: email });
        
        if (!user) {
            return res.status(404).json({ "error": "User not found" });
        }
        
        res.status(200).json({
            "user": {
                userName: user.userName,
                Email: user.Email,
                role: user.role,
                mobile: user.mobile,
                location: user.location,
                bio: user.info,
                profileImage: user.profileImage
            }
        });
    } catch (err) {
        console.error("Error getting user profile:", err);
        res.status(500).json({ "error": err.message });
    }
});

// Project Management Routes (updated to use Cloudinary for project images too)
router.post("/get-projects", async (req, res) => {
    try {
        const email = req.body.email;
        
        if (!email) {
            return res.status(400).json({ "error": "Email is required" });
        }
        
        const user = await userModel.findOne({ Email: email });
        
        if (!user) {
            return res.status(404).json({ "error": "User not found" });
        }
        
        const projects = await ProjectModel.find({ userId: user._id });
        
        res.status(200).json({ "projects": projects });
    } catch (err) {
        console.error("Error getting projects:", err);
        res.status(500).json({ "error": err.message });
    }
});

// Add project route
router.post("/add-project", async (req, res) => {
    try {
        const { project, email } = req.body;
        
        if (!project || !email) {
            return res.status(400).json({ "error": "Project data and email are required" });
        }
        
        const user = await userModel.findOne({ Email: email });
        
        if (!user) {
            return res.status(404).json({ "error": "User not found" });
        }
        
        const newProject = new ProjectModel({
            userId: user._id,
            name: project.name,
            description: project.description,
            image: project.image || null
        });
        
        await newProject.save();
        
        res.status(200).json({
            "success": "Project added successfully",
            "projectId": newProject._id,
            "project": newProject
        });
    } catch (err) {
        console.error("Error adding project:", err);
        res.status(500).json({ "error": err.message });
    }
});

// Upload project image route (updated for Cloudinary)
router.post("/upload-project-image", upload.single('projectImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ "error": "No file uploaded" });
        }

        const projectId = req.body.projectId;
        if (!projectId) {
            return res.status(400).json({ "error": "Project ID is required" });
        }

        const existingProject = await ProjectModel.findById(projectId);
        
        if (!existingProject) {
            return res.status(404).json({ "error": "Project not found" });
        }

        // Delete old image from Cloudinary if it exists
        if (existingProject.image) {
            const oldPublicId = extractPublicId(existingProject.image);
            if (oldPublicId) {
                try {
                    await deleteFromCloudinary(oldPublicId);
                } catch (deleteError) {
                    console.warn('Could not delete old project image:', deleteError);
                }
            }
        }

        // Upload new image to Cloudinary
        const folder = 'project-images';
        const publicId = `project_${projectId}_${Date.now()}`;
        
        const cloudinaryResult = await uploadToCloudinary(
            req.file.buffer, 
            folder, 
            publicId
        );

        // Update project in database
        const updatedProject = await ProjectModel.findByIdAndUpdate(
            projectId,
            { 
                $set: { 
                    image: cloudinaryResult.secure_url,
                    updatedAt: new Date()
                }
            },
            { new: true }
        );

        res.status(200).json({
            "success": "Project image updated successfully",
            "imageUrl": cloudinaryResult.secure_url,
            "project": updatedProject
        });
    } catch (err) {
        console.error("Error uploading project image:", err);
        res.status(500).json({"error": err.message});
    }
});

// Update project route
router.post("/update-project", async (req, res) => {
    try {
        const { project, email } = req.body;
        
        if (!project || !project.id || !email) {
            return res.status(400).json({ "error": "Project data with ID and email are required" });
        }
        
        const user = await userModel.findOne({ Email: email });
        
        if (!user) {
            return res.status(404).json({ "error": "User not found" });
        }
        
        const updatedProject = await ProjectModel.findOneAndUpdate(
            { _id: project.id, userId: user._id },
            {
                $set: {
                    name: project.name,
                    description: project.description,
                    image: project.image,
                    updatedAt: new Date()
                }
            },
            { new: true }
        );
        
        if (!updatedProject) {
            return res.status(404).json({ "error": "Project not found or not owned by user" });
        }
        
        res.status(200).json({ 
            "success": "Project updated successfully",
            "project": updatedProject
        });
    } catch (err) {
        console.error("Error updating project:", err);
        res.status(500).json({ "error": err.message });
    }
});

// Delete project route (updated to delete from Cloudinary)
router.post("/delete-project", async (req, res) => {
    try {
        const { projectId, email } = req.body;
        
        if (!projectId || !email) {
            return res.status(400).json({ "error": "Project ID and email are required" });
        }
        
        const user = await userModel.findOne({ Email: email });
        
        if (!user) {
            return res.status(404).json({ "error": "User not found" });
        }
        
        const project = await ProjectModel.findOne({ _id: projectId, userId: user._id });
        
        if (!project) {
            return res.status(404).json({ "error": "Project not found or not owned by user" });
        }
        
        // Delete project image from Cloudinary if it exists
        if (project.image) {
            const publicId = extractPublicId(project.image);
            if (publicId) {
                try {
                    await deleteFromCloudinary(publicId);
                } catch (deleteError) {
                    console.warn('Could not delete project image:', deleteError);
                    // Continue with project deletion even if image deletion fails
                }
            }
        }
        
        // Delete project from database
        await ProjectModel.findByIdAndDelete(projectId);
        
        res.status(200).json({ "success": "Project deleted successfully" });
    } catch (err) {
        console.error("Error deleting project:", err);
        res.status(500).json({ "error": err.message });
    }
});

// Forgot Password Route
router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    
    try {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({ 
                error: "Please provide a valid email address" 
            });
        }
        
        const userExists = await userModel.findOne({ Email: email });
        
        if (!userExists) {
            return res.status(404).json({ 
                error: "No user found with this email address" 
            });
        }
        
        clearOTP();
        
        const OTP = genotp();
        const hash = crypto.randomBytes(32).toString('hex');
        
        const OTPsave = new OTPmodel({ 
            otp: OTP, 
            proof: hash,
            userId: userExists._id,
            email: email,
            type: 'password_reset'
        });
        await OTPsave.save();
        
        try {
            const emailContent = `
                Password reset request received for user:
                
                User Email: ${email}
                User Name: ${userExists.userName}
                User Role: ${userExists.role}
                
                OTP for password reset: ${OTP}
                
                Please use this OTP to approve the password reset request.
            `;
            
            sendMail(emailContent, "zechsoft.it@gmail.com", "Password Reset Request");
            
            res.status(200).json({ 
                message: "Password reset request has been sent to admin for approval",
                secret: hash,
                userEmail: email
            });
        } catch (mailError) {
            console.log("Mail error:", mailError);
            res.status(500).json({ 
                error: "Failed to send password reset request to admin" 
            });
        }
        
    } catch (error) {
        console.log("Forgot password error:", error);
        res.status(500).json({ 
            error: "Internal server error. Please try again later." 
        });
    }
});

router.post("/reset-password", async (req, res) => {
    const { email, otp, newPassword, secret } = req.body;
    
    try {
        if (!email || !otp || !newPassword || !secret) {
            return res.status(400).json({ 
                error: "All fields are required" 
            });
        }
        
        const otpRecord = await OTPmodel.findOne({ 
            proof: secret, 
            email: email,
            type: 'password_reset'
        });
        
        if (!otpRecord) {
            return res.status(400).json({ 
                error: "Invalid or expired reset request" 
            });
        }
        
        if (otpRecord.otp !== otp) {
            return res.status(400).json({ 
                error: "Invalid OTP" 
            });
        }
        
        const current_time = moment();
        const otp_time = moment(otpRecord.createAt);
        const difference = current_time.diff(otp_time, "minutes");
        
        if (difference > 60) {
            return res.status(400).json({ 
                error: "OTP has expired. Please request a new password reset." 
            });
        }
        
        const user = await userModel.findOne({ Email: email });
        
        if (!user) {
            return res.status(404).json({ 
                error: "User not found" 
            });
        }
        
        const salt = parseInt(process.env.SALT);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        await userModel.updateOne(
            { Email: email },
            { 
                $set: { 
                    password: hashedPassword,
                    updatedAt: new Date()
                }
            }
        );
        
        await OTPmodel.deleteOne({ _id: otpRecord._id });
        
        res.status(200).json({ 
            message: "Password has been reset successfully" 
        });
        
    } catch (error) {
        console.log("Reset password error:", error);
        res.status(500).json({ 
            error: "Failed to reset password. Please try again." 
        });
    }
});

export default router;