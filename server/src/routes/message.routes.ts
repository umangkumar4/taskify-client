import express from 'express';
import {
    getMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    markAsRead,
    searchMessages
} from '../controllers/message.controller';

const router = express.Router();

router.get('/:chatroomId', getMessages);
router.post('/', sendMessage);
router.put('/:id', editMessage);
router.delete('/:id', deleteMessage);
router.post('/:id/reaction', addReaction);
router.delete('/:id/reaction', removeReaction);
router.put('/:id/read', markAsRead);
router.get('/:chatroomId/search', searchMessages);

export default router;
