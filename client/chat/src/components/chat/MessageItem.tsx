import { useState, useRef, useEffect } from 'react';
import { Message } from '../../types';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { format } from 'date-fns';
import { deleteMessage, setEditingMessage, setReplyingTo } from '../../store/slices/messageSlice';
import socketService from '../../services/socket';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { MdDelete, MdEdit, MdContentCopy, MdUndo, MdExpandMore, MdDoneAll, MdReply, MdBlock } from 'react-icons/md';

interface MessageItemProps {
    message: Message;
}

export const MessageItem = ({ message }: MessageItemProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const isOwnMessage = message.senderId._id === user?.id;
    const [showActions, setShowActions] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState<'bottom' | 'top'>('bottom');
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [localDeleted, setLocalDeleted] = useState(false);
    const deleteTimerRef = useRef<number | null>(null);
    const [undoTimer, setUndoTimer] = useState(6);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
        };
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
                menuButtonRef.current && !menuButtonRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    const toggleMenu = () => {
        if (!isMenuOpen && menuButtonRef.current) {
            // Calculate position before opening
            const rect = menuButtonRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            // 200px is approx menu height
            if (spaceBelow < 200) {
                setMenuPosition('top');
            } else {
                setMenuPosition('bottom');
            }
        }
        setIsMenuOpen(!isMenuOpen);
    };

    // System Message
    if (message.type === 'system') {
        return (
            <div className="flex justify-center my-3 hover:bg-transparent">
                <div className="bg-[#E1F3FB] text-gray-800 text-xs px-3 py-1 rounded-lg shadow-sm">
                    {message.content}
                </div>
            </div>
        );
    }

    // Temporary Soft Delete (Undoable)
    if (localDeleted) {
        return (
            <div className={`mb-2 flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                <div className="bg-gray-100 rounded-lg px-4 py-2 shadow-sm text-sm text-gray-500 italic flex items-center gap-3">
                    <span>Message deleted</span>
                    <button
                        onClick={() => {
                            if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
                            setLocalDeleted(false);
                        }}
                        className="text-blue-500 font-bold hover:underline flex items-center gap-1"
                    >
                        <MdUndo className="w-4 h-4" /> Undo
                    </button>
                    <span>{undoTimer}</span>
                </div>
            </div>
        );
    }

    const handleEdit = () => {
        dispatch(setEditingMessage(message));
        setIsMenuOpen(false);
        setShowActions(false);
    };

    const handleReply = () => {
        dispatch(setReplyingTo(message));
        setIsMenuOpen(false);
        setShowActions(false);
    };

    const handleDelete = () => {
        // Start soft delete process
        setLocalDeleted(true);
        setIsDeleteModalOpen(false);

        const timer = setInterval(() => {
            if (undoTimer > 0) {
                setUndoTimer(prev => prev - 1);
            } else {
                clearInterval(timer);
            }
        }, 1000);


        // Schedule actual delete
        deleteTimerRef.current = window.setTimeout(async () => {
            const result = await dispatch(deleteMessage({
                messageId: message._id,
                chatroomId: message.chatroomId
            }));
            if (deleteMessage.fulfilled.match(result)) {
                socketService.emitMessageDeleted(message.chatroomId, message._id);
                setLocalDeleted(false);
            }
        }, 6000); // 6 seconds to undo
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        setIsMenuOpen(false);
        setShowActions(false);
    };

    return (
        <>
            <div
                className={`mb-2 flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group relative`}
                onMouseEnter={() => setShowActions(true)}
                onMouseLeave={() => setShowActions(false)}
            >
                <div
                    className={`max-w-[65%] rounded-lg px-3 py-1 shadow-sm relative text-sm ${message.isDeleted
                        ? 'bg-gray-100 text-gray-500 italic border border-gray-200'
                        : isOwnMessage
                            ? 'bg-[#D9FDD3] rounded-tr-none'
                            : 'bg-white rounded-tl-none'
                        }`}
                >
                    {/* Quoted Message */}
                    {message.quotedMessage && !message.isDeleted && (
                        <div className="mb-1 rounded-md bg-black/5 p-2 border-l-4 border-l-green-600 text-xs">
                            <span className="font-bold text-green-700 block mb-0.5">{message.quotedMessage.senderId.username}</span>
                            <span className="text-gray-600 line-clamp-2">{message.quotedMessage.content}</span>
                        </div>
                    )}

                    {/* Header - Sender Name for Group Chats (Not own message) */}
                    {!isOwnMessage && !message.isDeleted && (
                        <p className={`text-xs font-bold mb-1 text-[${
                            // Generate a pseudo-random color based on name length
                            ['#e542a3', '#1f7aec', '#008069', '#d28c04', '#53bdeb'][message.senderId.username.length % 5]
                            }]`}>
                            {message.senderId.username}
                        </p>
                    )}

                    {/* Message Content */}
                    <div className="break-words whitespace-pre-wrap mr-6 pb-1 min-w-[80px]">
                        {message.isDeleted ? (
                            <div className="flex items-center gap-2">
                                <MdBlock className="w-4 h-4" />
                                This message was deleted
                            </div>
                        ) : (
                            <>
                                {message.content}
                                {/* Invisible spacer to prevent text sticking to time */}
                                <span className="inline-block w-16 h-3 select-none">&nbsp;</span>
                            </>
                        )}
                    </div>

                    {/* Metadata */}
                    <div className="absolute bottom-1 right-2 flex items-center gap-1 select-none">
                        {message.isEdited && !message.isDeleted && (
                            <span className="text-[10px] text-gray-500 italic">edited</span>
                        )}
                        <span className={`text-[10px] ${isOwnMessage && !message.isDeleted ? 'text-gray-500' : 'text-gray-400'}`}>
                            {format(new Date(message.createdAt), 'HH:mm')}
                        </span>
                        {/* {isOwnMessage && !message.isDeleted && (
                            <span className="text-blue-500">
                                <MdDoneAll className="w-4 h-4" />
                            </span>
                        )} */}
                    </div>

                    {/* Actions Dropdown */}
                    {(showActions || isMenuOpen) && !message.isDeleted && (
                        <div className="absolute top-0 right-0 p-1 z-20">
                            <div className="relative">
                                <button
                                    ref={menuButtonRef}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleMenu();
                                    }}
                                    className={`rounded-full p-1 shadow transition-colors ${isMenuOpen ? 'bg-gray-200 text-gray-800' : 'bg-gray-100/50 hover:bg-gray-200 text-gray-600'}`}
                                >
                                    <MdExpandMore className="w-5 h-5" />
                                </button>

                                {isMenuOpen && (
                                    <div
                                        ref={menuRef}
                                        onClick={(e) => e.stopPropagation()}
                                        className={`absolute right-0 w-36 bg-white rounded-md shadow-xl py-1 border border-gray-100 animate-in fade-in zoom-in-95 duration-100 z-30 ${menuPosition === 'top' ? 'bottom-full mb-1 origin-bottom-right' : 'top-full mt-1 origin-top-right'
                                            }`}
                                    >
                                        <button
                                            onClick={handleReply}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <MdReply className="w-4 h-4" /> Reply
                                        </button>
                                        <button
                                            onClick={handleCopy}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <MdContentCopy className="w-4 h-4" /> Copy
                                        </button>
                                        {isOwnMessage && (
                                            <>
                                                <button
                                                    onClick={handleEdit}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    <MdEdit className="w-4 h-4" /> Edit
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setIsMenuOpen(false);
                                                        setIsDeleteModalOpen(true);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                >
                                                    <MdDelete className="w-4 h-4" /> Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Message"
                message="Are you sure you want to delete this message? You can undo this action for 6 seconds."
            />
        </>
    );
};
