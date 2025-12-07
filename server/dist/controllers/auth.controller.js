"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.logout = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const register = async (req, res) => {
    try {
        const { email, password, username, firstName, lastName } = req.body;
        // Validate required fields
        if (!email || !password || !username) {
            return res.status(400).json({
                error: 'Email, password, and username are required'
            });
        }
        // Check if user exists
        const existingUser = await User_1.User.findOne({
            $or: [{ email }, { username }]
        });
        if (existingUser) {
            return res.status(400).json({
                error: 'User already exists with this email or username'
            });
        }
        // Create user
        const user = await User_1.User.create({
            email,
            password,
            username,
            firstName,
            lastName,
            avatar: `https://ui-avatars.com/api/?name=${firstName || username}&background=random`
        });
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: (process.env.JWT_EXPIRE || '7d') });
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                avatar: user.avatar,
                status: user.status
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }
        // Find user
        const user = await User_1.User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // Update status
        user.status = 'online';
        user.lastSeen = new Date();
        await user.save();
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: (process.env.JWT_EXPIRE || '7d') });
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                avatar: user.avatar,
                status: user.status,
                bio: user.bio
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.login = login;
const logout = async (req, res) => {
    try {
        if (req.user) {
            await User_1.User.findByIdAndUpdate(req.user._id, {
                status: 'offline',
                lastSeen: new Date()
            });
        }
        res.json({ message: 'Logout successful' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.logout = logout;
const getMe = async (req, res) => {
    try {
        res.json({
            user: {
                id: req.user._id,
                email: req.user.email,
                username: req.user.username,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                avatar: req.user.avatar,
                status: req.user.status,
                bio: req.user.bio
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getMe = getMe;
