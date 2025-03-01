import React, { useState, useEffect, useRef } from "react";
import "../css/AuthForm.css";

const AuthForm = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState({ name: "United States", code: "+1" });
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const countryCodeRef = useRef(null);
  const [paddingLeft, setPaddingLeft] = useState(50);

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

  const handlePhoneChange = (e) => {
    setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") });
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setShowCountryDropdown(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(isRegistering ? "Registering:" : "Logging in:", {
      ...formData,
      phone: selectedCountry.code + formData.phone,
    });
  };

  const handleGoogleLogin = () => {
    console.log("Logging in with Google...");
    // Here will be the handling of Google login (OAuth)
  };

  const handleSignUp = () => {
    console.log("Registration");
    // Add logic for registration
  };

  const handleLogIn = () => {
    console.log("Login");
    // Add logic for login
  };

  return (
    <div className="auth-container">
      <h2>{isRegistering ? "Register" : "Login"}</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
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
            <div
              className="input-group phone-group"
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >
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
          </>
        )}
        <button
          type="submit"
          className="neon-button"
          onClick={isRegistering ? handleSignUp : handleLogIn}
        >
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
