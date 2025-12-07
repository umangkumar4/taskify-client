"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chatroom_controller_1 = require("../controllers/chatroom.controller");
const router = express_1.default.Router();
router.get('/', chatroom_controller_1.getChatrooms);
router.post('/', chatroom_controller_1.createChatroom);
router.get('/:id', chatroom_controller_1.getChatroomById);
router.put('/:id', chatroom_controller_1.updateChatroom);
router.post('/:id/members', chatroom_controller_1.addMembers);
router.delete('/:id/members/:userId', chatroom_controller_1.removeMember);
router.put('/:id/pin', chatroom_controller_1.togglePin);
exports.default = router;
