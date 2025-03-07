import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Menu.css";

const API_URL = process.env.REACT_APP_API_URL;

const Menu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/api/user/`, {
        method: "GET",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.id) {
            setUserId(data.id);
          }
        })
        .catch((error) => console.error("Error fetching user ID:", error));
    }
  }, [token]);

  if (!token) {
    return null;
  }

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  const handleNavigation = (page) => {
    navigate(`/${page.toLowerCase()}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="menu-wrapper">
      <button className="menu-toggle" onClick={toggleMenu}>
        ☰
      </button>
      {isOpen && (
        <div className="menu">
          <button className="menu-item" onClick={() => handleNavigation("Chats")}>
            Chats
          </button>
          <button className="menu-item" onClick={() => handleNavigation("Profile")}>
            Search User
          </button>
          {userId && (
            <button className="menu-item" onClick={() => navigate(`/profile/${userId}`)}>
              My Profile
            </button>
          )}
          <button className="menu-item" onClick={() => handleNavigation("Settings")}>
            Settings
          </button>
          <button className="menu-item" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default Menu;
