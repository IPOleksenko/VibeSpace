import React, { useState, useEffect, useRef } from "react";
import "../css/Header.css";
import logoIcon from "../logo.svg";

const API_URL = process.env.REACT_APP_API_URL;

const Header = () => {
  const [lastScrollY, setLastScrollY] = useState(0);
  const [offset, setOffset] = useState(0);
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [swapped, setSwapped] = useState(false);
  // States to store offsets applied to elements
  const [avatarTranslation, setAvatarTranslation] = useState(0);
  const [nameTranslation, setNameTranslation] = useState(0);

  // Refs for accessing DOM elements
  const containerRef = useRef(null);
  const avatarRef = useRef(null);
  const nameRef = useRef(null);

  // Save initial positions (relative to the container) on the first render
  const initialAvatarOffsetRef = useRef(0);
  const initialNameOffsetRef = useRef(0);

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/api/user/`, {
          method: "GET",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        } else {
          console.error("Failed to fetch user data");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  // Measure initial positions of elements relative to the container after user data is loaded
  useEffect(() => {
    if (user && containerRef.current && avatarRef.current && nameRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const avatarRect = avatarRef.current.getBoundingClientRect();
      const nameRect = nameRef.current.getBoundingClientRect();
      initialAvatarOffsetRef.current = avatarRect.left - containerRect.left;
      initialNameOffsetRef.current = nameRect.left - containerRect.left;
    }
  }, [user]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDiff = currentScrollY - lastScrollY;
      setOffset((prev) => Math.max(0, Math.min(prev + scrollDiff, 120)));
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const toggleTheme = () => {
    if (!containerRef.current || !avatarRef.current || !nameRef.current) {
      setTheme((prev) => (prev === "dark" ? "light" : "dark"));
      setSwapped((prev) => !prev);
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const leftPadding = 20; // corresponds to padding-left in CSS
    const rightPadding = 20; // corresponds to padding-right in CSS

    const avatarWidth = avatarRef.current.getBoundingClientRect().width;
    const nameWidth = nameRef.current.getBoundingClientRect().width;

    let avatarTarget, nameTarget;
    if (!swapped) {
      // Initially: name on the left, avatar on the right.
      // Swap: move avatar to the left edge, move name to the right edge.
      avatarTarget = leftPadding;
      nameTarget = containerWidth - rightPadding - nameWidth;
    } else {
      // Reverse swap: move avatar to the right edge, move name to the left edge.
      avatarTarget = containerWidth - rightPadding - avatarWidth;
      nameTarget = leftPadding;
    }

    // Calculate new offsets relative to the initially measured positions
    const newAvatarTranslation =
      avatarTarget - initialAvatarOffsetRef.current;
    const newNameTranslation = nameTarget - initialNameOffsetRef.current;

    // Update state
    setAvatarTranslation(newAvatarTranslation);
    setNameTranslation(newNameTranslation);

    // Toggle theme and swapped state
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    setSwapped((prev) => !prev);
  };

  return (
    <header
      className={`header ${theme}`}
      style={{
        transform: `translateY(${-offset}px)`,
        transition: "transform 0.3s ease-out",
      }}
    >
      <div className="header-content">
      <div className="logo-container" style = {{display: "flex"}}>
        <img src={logoIcon} alt="VibeSpace Icon" className="logo-icon" />
        <h1 className="logo">VibeSpace</h1>
      </div>
        {user && (
          <div
            ref={containerRef}
            className="user-info"
            onClick={toggleTheme}
            style={{ cursor: "pointer", position: "relative" }}
          >
            <span
              ref={nameRef}
              className="user-name"
              style={{
                transform: `translateX(${nameTranslation}px)`,
                transition: "transform 0.5s ease-out",
              }}
              title={user.username}
            >
              {user.username.length > 18
                ? user.username.slice(0, 18) + "..."
                : user.username}
            </span>
            {user.avatar_base64 && (
              <div
                ref={avatarRef}
                className="avatar-wrapper"
                style={{
                  transform: `translateX(${avatarTranslation}px)`,
                  transition: "transform 0.5s ease-out",
                }}
              >
                <img
                  className="user-avatar"
                  src={`data:image/png;base64,${user.avatar_base64}`}
                  alt="User Avatar"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
