import { Server } from 'socket.io';
import { createServer } from 'http';
import { Conversation, ChatRoom, Message } from './config/ChatSchema.js';
import { userModel } from './config/Schema.js';
import jwt from 'jsonwebtoken';

export function initializeSocket(app) {
  const server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:3000",
        "http://192.168.29.21:3000",
        "https://global-india-corporation-r9ad.vercel.app",
        "https://loquacious-nasturtium-28919c.netlify.app"
      ],
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Enhanced authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      console.log('Socket auth - handshake:', socket.handshake.auth);
      
      const token = socket.handshake.auth.token;
      if (!token) {
        console.log('Socket auth - No token provided');
        return next(new Error('Authentication error: No token provided'));
      }

      console.log('Socket auth - Verifying token...');
      const decoded = jwt.verify(token, process.env.TOKEN);
      console.log('Socket auth - Decoded token:', decoded);
      
      const user = await userModel.findById(decoded.id).select('-password');
      
      if (!user) {
        console.log('Socket auth - User not found for ID:', decoded.id);
        return next(new Error('Authentication error: User not found'));
      }

      console.log('Socket auth - User authenticated:', {
        id: user._id,
        email: user.Email,
        name: user.userName,
        role: user.role
      });

      socket.user = {
        id: user._id.toString(),
        email: user.Email,
        name: user.userName,
        role: user.role
      };

      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next(new Error('Authentication error: ' + error.message));
    }
  });

  // Store online users and user rooms
  const onlineUsers = new Map(); // userId -> socketId
  const userRooms = new Map();   // userId -> Set of roomIds
  const userSockets = new Map(); // userId -> socket instance for direct messaging

  io.on('connection', (socket) => {
    console.log('User connected:', socket.user.name, '(', socket.user.id, ')', socket.id);

    // Add user to online users
    onlineUsers.set(socket.user.id, socket.id);
    userSockets.set(socket.user.id, socket);
    io.emit('online-users', Array.from(onlineUsers.keys()));

    // Join user to their personal room for private messages
    socket.join(`user-${socket.user.id}`);

    // Handle joining conversation rooms
    socket.on('join-conversation', async (conversationId) => {
      try {
        console.log('User', socket.user.id, 'joining conversation:', conversationId);
        
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          throw new Error('Conversation not found');
        }

        if (!conversation.participants.includes(socket.user.id)) {
          throw new Error('Not a conversation participant');
        }

        socket.join(`conversation-${conversationId}`);
        console.log(`User ${socket.user.id} joined conversation ${conversationId}`);

        // Track user's rooms
        if (!userRooms.has(socket.user.id)) {
          userRooms.set(socket.user.id, new Set());
        }
        userRooms.get(socket.user.id).add(`conversation-${conversationId}`);
      } catch (error) {
        console.error('Join conversation error:', error.message);
        socket.emit('error', { message: error.message });
      }
    });

    // Handle joining chat rooms
    socket.on('join-room', async (roomId) => {
      try {
        console.log('User', socket.user.id, 'joining room:', roomId);
        
        const room = await ChatRoom.findById(roomId);
        if (!room) {
          throw new Error('Room not found');
        }

        if (!room.participants.includes(socket.user.id)) {
          throw new Error('Not a room participant');
        }

        socket.join(`room-${roomId}`);
        console.log(`User ${socket.user.id} joined room ${roomId}`);

        // Track user's rooms
        if (!userRooms.has(socket.user.id)) {
          userRooms.set(socket.user.id, new Set());
        }
        userRooms.get(socket.user.id).add(`room-${roomId}`);

        // Notify others in the room
        socket.to(`room-${roomId}`).emit('user-joined', {
          userId: socket.user.id,
          userName: socket.user.name,
          roomId
        });
      } catch (error) {
        console.error('Join room error:', error.message);
        socket.emit('error', { message: error.message });
      }
    });

    // Handle leaving rooms
    socket.on('leave-room', (roomId) => {
      console.log('User', socket.user.id, 'leaving room:', roomId);
      socket.leave(`room-${roomId}`);
      if (userRooms.has(socket.user.id)) {
        userRooms.get(socket.user.id).delete(`room-${roomId}`);
      }
      socket.to(`room-${roomId}`).emit('user-left', {
        userId: socket.user.id,
        roomId
      });
    });

    // Handle leaving conversations
    socket.on('leave-conversation', (conversationId) => {
      console.log('User', socket.user.id, 'leaving conversation:', conversationId);
      socket.leave(`conversation-${conversationId}`);
      if (userRooms.has(socket.user.id)) {
        userRooms.get(socket.user.id).delete(`conversation-${conversationId}`);
      }
    });

    // Handle private messages - FIXED to only send to conversation participants
    socket.on('send-private-message', async (data) => {
      try {
        const { conversationId, content, tempId } = data;
        
        console.log('Send private message:', {
          conversationId,
          content: content?.substring(0, 50) + '...',
          tempId,
          userId: socket.user.id
        });
        
        if (!conversationId || !content) {
          throw new Error('Missing required fields');
        }

        // Find conversation with participants
        const conversation = await Conversation.findById(conversationId)
          .populate('participants', 'userName Email');
        
        if (!conversation) {
          throw new Error('Conversation not found');
        }

        // Check if user is a participant
        if (!conversation.participants.some(p => p._id.toString() === socket.user.id)) {
          throw new Error('Not a conversation participant');
        }

        // Create new message
        const newMessage = {
          sender: socket.user.id,
          content: content.trim(),
          timestamp: new Date()
        };

        // Add to conversation
        conversation.messages.push(newMessage);
        conversation.lastMessage = {
          content: content.trim(),
          timestamp: new Date(),
          sender: socket.user.id
        };
        
        await conversation.save();

        // Get the last message with populated sender
        const savedMessage = conversation.messages[conversation.messages.length - 1];
        const populatedMessage = {
          ...savedMessage.toObject(),
          sender: {
            _id: socket.user.id,
            userName: socket.user.name
          }
        };

        console.log('Private message saved, participants:', conversation.participants.map(p => p._id));

        // FIXED: Only emit to conversation participants, not all users
        conversation.participants.forEach(participant => {
          const participantSocket = userSockets.get(participant._id.toString());
          if (participantSocket) {
            console.log('Sending message to participant:', participant._id);
            participantSocket.emit('receive-private-message', {
              conversationId,
              message: populatedMessage,
              tempId
            });
          }
        });

        // Update conversation list for participants only
        const updatedConversation = await Conversation.findById(conversationId)
          .populate('participants', 'userName Email')
          .populate('lastMessage.sender', 'userName');

        conversation.participants.forEach(participant => {
          const participantSocket = userSockets.get(participant._id.toString());
          if (participantSocket) {
            participantSocket.emit('conversation-updated', updatedConversation);
          }
        });

      } catch (error) {
        console.error('Send private message error:', error.message);
        socket.emit('message-error', { 
          tempId: data.tempId, 
          error: error.message 
        });
      }
    });

    // Handle room messages - FIXED similar to private messages
    socket.on('send-room-message', async (data) => {
      try {
        const { roomId, content, tempId } = data;
        
        console.log('Send room message:', {
          roomId,
          content: content?.substring(0, 50) + '...',
          tempId,
          userId: socket.user.id
        });
        
        if (!roomId || !content) {
          throw new Error('Missing required fields');
        }

        // Find room with participants
        const room = await ChatRoom.findById(roomId)
          .populate('participants', 'userName Email');
        
        if (!room) {
          throw new Error('Room not found');
        }

        // Check if user is a participant
        if (!room.participants.some(p => p._id.toString() === socket.user.id)) {
          throw new Error('Not a room participant');
        }

        // Create new message
        const newMessage = {
          sender: socket.user.id,
          content: content.trim(),
          timestamp: new Date()
        };

        // Add to room
        room.messages.push(newMessage);
        await room.save();

        // Get the last message with populated sender
        const savedMessage = room.messages[room.messages.length - 1];
        const populatedMessage = {
          ...savedMessage.toObject(),
          sender: {
            _id: socket.user.id,
            userName: socket.user.name
          }
        };

        console.log('Room message saved, participants:', room.participants.map(p => p._id));

        // FIXED: Only emit to room participants, not all users
        room.participants.forEach(participant => {
          const participantSocket = userSockets.get(participant._id.toString());
          if (participantSocket) {
            console.log('Sending room message to participant:', participant._id);
            participantSocket.emit('receive-room-message', {
              roomId,
              message: populatedMessage,
              tempId
            });
          }
        });

        // Update room list for participants only
        const updatedRoom = await ChatRoom.findById(roomId)
          .populate('participants', 'userName Email')
          .select('name description participants messages');

        room.participants.forEach(participant => {
          const participantSocket = userSockets.get(participant._id.toString());
          if (participantSocket) {
            participantSocket.emit('room-updated', updatedRoom);
          }
        });

      } catch (error) {
        console.error('Send room message error:', error.message);
        socket.emit('message-error', { 
          tempId: data.tempId, 
          error: error.message 
        });
      }
    });

    // Handle typing indicators - FIXED to only send to relevant participants
    socket.on('typing-start', ({ conversationId, roomId }) => {
      console.log('User typing:', socket.user.id, conversationId || roomId);
      if (conversationId) {
        // Only send to conversation participants
        socket.to(`conversation-${conversationId}`).emit('user-typing', {
          userId: socket.user.id,
          userName: socket.user.name,
          conversationId
        });
      } else if (roomId) {
        // Only send to room participants
        socket.to(`room-${roomId}`).emit('user-typing', {
          userId: socket.user.id,
          userName: socket.user.name,
          roomId
        });
      }
    });

    socket.on('typing-stop', ({ conversationId, roomId }) => {
      console.log('User stopped typing:', socket.user.id, conversationId || roomId);
      if (conversationId) {
        socket.to(`conversation-${conversationId}`).emit('user-stopped-typing', {
          userId: socket.user.id,
          conversationId
        });
      } else if (roomId) {
        socket.to(`room-${roomId}`).emit('user-stopped-typing', {
          userId: socket.user.id,
          roomId
        });
      }
    });

    // Handle read receipts
    socket.on('mark-messages-read', async ({ conversationId, roomId }) => {
      try {
        console.log('Mark messages read:', { conversationId, roomId, userId: socket.user.id });
        
        if (conversationId) {
          socket.to(`conversation-${conversationId}`).emit('messages-read', {
            userId: socket.user.id,
            conversationId
          });
        } else if (roomId) {
          socket.to(`room-${roomId}`).emit('messages-read', {
            userId: socket.user.id,
            roomId
          });
        }
      } catch (error) {
        console.error('Mark messages read error:', error.message);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.user.name, '(', socket.user.id, ')', socket.id);
      
      // Remove from online users
      onlineUsers.delete(socket.user.id);
      userSockets.delete(socket.user.id);
      io.emit('online-users', Array.from(onlineUsers.keys()));
      
      // Leave all rooms
      if (userRooms.has(socket.user.id)) {
        userRooms.get(socket.user.id).forEach(room => {
          socket.leave(room);
          if (room.startsWith('room-')) {
            const roomId = room.replace('room-', '');
            socket.to(room).emit('user-left', {
              userId: socket.user.id,
              roomId
            });
          }
        });
        userRooms.delete(socket.user.id);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error for user', socket.user.id, ':', error);
    });
  });

  // Handle server errors
  io.on('error', (error) => {
    console.error('Socket.IO server error:', error);
  });

  return server;
}