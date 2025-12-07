import { Response } from 'express';
import { Message } from '../models/Message';
import { Chatroom } from '../models/Chatroom';
import { AuthRequest } from '../types';
import mongoose from 'mongoose';

export const getMessages = async (req: AuthRequest, res: Response) => {
    try {
        const { chatroomId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        const skip = (Number(page) - 1) * Number(limit);

        // Verify user is member
        const chatroom = await Chatroom.findOne({
            _id: chatroomId,
            'members.userId': req.user!._id
        });

        if (!chatroom) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const messages = await Message.find({
            chatroomId,
            // isDeleted: false
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate('senderId', 'username firstName lastName avatar')
            .populate('quotedMessage.senderId', 'username firstName lastName avatar');

        const total = await Message.countDocuments({
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
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
    try {
        const { chatroomId, content, quotedMessageId, mentions } = req.body;

        if (!chatroomId || !content) {
            return res.status(400).json({
                error: 'Chatroom ID and content are required'
            });
        }

        // Verify user is member
        const chatroom = await Chatroom.findOne({
            _id: chatroomId,
            'members.userId': req.user!._id
        });

        if (!chatroom) {
            return res.status(403).json({ error: 'Not a member of this chatroom' });
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
            chatroomId,
            senderId: req.user!._id,
            content,
            quotedMessage,
            mentions: mentions || [],
            readBy: [{ userId: req.user!._id, readAt: new Date() }]
        });

        await message.populate('senderId', 'username firstName lastName avatar');
        if (quotedMessage) {
            await message.populate('quotedMessage.senderId', 'username firstName lastName avatar');
        }

        // Update chatroom last message
        chatroom.lastMessage = {
            messageId: message._id,
            content: message.content,
            senderId: req.user!._id,
            timestamp: message.createdAt
        };
        await chatroom.save();

        res.status(201).json({ message });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const editMessage = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const message = await Message.findOne({
            _id: id,
            senderId: req.user!._id,
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
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteMessage = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const message = await Message.findOne({
            _id: id,
            senderId: req.user!._id
        });

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        message.isDeleted = true;
        message.deletedAt = new Date();
        await message.save();

        res.json({ message: 'Message deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const addReaction = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { emoji } = req.body;

        if (!emoji) {
            return res.status(400).json({ error: 'Emoji is required' });
        }

        const message = await Message.findById(id);

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Remove existing reaction from this user
        message.reactions = message.reactions.filter(
            (r) => r.userId.toString() !== req.user!._id.toString()
        );

        // Add new reaction
        message.reactions.push({
            userId: req.user!._id,
            emoji,
            createdAt: new Date()
        });

        await message.save();

        res.json({ message });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const removeReaction = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const message = await Message.findById(id);

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        message.reactions = message.reactions.filter(
            (r) => r.userId.toString() !== req.user!._id.toString()
        );

        await message.save();

        res.json({ message });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const message = await Message.findById(id);

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        const alreadyRead = message.readBy.some(
            (r) => r.userId.toString() === req.user!._id.toString()
        );

        if (!alreadyRead) {
            message.readBy.push({
                userId: req.user!._id,
                readAt: new Date()
            });
            await message.save();
        }

        res.json({ message: 'Message marked as read' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const searchMessages = async (req: AuthRequest, res: Response) => {
    try {
        const { chatroomId } = req.params;
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        // Verify user is member
        const chatroom = await Chatroom.findOne({
            _id: chatroomId,
            'members.userId': req.user!._id
        });

        if (!chatroom) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const messages = await Message.find({
            chatroomId,
            isDeleted: false,
            $text: { $search: query as string }
        })
            .populate('senderId', 'username firstName lastName avatar')
            .limit(50);

        res.json({ messages });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
