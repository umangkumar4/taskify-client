import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { ChatroomList } from '../chatroom/ChatroomList';
import { CreateChatModal } from '../chat/CreateChatModal';
import { MdChat, MdSearch, MdMoreVert, MdLogout } from 'react-icons/md';
import { logout } from '../../store/slices/authSlice';
import { Logo } from '../common/Logo';
import api from '../../services/api';
import { User } from '../../types';

export const Sidebar = () => {
    const dispatch = useDispatch<AppDispatch>();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const { user } = useSelector((state: RootState) => state.auth);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        dispatch(logout());
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Global User Search
    useEffect(() => {
        const searchUsers = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const response = await api.get(`/users/search?query=${searchQuery}`);
                // Filter out self
                const users = response.data.users.filter((u: User) => u._id !== user?.id && u.id !== user?.id);
                setSearchResults(users);
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(searchUsers, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, user]);

    return (
        <div className="w-full h-full flex flex-col bg-white">
            {/* Header */}
            <div className="h-16 bg-[#F0F2F5] px-4 flex items-center justify-between border-b border-gray-200 shrink-0">
                <div className="flex items-center gap-3">
                    {/* Compact Logo */}
                    <div className="">
                        <Logo className="w-20 h-20" textClassName="text-lg" />
                    </div>
                </div>
                <div className="flex gap-2 text-[#54656F] items-center">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                        title="New Chat"
                    >
                        <MdChat className="w-6 h-6" />
                    </button>

                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`p-2 hover:bg-gray-200 rounded-full transition-colors ${isMenuOpen ? 'bg-gray-200' : ''}`}
                            title="Menu"
                        >
                            <MdMoreVert className="w-6 h-6" />
                        </button>

                        {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl py-2 z-50 border border-gray-100 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                <div className="px-4 py-2 border-b border-gray-100 mb-1">
                                    <p className="text-sm font-semibold text-gray-800">{user?.username}</p>
                                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                >
                                    <MdLogout className="w-4 h-4" />
                                    Log out
                                </button>
                            </div>
                        )}

                    </div>
                    <div className="h-16 bg-[#F0F2F5] flex items-center justify-between border-b border-gray-200 shrink-0">
                        <img
                            src={user?.avatar}
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover cursor-pointer border-2 border-transparent hover:border-gray-300 transition-all"
                            title={user?.username}
                        />
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="p-2 bg-white border-b border-gray-100 shrink-0">
                <div className="bg-[#F0F2F5] rounded-lg px-3 py-1.5 flex items-center gap-3 focus-within:bg-white focus-within:ring-1 focus-within:ring-green-400 transition-all shadow-sm">
                    <MdSearch className="w-5 h-5 text-[#54656F]" />
                    <input
                        type="text"
                        placeholder="Search or start new chat"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm w-full placeholder-[#54656F] text-gray-800 h-full py-1"
                    />
                </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <ChatroomList
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    searchResults={searchResults}
                    isSearching={isSearching}
                />
            </div>

            <CreateChatModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
};
