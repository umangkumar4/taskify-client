import { Response } from 'express';
import { User } from '../models/User';
import { AuthRequest } from '../types';

export const searchUsers = async (req: AuthRequest, res: Response) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const users = await User.find({
            $and: [
                {
                    $or: [
                        { username: { $regex: query, $options: 'i' } },
                        { firstName: { $regex: query, $options: 'i' } },
                        { lastName: { $regex: query, $options: 'i' } },
                        { email: { $regex: query, $options: 'i' } }
                    ]
                },
                { _id: { $ne: req.user!._id } }
            ]
        } as any)
            .select('-password')
            .limit(20);

        res.json({ users });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getUserById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const { firstName, lastName, bio, avatar } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user!._id,
            { firstName, lastName, bio, avatar },
            { new: true }
        ).select('-password');

        res.json({
            message: 'Profile updated successfully',
            user
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.body;

        if (!['online', 'offline', 'away'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const user = await User.findByIdAndUpdate(
            req.user!._id,
            { status, lastSeen: new Date() },
            { new: true }
        ).select('-password');

        res.json({ user });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
