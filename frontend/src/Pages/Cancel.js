import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Cancel.css";

const Cancel = () => {
  const [seconds, setSeconds] = useState(5);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkTheme = () => {
      setIsDarkTheme(document.body.classList.contains("dark"));
    };

    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (seconds <= 0) {
      navigate("/");
      return;
    }

    const timerId = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timerId);
  }, [seconds, navigate]);

  return (
    <div className={`cancel-container ${isDarkTheme ? "dark" : ""}`}>
      <h1>❌ Payment Failed</h1>
      <p>
        You will be redirected to the home page in{" "}
        <strong>{seconds}</strong> second{seconds === 1 ? "" : "s"}.
      </p>
    </div>
  );
};

export default Cancel;
