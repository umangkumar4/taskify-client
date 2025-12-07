import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { ChatroomItem } from './ChatroomItem';
import { createChatroom, setSelectedChatroom } from '../../store/slices/chatroomSlice';
import { User } from '../../types';
import { MdPersonAdd } from 'react-icons/md';

interface ChatroomListProps {
    searchQuery?: string;
    setSearchQuery?: (query: string) => void;
    searchResults?: User[];
    isSearching?: boolean;
}

export const ChatroomList = ({ searchQuery = '', setSearchQuery, searchResults = [], isSearching = false }: ChatroomListProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const { chatrooms, loading } = useSelector((state: RootState) => state.chatroom);

    const filteredChatrooms = chatrooms.filter(chatroom =>
        chatroom.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateChat = async (user: User) => {
        setSearchQuery('')
        // Check if chatroom already exists
        const existingChatroom = chatrooms.find(c =>
            c.type === 'personal' &&
            c.members.some(m => m.userId._id === (user.id || (user as any)._id) || m.userId.id === (user.id || (user as any)._id))
        );

        if (existingChatroom) {
            dispatch(setSelectedChatroom(existingChatroom));
            return;
        }

        const result = await dispatch(createChatroom({
            name: user.username,
            type: 'personal',
            memberIds: [user.id || (user as any)._id]
        }));

        if (createChatroom.fulfilled.match(result)) {
            dispatch(setSelectedChatroom(result.payload));
        }





    };

    if (loading && !searchQuery) {
        return <div className="p-4 text-center">Loading...</div>;
    }

    return (
        <div className="flex-1 overflow-y-auto">
            {/* Existing Chats */}
            {filteredChatrooms.length > 0 && (
                <>
                    {searchQuery && <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Chats</div>}
                    {filteredChatrooms.map((chatroom) => (
                        <ChatroomItem key={chatroom._id} chatroom={chatroom} setSearchQuery={setSearchQuery} />
                    ))}
                </>
            )}

            {/* Global Search Results */}
            {searchQuery && (
                <div className="mt-2">
                    {/* Header */}
                    {(searchResults.length > 0 || isSearching) && (
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                            Discover Users
                        </div>
                    )}

                    {isSearching ? (
                        <div className="p-4 text-center text-sm text-gray-500">Searching global users...</div>
                    ) : (
                        searchResults.map(user => (
                            <div
                                key={user.id || (user as any)._id}
                                onClick={() => handleCreateChat(user)}
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors"
                            >
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                                    {user.username[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">
                                        {user.username}
                                    </h3>
                                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                                </div>
                                <div className="p-2 text-blue-500 rounded-full bg-blue-50">
                                    <MdPersonAdd className="w-5 h-5" />
                                </div>
                            </div>
                        ))
                    )}

                    {!isSearching && searchResults.length === 0 && filteredChatrooms.length === 0 && (
                        <div className="p-8 text-center text-gray-500 text-sm">
                            No chats or users found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
