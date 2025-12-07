import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { fetchMessages } from '../../store/slices/messageSlice';
import { setSelectedChatroom } from '../../store/slices/chatroomSlice';
import { MessageItem } from './MessageItem';
import { MessageInput } from './MessageInput';
import { AddMemberModal } from './AddMemberModal';
import { MdArrowBack } from 'react-icons/md';

export const ChatArea = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { selectedChatroom, typingUsers } = useSelector((state: RootState) => state.chatroom);
    const { messages, pagination, loading } = useSelector((state: RootState) => state.message); // Wait, typingUsers is in chatroomSlice!
    // Correcting selector
    // Actually, state.message HAS messages, but state.chatroom HAS typingUsers?
    // Let me check chatroomSlice.ts again. YES, I added it to chatroomSlice.

    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [prevMessagesLength, setPrevMessagesLength] = useState(0);

    const chatroomMessages = selectedChatroom
        ? messages[selectedChatroom._id] || []
        : [];

    const chatroomPagination = selectedChatroom ? pagination[selectedChatroom._id] : null;

    useEffect(() => {
        if (selectedChatroom) {
            // Reset and fetch initial messages
            dispatch(fetchMessages({ chatroomId: selectedChatroom._id, page: 1 }));
        }
    }, [selectedChatroom, dispatch]);

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

    // Auto-scroll to bottom on initial load or new message
    useEffect(() => {
        if (scrollContainerRef.current && chatroomMessages.length > 0) {
            const container = scrollContainerRef.current;

            // If new messages added (not pagination)
            if (chatroomMessages.length > prevMessagesLength) {
                // If it's a pagination load (prepended messages), maintain scroll position
                // We detect this by checking if the FIRST message changed ID and we have pagination data
                const isPaginationLoad = chatroomPagination?.page && chatroomPagination.page > 1;

                if (!isPaginationLoad) {
                    // Normal new message or initial load -> scroll to bottom
                    container.scrollTop = container.scrollHeight;
                }
            }
            setPrevMessagesLength(chatroomMessages.length);
        }
    }, [chatroomMessages, chatroomPagination]);

    // Handle scroll for pagination
    const handleScroll = () => {
        if (scrollContainerRef.current && selectedChatroom && chatroomPagination?.hasMore && !loading) {
            if (scrollContainerRef.current.scrollTop === 0) {
                const currentHeight = scrollContainerRef.current.scrollHeight;

                dispatch(fetchMessages({
                    chatroomId: selectedChatroom._id,
                    page: chatroomPagination.page + 1
                })).then(() => {
                    // Adjust scroll position after render to prevent jumping to top
                    // We need to wait for DOM update. A simple timeout usually works or useLayoutEffect with dependency
                    if (scrollContainerRef.current) {
                        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight - currentHeight;
                    }
                });
            }
        }
    };

    if (!selectedChatroom) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-[var(--chat-bg)] border-b-4 border-green-500">
                <div className="text-center">
                    <h1 className="text-3xl font-light text-gray-600 mb-4">Welcome to Chat Application</h1>
                    <p className="text-gray-500">Select a chat to start messaging.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-[var(--chat-bg)]">
            {/* Header */}
            <div className="h-16 bg-[#F0F2F5] px-4 flex items-center justify-between border-b border-gray-200 shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => dispatch(setSelectedChatroom(null))}
                        className="md:hidden p-2 -ml-2 hover:bg-gray-200 rounded-full text-gray-600"
                    >
                        <MdArrowBack className="w-6 h-6" />
                    </button>
                    <div className={`w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white overflow-hidden ${!selectedChatroom.avatar ? getAvatarColor(selectedChatroom.name) : 'bg-gray-300'}`}>
                        {selectedChatroom.avatar ? (
                            <img src={selectedChatroom.avatar} alt={selectedChatroom.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-lg">{selectedChatroom.name[0]?.toUpperCase() + selectedChatroom.name[1]?.toUpperCase()}</span>
                        )}
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-800">{selectedChatroom.name}</h2>
                        <p className="text-xs text-gray-500 truncate max-w-xs">
                            {selectedChatroom.members.map(m => m.userId.username).join(', ')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Only show 'Add Member' for group chats */}
                    {selectedChatroom.type === 'group' && (
                        <button
                            onClick={() => setIsAddMemberOpen(true)}
                            className="p-2 hover:bg-gray-200 rounded-full text-gray-600"
                            title="Add Members"
                        >
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
                            </svg>
                        </button>
                    )}
                    <button className="p-2 hover:bg-gray-200 rounded-full text-gray-600">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 sm:p-8"
                style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundRepeat: 'repeat', opacity: 0.9 }}
            >
                {/* Loading spinner for pagination */}
                {loading && chatroomPagination?.page && chatroomPagination.page > 1 && (
                    <div className="text-center py-2 text-xs text-gray-500">Loading history...</div>
                )}

                <div className="flex flex-col gap-4">
                    {(() => {
                        const groupedMessages: { [key: string]: typeof chatroomMessages } = {};

                        chatroomMessages.forEach(msg => {
                            const date = new Date(msg.createdAt);
                            const today = new Date();
                            const yesterday = new Date(today);
                            yesterday.setDate(yesterday.getDate() - 1);

                            let dateKey = date.toLocaleDateString();

                            if (date.toDateString() === today.toDateString()) {
                                dateKey = 'Today';
                            } else if (date.toDateString() === yesterday.toDateString()) {
                                dateKey = 'Yesterday';
                            }

                            if (!groupedMessages[dateKey]) {
                                groupedMessages[dateKey] = [];
                            }
                            groupedMessages[dateKey].push(msg);
                        });

                        return Object.entries(groupedMessages).map(([date, msgs]) => (
                            <div key={date}>
                                <div className="flex justify-center mb-4 sticky top-0 z-10">
                                    <span className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-500 shadow-sm border border-gray-100">
                                        {date}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    {msgs.map((message) => (
                                        <MessageItem key={message._id} message={message} />
                                    ))}
                                </div>
                            </div>
                        ));
                    })()}

                    {/* Typing Indicator */}
                    {typingUsers && typingUsers[selectedChatroom._id] && Object.keys(typingUsers[selectedChatroom._id] || {}).length > 0 && (
                        <div className="flex items-center gap-2 mb-2 ml-2">
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-white ring-2 ring-white">
                                {Object.values(typingUsers[selectedChatroom._id])[0][0].toUpperCase()}
                            </div>
                            <div className="bg-white rounded-xl rounded-tl-none px-4 py-3 shadow-sm border border-gray-100 inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="bg-[#F0F2F5] p-3">
                <MessageInput chatroomId={selectedChatroom._id} />
            </div>

            <AddMemberModal isOpen={isAddMemberOpen} onClose={() => setIsAddMemberOpen(false)} />
        </div>
    );
};
