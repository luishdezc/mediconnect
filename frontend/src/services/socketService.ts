import { io, Socket } from 'socket.io-client';

const WS_URL = (import.meta as any).env?.VITE_WS_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private pendingRooms: string[] = [];

  connect(userId: string): void {
    if (this.socket?.connected && this.userId === userId) return;

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.userId = userId;

    this.socket = io(WS_URL, {
      withCredentials: true,
      transports: ['polling', 'websocket'],  
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket!.id);
      this.socket!.emit('join:user', userId);
      this.pendingRooms.forEach(room => this.socket!.emit('join:conversation', room));
      this.pendingRooms = [];
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[Socket] connect_error:', err.message);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.userId = null;
    this.pendingRooms = [];
  }

  joinConversation(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join:conversation', conversationId);
    } else {
      if (!this.pendingRooms.includes(conversationId)) {
        this.pendingRooms.push(conversationId);
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    if (!this.socket?.connected) {
      console.warn(`[Socket] emit('${event}') called but socket not connected`);
      return;
    }
    this.socket.emit(event, ...args);
  }

  on(event: string, handler: (...args: any[]) => void): void {
    this.socket?.on(event, handler);
  }

  off(event: string, handler?: (...args: any[]) => void): void {
    this.socket?.off(event, handler);
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
