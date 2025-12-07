import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
import { addMembers } from '../../store/slices/chatroomSlice';
import { UserSearch } from '../common/UserSearch';
import { User } from '../../types';

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AddMemberModal = ({ isOpen, onClose }: AddMemberModalProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const { selectedChatroom } = useSelector((state: RootState) => state.chatroom);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

    if (!isOpen || !selectedChatroom) return null;

    const handleAddMembers = async () => {
        if (selectedUsers.length === 0) return;

        await dispatch(addMembers({
            chatroomId: selectedChatroom._id,
            memberIds: selectedUsers.map(u => u.id || (u as any)._id)
        }));

        onClose();
        setSelectedUsers([]);
    };

    const currentMemberIds = selectedChatroom.members.map(m => m.userId.id || (m.userId as any)._id);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Add Members</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        ✕
                    </button>
                </div>

                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Search Users</label>
                        <UserSearch
                            onSelect={(user) => {
                                const userId = user.id || (user as any)._id;
                                if (!selectedUsers.find(u => (u.id || (u as any)._id) === userId) &&
                                    !currentMemberIds.includes(userId)) {
                                    setSelectedUsers([...selectedUsers, user]);
                                }
                            }}
                            excludeUserIds={[...currentMemberIds, ...selectedUsers.map(u => u.id || (u as any)._id)]}
                        />
                    </div>

                    {selectedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {selectedUsers.map((user) => (
                                <div key={user.id || (user as any)._id} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                                    <span>{user.username}</span>
                                    <button
                                        onClick={() => setSelectedUsers(selectedUsers.filter(u => u !== user))}
                                        className="hover:text-blue-900"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={handleAddMembers}
                        disabled={selectedUsers.length === 0}
                        className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
                    >
                        Add Selected Members
                    </button>
                </div>
            </div>
        </div>
    );
};
