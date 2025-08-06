import { Conversation, ChatRoom, Message } from "../config/ChatSchema.js";
import { userModel } from "../config/Schema.js";
import mongoose from "mongoose";

export const sendPrivateMessage = async (req, res) => {
  try {
    const senderId = validateUserId(req);
    const receiverId = req.params.userId;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: "Message content cannot be empty" });
    }

    if (!receiverId || !mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ error: "Invalid receiver ID" });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [senderId, receiverId],
        messages: []
      });
    }

    // Create new message
    const newMessage = {
      sender: senderId,
      content: content.trim(),
      timestamp: new Date()
    };

    // Add message to conversation
    conversation.messages.push(newMessage);
    conversation.lastMessage = {
      content: content.trim(),
      timestamp: new Date(),
      sender: senderId
    };

    await conversation.save();

    // Populate the sender details for the response
    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants', 'userName Email')
      .populate('messages.sender', 'userName')
      .populate('lastMessage.sender', 'userName');

    res.status(201).json({
      message: "Message sent successfully",
      conversation: populatedConversation
    });
  } catch (err) {
    console.error("Error sending message:", err);

    if (err.message.includes("Authentication required") || err.message.includes("Invalid user ID")) {
      return res.status(401).json({ error: err.message });
    }

    res.status(500).json({ error: "Failed to send message" });
  }
};

// Chat Rooms Controllers






export const sendChatRoomMessage = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const userId = validateUserId(req);
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ error: "Invalid room ID format" });
    }

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: "Message content cannot be empty" });
    }

    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
      return res.status(404).json({ error: "Chat room not found" });
    }

    // Check if user is a participant
    if (!chatRoom.participants.some(p => p.toString() === userId)) {
      return res.status(403).json({ error: "You must join this room before sending messages" });
    }

    // Create new message
    const newMessage = {
      sender: userId,
      content: content.trim(),
      timestamp: new Date()
    };

    // Add message to chat room
    chatRoom.messages.push(newMessage);
    await chatRoom.save();

    // Populate the sender details for the response
    const populatedRoom = await ChatRoom.findById(roomId)
      .populate('messages.sender', 'userName')
      .populate('participants', 'userName Email');

    res.status(201).json({
      message: "Message sent successfully",
      chatRoom: populatedRoom
    });
  } catch (err) {
    console.error("Error sending message to chat room:", err);

    if (err.message.includes("Authentication required") || err.message.includes("Invalid user ID")) {
      return res.status(401).json({ error: err.message });
    }

    res.status(500).json({ error: "Failed to send message" });
  }
};

// controllers/chatController.js


// Helper function to validate and extract user ID
const validateUserId = (req) => {
  console.log('validateUserId - req.user:', req.user);
  
  const user = req.user || {};
  const userId = user.id || user._id;

  if (!userId) {
    throw new Error("Authentication required - no user ID found");
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID format");
  }

  console.log('validateUserId - validated user ID:', userId);
  return userId;
};

// Private Conversations Controllers
export const getPrivateConversations = async (req, res) => {
  try {
    const userId = validateUserId(req);

    console.log("Fetching conversations for user:", userId);

    const conversations = await Conversation.find({
      participants: userId
    })
      .populate('participants', 'userName Email')
      .populate('lastMessage.sender', 'userName')
      .sort({ 'lastMessage.timestamp': -1 });

    console.log(`Found ${conversations.length} conversations`);
    res.status(200).json({ conversations });
  } catch (err) {
    console.error("Error fetching conversations:", err);

    if (err.message.includes("Authentication required") || err.message.includes("Invalid user ID")) {
      return res.status(401).json({ error: err.message });
    }

    res.status(500).json({ error: "Failed to fetch conversations: " + err.message });
  }
};

export const getPrivateConversation = async (req, res) => {
  try {
    const currentUserId = validateUserId(req);
    const otherUserId = req.params.userId;

    console.log("Current User ID:", currentUserId);
    console.log("Other User ID:", otherUserId);

    if (!otherUserId) {
      return res.status(400).json({ error: "Target user ID is required" });
    }

    // Validate target user ObjectId
    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      console.error("Invalid target user ID format:", otherUserId);
      return res.status(400).json({ error: "Invalid target user ID format" });
    }

    // Check if trying to chat with self
    if (currentUserId.toString() === otherUserId.toString()) {
      return res.status(400).json({ error: "Cannot start conversation with yourself" });
    }

    // Validate other user exists
    const otherUser = await userModel.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ error: "Target user not found" });
    }

    // Find existing conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, otherUserId] }
    })
      .populate('participants', 'userName Email')
      .populate('messages.sender', 'userName');

    // If no conversation exists, create one
    if (!conversation) {
      console.log("Creating new conversation between:", currentUserId, "and", otherUserId);

      conversation = new Conversation({
        participants: [currentUserId, otherUserId],
        messages: []
      });

      await conversation.save();

      // Fetch again with populated fields
      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'userName Email')
        .populate('messages.sender', 'userName');
    }

    console.log("Returning conversation:", conversation._id);
    res.status(200).json({ conversation });
  } catch (err) {
    console.error("Error fetching conversation:", err);

    if (err.message.includes("Authentication required") || err.message.includes("Invalid user ID")) {
      return res.status(401).json({ error: err.message });
    }

    res.status(500).json({ error: "Failed to fetch conversation: " + err.message });
  }
};

