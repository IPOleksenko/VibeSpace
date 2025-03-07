import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../css/Profile.css";

const API_URL = process.env.REACT_APP_API_URL;

const Profile = () => {
  const { id } = useParams(); // Get ID from URL
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user data when the component mounts
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Updated request to an endpoint where the backend handles validation
        const response = await fetch(`${API_URL}/api/user/${id}`);
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

  const getAvatarSrc = (avatarBase64) => {
    if (!avatarBase64) return null;
    if (avatarBase64.startsWith("data:image")) {
      return avatarBase64;
    }
    return `data:image/jpeg;base64,${avatarBase64}`;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="profile-page-container">
      <h2 className="profile-username">{user.username} (ID: {user.id})</h2>
      <div className="profile-details">
        {user.avatar_base64 && (
          <img
            src={getAvatarSrc(user.avatar_base64)}
            alt={user.username}
            className="profile-avatar"
          />
        )}
      </div>
    </div>
  );
};

export default Profile;
