import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import socketService from '../services/socket';
import { addMessage, updateMessage, removeMessage } from '../store/slices/messageSlice';
import { updateChatroomLastMessage, addChatroom, setTypingStatus } from '../store/slices/chatroomSlice';
import { RootState } from '../store/store';

export const useSocket = () => {
    const dispatch = useDispatch();
    const { token } = useSelector((state: RootState) => state.auth);

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
            });

            socketService.on('message-deleted', (data) => {
                dispatch(removeMessage(data));
            });

            return () => {
                socketService.disconnect();
            };
        }
    }, [token, dispatch]);

    return socketService;
};
