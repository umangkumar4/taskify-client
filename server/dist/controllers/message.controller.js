"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchMessages = exports.markAsRead = exports.removeReaction = exports.addReaction = exports.deleteMessage = exports.editMessage = exports.sendMessage = exports.getMessages = void 0;
const Message_1 = require("../models/Message");
const Chatroom_1 = require("../models/Chatroom");
const getMessages = async (req, res) => {
    try {
        const { chatroomId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        // Verify user is member
        const chatroom = await Chatroom_1.Chatroom.findOne({
            _id: chatroomId,
            'members.userId': req.user._id
        });
        if (!chatroom) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const messages = await Message_1.Message.find({
            chatroomId,
            // isDeleted: false
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate('senderId', 'username firstName lastName avatar')
            .populate('quotedMessage.senderId', 'username firstName lastName avatar');
        const total = await Message_1.Message.countDocuments({
            chatroomId,
            //isDeleted: false
        });
        res.json({
            messages: messages.reverse(),
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getMessages = getMessages;
const sendMessage = async (req, res) => {
    try {
        const { chatroomId, content, quotedMessageId, mentions } = req.body;
        if (!chatroomId || !content) {
            return res.status(400).json({
                error: 'Chatroom ID and content are required'
            });
        }
        // Verify user is member
        const chatroom = await Chatroom_1.Chatroom.findOne({
            _id: chatroomId,
            'members.userId': req.user._id
        });
        if (!chatroom) {
            return res.status(403).json({ error: 'Not a member of this chatroom' });
        }
        // Get quoted message if exists
        let quotedMessage = undefined;
        if (quotedMessageId) {
            const quoted = await Message_1.Message.findById(quotedMessageId);
            if (quoted) {
                quotedMessage = {
                    messageId: quoted._id,
                    content: quoted.content,
                    senderId: quoted.senderId
                };
            }
        }
        // Create message
        const message = await Message_1.Message.create({
            chatroomId,
            senderId: req.user._id,
            content,
            quotedMessage,
            mentions: mentions || [],
            readBy: [{ userId: req.user._id, readAt: new Date() }]
        });
        await message.populate('senderId', 'username firstName lastName avatar');
        if (quotedMessage) {
            await message.populate('quotedMessage.senderId', 'username firstName lastName avatar');
        }
        // Update chatroom last message
        chatroom.lastMessage = {
            messageId: message._id,
            content: message.content,
            senderId: req.user._id,
            timestamp: message.createdAt
        };
        await chatroom.save();
        res.status(201).json({ message });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.sendMessage = sendMessage;
const editMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }
        const message = await Message_1.Message.findOne({
            _id: id,
            senderId: req.user._id,
            isDeleted: false
        });
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }
        message.content = content;
        message.isEdited = true;
        message.editedAt = new Date();
        await message.save();
        await message.populate('senderId', 'username firstName lastName avatar');
        res.json({ message });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.editMessage = editMessage;
const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const message = await Message_1.Message.findOne({
            _id: id,
            senderId: req.user._id
        });
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }
        message.isDeleted = true;
        message.deletedAt = new Date();
        await message.save();
        res.json({ message: 'Message deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deleteMessage = deleteMessage;
const addReaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { emoji } = req.body;
        if (!emoji) {
            return res.status(400).json({ error: 'Emoji is required' });
        }
        const message = await Message_1.Message.findById(id);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }
        // Remove existing reaction from this user
        message.reactions = message.reactions.filter((r) => r.userId.toString() !== req.user._id.toString());
        // Add new reaction
        message.reactions.push({
            userId: req.user._id,
            emoji,
            createdAt: new Date()
        });
        await message.save();
        res.json({ message });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.addReaction = addReaction;
const removeReaction = async (req, res) => {
    try {
        const { id } = req.params;
        const message = await Message_1.Message.findById(id);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }
        message.reactions = message.reactions.filter((r) => r.userId.toString() !== req.user._id.toString());
        await message.save();
        res.json({ message });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.removeReaction = removeReaction;
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const message = await Message_1.Message.findById(id);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }
        const alreadyRead = message.readBy.some((r) => r.userId.toString() === req.user._id.toString());
        if (!alreadyRead) {
            message.readBy.push({
                userId: req.user._id,
                readAt: new Date()
            });
            await message.save();
        }
        res.json({ message: 'Message marked as read' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.markAsRead = markAsRead;
const searchMessages = async (req, res) => {
    try {
        const { chatroomId } = req.params;
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        // Verify user is member
        const chatroom = await Chatroom_1.Chatroom.findOne({
            _id: chatroomId,
            'members.userId': req.user._id
        });
        if (!chatroom) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const messages = await Message_1.Message.find({
            chatroomId,
            isDeleted: false,
            $text: { $search: query }
        })
            .populate('senderId', 'username firstName lastName avatar')
            .limit(50);
        res.json({ messages });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.searchMessages = searchMessages;
