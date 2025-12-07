import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
    chatroomId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    content: string;
    type: 'text' | 'system';
    quotedMessage?: {
        messageId: mongoose.Types.ObjectId;
        content: string;
        senderId: mongoose.Types.ObjectId;
    };
    reactions: Array<{
        userId: mongoose.Types.ObjectId;
        emoji: string;
        createdAt: Date;
    }>;
    mentions: mongoose.Types.ObjectId[];
    readBy: Array<{
        userId: mongoose.Types.ObjectId;
        readAt: Date;
    }>;
    isEdited: boolean;
    editedAt?: Date;
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
    {
        chatroomId: {
            type: Schema.Types.ObjectId,
            ref: 'Chatroom',
            required: true,
            index: true
        },
        senderId: {
            type: Schema.Types.ObjectId,
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
                type: Schema.Types.ObjectId,
                ref: 'Message'
            },
            content: String,
            senderId: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            }
        },
        reactions: [
            {
                userId: {
                    type: Schema.Types.ObjectId,
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
                type: Schema.Types.ObjectId,
                ref: 'User'
            }
        ],
        readBy: [
            {
                userId: {
                    type: Schema.Types.ObjectId,
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
    },
    { timestamps: true }
);

messageSchema.index({ chatroomId: 1, createdAt: -1 });
messageSchema.index({ content: 'text' });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
