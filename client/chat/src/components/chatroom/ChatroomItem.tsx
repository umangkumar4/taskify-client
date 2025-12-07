import { useDispatch, useSelector } from 'react-redux';
import { Chatroom } from '../../types';
import { setSelectedChatroom } from '../../store/slices/chatroomSlice';
import { RootState } from '../../store/store';
import { format } from 'date-fns';
import { MdGroup } from 'react-icons/md';

interface ChatroomItemProps {
    chatroom: Chatroom;
    setSearchQuery: (query: string) => void;
}

const getAvatarColor = (name: string) => {
    const colors = [
        'bg-red-600', 'bg-blue-600', 'bg-green-600', 'bg-yellow-600',
        'bg-purple-600', 'bg-pink-600', 'bg-indigo-600', 'bg-teal-600',
        'bg-orange-600', 'bg-cyan-600'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
};

export const ChatroomItem = ({ chatroom, setSearchQuery }: ChatroomItemProps) => {
    const dispatch = useDispatch();
    const { selectedChatroom } = useSelector((state: RootState) => state.chatroom);

    const handleClick = () => {
        dispatch(setSelectedChatroom(chatroom));
        setSearchQuery('')
    };

    const isActive = selectedChatroom?._id === chatroom._id;
    const avatarColor = getAvatarColor(chatroom.name);

    return (
        <div
            onClick={handleClick}
            className={`p-3 cursor-pointer border-b border-gray-100 transition-colors flex items-center gap-3 ${isActive ? 'bg-[#F0F2F5]' : 'hover:bg-[#F5F6F6]'
                }`}
        >
            <div className="relative">
                <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white text-lg font-medium overflow-hidden ${!chatroom.avatar ? avatarColor : 'bg-gray-300'}`}>
                    {chatroom.avatar ? (
                        <img src={chatroom.avatar} alt={chatroom.name} className="w-full h-full object-cover" />
                    ) : (
                        <span>{chatroom.name[0]?.toUpperCase() + (chatroom.name[1]?.toUpperCase() || '')}</span>
                    )}
                </div>
                {chatroom.type === 'group' && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-sm border border-gray-100">
                        <div className="bg-gray-100 rounded-full p-0.5">
                            <MdGroup className="w-3 h-3 text-gray-500" />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                    <h3 className="font-medium text-gray-900 truncate">{chatroom.name}</h3>
                    {chatroom.lastMessage?.timestamp && (
                        <span className={`text-xs ${isActive ? 'text-gray-600' : 'text-gray-500'}`}>
                            {format(new Date(chatroom.lastMessage.timestamp), 'HH:mm')}
                        </span>
                    )}
                </div>

                <div className="flex justify-between items-center mt-1">
                    <p className={`text-sm truncate flex-1 ${isActive ? 'text-gray-600' : 'text-gray-500'}`}>
                        {chatroom.lastMessage ? (
                            <>
                                {chatroom.type === 'group' && chatroom.lastMessage.senderId !== 'system' && (
                                    <span className="font-semibold text-gray-700 mr-1">
                                        {/* In real app, we need sender username here, simplifying for now */}
                                        {/* User: */}
                                    </span>
                                )}
                                {chatroom.lastMessage.content}
                            </>
                        ) : (
                            <span className="italic">No messages yet</span>
                        )}
                    </p>
                    {chatroom.unreadCount && chatroom.unreadCount > 0 ? (
                        <div className="ml-2 bg-[#25D366] text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                            {chatroom.unreadCount}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};
