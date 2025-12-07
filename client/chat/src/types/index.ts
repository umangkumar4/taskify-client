export interface User {
    id: string;
    _id?: string; // Mongoose ID
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
    status: 'online' | 'offline' | 'away';
    lastSeen: Date | string;
}

export interface Chatroom {
    _id: string;
    name: string;
    type: 'personal' | 'group';
    avatar?: string;
    description?: string;
    members: Array<{
        userId: User;
        role: 'admin' | 'member';
        joinedAt: Date | string;
        lastReadMessageId?: string;
        isPinned: boolean;
    }>;
    unreadCount?: number;
    createdBy: string;
    lastMessage?: {
        messageId: string;
        content: string;
        senderId: string;
        timestamp: Date | string;
    };
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface Message {
    _id: string;
    chatroomId: string;
    senderId: User;
    content: string;
    type: 'text' | 'system';
    quotedMessage?: {
        messageId: string;
        content: string;
        senderId: User;
    };
    reactions: Array<{
        userId: string;
        emoji: string;
        createdAt: Date | string;
    }>;
    mentions: string[];
    readBy: Array<{
        userId: string;
        readAt: Date | string;
    }>;
    isEdited: boolean;
    editedAt?: Date | string;
    isDeleted: boolean;
    deletedAt?: Date | string;
    createdAt: Date | string;
    updatedAt: Date | string;
}
