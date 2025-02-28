import React, { useState, useEffect } from "react";
import "../css/Header.css";
import logoIcon from "../logo.svg";

const Header = () => {
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState("up");
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDifference = currentScrollY - lastScrollY;

      if (scrollDifference > 0) {
        setScrollDirection("down");
      } else {
        setScrollDirection("up");
      }

      setOffset((prev) => Math.max(0, Math.min(prev + scrollDifference, 120)));

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <header
      className="header"
      style={{
        transform: `translateY(${-offset}px)`,
        transition: "transform 0.3s ease-out",
      }}
    >
      <div className="header-content">
        <img src={logoIcon} alt="VibeSpace Icon" className="logo-icon" />
        <h1 className="logo">VibeSpace</h1>
      </div>
    </header>
  );
};

export default Header;
