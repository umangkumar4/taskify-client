import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Message } from '../models/Message';
import { Chatroom } from '../models/Chatroom';

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

        // Send message via socket (new socket-based flow)
        socket.on('send-message', async (data: any) => {
            try {
                const { chatroomId, content, quotedMessageId, mentions } = data;

                if (!chatroomId || !content) {
                    socket.emit('message-error', { error: 'Chatroom ID and content are required' });
                    return;
                }

                // Verify user is member
                const chatroom = await Chatroom.findOne({
                    _id: chatroomId,
                    'members.userId': socket.user?._id
                });

                if (!chatroom) {
                    socket.emit('message-error', { error: 'Not a member of this chatroom' });
                    return;
                }

                // Get quoted message if exists
                let quotedMessage = undefined;
                if (quotedMessageId) {
                    const quoted = await Message.findById(quotedMessageId);
                    if (quoted) {
                        quotedMessage = {
                            messageId: quoted._id,
                            content: quoted.content,
                            senderId: quoted.senderId
                        };
                    }
                }

                // Create message
                const message = await Message.create({
                    chatroomId: new mongoose.Types.ObjectId(chatroomId),
                    senderId: new mongoose.Types.ObjectId(socket.user!._id),
                    content,
                    quotedMessage,
                    mentions: mentions || [],
                    readBy: [{ userId: new mongoose.Types.ObjectId(socket.user!._id), readAt: new Date() }]
                });

                const populatedMessage = await message.populate('senderId', 'username firstName lastName avatar');
                if (quotedMessage) {
                    await populatedMessage.populate('quotedMessage.senderId', 'username firstName lastName avatar');
                }

                // Update chatroom last message
                chatroom.lastMessage = {
                    messageId: populatedMessage._id as any,
                    content: populatedMessage.content,
                    senderId: new mongoose.Types.ObjectId(socket.user!._id),
                    timestamp: populatedMessage.createdAt
                };
                await chatroom.save();

                // Convert to plain object and ensure IDs are strings for frontend
                const messageObject: any = populatedMessage.toObject();
                messageObject.chatroomId = messageObject.chatroomId.toString();
                messageObject._id = messageObject._id.toString();

                console.log('Emitting new-message to chatroom:', chatroomId, messageObject);

                // Broadcast to ALL users in chatroom (including sender)
                io.to(chatroomId).emit('new-message', messageObject);
            } catch (error: any) {
                console.error('Error sending message:', error);
                socket.emit('message-error', { error: error.message });
            }
        });

        // Message edited
        socket.on('message-edited', (data: any) => {
            socket.to(data.chatroomId).emit('message-updated', data.message);
        });

        // Message deleted
        socket.on('message-deleted', (data: any) => {
            socket.to(data.chatroomId).emit('message-deleted', {
                messageId: data.messageId,
                chatroomId: data.chatroomId
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
