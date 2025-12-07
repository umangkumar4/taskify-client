import express from 'express';
import {
    getChatrooms,
    createChatroom,
    getChatroomById,
    updateChatroom,
    addMembers,
    removeMember,
    togglePin
} from '../controllers/chatroom.controller';

const router = express.Router();

router.get('/', getChatrooms);
router.post('/', createChatroom);
router.get('/:id', getChatroomById);
router.put('/:id', updateChatroom);
router.post('/:id/members', addMembers);
router.delete('/:id/members/:userId', removeMember);
router.put('/:id/pin', togglePin);

export default router;
