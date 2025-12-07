import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
import { sendMessage, editMessage, setEditingMessage, setReplyingTo } from '../../store/slices/messageSlice';
import { updateChatroomLastMessage } from '../../store/slices/chatroomSlice';
import socketService from '../../services/socket';
import { MdSend, MdCheck, MdClose, MdInsertEmoticon } from 'react-icons/md';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface MessageInputProps {
    chatroomId: string;
}

export const MessageInput = ({ chatroomId }: MessageInputProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const { editingMessage, replyingTo } = useSelector((state: RootState) => state.message);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [message, setMessage] = useState('');
    const [showPicker, setShowPicker] = useState(false);

    useEffect(() => {
        if (editingMessage && editingMessage.chatroomId === chatroomId) {
            setMessage(editingMessage.content);
            textareaRef.current?.focus();
            setShowPicker(false);
        } else if (!replyingTo) {
            setMessage('');
            setShowPicker(false);
        }

        if (replyingTo) {
            textareaRef.current?.focus();
        }
    }, [editingMessage, replyingTo, chatroomId]);

    const typingTimeoutRef = useRef<number | null>(null);
    const lastTypingSentRef = useRef<number>(0);

    const handleTyping = () => {
        const now = Date.now();
        const THROTTLE_TIME = 3000; // Send "true" at most every 3 seconds

        // Clear existing timeout to prevent "false" from being sent while still typing
        if (typingTimeoutRef.current) {
            window.clearTimeout(typingTimeoutRef.current);
        }

        // Send "typing: true" if enough time has passed since last sent
        if (now - lastTypingSentRef.current > THROTTLE_TIME) {
            socketService.sendTyping(chatroomId, true);
            lastTypingSentRef.current = now;
        }

        // Set timeout to stop typing after 4 seconds of inactivity
        typingTimeoutRef.current = window.setTimeout(() => {
            socketService.sendTyping(chatroomId, false);
            typingTimeoutRef.current = null;
        }, 4000);
    };

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        setMessage((prev) => prev + emojiData.emoji);
        handleTyping();
        // Keep focus on textarea
        textareaRef.current?.focus();
    };

    const handleSend = async () => {
        if (!message.trim()) return;

        if (editingMessage && editingMessage.chatroomId === chatroomId) {
            // Update existing message
            const result = await dispatch(editMessage({
                messageId: editingMessage._id,
                content: message
            }));

            if (editMessage.fulfilled.match(result)) {
                socketService.emitMessageEdited(chatroomId, result.payload);
                dispatch(setEditingMessage(null)); // Exit edit mode
            }
        } else {
            // Send new message (possibly with reply)
            const result = await dispatch(sendMessage({
                chatroomId,
                content: message,
                quotedMessageId: replyingTo?._id
            }));

            if (sendMessage.fulfilled.match(result)) {
                socketService.emitMessageSent(chatroomId, result.payload);
                dispatch(updateChatroomLastMessage({ chatroomId, message: result.payload }));
                setMessage('');
                if (replyingTo) {
                    dispatch(setReplyingTo(null));
                }
            }
        }
        setShowPicker(false);
    };

    const handleCancel = () => {
        dispatch(setEditingMessage(null));
        dispatch(setReplyingTo(null));
        setMessage('');
        setShowPicker(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const isReplying = replyingTo && replyingTo.chatroomId === chatroomId;
    const isEditing = editingMessage && editingMessage.chatroomId === chatroomId;

    return (
        <div className="p-3 bg-[#F0F2F5] relative">
            {/* Emoji Picker Popover */}
            {showPicker && (
                <div className="absolute bottom-20 left-4 z-50 shadow-2xl rounded-lg">
                    <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        width={300}
                        height={400}
                    />
                </div>
            )}

            {/* Status Banner */}
            {(isEditing || isReplying) && (
                <div className="flex justify-between items-center bg-white p-2 rounded-t-lg border-b border-gray-200 text-sm mb-1 animate-in slide-in-from-bottom-2 border-l-4 border-l-green-500">
                    <div className="flex flex-col overflow-hidden mr-2">
                        <span className="text-green-600 font-bold text-xs">
                            {isEditing ? 'Editing Message' : `Replying to ${replyingTo?.senderId.username}`}
                        </span>
                        <span className="text-gray-500 truncate text-xs">
                            {isEditing ? editingMessage?.content : replyingTo?.content}
                        </span>
                    </div>
                    <button onClick={handleCancel} className="text-gray-500 hover:bg-gray-100 p-1 rounded-full">
                        <MdClose className="w-5 h-5" />
                    </button>
                </div>
            )}

            <div className="flex gap-2 items-end">
                <div className={`flex-1 bg-white border border-white focus-within:border-white focus-within:ring-0 overflow-hidden shadow-sm transition-all flex items-end ${(isEditing || isReplying) ? 'rounded-b-2xl rounded-tr-2xl rounded-tl-none' : 'rounded-2xl'
                    }`}>

                    <button
                        onClick={() => setShowPicker(!showPicker)}
                        className={`p-2 mb-1 ml-1 text-gray-500 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors ${showPicker ? 'text-[#00A884]' : ''}`}
                    >
                        <MdInsertEmoticon className="w-6 h-6" />
                    </button>

                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => {
                            setMessage(e.target.value);
                            handleTyping();
                        }}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="w-full px-4 py-3 max-h-32 focus:outline-none resize-none text-[15px] placeholder-gray-500"
                        rows={1}
                        style={{ minHeight: '44px' }}
                    />
                </div>
                <button
                    onClick={handleSend}
                    className={`p-3 rounded-full text-white shadow-sm flex items-center justify-center transition-all duration-200 ease-in-out ${message.trim()
                        ? 'bg-[#00A884] hover:bg-[#008f6f] transform scale-100'
                        : 'bg-[#F0F2F5] text-gray-400 cursor-default scale-95'
                        }`}
                    disabled={!message.trim()}
                >
                    {isEditing ? (
                        <MdCheck className="w-6 h-6" />
                    ) : (
                        <MdSend className={`w-6 h-6 ${message.trim() ? 'ml-0.5' : ''}`} />
                    )}
                </button>
            </div>
        </div>
    );
};
