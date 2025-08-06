// routes/chatRoutes.js
import express from "express";
import { 
  getPrivateConversations, 
  getPrivateConversation, 
  sendPrivateMessage,
  getChatRooms,
  getChatRoomMessages,
  createChatRoom,
  joinChatRoom,
  leaveChatRoom,
  sendChatRoomMessage
} from "../controllers/chatController.js";
import { routeVerify } from "../middleware/tokenVerify.js";
import { authenticateUser } from "../middleware/authMiddleware.js"


const router = express.Router();

// Apply authentication middleware to all chat routes
router.use(routeVerify);

// Private chat routes
router.get("/conversations",authenticateUser, getPrivateConversations);
router.get("/conversations/:userId",authenticateUser, getPrivateConversation);
router.post("/conversations/:userId", authenticateUser,sendPrivateMessage);

// Public chat routes
router.get("/rooms",authenticateUser, getChatRooms);
router.get("/rooms/:roomId", authenticateUser,getChatRoomMessages);
router.post("/rooms",authenticateUser, createChatRoom);
router.post("/rooms/:roomId/join",authenticateUser, joinChatRoom);
router.post("/rooms/:roomId/leave",authenticateUser, leaveChatRoom);
router.post("/rooms/:roomId/messages",authenticateUser, sendChatRoomMessage);

export default router;