"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const router = express_1.default.Router();
router.get('/search', user_controller_1.searchUsers);
router.get('/:id', user_controller_1.getUserById);
router.put('/profile', user_controller_1.updateProfile);
router.put('/status', user_controller_1.updateStatus);
exports.default = router;
