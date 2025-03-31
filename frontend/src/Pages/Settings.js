import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL;
const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;

const Settings = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [oldAvatarPreview, setOldAvatarPreview] = useState(null);
  const [newAvatarPreview, setNewAvatarPreview] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [googleAccount, setGoogleAccount] = useState(null);

  const navigate = useNavigate();

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch(`${API_URL}/api/accounts/user/`, {
          method: "GET",
          headers: {
            Authorization: `Token ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUsername(data.username || "");
          setEmail(data.email || "");
          setPhoneNumber(data.phone_number || "");
          if (data.avatar_base64) {
            setOldAvatarPreview(`data:image/png;base64,${data.avatar_base64}`);
          } else if (data.avatar_url) {
            setOldAvatarPreview(data.avatar_url);
          }
        } else {
          const errorData = await response.json();
          setError(errorData);
        }
      } catch (err) {
        setError("Error fetching user data");
      }
    };

    fetchUserData();
  }, []);

  // Fetch linked Google account via endpoint api/accounts/google/get/
  useEffect(() => {
    const fetchGoogleAccount = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch(`${API_URL}/api/accounts/google/get/`, {
          method: "GET",
          headers: {
            Authorization: `Token ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          // The server is expected to return an object like { google_id: "..." }
          if (data.google_id) {
            setGoogleAccount(data.google_id);
          } else {
            setGoogleAccount(null);
          }
        }
      } catch (err) {
        console.error("Error fetching linked Google account", err);
      }
    };

    fetchGoogleAccount();
  }, []);

  // Create preview for the new file
  useEffect(() => {
    if (avatar) {
      const objectUrl = URL.createObjectURL(avatar);
      setNewAvatarPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setNewAvatarPreview(null);
    }
  }, [avatar]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setAvatar(file);
        setError(null);
      } else {
        setError("Invalid file format. Please upload an image.");
        setAvatar(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !phoneNumber) {
      setError("Email and Phone Number are required.");
      return;
    }

    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    formData.append("phone_number", phoneNumber);
    if (password) {
      formData.append("password", password);
    }
    if (avatar) {
      formData.append("avatar", avatar);
    }

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/api/accounts/update/`, {
        method: "PUT",
        headers: {
          Authorization: `Token ${token}`,
        },
        body: formData,
      });
      if (response.ok) {
        setMessage("User data updated successfully");
        if (newAvatarPreview) {
          setOldAvatarPreview(newAvatarPreview);
          setAvatar(null);
          setNewAvatarPreview(null);
        }
        // Reload the page or update data
        window.location.reload();
      } else {
        const data = await response.json();
        setError(data);
      }
    } catch (err) {
      setError("Error updating user data");
    }
  };

  // Function to obtain Google User ID and link account
  const handleGoogleId = () => {
    if (!CLIENT_ID) {
      setError("Missing client_id. Please check the REACT_APP_CLIENT_ID variable in the .env file.");
      return;
    }
    if (!window.google) {
      setError("Google API not loaded");
      return;
    }
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: "https://www.googleapis.com/auth/userinfo.profile",
      callback: (response) => {
        if (response.error) {
          setError("Google authorization error");
        } else {
          fetchGoogleUserId(response.access_token);
        }
      },
    });
    client.requestAccessToken();
  };

  // Request to Google API to fetch data and link account via POST
  const fetchGoogleUserId = async (accessToken) => {
    try {
      const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const googleId = data.sub;
        console.log("Google User ID:", googleId);
        const backendToken = localStorage.getItem("token");
        const linkResponse = await fetch(`${API_URL}/api/accounts/google/link/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${backendToken}`,
          },
          body: JSON.stringify({ google_id: googleId }),
        });
        if (linkResponse.ok) {
          setMessage("Google account linked successfully.");
          setGoogleAccount(googleId);
        } else {
          const errData = await linkResponse.json();
          setError(errData);
        }
      } else {
        setError("Failed to fetch Google user data");
      }
    } catch (error) {
      setError("Error fetching Google user data");
    }
  };

  // Function to unlink Google account via DELETE request
  const handleUnlink = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_URL}/api/accounts/google/unlink/`, {
        method: "DELETE",
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      if (response.ok) {
        setMessage("Google account unlinked successfully.");
        setGoogleAccount(null);
      } else {
        const errData = await response.json();
        setError(errData);
      }
    } catch (error) {
      setError("Error unlinking Google account");
    }
  };

  const displayedAvatar = newAvatarPreview || oldAvatarPreview;

  return (
    <div>
      <h2>Update Settings</h2>
      {error && <div style={{ color: "red" }}>{JSON.stringify(error)}</div>}
      {message && <div style={{ color: "green" }}>{message}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username: </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
          />
        </div>
        <div>
          <label>Email: </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
        </div>
        <div>
          <label>Phone Number: </label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter your phone number"
          />
        </div>
        <div>
          <label>Password: </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password (if you want to change)"
          />
        </div>
        <div>
          <label>Avatar: </label>
          <input type="file" onChange={handleAvatarChange} accept="image/*" />
        </div>
        {displayedAvatar && (
          <div style={{ margin: "10px 0" }}>
            <img
              src={displayedAvatar}
              alt="Avatar Preview"
              style={{
                width: "100px",
                height: "100px",
                objectFit: "cover",
                borderRadius: "50%",
              }}
            />
          </div>
        )}
        <button type="submit">Update</button>
      </form>
      {/* Block for managing linked Google account */}
      <div style={{ marginTop: "20px" }}>
        {googleAccount ? (
          <>
            <div style={{ marginBottom: "10px", color: "blue" }}>
              Linked Google account: {googleAccount}
            </div>
            <button type="button" onClick={handleUnlink}>
              Unlink account
            </button>
          </>
        ) : (
          <button type="button" onClick={handleGoogleId}>
            Obtain and send Google User ID
          </button>
        )}
      </div>
    </div>
  );
};

export default Settings;
