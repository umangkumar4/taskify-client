import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store/store';
import { createChatroom, setSelectedChatroom } from '../../store/slices/chatroomSlice';
import { UserSearch } from '../common/UserSearch';
import { User } from '../../types';
import { MdGroup, MdPerson, MdClose, MdCheck } from 'react-icons/md';

interface CreateChatModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateChatModal = ({ isOpen, onClose }: CreateChatModalProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const [activeTab, setActiveTab] = useState<'personal' | 'group'>('personal');
    const [groupName, setGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handlePersonalChat = async (user: User) => {
        setIsLoading(true);
        const result = await dispatch(createChatroom({
            name: user.username,
            type: 'personal',
            memberIds: [user.id || (user as any)._id]
        }));
        setIsLoading(false);

        if (result.meta.requestStatus === 'fulfilled') {
            dispatch(setSelectedChatroom(result.payload));
            onClose();
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedUsers.length === 0) return;

        setIsLoading(true);
        const result = await dispatch(createChatroom({
            name: groupName,
            type: 'group',
            memberIds: selectedUsers.map(u => u.id || (u as any)._id)
        }));
        setIsLoading(false);

        if (result.meta.requestStatus === 'fulfilled') {
            dispatch(setSelectedChatroom(result.payload));
            onClose();
        }
    };

    // Reset state when closing or switching tabs? No, keep it simple.
    // Ideally use useEffect to reset on isOpen change.

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-lg p-0 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 bg-[#00A884] text-white flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold">New Chat</h2>
                        <p className="text-white/80 text-sm">Start a conversation</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <MdClose className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 shrink-0">
                    <button
                        className={`flex-1 py-4 font-semibold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'personal'
                                ? 'text-[#00A884] border-b-2 border-[#00A884] bg-green-50/30'
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
                        onClick={() => setActiveTab('personal')}
                    >
                        <MdPerson className="w-5 h-5" />
                        Personal Chat
                    </button>
                    <button
                        className={`flex-1 py-4 font-semibold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'group'
                                ? 'text-[#00A884] border-b-2 border-[#00A884] bg-green-50/30'
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
                        onClick={() => setActiveTab('group')}
                    >
                        <MdGroup className="w-5 h-5" />
                        New Group
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {activeTab === 'personal' ? (
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                                <p className="text-sm text-blue-700">
                                    Search for a user by their username to start a private conversation.
                                </p>
                            </div>
                            <UserSearch onSelect={handlePersonalChat} />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Group Name</label>
                                <input
                                    type="text"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A884] focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                                    placeholder="Enter a name for your group"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Add Members</label>
                                <div className="p-1">
                                    <UserSearch
                                        onSelect={(user) => {
                                            if (!selectedUsers.find(u => (u.id || (u as any)._id) === (user.id || (user as any)._id))) {
                                                setSelectedUsers([...selectedUsers, user]);
                                            }
                                        }}
                                        excludeUserIds={selectedUsers.map(u => u.id || (u as any)._id)}
                                    />
                                </div>
                            </div>

                            {selectedUsers.length > 0 && (
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Selected Members ({selectedUsers.length})
                                    </label>
                                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                        {selectedUsers.map((user) => (
                                            <div key={user.id || (user as any)._id} className="bg-[#E9FCD4] text-[#00A884] pl-3 pr-2 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 shadow-sm border border-[#00A884]/20 animate-in zoom-in duration-200">
                                                <span>{user.username}</span>
                                                <button
                                                    onClick={() => setSelectedUsers(selectedUsers.filter(u => u !== user))}
                                                    className="p-0.5 hover:bg-[#00A884]/10 rounded-full transition-colors"
                                                >
                                                    <MdClose className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer (Group only) */}
                {activeTab === 'group' && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-end">
                        <button
                            onClick={handleCreateGroup}
                            disabled={!groupName.trim() || selectedUsers.length === 0 || isLoading}
                            className="bg-[#00A884] hover:bg-[#008f6f] text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2"
                        >
                            {isLoading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <MdCheck className="w-5 h-5" />
                                    Create Group
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
