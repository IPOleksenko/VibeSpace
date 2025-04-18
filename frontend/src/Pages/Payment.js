import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL;

const Payment = () => {
  const [selectedOption, setSelectedOption] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

  return (
    <div style={styles.container}>
      <h2>Choose a payment option</h2>
      <div style={styles.options}>
        <label style={styles.option}>
          <input
            type="radio"
            value="one_time"
            checked={selectedOption === "one_time"}
            onChange={() => setSelectedOption("one_time")}
          />
          One-Time Payment
        </label>
        <label style={styles.option}>
          <input
            type="radio"
            value="one_week"
            checked={selectedOption === "one_week"}
            onChange={() => setSelectedOption("one_week")}
          />
          1 Week Subscription
        </label>
        <label style={styles.option}>
          <input
            type="radio"
            value="one_month"
            checked={selectedOption === "one_month"}
            onChange={() => setSelectedOption("one_month")}
          />
          1 Month Subscription
        </label>
      </div>
      <button onClick={handlePayment} disabled={loading} style={styles.button}>
        {loading ? "Redirecting..." : "Pay"}
      </button>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "400px",
    margin: "50px auto",
    padding: "20px",
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
    border: "1px solid #ccc",
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
  },
  options: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    margin: "20px 0",
  },
  option: {
    marginBottom: "10px",
    fontSize: "16px",
  },
  button: {
    padding: "10px 20px",
    fontSize: "16px",
    cursor: "pointer",
    backgroundColor: "#6772e5",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
  },
};

export default Payment;
