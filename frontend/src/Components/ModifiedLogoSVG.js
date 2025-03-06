import React, { useEffect, useState } from "react";
import logo from "../logo.svg";

const useTheme = () => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    const checkTheme = () => {
      const newTheme = localStorage.getItem("theme") || "light";
      if (newTheme !== theme) {
        setTheme(newTheme);
      }
    };

    const intervalId = setInterval(checkTheme, 500);
    return () => clearInterval(intervalId);
  }, [theme]);

  return theme;
};

const useCachedLogos = () => {
  const [logos, setLogos] = useState({ light: "", dark: "" });

  useEffect(() => {
    let lightBlobUrl = "";
    let darkBlobUrl = "";

    fetch(logo)
      .then((response) => response.text())
      .then((data) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, "image/svg+xml");

        const gradient = doc.querySelector("#grad1");
        if (!gradient) throw new Error("Gradient not found in SVG");

        const stops = gradient.querySelectorAll("stop");
        if (stops.length < 2) throw new Error("Not enough gradient stops");

        // Create a light version
        stops[0].setAttribute("stop-color", "#3a80ff");
        stops[1].setAttribute("stop-color", "#ffffff");
        const lightSvg = new XMLSerializer().serializeToString(doc.documentElement);
        const lightBlob = new Blob([lightSvg], { type: "image/svg+xml;charset=utf-8" });
        lightBlobUrl = URL.createObjectURL(lightBlob);

        // Create a dark version
        stops[0].setAttribute("stop-color", "#ff00ff");
        stops[1].setAttribute("stop-color", "#300040");
        const darkSvg = new XMLSerializer().serializeToString(doc.documentElement);
        const darkBlob = new Blob([darkSvg], { type: "image/svg+xml;charset=utf-8" });
        darkBlobUrl = URL.createObjectURL(darkBlob);

        setLogos({ light: lightBlobUrl, dark: darkBlobUrl });
      })
      .catch((error) => console.error("Error loading SVG:", error));

    return () => {
      if (lightBlobUrl) URL.revokeObjectURL(lightBlobUrl);
      if (darkBlobUrl) URL.revokeObjectURL(darkBlobUrl);
    };
  }, []);

  return logos;
};

const ModifiedLogoSVG = () => {
  const theme = useTheme();
  const logos = useCachedLogos();
  const [visibleLogo, setVisibleLogo] = useState("");

  useEffect(() => {
    if (logos.light && logos.dark) {
      setVisibleLogo(theme === "dark" ? logos.dark : logos.light);
    }
  }, [logos, theme]);

  return (
    <div className="logo-icon" style={{ position: "relative" }}>
      {logos.light && logos.dark && (
        <>
          <img
            src={logos.light}
            alt="Light Logo"
            style={{
              position: "absolute",
              transition: "opacity 0.5s ease-in-out",
              opacity: theme === "light" ? 1 : 0,
              width: "100%",
              height: "100%",
            }}
          />
          <img
            src={logos.dark}
            alt="Dark Logo"
            style={{
              position: "absolute",
              transition: "opacity 0.5s ease-in-out",
              opacity: theme === "dark" ? 1 : 0,
              width: "100%",
              height: "100%",
            }}
          />
        </>
      )}
    </div>
  );
};

export default ModifiedLogoSVG;
