import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import "../css/ChatMessages.css";

const API_URL = process.env.REACT_APP_API_URL;
const BATCH_SIZE = 20;

const ChatMessages = () => {
  const { chatId } = useParams();
  const [allMessages, setAllMessages] = useState([]);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [users, setUsers] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const token = localStorage.getItem("token");

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const [footerVisible, setFooterVisible] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);

  useEffect(() => {
    const footerEl = document.getElementById("footer");
    if (!footerEl) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setFooterVisible(true);
          setFooterHeight(footerEl.offsetHeight);
        } else {
          setFooterVisible(false);
          setFooterHeight(0);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(footerEl);
    return () => observer.disconnect();
  }, []);

  // Load the current user
  useEffect(() => {
    fetch(`${API_URL}/api/accounts/user`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setCurrentUser(data))
      .catch((error) =>
        console.error("Error loading current user:", error)
      );
  }, [token]);

  // Load all messages
  const fetchMessages = () => {
    fetch(`${API_URL}/api/chat_messages/${chatId}/messages/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAllMessages(data);
          setErrorMessage("");
          // Scroll down after loading
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        } else {
          setAllMessages([]);
          setErrorMessage(data.detail || "Access denied.");
        }
      })
      .catch((error) => {
        console.error("Error loading messages:", error);
        setAllMessages([]);
        setErrorMessage("Error loading messages.");
      });
  };

  useEffect(() => {
    if (!chatId) return;
    fetchMessages();

    // Connect to WebSocket to receive new messages
    const socket = new WebSocket(`ws://localhost:8001/ws/chat/${chatId}/`);
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "message") {
        const newMessage = {
          id: data.id,
          user: data.user.id,
          chat: data.chat,
          text: data.text,
          uploaded_at: data.uploaded_at,
          media: data.media_url ? { file_url: data.media_url } : null,
        };
        setAllMessages((prev) => [...prev, newMessage]);
        if (!users[newMessage.user]) fetchUserInfo(newMessage.user);
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      } else if (data.type === "notification") {
        fetchMessages();
      }
    };
    return () => socket.close();
  }, [chatId, users]);

  const fetchUserInfo = (userId) => {
    fetch(`${API_URL}/api/accounts/user/${userId}`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then((res) => res.json())
      .then((data) =>
        setUsers((prev) => ({
          ...prev,
          [userId]: data,
        }))
      )
      .catch((error) =>
        console.error("Error loading user data:", error)
      );
  };

  useEffect(() => {
    const userIds = Array.from(new Set(allMessages.map((msg) => msg.user)));
    userIds.forEach((userId) => {
      if (!users[userId]) fetchUserInfo(userId);
    });
  }, [allMessages]);

  // Automatically adjust the height of the textarea
  const autoResize = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  // Sending a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatId || (!text && !file)) return;
    const formData = new FormData();
    formData.append("chat", chatId);
    formData.append("text", text);
    if (file) formData.append("file", file);
    try {
      const res = await fetch(`${API_URL}/api/chat_messages/create/`, {
        method: "POST",
        headers: { Authorization: `Token ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.detail || "Error sending message");
      setText("");
      setFile(null);
      // Reset textarea height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      if (!users[data.user]) fetchUserInfo(data.user);
    } catch (error) {
      console.error("Error:", error.message);
    }
  };

  useEffect(() => {
    const handleWindowScroll = () => {
      if (
        window.scrollY < 100 &&
        visibleCount < allMessages.length &&
        !isBatchLoading
      ) {
        setIsBatchLoading(true);
        const prevHeight = document.documentElement.scrollHeight;
        setTimeout(() => {
          setVisibleCount((prev) =>
            Math.min(prev + BATCH_SIZE, allMessages.length)
          );
          setTimeout(() => {
            const newHeight = document.documentElement.scrollHeight;
            window.scrollTo({
              top: window.scrollY + (newHeight - prevHeight),
              behavior: "smooth",
            });
            setIsBatchLoading(false);
          }, 100);
        }, 300);
      }
    };

    window.addEventListener("scroll", handleWindowScroll);
    return () => window.removeEventListener("scroll", handleWindowScroll);
  }, [visibleCount, allMessages, isBatchLoading]);

  const visibleMessages = allMessages.slice(-visibleCount);

  if (errorMessage)
    return <p style={{ color: "red" }}>{errorMessage}</p>;

  let chatPartner = null;
  if (currentUser) {
    const partnerIds = Object.keys(users).filter(
      (id) => String(id) !== String(currentUser.id)
    );
    if (partnerIds.length > 0) {
      chatPartner = users[partnerIds[0]];
    }
  }

  const chatInputStyle = {
    position: "fixed",
    left: 0,
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 20px",
    background: "inherit",
    zIndex: 1000,
    bottom: footerVisible ? `${footerHeight}px` : "0px",
    transition: "bottom 0.3s ease",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  };

  const textareaStyle = {
    flex: 1,
    minHeight: "40px",
    maxHeight: "300px",
    padding: "5px 10px",
    borderRadius: "5px",
    border: "1px solid",
    fontSize: "14px",
    resize: "none",
    overflow: "hidden",
  };

  return (
    <div className="chat-container">
      <h2>{chatPartner ? chatPartner.username : `Chat ${chatId}`}</h2>
      <div>
        {isBatchLoading && (
          <div className="loader">
            <div className="spinner"></div>
          </div>
        )}
        {visibleMessages.length > 0 ? (
          visibleMessages.map((msg, index) => {
            const isMyMessage =
              currentUser && String(msg.user) === String(currentUser.id);
            const showHeader =
              index === 0 ||
              visibleMessages[index - 1].user !== msg.user;
            const currentMsgDate = new Date(msg.uploaded_at).toLocaleDateString();
            const prevMsgDate =
              index > 0
                ? new Date(visibleMessages[index - 1].uploaded_at).toLocaleDateString()
                : null;
            const showDateSeparator =
              index === 0 || prevMsgDate !== currentMsgDate;
            return (
              <React.Fragment key={msg.id}>
                {showDateSeparator && (
                  <div
                    className="date-separator"
                    style={{
                      textAlign: "center",
                      margin: "10px 0",
                      fontWeight: "bold",
                    }}
                  >
                    {currentMsgDate}
                  </div>
                )}
                <div
                  className={`message-item ${
                    isMyMessage ? "my-message" : ""
                  } fade-in`}
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: isMyMessage ? "row-reverse" : "row",
                    alignItems: "flex-start",
                    marginBottom: "15px",
                  }}
                >
                  {!isMyMessage &&
                    showHeader &&
                    users[msg.user] &&
                    users[msg.user].avatar_base64 && (
                      <img
                        src={`data:image/png;base64,${users[msg.user].avatar_base64}`}
                        alt="avatar"
                        className="avatar"
                      />
                    )}
                  <div className="message-bubble">
                    {showHeader && (
                      <div className="message-header">
                        <strong>
                          {users[msg.user]
                            ? users[msg.user].username
                            : "Unknown"}
                        </strong>
                      </div>
                    )}
                    {msg.media?.file_url && (
                      <div className="message-file">
                        {msg.media.file_url.match(/\.(jpg|png|gif|jpeg)$/) ? (
                          <img
                            src={msg.media.file_url}
                            alt="media"
                            className="media-image"
                          />
                        ) : msg.media.file_url.match(/\.(mp4|webm)$/) ? (
                          <video controls className="message-video">
                            <source
                              src={msg.media.file_url}
                              type="video/mp4"
                            />
                            Your browser does not support the video element.
                          </video>
                        ) : msg.media.file_url.match(/\.(mp3|wav)$/) ? (
                          <audio controls className="message-audio">
                            <source
                              src={msg.media.file_url}
                              type="audio/mp3"
                            />
                            Your browser does not support the audio element.
                          </audio>
                        ) : (
                          <a
                            href={msg.media.file_url}
                            download
                            className="file-download"
                          >
                            Download file
                          </a>
                        )}
                      </div>
                    )}
                    <div className="message-text">{msg.text}</div>
                    <div
                      className="timestamp"
                      style={{
                        fontSize: "0.8em",
                        color: "#999",
                        marginTop: "5px",
                      }}
                    >
                      {new Date(msg.uploaded_at).toLocaleString()}
                    </div>
                  </div>
                  {isMyMessage &&
                    showHeader &&
                    users[msg.user] &&
                    users[msg.user].avatar_base64 && (
                      <img
                        src={`data:image/png;base64,${users[msg.user].avatar_base64}`}
                        alt="avatar"
                        className="avatar"
                      />
                    )}
                </div>
              </React.Fragment>
            );
          })
        ) : (
          <p>No messages.</p>
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* Message input form */}
      <form onSubmit={handleSendMessage} className="chat-input" style={chatInputStyle}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            autoResize(e);
          }}
          placeholder="Enter a message..."
          style={textareaStyle}
          className="chat-textarea"
        />
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="chat-file-input"
          style={{
            width: "80px",
            padding: "5px 10px",
            borderRadius: "5px",
            border: "1px solid",
            fontSize: "14px",
          }}
        />
        <button
          type="submit"
          className="chat-send-button"
          style={{
            padding: "5px 10px",
            borderRadius: "5px",
            border: "1px solid",
            fontSize: "14px",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatMessages;
