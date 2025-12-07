"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocket = exports.io = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const initializeSocket = (httpServer) => {
    exports.io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            credentials: true
        },
        transports: ['websocket', 'polling']
    });
    // Authentication middleware
    exports.io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication required'));
            }
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const user = await User_1.User.findById(decoded.userId).select('-password');
            if (!user) {
                return next(new Error('User not found'));
            }
            socket.user = {
                _id: user._id.toString(),
                username: user.username,
                email: user.email
            };
            next();
        }
        catch (error) {
            next(new Error('Invalid token'));
        }
    });
    // Connection event
    exports.io.on('connection', (socket) => {
        console.log(`User connected: ${socket.user?.username}`);
        // Update user status to online
        if (socket.user) {
            User_1.User.findByIdAndUpdate(socket.user._id, {
                status: 'online',
                lastSeen: new Date()
            }).exec();
            // Broadcast online status
            exports.io.emit('user-status', {
                userId: socket.user._id,
                status: 'online'
            });
        }
        // Join chatroom
        socket.on('join-chatroom', (chatroomId) => {
            socket.join(chatroomId);
            console.log(`User ${socket.user?.username} joined chatroom ${chatroomId}`);
        });
        // Join personal user room for notifications
        if (socket.user) {
            socket.join(`user:${socket.user._id}`);
        }
        // Leave chatroom
        socket.on('leave-chatroom', (chatroomId) => {
            socket.leave(chatroomId);
            console.log(`User ${socket.user?.username} left chatroom ${chatroomId}`);
        });
        // Typing indicator
        socket.on('typing', ({ chatroomId, isTyping }) => {
            socket.to(chatroomId).emit('typing', {
                chatroomId,
                userId: socket.user?._id,
                username: socket.user?.username,
                isTyping
            });
        });
        // Message sent (broadcast to chatroom)
        socket.on('message-sent', (data) => {
            socket.to(data.chatroomId).emit('new-message', data.message);
        });
        // Message edited
        socket.on('message-edited', (data) => {
            socket.to(data.chatroomId).emit('message-updated', data.message);
        });
        // Message deleted
        socket.on('message-deleted', (data) => {
            socket.to(data.chatroomId).emit('message-deleted', {
                messageId: data.messageId
            });
        });
        // Reaction added
        socket.on('reaction-added', (data) => {
            socket.to(data.chatroomId).emit('reaction-updated', data.message);
        });
        // Disconnect event
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.user?.username}`);
            if (socket.user) {
                // Update user status to offline
                User_1.User.findByIdAndUpdate(socket.user._id, {
                    status: 'offline',
                    lastSeen: new Date()
                }).exec();
                // Broadcast offline status
                exports.io.emit('user-status', {
                    userId: socket.user._id,
                    status: 'offline'
                });
            }
        });
    });
    return exports.io;
};
exports.initializeSocket = initializeSocket;
