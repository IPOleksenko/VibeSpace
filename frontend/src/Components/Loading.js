import React, { useState, useEffect } from "react";
import "../css/Loading.css";

const Loading = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkContentLoaded = () => {
      if (document.readyState === "complete") {
        setLoading(false);
      }
    };

    document.addEventListener("readystatechange", checkContentLoaded);
    return () => document.removeEventListener("readystatechange", checkContentLoaded);
  }, []);

  if (!loading) return null;

  return (
    <div className="neon-loader">
      <div className="loader-ring"></div>
      <div className="loader-ring"></div>
      <div className="loader-ring"></div>
      <div className="loader-ring"></div>
    </div>
  );
};

export default Loading;
