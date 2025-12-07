import { io, Socket } from 'socket.io-client';

class SocketService {
    private socket: Socket | null = null;

    connect(token: string): void {
        this.socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000
        });

        this.socket.on('connect', () => {
            console.log('Socket connected');
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    joinChatroom(chatroomId: string): void {
        if (this.socket) {
            this.socket.emit('join-chatroom', chatroomId);
        }
    }

    leaveChatroom(chatroomId: string): void {
        if (this.socket) {
            this.socket.emit('leave-chatroom', chatroomId);
        }
    }

    sendTyping(chatroomId: string, isTyping: boolean): void {
        if (this.socket) {
            this.socket.emit('typing', { chatroomId, isTyping });
        }
    }

    emitMessageSent(chatroomId: string, message: any): void {
        if (this.socket) {
            this.socket.emit('message-sent', { chatroomId, message });
        }
    }

    emitMessageEdited(chatroomId: string, message: any): void {
        if (this.socket) {
            this.socket.emit('message-edited', { chatroomId, message });
        }
    }

    emitMessageDeleted(chatroomId: string, messageId: string): void {
        if (this.socket) {
            this.socket.emit('message-deleted', { chatroomId, messageId });
        }
    }

    on(event: string, callback: (data: any) => void): void {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event: string): void {
        if (this.socket) {
            this.socket.off(event);
        }
    }
}

export default new SocketService();
