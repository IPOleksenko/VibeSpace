import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../css/AuthForm.css";

const API_URL = process.env.REACT_APP_API_URL;

const AuthForm = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState({ name: "United States", code: "+1" });
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    phone: "",
    avatar: null,
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarError, setAvatarError] = useState("");
  const [regError, setRegError] = useState("");
  const countryCodeRef = useRef(null);
  const [paddingLeft, setPaddingLeft] = useState(50);

  const navigate = useNavigate();

  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all")
      .then((response) => response.json())
      .then((data) => {
        const countryList = data
          .map((country) => ({
            name: country.name.common,
            code: country.idd?.root ? country.idd.root + (country.idd.suffixes?.[0] || "") : null,
          }))
          .filter((c) => c.code !== null)
          .sort((a, b) => a.name.localeCompare(b.name));

        setCountries(countryList);
      })
      .catch((error) => console.error("Error fetching country data:", error));
  }, []);

  useEffect(() => {
    if (countryCodeRef.current) {
      setPaddingLeft(countryCodeRef.current.offsetWidth + 20);
    }
  }, [selectedCountry]);

  // Create avatar preview when a file is selected
  useEffect(() => {
    if (formData.avatar) {
      const objectUrl = URL.createObjectURL(formData.avatar);
      setAvatarPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setAvatarPreview(null);
    }
  }, [formData.avatar]);

  const handlePhoneChange = (e) => {
    setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") });
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setShowCountryDropdown(false);
  };

  // Custom handler to allow only image files
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setFormData({ ...formData, avatar: file });
        setAvatarError("");
      } else {
        setAvatarError("Invalid file format. Please upload an image.");
        setFormData({ ...formData, avatar: null });
      }
    }
  };

  const handleSignUp = async () => {
    const dataToSend = new FormData();
    dataToSend.append("email", formData.email);
    dataToSend.append("username", formData.username);
    dataToSend.append("password", formData.password);
    dataToSend.append("confirmPassword", formData.confirmPassword);
    dataToSend.append("phone", selectedCountry.code + formData.phone);
    if (formData.avatar) {
      dataToSend.append("avatar", formData.avatar);
    }

    try {
      const response = await fetch(`${API_URL}/api/users/`, {
        method: "POST",
        body: dataToSend,
      });
      const data = await response.json();
      if (response.ok) {
        console.log("Registration successful:", data);
        navigate("/");
      } else {
        console.error("Registration error:", data);
        setRegError(data.error || data.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Error during registration API call:", error);
      setRegError("Error during registration API call.");
    }
  };

  // Login function sends JSON (no file transmission required)
  const handleLogIn = async () => {
    console.log("Logging...");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setRegError(""); // clearing error message before sending
    // Depending on the mode, call registration or login
    if (isRegistering) {
      handleSignUp();
    } else {
      handleLogIn();
    }
  };

  const handleGoogleLogin = () => {
    console.log("Logging in with Google...");
    // Google login (OAuth) handling goes here
  };

  return (
    <div className="auth-container">
      <h2>{isRegistering ? "Register" : "Login"}</h2>
      {regError && <div className="error-message">{regError}</div>}
      <form onSubmit={handleSubmit}>
        {/* Email Field */}
        <div className="input-group">
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        {/* Registration-only Fields */}
        {isRegistering && (
          <>
            {/* Username Field */}
            <div className="input-group">
              <input
                type="text"
                placeholder="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
          </>
        )}
        {/* Password Field */}
        <div className="input-group">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <span className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? "🔓" : "🔒"}
          </span>
        </div>
        {isRegistering && (
          <>
            {/* Confirm Password Field */}
            <div className="input-group">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
              <span className="toggle-password" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? "🔓" : "🔒"}
              </span>
            </div>
            {/* Phone Number Field */}
            <div className="input-group phone-group" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                className="country-code"
                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                ref={countryCodeRef}
              >
                {selectedCountry.code}
              </button>
              {showCountryDropdown && (
                <div className="dropdown">
                  {countries.map((country) => (
                    <div
                      key={country.code}
                      className="dropdown-item"
                      onClick={() => handleCountrySelect(country)}
                    >
                      {country.name} ({country.code})
                    </div>
                  ))}
                </div>
              )}
              <input
                type="tel"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handlePhoneChange}
                required
                style={{ flex: "1", paddingLeft: `${paddingLeft}px` }}
              />
            </div>
            {/* Avatar Upload Field */}
            <div className="avatar-upload input-group">
              <label htmlFor="avatarUpload">Upload Avatar</label>
              <input
                id="avatarUpload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
              />
              {avatarError && <div className="error-message">{avatarError}</div>}
            </div>
            {avatarPreview && (
              <div className="avatar-preview">
                <img
                  src={avatarPreview}
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
          </>
        )}
        <button type="submit" className="neon-button">
          {isRegistering ? "Sign Up" : "Log In"}
        </button>
        {!isRegistering && (
          <button type="button" className="neon-button google" onClick={handleGoogleLogin}>
            Sign in with Google
          </button>
        )}
      </form>
      <button className="neon-button register" onClick={() => setIsRegistering(!isRegistering)}>
        {isRegistering ? "Back to Login" : "Register"}
      </button>
    </div>
  );
};

export default AuthForm;