// Chat Rooms Controllers
export const getChatRooms = async (req, res) => {
  try {
    const userId = validateUserId(req);

    console.log("Fetching chat rooms for user:", userId);

    const chatRooms = await ChatRoom.find()
      .populate('createdBy', 'userName')
      .populate('participants', 'userName Email')
      .select('name description participants createdAt createdBy')
      .sort({ createdAt: -1 });

    console.log(`Found ${chatRooms.length} chat rooms`);
    res.status(200).json({ chatRooms });
  } catch (err) {
    console.error("Error fetching chat rooms:", err);

    if (err.message.includes("Authentication required") || err.message.includes("Invalid user ID")) {
      return res.status(401).json({ error: err.message });
    }

    res.status(500).json({ error: "Failed to fetch chat rooms: " + err.message });
  }
};

export const getChatRoomMessages = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const userId = validateUserId(req);

    console.log("Fetching chat room messages:", roomId, "for user:", userId);

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ error: "Invalid room ID format" });
    }

    const chatRoom = await ChatRoom.findById(roomId)
      .populate('messages.sender', 'userName')
      .populate('participants', 'userName Email')
      .populate('createdBy', 'userName');

    if (!chatRoom) {
      return res.status(404).json({ error: "Chat room not found" });
    }

    // Check if user has access to this room (is participant)
    const isParticipant = chatRoom.participants.some(p => p._id.toString() === userId);
    if (!isParticipant) {
      return res.status(403).json({ error: "You must join this room to view messages" });
    }

    console.log("Returning chat room with", chatRoom.messages?.length || 0, "messages");
    res.status(200).json({ chatRoom });
  } catch (err) {
    console.error("Error fetching chat room:", err);

    if (err.message.includes("Authentication required") || err.message.includes("Invalid user ID")) {
      return res.status(401).json({ error: err.message });
    }

    res.status(500).json({ error: "Failed to fetch chat room: " + err.message });
  }
};

export const createChatRoom = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = validateUserId(req);

    console.log("Creating chat room:", name, "by user:", userId);

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: "Room name is required" });
    }

    // Check if room with same name already exists
    const existingRoom = await ChatRoom.findOne({
      name: name.trim()
    });

    if (existingRoom) {
      return res.status(409).json({ error: "A room with this name already exists" });
    }

    const newRoom = new ChatRoom({
      name: name.trim(),
      description: description ? description.trim() : '',
      createdBy: userId,
      participants: [userId] // Creator automatically joins
    });

    await newRoom.save();

    const populatedRoom = await ChatRoom.findById(newRoom._id)
      .populate('createdBy', 'userName')
      .populate('participants', 'userName Email');

    console.log("Chat room created successfully:", populatedRoom._id);
    res.status(201).json({ chatRoom: populatedRoom });
  } catch (err) {
    console.error("Error creating chat room:", err);

    if (err.message.includes("Authentication required") || err.message.includes("Invalid user ID")) {
      return res.status(401).json({ error: err.message });
    }

    res.status(500).json({ error: "Failed to create chat room: " + err.message });
  }
};

export const joinChatRoom = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const userId = validateUserId(req);

    console.log("User", userId, "joining room:", roomId);

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ error: "Invalid room ID format" });
    }

    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
      return res.status(404).json({ error: "Chat room not found" });
    }

    // Check if user is already a participant
    if (chatRoom.participants.some(p => p.toString() === userId)) {
      return res.status(400).json({ error: "You're already a participant in this room" });
    }

    chatRoom.participants.push(userId);
    await chatRoom.save();

    const populatedRoom = await ChatRoom.findById(roomId)
      .populate('participants', 'userName Email')
      .populate('createdBy', 'userName');

    console.log("User joined room successfully");
    res.status(200).json({
      message: "Joined chat room successfully",
      chatRoom: populatedRoom
    });
  } catch (err) {
    console.error("Error joining chat room:", err);

    if (err.message.includes("Authentication required") || err.message.includes("Invalid user ID")) {
      return res.status(401).json({ error: err.message });
    }

    res.status(500).json({ error: "Failed to join chat room: " + err.message });
  }
};

export const leaveChatRoom = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const userId = validateUserId(req);

    console.log("User", userId, "leaving room:", roomId);

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ error: "Invalid room ID format" });
    }

    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
      return res.status(404).json({ error: "Chat room not found" });
    }

    // Check if user is a participant
    if (!chatRoom.participants.some(p => p.toString() === userId)) {
      return res.status(400).json({ error: "You're not a participant in this room" });
    }

    // Remove user from participants
    chatRoom.participants = chatRoom.participants.filter(
      participant => participant.toString() !== userId
    );

    await chatRoom.save();

    console.log("User left room successfully");
    res.status(200).json({ message: "Left chat room successfully" });
  } catch (err) {
    console.error("Error leaving chat room:", err);

    if (err.message.includes("Authentication required") || err.message.includes("Invalid user ID")) {
      return res.status(401).json({ error: err.message });
    }

    res.status(500).json({ error: "Failed to leave chat room: " + err.message });
  }
};