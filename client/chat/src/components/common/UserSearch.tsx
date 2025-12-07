import { useState, useEffect } from 'react';
import api from '../../services/api';
import { User } from '../../types';

interface UserSearchProps {
    onSelect: (user: User) => void;
    excludeUserIds?: string[];
    placeholder?: string;
}

export const UserSearch = ({ onSelect, excludeUserIds = [], placeholder = 'Search users...' }: UserSearchProps) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const searchUsers = async () => {
            if (!query.trim()) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const response = await api.get(`/users/search?query=${query}`);
                const users = response.data.users.filter(
                    (user: User) => !excludeUserIds.includes(user.id) && !excludeUserIds.includes(user._id || user.id)
                );
                setResults(users);
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(searchUsers, 300);
        return () => clearTimeout(timeoutId);
    }, [query, excludeUserIds]);

    return (
        <div className="relative">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {(results.length > 0 || loading) && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {loading ? (
                        <div className="p-3 text-center text-gray-500">Searching...</div>
                    ) : (
                        results.map((user) => (
                            <div
                                key={user.id || (user as any)._id}
                                onClick={() => {
                                    onSelect(user);
                                    setQuery('');
                                    setResults([]);
                                }}
                                className="p-3 hover:bg-gray-100 cursor-pointer flex items-center gap-3"
                            >
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
                                    {user.username[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium">{user.username}</p>
                                    <p className="text-xs text-gray-500">{user.email}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
