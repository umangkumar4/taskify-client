import mongoose, { Schema, Document } from 'mongoose';

export interface IChatroom extends Document {
    name: string;
    type: 'personal' | 'group';
    avatar?: string;
    description?: string;
    members: Array<{
        userId: mongoose.Types.ObjectId;
        role: 'admin' | 'member';
        joinedAt: Date;
        lastReadMessageId?: mongoose.Types.ObjectId;
        isPinned: boolean;
    }>;
    createdBy: mongoose.Types.ObjectId;
    lastMessage?: {
        messageId: mongoose.Types.ObjectId;
        content: string;
        senderId: mongoose.Types.ObjectId;
        timestamp: Date;
    };
}

const chatroomSchema = new Schema<IChatroom>(
    {
        name: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['personal', 'group'],
            required: true
        },
        avatar: String,
        description: String,
        members: [
            {
                userId: {
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                    required: true
                },
                role: {
                    type: String,
                    enum: ['admin', 'member'],
                    default: 'member'
                },
                joinedAt: {
                    type: Date,
                    default: Date.now
                },
                lastReadMessageId: {
                    type: Schema.Types.ObjectId,
                    ref: 'Message'
                },
                isPinned: {
                    type: Boolean,
                    default: false
                }
            }
        ],
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        lastMessage: {
            messageId: {
                type: Schema.Types.ObjectId,
                ref: 'Message'
            },
            content: String,
            senderId: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            },
            timestamp: Date
        }
    },
    { timestamps: true }
);

chatroomSchema.index({ 'members.userId': 1 });

export const Chatroom = mongoose.model<IChatroom>('Chatroom', chatroomSchema);
