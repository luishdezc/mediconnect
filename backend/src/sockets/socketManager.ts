interface RTCSessionDescriptionInit { type: string; sdp?: string; }
interface RTCIceCandidateInit { candidate?: string; sdpMLineIndex?: number | null; sdpMid?: string | null; }

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Message, Conversation } from '../models/Chat';

let io: SocketIOServer;

export const initSocket = (server: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    allowUpgrades: true,
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join user's personal room
    socket.on('join:user', (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined personal room`);
    });

    // Join appointment room (for status updates)
    socket.on('join:appointment', (appointmentId: string) => {
      socket.join(`appointment:${appointmentId}`);
    });

    // Join conversation room (for chat)
    socket.on('join:conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    // Handle chat message
    socket.on('chat:send', async (data: {
      conversationId: string;
      senderId: string;
      content: string;
      type?: string;
    }) => {
      try {
        // Basic validation
        if (!data.conversationId || !data.senderId || !data.content?.trim()) return;
        const content = data.content.trim().slice(0, 2000); // max 2000 chars

        const message = await Message.create({
          conversationId: data.conversationId,
          senderId: data.senderId,
          content,
          type: data.type || 'text',
        });

        await message.populate('senderId', 'name avatar');

        await Conversation.findByIdAndUpdate(data.conversationId, {
          lastMessage: content,
          lastMessageAt: new Date(),
        });

        // Broadcast to everyone in the conversation room (including sender on other devices)
        io.to(`conversation:${data.conversationId}`).emit('chat:message', message);
      } catch (error) {
        console.error('chat:send error:', error);
        socket.emit('chat:error', { message: 'Error al enviar mensaje' });
      }
    });

    // --- VIDEO CALL SIGNALING ---
    // Callee signals to caller that they accepted — caller can now send the offer
    socket.on('video:accept', (data: { to: string; from: string }) => {
      io.to(`user:${data.to}`).emit('video:accepted', { from: data.from });
    });

    socket.on('video:offer', (data: { to: string; offer: RTCSessionDescriptionInit; from: string }) => {
      io.to(`user:${data.to}`).emit('video:offer', {
        offer: data.offer,
        from: data.from,
        socketId: socket.id,
      });
    });

    socket.on('video:answer', (data: { to: string; answer: RTCSessionDescriptionInit }) => {
      io.to(`user:${data.to}`).emit('video:answer', { answer: data.answer });
    });

    socket.on('video:ice-candidate', (data: { to: string; candidate: RTCIceCandidateInit }) => {
      io.to(`user:${data.to}`).emit('video:ice-candidate', { candidate: data.candidate });
    });

    socket.on('video:end', (data: { to: string }) => {
      io.to(`user:${data.to}`).emit('video:end');
    });

    socket.on('video:call-request', (data: { to: string; from: string; fromName: string; appointmentId: string }) => {
      io.to(`user:${data.to}`).emit('video:incoming-call', {
        from: data.from,
        fromName: data.fromName,
        appointmentId: data.appointmentId,
        socketId: socket.id,
      });
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
    });

    socket.on('error', (err) => {
      console.error(`Socket error [${socket.id}]:`, err);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};
