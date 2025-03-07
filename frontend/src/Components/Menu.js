import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Menu.css";

const Menu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

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
