import React from "react";
import "../css/Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <nav className="footer-nav">
        </nav>
        <p>&copy; {new Date().getFullYear()} IPOleksenko. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
