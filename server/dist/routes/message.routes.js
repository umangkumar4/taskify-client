"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const message_controller_1 = require("../controllers/message.controller");
const router = express_1.default.Router();
router.get('/:chatroomId', message_controller_1.getMessages);
router.post('/', message_controller_1.sendMessage);
router.put('/:id', message_controller_1.editMessage);
router.delete('/:id', message_controller_1.deleteMessage);
router.post('/:id/reaction', message_controller_1.addReaction);
router.delete('/:id/reaction', message_controller_1.removeReaction);
router.put('/:id/read', message_controller_1.markAsRead);
router.get('/:chatroomId/search', message_controller_1.searchMessages);
exports.default = router;
