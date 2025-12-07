import express from 'express';
import {
    searchUsers,
    getUserById,
    updateProfile,
    updateStatus
} from '../controllers/user.controller';

const router = express.Router();

router.get('/search', searchUsers);
router.get('/:id', getUserById);
router.put('/profile', updateProfile);
router.put('/status', updateStatus);

export default router;
