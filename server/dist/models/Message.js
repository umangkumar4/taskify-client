"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const messageSchema = new mongoose_1.Schema({
    chatroomId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Chatroom',
        required: true,
        index: true
    },
    senderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'system'],
        default: 'text'
    },
    quotedMessage: {
        messageId: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Message'
        },
        content: String,
        senderId: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    reactions: [
        {
            userId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User'
            },
            emoji: String,
            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    mentions: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    readBy: [
        {
            userId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User'
            },
            readAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: Date,
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date
}, { timestamps: true });
messageSchema.index({ chatroomId: 1, createdAt: -1 });
messageSchema.index({ content: 'text' });
exports.Message = mongoose_1.default.model('Message', messageSchema);
