import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { useEffect, useRef, useState } from "react";

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
};