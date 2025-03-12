import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL;

const Chats = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetching the current user data
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(`${API_URL}/api/accounts/user/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setCurrentUser(data);
        } else {
          console.error("Error fetching current user:", data);
        }
      } catch (err) {
        console.error("Error fetching current user:", err);
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetching the list of chats the current user participates in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    const fetchChats = async () => {
      try {
        const response = await fetch(`${API_URL}/api/chats/get/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setChats(data);
          console.log("Fetched chats:", data);
        } else {
          console.error("Error fetching chats:", data);
        }
      } catch (err) {
        console.error("Error fetching chats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, []);

  // Fetching user details for chat participants
  useEffect(() => {
    if (!currentUser || chats.length === 0) return;
    const token = localStorage.getItem("token");
    chats.forEach((chat) => {
      const otherUserId = chat.users.find(
        (userId) => Number(userId) !== Number(currentUser.id)
      );
      if (otherUserId && !usersMap[otherUserId]) {
        fetch(`${API_URL}/api/accounts/user/${otherUserId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        })
          .then((response) => response.json())
          .then((data) => {
            setUsersMap((prev) => ({ ...prev, [otherUserId]: data }));
          })
          .catch((err) =>
            console.error(`Error fetching user ${otherUserId}:`, err)
          );
      }
    });
  }, [currentUser, chats, usersMap]);

  const handleChatClick = (chatId) => {
    navigate(`/chats/${chatId}`);
  };

  if (loading) {
    return <div>Loading chats...</div>;
  }

  if (!currentUser) {
    return <div>Please log in to view your chats.</div>;
  }

  return (
    <div>
      <h2>Your Chats</h2>
      {chats.length === 0 ? (
        <div>No chats available.</div>
      ) : (
        <ul>
          {chats.map((chat) => {
            // Finding the second participant's ID
            const otherUserId = chat.users.find(
              (userId) => Number(userId) !== Number(currentUser.id)
            );
            const chatName =
              otherUserId && usersMap[otherUserId]
                ? usersMap[otherUserId].username
                : "Loading...";
            return (
              <li
                key={chat.id}
                onClick={() => handleChatClick(chat.id)}
                style={{ cursor: "pointer", marginBottom: "10px" }}
              >
                {chatName}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Chats;