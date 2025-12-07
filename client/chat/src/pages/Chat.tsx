import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { fetchChatrooms, setTypingStatus } from '../store/slices/chatroomSlice';
import { useSocket } from '../hooks/useSocket';
import { Sidebar } from '../components/layout/Sidebar';
import { ChatArea } from '../components/chat/ChatArea';

export const Chat = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { selectedChatroom, chatrooms } = useSelector((state: RootState) => state.chatroom);
    const socket = useSocket();

    useEffect(() => {
        dispatch(fetchChatrooms());
    }, [dispatch]);

    // Join all chatrooms for real-time updates
    useEffect(() => {
        if (chatrooms.length > 0) {
            chatrooms.forEach(room => {
                socket.joinChatroom(room._id);
            });
        }
    }, [chatrooms, socket]);

    useEffect(() => {
        const handleTyping = (data: any) => {
            dispatch(setTypingStatus(data));
        };

        socket.on('typing', handleTyping);

        return () => {
            socket.off('typing');
        };
    }, [socket, dispatch]);

    return (
        <div className="h-screen flex bg-gray-100 relative overflow-hidden">
            {/* Sidebar: Hidden on mobile when chat is selected, always visible on desktop */}
            <div className={`w-full md:w-[400px] h-full flex-shrink-0 bg-white ${selectedChatroom ? 'hidden md:flex' : 'flex'}`}>
                <Sidebar />
            </div>

            {/* ChatArea: Hidden on mobile when no chat selected, always visible on desktop */}
            <div className={`flex-1 h-full min-w-0 bg-[#efeae2] ${!selectedChatroom ? 'hidden md:flex' : 'flex'}`}>
                <ChatArea />
            </div>
        </div>
    );
};
