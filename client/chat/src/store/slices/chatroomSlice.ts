import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { Chatroom } from '../../types';

interface ChatroomState {
    chatrooms: Chatroom[];
    selectedChatroom: Chatroom | null;
    typingUsers: { [chatroomId: string]: { [userId: string]: string } };
    loading: boolean;
    error: string | null;
}

const initialState: ChatroomState = {
    chatrooms: [],
    selectedChatroom: null,
    typingUsers: {},
    loading: false,
    error: null
};

export const fetchChatrooms = createAsyncThunk('chatroom/fetchAll', async () => {
    const response = await api.get('/chatrooms');
    return response.data.chatrooms;
});

export const createChatroom = createAsyncThunk(
    'chatroom/create',
    async (data: { name: string; type: 'personal' | 'group'; memberIds?: string[] }) => {
        const response = await api.post('/chatrooms', data);
        return response.data.chatroom;
    }
);

export const addMembers = createAsyncThunk(
    'chatroom/addMembers',
    async ({ chatroomId, memberIds }: { chatroomId: string; memberIds: string[] }) => {
        const response = await api.post(`/chatrooms/${chatroomId}/members`, { memberIds });
        return response.data.chatroom;
    }
);

const chatroomSlice = createSlice({
    name: 'chatroom',
    initialState,
    reducers: {
        setTypingStatus: (state, action) => {
            const { chatroomId, userId, username, isTyping } = action.payload;
            if (!state.typingUsers[chatroomId]) {
                state.typingUsers[chatroomId] = {};
            }

            if (isTyping) {
                state.typingUsers[chatroomId][userId] = username;
            } else {
                delete state.typingUsers[chatroomId][userId];
            }
        },
        setSelectedChatroom: (state, action) => {
            state.selectedChatroom = action.payload;
            // Reset unread count for the selected chatroom in the list
            if (action.payload) {
                const chatroom = state.chatrooms.find(c => c._id === action.payload._id);
                if (chatroom) {
                    chatroom.unreadCount = 0;
                }
            }
        },
        updateChatroomLastMessage: (state, action) => {
            const { chatroomId, message } = action.payload;
            const chatroom = state.chatrooms.find((c) => c._id === chatroomId);
            if (chatroom) {
                chatroom.lastMessage = {
                    messageId: message._id,
                    content: message.content,
                    senderId: message.senderId._id || message.senderId,
                    timestamp: message.createdAt
                };

                // Increment unread count if not currently selected
                if (state.selectedChatroom?._id !== chatroomId) {
                    chatroom.unreadCount = (chatroom.unreadCount || 0) + 1;
                }

                // Move to top
                state.chatrooms = [
                    chatroom,
                    ...state.chatrooms.filter(c => c._id !== chatroomId)
                ];
            }
        },
        addChatroom: (state, action) => {
            const chatroom = action.payload;
            if (!state.chatrooms.some(c => c._id === chatroom._id)) {
                state.chatrooms.unshift(chatroom);
            }
        },
        handleMessageDeleted: (state, action) => {
            const { chatroomId, messageId, newLastMessage } = action.payload;
            const chatroom = state.chatrooms.find((c) => c._id === chatroomId);
            if (chatroom && chatroom.lastMessage?.messageId === messageId) {
                // Update with new last message or clear it
                if (newLastMessage) {
                    chatroom.lastMessage = {
                        messageId: newLastMessage._id,
                        content: newLastMessage.content,
                        senderId: newLastMessage.senderId._id || newLastMessage.senderId,
                        timestamp: newLastMessage.createdAt
                    };
                } else {
                    chatroom.lastMessage = undefined;
                }
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchChatrooms.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchChatrooms.fulfilled, (state, action) => {
                state.loading = false;
                state.chatrooms = action.payload;
            })
            .addCase(fetchChatrooms.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch chatrooms';
            })
            .addCase(createChatroom.fulfilled, () => {
                // Don't add here - socket event will handle it to prevent duplicates
            })
            .addCase(addMembers.fulfilled, (state, action) => {
                if (state.selectedChatroom?._id === action.payload._id) {
                    state.selectedChatroom = action.payload;
                }
                const index = state.chatrooms.findIndex(c => c._id === action.payload._id);
                if (index !== -1) {
                    state.chatrooms[index] = action.payload;
                }
            })
            .addCase(createChatroom.rejected, () => {
                // Error handling if needed
            });
    }
});

export const { setSelectedChatroom, updateChatroomLastMessage, addChatroom, setTypingStatus, handleMessageDeleted } = chatroomSlice.actions;
export default chatroomSlice.reducer;
