import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true }],
  messages: [messageSchema],
  lastMessage: {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    content: { type: String },
    timestamp: { type: Date }
  }
}, { timestamps: true });

const chatRoomSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users' }],
  messages: [messageSchema]
}, { timestamps: true });

export const Message = mongoose.model("Message", messageSchema, "Messages");
export const Conversation = mongoose.model("Conversation", conversationSchema, "Conversations");
export const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema, "ChatRooms");