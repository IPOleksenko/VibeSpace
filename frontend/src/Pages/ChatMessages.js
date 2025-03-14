import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL;

const ChatMessages = () => {
    const { chatId } = useParams();
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState({});
    const [text, setText] = useState("");
    const [file, setFile] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const token = localStorage.getItem("token");

    // Function to load messages
    const fetchMessages = () => {
        fetch(`${API_URL}/api/chat_messages/${chatId}/messages/`, {
            headers: { Authorization: `Token ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setMessages(data);
                    setErrorMessage("");
                } else {
                    setMessages([]);
                    setErrorMessage(data.detail || "Access to the chat is not allowed.");
                }
            })
            .catch((error) => {
                console.error("Error loading messages:", error);
                setMessages([]);
                setErrorMessage("Error loading messages.");
            });
    };

    useEffect(() => {
        if (!chatId) {
            console.error("Error: chatId is undefined!");
            return;
        }

        fetchMessages(); // Load messages on component mount

        const socket = new WebSocket(`ws://localhost:8001/ws/chat/${chatId}/`);

        socket.onopen = () => console.log("Connected to WebSocket!");

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "message") {
                // Transform the received message to match the API format
                const newMessage = {
                    id: data.id,
                    // Convert the user object to its id,
                    // to later use it for retrieving user information
                    user: data.user.id,
                    chat: data.chat,
                    text: data.text,
                    uploaded_at: data.uploaded_at,
                    media: data.media_url ? { file_url: data.media_url } : null,
                };
                setMessages((prevMessages) => [...prevMessages, newMessage]);
                if (!users[newMessage.user]) {
                    fetchUserInfo(newMessage.user);
                }
            } else if (data.type === "notification") {
                console.log("New message notification received, updating messages...");
                fetchMessages(); // Reload messages on notification
            }
        };

        socket.onerror = (event) => console.error("WebSocket error:", event);

        socket.onclose = () => console.log("WebSocket closed!");

        return () => socket.close();
    }, [chatId]);

    const fetchUserInfo = (userId) => {
        fetch(`${API_URL}/api/accounts/user/${userId}`, {
            headers: { Authorization: `Token ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setUsers((prevUsers) => ({ ...prevUsers, [userId]: data }));
            })
            .catch((error) =>
                console.error(`Error loading user data for ${userId}:`, error)
            );
    };

    useEffect(() => {
        const uniqueUserIds = Array.from(new Set(messages.map((msg) => msg.user)));
        uniqueUserIds.forEach((userId) => {
            if (!users[userId]) {
                fetchUserInfo(userId);
            }
        });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!chatId || (!text && !file)) {
            console.error("Error: Missing chatId or message content!");
            return;
        }

        const formData = new FormData();
        formData.append("chat", chatId);
        formData.append("text", text);
        if (file) formData.append("file", file);

        try {
            const response = await fetch(`${API_URL}/api/chat_messages/create/`, {
                method: "POST",
                headers: { Authorization: `Token ${token}` },
                body: formData,
            });

            const responseData = await response.json();
            if (!response.ok) throw new Error(responseData.detail || "Error sending message");

            setText("");
            setFile(null);

            if (!users[responseData.user]) fetchUserInfo(responseData.user);
        } catch (error) {
            console.error("Error:", error.message);
        }
    };

    if (errorMessage) {
        return <p style={{ color: "red" }}>{errorMessage}</p>;
    }

    return (
        <div>
            <h2>Chat {chatId}</h2>
            <div>
                {messages.length > 0 ? (
                    messages.map((msg) => (
                        <div key={msg.id} style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
                            {users[msg.user] && users[msg.user].avatar_base64 ? (
                                <img
                                    src={`data:image/png;base64,${users[msg.user].avatar_base64}`}
                                    alt="avatar"
                                    style={{
                                        width: "30px",
                                        height: "30px",
                                        borderRadius: "50%",
                                        marginRight: "10px",
                                    }}
                                />
                            ) : null}
                            <div>
                                <strong>
                                    {users[msg.user] ? users[msg.user].username : "Unknown"}
                                </strong>
                                : {msg.text}
                                {msg.media?.file_url ? (
                                    msg.media.file_url.match(/\.(jpg|png|gif|jpeg)$/) ? (
                                        <img
                                            src={msg.media.file_url}
                                            alt="media"
                                            style={{ maxWidth: "200px", display: "block", marginTop: "10px" }}
                                        />
                                    ) : msg.media.file_url.match(/\.(mp4|webm)$/) ? (
                                        <video
                                            controls
                                            style={{ maxWidth: "200px", display: "block", marginTop: "10px" }}
                                        >
                                            <source src={msg.media.file_url} type="video/mp4" />
                                            Your browser does not support the video element.
                                        </video>
                                    ) : msg.media.file_url.match(/\.(mp3|wav)$/) ? (
                                        <audio controls style={{ display: "block", marginTop: "10px" }}>
                                            <source src={msg.media.file_url} type="audio/mp3" />
                                            Your browser does not support the audio element.
                                        </audio>
                                    ) : (
                                        <a
                                            href={msg.media.file_url}
                                            download
                                            style={{ display: "block", marginTop: "10px" }}
                                        >
                                            Download file
                                        </a>
                                    )
                                ) : null}
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No messages.</p>
                )}
            </div>
            <form onSubmit={handleSendMessage}>
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter a message..."
                />
                <input type="file" onChange={(e) => setFile(e.target.files[0])} />
                <button type="submit">Send</button>
            </form>
        </div>
    );
};

export default ChatMessages;
