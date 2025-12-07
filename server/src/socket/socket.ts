import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export let io: Server;

interface SocketUser {
    _id: string;
    username: string;
    email: string;
}

interface AuthenticatedSocket extends Socket {
    user?: SocketUser;
}

export const initializeSocket = (httpServer: HTTPServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            credentials: true
        },
        transports: ['websocket', 'polling']
    });

    // Authentication middleware
    io.use(async (socket: AuthenticatedSocket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication required'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
            const user = await User.findById(decoded.userId).select('-password');

            if (!user) {
                return next(new Error('User not found'));
            }

            socket.user = {
                _id: user._id.toString(),
                username: user.username,
                email: user.email
            };

            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    // Connection event
    io.on('connection', (socket: AuthenticatedSocket) => {
        console.log(`User connected: ${socket.user?.username}`);

        // Update user status to online
        if (socket.user) {
            User.findByIdAndUpdate(socket.user._id, {
                status: 'online',
                lastSeen: new Date()
            }).exec();

            // Broadcast online status
            io.emit('user-status', {
                userId: socket.user._id,
                status: 'online'
            });
        }

        // Join chatroom
        socket.on('join-chatroom', (chatroomId: string) => {
            socket.join(chatroomId);
            console.log(`User ${socket.user?.username} joined chatroom ${chatroomId}`);
        });

        // Join personal user room for notifications
        if (socket.user) {
            socket.join(`user:${socket.user._id}`);
        }

        // Leave chatroom
        socket.on('leave-chatroom', (chatroomId: string) => {
            socket.leave(chatroomId);
            console.log(`User ${socket.user?.username} left chatroom ${chatroomId}`);
        });

        // Typing indicator
        socket.on('typing', ({ chatroomId, isTyping }: { chatroomId: string; isTyping: boolean }) => {
            socket.to(chatroomId).emit('typing', {
                chatroomId,
                userId: socket.user?._id,
                username: socket.user?.username,
                isTyping
            });
        });

        // Message sent (broadcast to chatroom)
        socket.on('message-sent', (data: any) => {
            socket.to(data.chatroomId).emit('new-message', data.message);
        });

        // Message edited
        socket.on('message-edited', (data: any) => {
            socket.to(data.chatroomId).emit('message-updated', data.message);
        });

        // Message deleted
        socket.on('message-deleted', (data: any) => {
            socket.to(data.chatroomId).emit('message-deleted', {
                messageId: data.messageId
            });
        });

        // Reaction added
        socket.on('reaction-added', (data: any) => {
            socket.to(data.chatroomId).emit('reaction-updated', data.message);
        });

        // Disconnect event
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.user?.username}`);

            if (socket.user) {
                // Update user status to offline
                User.findByIdAndUpdate(socket.user._id, {
                    status: 'offline',
                    lastSeen: new Date()
                }).exec();

                // Broadcast offline status
                io.emit('user-status', {
                    userId: socket.user._id,
                    status: 'offline'
                });
            }
        });
    });

    return io;
};
