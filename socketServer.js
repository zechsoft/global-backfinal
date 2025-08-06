import { Server } from 'socket.io';
import { MessageModel, ChatModel, userModel } from './config/Schema.js';

export function initializeSocket(app) {
  const server = require('http').createServer(app);
  const io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:3000",
        "http://192.168.29.21:3000"
      ],
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Store online users
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Add user to online list
    socket.on('add-user', (userId) => {
      onlineUsers.set(userId, socket.id);
      io.emit('online-users', Array.from(onlineUsers.keys()));
    });

    // Handle private messages
    socket.on('private-message', async ({ to, message, chatId }) => {
      try {
        const fromSocketId = socket.id;
        const fromUserId = [...onlineUsers.entries()]
          .find(([_, socketId]) => socketId === fromSocketId)[0];

        // Save message to database
        const newMessage = new MessageModel({
          chatId,
          sender: fromUserId,
          message,
          readBy: [fromUserId]
        });
        await newMessage.save();

        // Update chat's last message
        await ChatModel.findByIdAndUpdate(chatId, { lastMessage: newMessage._id });

        // Emit to recipient if online
        if (onlineUsers.has(to)) {
          const toSocketId = onlineUsers.get(to);
          io.to(toSocketId).emit('receive-message', {
            from: fromUserId,
            message: newMessage,
            chatId
          });
        }

        // Also emit back to sender for their own UI update
        socket.emit('receive-message', {
          from: fromUserId,
          message: newMessage,
          chatId
        });

      } catch (err) {
        console.error('Error sending private message:', err);
      }
    });

    // Handle group messages
    socket.on('group-message', async ({ chatId, message }) => {
      try {
        const fromSocketId = socket.id;
        const fromUserId = [...onlineUsers.entries()]
          .find(([_, socketId]) => socketId === fromSocketId)[0];

        // Save message to database
        const newMessage = new MessageModel({
          chatId,
          sender: fromUserId,
          message,
          readBy: [fromUserId]
        });
        await newMessage.save();

        // Update chat's last message
        const chat = await ChatModel.findByIdAndUpdate(
          chatId, 
          { lastMessage: newMessage._id }
        ).populate('members');

        // Emit to all group members
        chat.members.forEach(member => {
          if (onlineUsers.has(member._id.toString()) {
            const memberSocketId = onlineUsers.get(member._id.toString());
            io.to(memberSocketId).emit('receive-message', {
              from: fromUserId,
              message: newMessage,
              chatId
            });
          }
        });

      } catch (err) {
        console.error('Error sending group message:', err);
      }
    });

    // Handle typing indicators
    socket.on('typing', ({ chatId, userId }) => {
      socket.broadcast.emit('typing', { chatId, userId });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      // Remove user from online list
      for (let [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          io.emit('online-users', Array.from(onlineUsers.keys()));
          break;
        }
      }
    });
  });

  return server;
}