import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Payment.css";

const API_URL = process.env.REACT_APP_API_URL;

const Payment = () => {
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    document.body.classList.add(savedTheme || "light");
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const response = await fetch(`${API_URL}/api/payment/products/`);
        const data = await response.json();
        if (response.ok) {
          setProducts(data);
        } else {
          setErrorMessage(data.message || "No products available.");
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setErrorMessage("Failed to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handlePayment = async () => {
    const token = localStorage.getItem("token");

    if (!selectedProductId) {
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
        body: JSON.stringify({ product_id: selectedProductId }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Error: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again later.");
    } finally {
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
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Choose a payment option</h2>

      <div className="options">
        {loading ? (
          <p>Loading products...</p>
        ) : errorMessage ? (
          <p>{errorMessage}</p>
        ) : products.length > 0 ? (
          products.map((product) => (
            <label key={product.id} className="option">
              <div className="option-text">
                <strong>{product.name}</strong><br />
                <span>{product.description}</span><br />
                <span><em>Type:</em> {product.type === 'one_time' ? 'One-Time Payment' : 'Subscription'}</span><br />
                <span><em>Price:</em> {product.price} USD</span>
              </div>
              <input
                type="radio"
                value={product.id}
                checked={selectedProductId === product.id}
                onChange={() => setSelectedProductId(product.id)}
              />
            </label>
          ))
        ) : (
          <p>No products available.</p>
        )}
      </div>

      <button onClick={handlePayment} disabled={loading} className="button">
        {loading ? "Redirecting..." : "Pay"}
      </button>

      <hr style={{ margin: "20px 0" }} />

      <button onClick={handleCancelSubscription} disabled={cancelLoading} className="button cancel-button">
        {cancelLoading ? "Cancelling..." : "Cancel Subscription"}
      </button>

      {/* Button to navigate to receipts page */}
      <button
        onClick={() => navigate("/success")}
        className="button"
        style={{ marginTop: "20px" }}
      >
        View Receipts
      </button>
    </div>
  );
};

export default Payment;
