import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { Message } from '../../types';

interface MessageState {
    messages: { [chatroomId: string]: Message[] };
    pagination: { [chatroomId: string]: { hasMore: boolean; page: number } };
    editingMessage: Message | null;
    replyingTo: Message | null;
    loading: boolean;
    error: string | null;
}

const initialState: MessageState = {
    messages: {},
    pagination: {},
    editingMessage: null,
    replyingTo: null,
    loading: false,
    error: null
};

export const fetchMessages = createAsyncThunk(
    'message/fetchMessages',
    async ({ chatroomId, page = 1 }: { chatroomId: string; page?: number }) => {
        const response = await api.get(`/messages/${chatroomId}?page=${page}`);
        return {
            chatroomId,
            messages: response.data.messages,
            pagination: response.data.pagination
        };
    }
);

// ... (other thunks: sendMessage, editMessage, deleteMessage remain valid, but check imports/exports)
export const sendMessage = createAsyncThunk(
    'message/send',
    async (data: { chatroomId: string; content: string; quotedMessageId?: string; mentions?: string[] }) => {
        const response = await api.post('/messages', data);
        return response.data.message;
    }
);

export const editMessage = createAsyncThunk(
    'message/edit',
    async ({ messageId, content }: { messageId: string; content: string }) => {
        const response = await api.put(`/messages/${messageId}`, { content });
        return response.data.message;
    }
);

export const deleteMessage = createAsyncThunk(
    'message/delete',
    async ({ messageId, chatroomId }: { messageId: string; chatroomId: string }) => {
        await api.delete(`/messages/${messageId}`);
        return { messageId, chatroomId };
    }
);

const messageSlice = createSlice({
    name: 'message',
    initialState,
    reducers: {
        addMessage: (state, action) => {
            const message = action.payload;
            if (!state.messages[message.chatroomId]) {
                state.messages[message.chatroomId] = [];
            }
            state.messages[message.chatroomId].push(message);
        },
        updateMessage: (state, action) => {
            const message = action.payload;
            const messages = state.messages[message.chatroomId];
            if (messages) {
                const index = messages.findIndex((m) => m._id === message._id);
                if (index !== -1) {
                    messages[index] = message;
                }
            }
            if (state.editingMessage?._id === message._id) {
                state.editingMessage = null;
            }
        },
        removeMessage: (state, action) => {
            const { chatroomId, messageId } = action.payload;
            const messages = state.messages[chatroomId];
            if (messages) {
                state.messages[chatroomId] = messages.filter((m) => m._id !== messageId);
            }
        },
        setEditingMessage: (state, action) => {
            state.editingMessage = action.payload;
            state.replyingTo = null;
        },
        setReplyingTo: (state, action) => {
            state.replyingTo = action.payload;
            state.editingMessage = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMessages.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchMessages.fulfilled, (state, action) => {
                state.loading = false;
                const { chatroomId, messages, pagination } = action.payload;

                if (pagination.page === 1) {
                    // Initial load: replace messages
                    state.messages[chatroomId] = messages;
                } else {
                    // Load more: prepend messages
                    if (!state.messages[chatroomId]) state.messages[chatroomId] = [];
                    // Avoid duplicates
                    const existingIds = new Set(state.messages[chatroomId].map(m => m._id));
                    const newMessages = messages.filter((m: Message) => !existingIds.has(m._id));
                    state.messages[chatroomId] = [...newMessages, ...state.messages[chatroomId]];
                }

                state.pagination[chatroomId] = {
                    hasMore: pagination.page < pagination.pages,
                    page: pagination.page
                };
            })
            .addCase(fetchMessages.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch messages';
            })
            .addCase(sendMessage.fulfilled, (state, action) => {
                const message = action.payload;
                if (!state.messages[message.chatroomId]) {
                    state.messages[message.chatroomId] = [];
                }
                state.messages[message.chatroomId].push(message);
            })
            .addCase(editMessage.fulfilled, (state, action) => {
                const message = action.payload;
                const messages = state.messages[message.chatroomId];
                if (messages) {
                    const index = messages.findIndex((m) => m._id === message._id);
                    if (index !== -1) {
                        messages[index] = message;
                    }
                }
                state.editingMessage = null;
            })
            .addCase(deleteMessage.fulfilled, (state, action) => {
                const { chatroomId, messageId } = action.payload;
                const messages = state.messages[chatroomId];
                if (messages) {
                    const index = messages.findIndex((m) => m._id === messageId);
                    if (index !== -1) {
                        messages[index] = {
                            ...messages[index],
                            isDeleted: true,
                            content: 'This message was deleted',
                            deletedAt: new Date().toISOString()
                        };
                    }
                }
            });
    }
});

export const { addMessage, updateMessage, removeMessage, setEditingMessage, setReplyingTo } = messageSlice.actions;
export default messageSlice.reducer;



