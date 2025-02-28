import React, { useState, useEffect, useRef } from "react";
import "../css/Body.css";

const Body = ({ children }) => {
  const [headerHeight, setHeaderHeight] = useState(80);
  const canvasRef = useRef(null);
  const stars = useRef([]);

  useEffect(() => {
    const header = document.querySelector(".header");
    if (header) {
      setHeaderHeight(header.offsetHeight);
    }

    const handleResize = () => {
      if (header) {
        setHeaderHeight(header.offsetHeight);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createStar = () => {
      return {
        x: Math.random() * canvas.width,
        y: -10,
        size: Math.random() * 3 + 2,
        speed: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.5,
      };
    };

    const updateStars = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(255, 0, 255, 0.8)";

      stars.current.forEach((star, index) => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 0, 255, ${star.opacity})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(255, 0, 255, 0.8)";
        ctx.fill();

        star.y += star.speed;
        if (star.y > canvas.height) {
          stars.current[index] = createStar();
        }
      });

      requestAnimationFrame(updateStars);
    };

    resizeCanvas();
    stars.current = Array.from({ length: 50 }, createStar);
    updateStars();

    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  return (
    <div className="body-container">
      <canvas ref={canvasRef} className="background-canvas"></canvas>
      <div
        className="content"
        style={{
          paddingTop: `${headerHeight}px`,
          marginTop: "20px",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default Body;
