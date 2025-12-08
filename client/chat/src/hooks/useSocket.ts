import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import socketService from '../services/socket';
import { addMessage, updateMessage, removeMessage } from '../store/slices/messageSlice';
import { updateChatroomLastMessage, addChatroom, setTypingStatus, handleMessageDeleted } from '../store/slices/chatroomSlice';
import { RootState } from '../store/store';

export const useSocket = () => {
    const dispatch = useDispatch();
    const { token } = useSelector((state: RootState) => state.auth);
    const { messages } = useSelector((state: RootState) => state.message);

    // Use ref to access latest messages without causing re-renders
    const messagesRef = useRef(messages);
    messagesRef.current = messages;

    useEffect(() => {
        if (token) {
            socketService.connect(token);

            socketService.on('new-message', (message) => {
                dispatch(addMessage(message));
                dispatch(updateChatroomLastMessage({ chatroomId: message.chatroomId, message }));
            });

            socketService.on('new-chatroom', (chatroom) => {
                dispatch(addChatroom(chatroom));
            });

            socketService.on('typing', (data) => {
                dispatch(setTypingStatus(data));
            });

            socketService.on('message-updated', (message) => {
                dispatch(updateMessage(message));
                dispatch(updateChatroomLastMessage({ chatroomId: message.chatroomId, message }));
            });

            socketService.on('message-deleted', (data) => {
                const { chatroomId, messageId } = data;
                dispatch(removeMessage(data));
                console.log('message-deleted', data)

                // Find the new last message after deletion using ref
                const chatroomMessages = messagesRef.current[chatroomId] || [];
                const filteredMessages = chatroomMessages.filter(m => m._id !== messageId);
                const newLastMessage = filteredMessages.length > 0
                    ? filteredMessages[filteredMessages.length - 1]
                    : null;

                dispatch(handleMessageDeleted({
                    chatroomId,
                    messageId,
                    newLastMessage
                }));
            });

            return () => {
                console.log('🔌 Cleaning up socket connection');
                socketService.disconnect();
            };
        }
    }, [token, dispatch]); // REMOVED messages dependency - this was causing reconnects!

    return socketService;
};
