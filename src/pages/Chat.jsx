import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { useCallback, useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import { PrivateChat } from './PrivateChat'

export default function Chat() {
    const navigate = useNavigate();
    const currentUser = authService.getCurrentUser();

    useEffect(() => {
        if (!currentUser) {
            navigate("/login");
            return;
        }

    }, [currentUser, navigate]);

    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState('');
    const [showEmojiSelector, setShowEmojiSelector] = useState(false);
    const [isTyping, setIsTyping] = useState('');
    const [privateChats, setPrivateChats] = useState(new Map( ));
    const [unreadMessages, setUnreadMessages] = useState(new Map());
    const [onlineUsers, setOnlineUsers] = useState(new Set());

    const privateMessageHandlers = useRef(new Map());
    const stompClient = useRef(null);
    const messageEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const emojis = ['😂', '🥹', '😅', '😁', '🤨', '😎', '🥳', '😏', '😒', '😔', '☹️', '😣', '😫',
                    '😭', '😡', '😤', '🤔', '🫣', '🤫', '😐', '🙄', '👍', '👎', '❤️']

    const {username} = currentUser;
    const scrollToButton = () => {
        messageEndRef.current.scrollIntoView({behavior: "smooth"});
    }

    const registerPrivateMessageHandler = useCallback((otherUser, handler) => {
        privateMessageHandlers.current.set(otherUser, handler);
    }, [])

    const unregisterPrivateMessageHandler = useCallback((otherUser, handler) => {
        privateMessageHandlers.current.delete(otherUser);
    })

    useEffect(() => {
        let reconnectInterval;

        const connectAndFetch = async () => {
            if(!username) {
                return;
            }
            setOnlineUsers(prev => {
                const prevSet = new Set(prev);
                prevSet.add(username);
                return prevSet;
            });

            const socket = new SockJS("http://localhost:8080/ws");
            stompClient.current = Stomp.over(socket);

            stompClient.current.connect({
                'client_id': username,
                'session-id': Date.now().toString(),
                'username': username
            }, (frame) => {
                clearInterval(reconnectInterval);
                const GroupChat = stompClient.current.subscribe('/topic/public', (msg) => {
                    const chatMessage = JSON.parse(msg.body);
                    
                    setOnlineUsers(prev => {
                        const newUsers = new Set(prev);
                        if (chatMessage.type === 'JOIN') {
                            newUsers.add(chatMessage.sender);
                        }
                        else if (chatMessage.type == 'LEAVE') {
                            newUsers.delete(chatMessage.sender);
                        }

                        if (chatMessage.type === 'TYPING') {
                            setIsTyping(chatMessage.sender);
                            clearTimeout(typingTimeoutRef.current);
                            typingTimeoutRef.current = setTimeout(() => {
                                setIsTyping('')
                            }, 2000);
                            return;
                        }

                        setMessage(prev => [...prev, {
                            ...chatMessage,
                            timestamp: chatMessage.timestamp || new Date().toISOString(),
                            id: chatMessage.id || (Date.now() + Math.random())
                        }]);
                    });
                });
                const privateChat = stompClient.current.subscribe(`/user/${username}/queue/private`, (msg) => {
                    const privateMessage = JSON.parse(msg.bodu);
                    const otherUser = privateMessage.sender === username ? privateMessage.recipient : privateMessage.sender;

                    const handler = privateMessageHandlers.current.get(otherUser);
                    if (handler) {
                        try {
                            handler(privateMessage);
                        }
                        catch (error) {
                            console.error('Error calling handler', error);
                        }
                    }
                    else if (privateMessage.recipient === username) {
                        setUnreadMessages(prev => {
                            const newUnread = new Map(prev);
                            const currentCount = newUnread.get(otherUser) || 0;
                            newUnread.set(otherUser, currentCount + 1);
                            return currentCount;
                        })
                    }
                })
                stompClient.current.send("/app/chat.adduser", {}, JSON.stringify({
                    username,
                    type: 'JOIN'
                }));

                authService.getOnlineUsers()
                .then(data => {
                    const fetchedUsers = Object.keys(data);
                    setOnlineUsers(prev => {
                        const mergedSet = new Set(prev);
                        fetchedUsers.forEach(user => mergedSet.add(user));
                        mergedSet.add(username);
                        return mergedSet
                    })
                })
                .catch(error => {
                    console.error('Error fetching online users', error)
                })
            }, (error) => {
                console.error("Stomp connection error", error);
                if(!reconnectInterval) {
                    reconnectInterval = setInterval(() => {
                        connectAndFetch();
                    }, 5000)
                }
            });
        };
        connectAndFetch();

        return () => {
            if(stompClient.current && stompClient.current.connected) {
                stompClient.current.disconnect();
            }
            clearTimeout(typingTimeoutRef.current);
            clearInterval(reconnectInterval);
        };
    }, [username, registerPrivateMessageHandler, unregisterPrivateMessageHandler]);

    return (
        <div className="chat-container">
            <div className="sidebar">
                <div className="siderbar-header">
                    <h2>Users</h2>
                </div>
                <div className="users-list">
                    {Array.from(onlineUsers).map((user) => {
                        <div key={user}
                        className={`user-item ${user === username ? 'current-user' : ''}`}
                        onClick={() => openPrivateChat(user)}>
                            <div className="user-avatar">
                                {user.charAt(0).toUpperCase()}
                            </div>
                            <span>{user}</span>
                            {user===username && <span className="you-label">(You)</span>}
                            {unreadMessages.has(user) && (
                                <span className="unread-count">{unreadMessages.get(user)}</span>
                            )}
                        </div>
                    })}
                </div>
            </div>
            <div className="main-chat">
                <div className="chat-header">
                    <h4>Welcome, {username}</h4>
                </div>
                <div className="messages-container">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`message ${msg.type.toLowercase()}`}>
                            {msg.type === "JOIN" && (
                                <div className="system-message">
                                    {msg.sender} joined the group
                                </div>
                            )}
                            {msg.type === "LEAVE" && (
                                <div className="system-message">
                                    {msg.sender} left the group
                                </div>
                            )}
                            {msg.type === "CHAT" && (
                                <div className={`chat-message ${msg.sender === username ? 'own-message' : ''}`}>
                                    <div className="message-info">
                                        <span className="sender">
                                            {message.sender}
                                        </span>
                                        <span className="time">
                                            {formatTime(msg.timestamp)}
                                        </span>
                                    </div>
                                    <div className="message-text">
                                        {msg.content}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {isTyping && isTyping !== username && (
                        <div className="typing-indicator">
                            {isTyping} is typing...
                        </div>
                    )}
                    <div ref={messageEndRef} />
                </div>

                <div className="input-area">
                    {showEmojiSelector && (
                        <div className="emoji-picker">
                            {emojis.map((emoji) => (
                                <button key={emoji} onClick={() => addEmoji(emoji)}>
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}

                    <form onSubmit={sendMessage} className="message-form">
                        <button type="button"
                        onClick={() => setShowEmojiSelector(prev => {return !prev})}
                        className="emoji-btn">
                            😀
                        </button>
                        <input type="text" placeholder="Message"
                        value={message}
                        onChange={handleTyping}
                        className="message-input" />
                        <button type="submit" 
                        className="send-btn"
                        disabled={!message.trim()}>
                            Send
                        </button>
                    </form>
                </div>
            </div>

            {Array.from(privateChats.keys()).map((user) => (
                <PrivateChat key={user}
                currentUser={username}
                recipientUser={user}
                stompClient={stompClient}
                onClose={() => closePrivateChat(user)}
                registerPrivateMessageHandler={registerPrivateMessageHandler}
                unregisterPrivateMessageHandler={unregisterPrivateMessageHandler} />
            ))}
        </div>
    )
};