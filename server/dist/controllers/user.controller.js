"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStatus = exports.updateProfile = exports.getUserById = exports.searchUsers = void 0;
const User_1 = require("../models/User");
const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        const users = await User_1.User.find({
            $and: [
                {
                    $or: [
                        { username: { $regex: query, $options: 'i' } },
                        { firstName: { $regex: query, $options: 'i' } },
                        { lastName: { $regex: query, $options: 'i' } },
                        { email: { $regex: query, $options: 'i' } }
                    ]
                },
                { _id: { $ne: req.user._id } }
            ]
        })
            .select('-password')
            .limit(20);
        res.json({ users });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.searchUsers = searchUsers;
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User_1.User.findById(id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getUserById = getUserById;
const updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, bio, avatar } = req.body;
        const user = await User_1.User.findByIdAndUpdate(req.user._id, { firstName, lastName, bio, avatar }, { new: true }).select('-password');
        res.json({
            message: 'Profile updated successfully',
            user
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateProfile = updateProfile;
const updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['online', 'offline', 'away'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const user = await User_1.User.findByIdAndUpdate(req.user._id, { status, lastSeen: new Date() }, { new: true }).select('-password');
        res.json({ user });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateStatus = updateStatus;
