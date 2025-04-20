import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import '../css/Payment.css';

const API_URL = process.env.REACT_APP_API_URL;

const Payment = () => {
  const [selectedOption, setSelectedOption] = useState("");
  const [loading, setLoading] = useState(false);  
  const [cancelLoading, setCancelLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      document.body.classList.add(savedTheme);
    } else {
      document.body.classList.add("light");
    }
  }, []);

  const handlePayment = async () => {
    const token = localStorage.getItem("token");

    if (!selectedOption) {
      alert("Please select a payment option.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/payment/stripe/checkout_session/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ option: selectedOption }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Error: " + (data.error || "Unknown error"));
        setLoading(false);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again later.");
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    const token = localStorage.getItem("token");
  
    setCancelLoading(true);
  
    try {
      const response = await fetch(`${API_URL}/api/payment/stripe/cancel/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        }
      });
  
      const data = await response.json();
  
      if (response.ok) {
        alert(data.message);
      } else {
        alert("Error: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while canceling the subscription.");
    }
  
    setCancelLoading(false);
  };  

  return (
    <div className="container">
      <h2>Choose a payment option</h2>
      <div className="options">
        <label className="option">
          <span className="option-text">One-Time Payment</span>
          <input
            type="radio"
            value="one_time"
            checked={selectedOption === "one_time"}
            onChange={() => setSelectedOption("one_time")}
          />
        </label>
        <label className="option">
          <span className="option-text">1 Week Subscription</span>
          <input
            type="radio"
            value="one_week"
            checked={selectedOption === "one_week"}
            onChange={() => setSelectedOption("one_week")}
          />
        </label>
        <label className="option">
          <span className="option-text">1 Month Subscription</span>
          <input
            type="radio"
            value="one_month"
            checked={selectedOption === "one_month"}
            onChange={() => setSelectedOption("one_month")}
          />
        </label>
      </div>
      <button onClick={handlePayment} disabled={loading} className="button">
        {loading ? "Redirecting..." : "Pay"}
      </button>

      <hr style={{ margin: "20px 0" }} />

      <button onClick={handleCancelSubscription} disabled={cancelLoading} className="button cancel-button">
        {cancelLoading ? "Cancelling..." : "Cancel Subscription"}
      </button>
    </div>
  );
};

export default Payment;
