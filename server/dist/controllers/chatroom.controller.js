"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.togglePin = exports.removeMember = exports.addMembers = exports.updateChatroom = exports.getChatroomById = exports.createChatroom = exports.getChatrooms = void 0;
const Chatroom_1 = require("../models/Chatroom");
const User_1 = require("../models/User");
const Message_1 = require("../models/Message");
const mongoose_1 = __importDefault(require("mongoose"));
const getChatrooms = async (req, res) => {
    try {
        const chatrooms = await Chatroom_1.Chatroom.find({
            'members.userId': req.user._id
        })
            .populate('members.userId', 'username firstName lastName avatar status')
            .populate('lastMessage.senderId', 'username avatar')
            .sort({ 'lastMessage.timestamp': -1 });
        res.json({ chatrooms });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getChatrooms = getChatrooms;
const createChatroom = async (req, res) => {
    try {
        const { name, type, memberIds, description } = req.body;
        if (!name || !type) {
            return res.status(400).json({ error: 'Name and type are required' });
        }
        if (type === 'personal') {
            // Check if personal chat already exists
            if (!memberIds || memberIds.length !== 1) {
                return res.status(400).json({
                    error: 'Personal chat requires exactly one other member'
                });
            }
            const existingChat = await Chatroom_1.Chatroom.findOne({
                type: 'personal',
                'members.userId': {
                    $all: [req.user._id, new mongoose_1.default.Types.ObjectId(memberIds[0])]
                }
            });
            if (existingChat) {
                return res.json({ chatroom: existingChat });
            }
        }
        const members = [
            {
                userId: req.user._id,
                role: 'admin',
                joinedAt: new Date(),
                isPinned: false
            }
        ];
        if (memberIds && memberIds.length > 0) {
            memberIds.forEach((memberId) => {
                members.push({
                    userId: new mongoose_1.default.Types.ObjectId(memberId),
                    role: 'member',
                    joinedAt: new Date(),
                    isPinned: false
                });
            });
        }
        const chatroom = await Chatroom_1.Chatroom.create({
            name,
            type,
            description,
            members: members,
            createdBy: req.user._id
        });
        await chatroom.populate('members.userId', 'username firstName lastName avatar status');
        // Create system message
        await Message_1.Message.create({
            chatroomId: chatroom._id,
            senderId: req.user._id,
            content: `${req.user.username} created this ${type} chat`,
            type: 'system',
            readBy: [{ userId: req.user._id, readAt: new Date() }]
        });
        // Emit socket event to all members
        const io = req.app.get('io');
        chatroom.members.forEach((member) => {
            // We need to find connected sockets for this user.
            // Simplified approach: Emit to a room named after userId if we had one, 
            // OR iterate all sockets. 
            // Better approach: Join users to a personal room "user:<id>" on connection.
            // Assuming we implement "join user room" in socket.ts, we can do:
            io.to(`user:${member.userId._id.toString()}`).emit('new-chatroom', chatroom);
        });
        res.status(201).json({
            message: 'Chatroom created successfully',
            chatroom
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.createChatroom = createChatroom;
const getChatroomById = async (req, res) => {
    try {
        const { id } = req.params;
        const chatroom = await Chatroom_1.Chatroom.findOne({
            _id: id,
            'members.userId': req.user._id
        }).populate('members.userId', 'username firstName lastName avatar status');
        if (!chatroom) {
            return res.status(404).json({ error: 'Chatroom not found' });
        }
        res.json({ chatroom });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getChatroomById = getChatroomById;
const updateChatroom = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, avatar } = req.body;
        const chatroom = await Chatroom_1.Chatroom.findOne({
            _id: id,
            'members.userId': req.user._id,
            'members.role': 'admin'
        });
        if (!chatroom) {
            return res.status(404).json({
                error: 'Chatroom not found or you are not an admin'
            });
        }
        chatroom.name = name || chatroom.name;
        chatroom.description = description || chatroom.description;
        chatroom.avatar = avatar || chatroom.avatar;
        await chatroom.save();
        await chatroom.populate('members.userId', 'username firstName lastName avatar status');
        res.json({
            message: 'Chatroom updated successfully',
            chatroom
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateChatroom = updateChatroom;
const addMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const { memberIds } = req.body;
        if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
            return res.status(400).json({ error: 'Member IDs are required' });
        }
        const chatroom = await Chatroom_1.Chatroom.findOne({
            _id: id,
            'members.userId': req.user._id,
            type: 'group'
        });
        if (!chatroom) {
            return res.status(404).json({ error: 'Group chatroom not found' });
        }
        const newMembers = memberIds.map((memberId) => ({
            userId: new mongoose_1.default.Types.ObjectId(memberId),
            role: 'member',
            joinedAt: new Date(),
            isPinned: false
        }));
        chatroom.members.push(...newMembers);
        await chatroom.save();
        // Create system message
        const users = await User_1.User.find({ _id: { $in: memberIds } });
        const usernames = users.map((u) => u.username).join(', ');
        await Message_1.Message.create({
            chatroomId: chatroom._id,
            senderId: req.user._id,
            content: `${req.user.username} added ${usernames}`,
            type: 'system',
            readBy: [{ userId: req.user._id, readAt: new Date() }]
        });
        await chatroom.populate('members.userId', 'username firstName lastName avatar status');
        res.json({
            message: 'Members added successfully',
            chatroom
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.addMembers = addMembers;
const removeMember = async (req, res) => {
    try {
        const { id, userId } = req.params;
        const chatroom = await Chatroom_1.Chatroom.findOne({
            _id: id,
            'members.userId': req.user._id,
            'members.role': 'admin',
            type: 'group'
        });
        if (!chatroom) {
            return res.status(404).json({
                error: 'Group not found or you are not an admin'
            });
        }
        chatroom.members = chatroom.members.filter((member) => member.userId.toString() !== userId);
        await chatroom.save();
        // Create system message
        const user = await User_1.User.findById(userId);
        await Message_1.Message.create({
            chatroomId: chatroom._id,
            senderId: req.user._id,
            content: `${req.user.username} removed ${user?.username}`,
            type: 'system',
            readBy: [{ userId: req.user._id, readAt: new Date() }]
        });
        res.json({ message: 'Member removed successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.removeMember = removeMember;
const togglePin = async (req, res) => {
    try {
        const { id } = req.params;
        const chatroom = await Chatroom_1.Chatroom.findOne({
            _id: id,
            'members.userId': req.user._id
        });
        if (!chatroom) {
            return res.status(404).json({ error: 'Chatroom not found' });
        }
        const member = chatroom.members.find((m) => m.userId.toString() === req.user._id.toString());
        if (member) {
            member.isPinned = !member.isPinned;
            await chatroom.save();
        }
        res.json({
            message: member?.isPinned ? 'Chat pinned' : 'Chat unpinned',
            isPinned: member?.isPinned
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.togglePin = togglePin;
