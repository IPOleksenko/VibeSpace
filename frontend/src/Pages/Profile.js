import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../css/Profile.css";

const API_URL = process.env.REACT_APP_API_URL;

const Profile = () => {
  const { id } = useParams(); // ID of the viewed profile
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserLoading, setCurrentUserLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetching the viewed profile data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${API_URL}/api/accounts/user/${id}`);
        const data = await response.json();
        if (response.ok) {
          setUser(data);
          setError(null);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError("Error: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  // Fetching the currently authenticated user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch(`${API_URL}/api/accounts/user/`, {
          method: "GET",
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
      } finally {
        setCurrentUserLoading(false);
      }
    };

    if (localStorage.getItem("token")) {
      fetchCurrentUser();
    } else {
      setCurrentUserLoading(false);
    }
  }, []);

  // Checking subscription status
  const checkSubscriptionStatus = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `${API_URL}/api/subscriptions/?subscribed_to=${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        }
      );
      const data = await response.json();
      if (response.ok) {
        setSubscriptionStatus(data);
        console.log("Subscription status:", data);
      } else {
        console.error("Error fetching subscription status:", data);
      }
    } catch (err) {
      console.error("Error checking subscription:", err);
    }
  };

  // Call subscription status check after loading profile
  useEffect(() => {
    if (localStorage.getItem("token")) {
      checkSubscriptionStatus();
    }
  }, [id]);

  // Subscribe function
  const handleSubscribe = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_URL}/api/subscriptions/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ subscribed_to: id }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log("Subscription added successfully", data);
        checkSubscriptionStatus();
      } else {
        console.error("Subscription error:", data);
      }
    } catch (err) {
      console.error("Error subscribing:", err);
    }
  };

  // Unsubscribe function
  const handleUnsubscribe = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_URL}/api/subscriptions/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ subscribed_to: id }),
      });
      if (response.ok) {
        console.log("Subscription deleted successfully");
        checkSubscriptionStatus();
      } else {
        const data = await response.json();
        console.error("Unsubscription error:", data);
      }
    } catch (err) {
      console.error("Error unsubscribing:", err);
    }
  };

  // Function to create a chat
  const handleCreateChat = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_URL}/api/chats/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ users: [currentUser.id, user.id] }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log("Chat created successfully", data);
        navigate(`/chats/${data.id}`);
      } else {
        console.error("Error creating chat:", data);
      }
    } catch (err) {
      console.error("Error creating chat:", err);
    }
  };

  // Function to get avatar source
  const getAvatarSrc = (avatarBase64) => {
    if (!avatarBase64) return null;
    if (avatarBase64.startsWith("data:image")) {
      return avatarBase64;
    }
    return `data:image/jpeg;base64,${avatarBase64}`;
  };

  // Determine if the viewed profile belongs to the current user
  const isOwnProfile =
    currentUser && user && parseInt(currentUser.id, 10) === parseInt(user.id, 10);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="profile-page-container">
      <h2 className="profile-username">
        {user.username} (ID: {user.id})
      </h2>
      <div className="profile-details">
        {user.avatar_base64 && (
          <img
            src={getAvatarSrc(user.avatar_base64)}
            alt={user.username}
            className="profile-avatar"
          />
        )}
      </div>
      {/* Subscription actions */}
      {!currentUserLoading && (!currentUser || !isOwnProfile) && (
        <div className="subscription-actions">
          {subscriptionStatus ? (
            subscriptionStatus.is_subscribed ? (
              <button onClick={handleUnsubscribe}>Unsubscribe</button>
            ) : subscriptionStatus.is_subscribed_back ? (
              <button onClick={handleSubscribe}>Add as Friend</button>
            ) : (
              <button onClick={handleSubscribe}>Subscribe</button>
            )
          ) : (
            <button onClick={handleSubscribe}>Subscribe</button>
          )}
        </div>
      )}
      {/* The chat button appears only if:
            - the current user exists and is not viewing their own profile,
            - subscriptions are mutual (is_subscribed && is_subscribed_back) */}
      {!currentUserLoading &&
        currentUser &&
        !isOwnProfile &&
        subscriptionStatus &&
        subscriptionStatus.is_subscribed &&
        subscriptionStatus.is_subscribed_back && (
          <div className="chat-actions">
            <button onClick={handleCreateChat}>Start Chat</button>
          </div>
        )}
    </div>
  );
};

export default Profile;
