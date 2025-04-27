import React, { useEffect, useState, useCallback } from "react";
import "../css/Success.css";

const API_URL = process.env.REACT_APP_API_URL;

const Success = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setError("User not authenticated.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/payment/payments/`, {
        headers: {
          "Authorization": `Token ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.status === 404) {
        setPayments([]);
        return;
      }
      if (!response.ok) {
        throw new Error("Failed to fetch payment receipts.");
      }
      const data = await response.json();
      setPayments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

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
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  if (loading) {
    return (
      <div className={`success-container ${isDarkTheme ? "dark" : ""}`}>
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className={`success-container ${isDarkTheme ? "dark" : ""}`}>
        Error: {error}
      </div>
    );
  }

  return (
    <div className={`success-container ${isDarkTheme ? "dark" : ""}`}>
      <h1>Your Receipts and Invoices:</h1>
      <button onClick={fetchPayments} className="refresh-button">
        🔄 Refresh
      </button>
      {payments.length === 0 ? (
        <p>You don't have any payments yet.</p>
      ) : (
        <ul className="success-list">
          {payments.map((payment) => {
            const isPaymentSuccessful =
              Boolean(payment.receipt_url) || Boolean(payment.invoice_url);
            const isWaitingForReceipt =
              (payment.status.toLowerCase() === "paid" || payment.status.toLowerCase() === "active") &&
              !isPaymentSuccessful;

            return (
              <li key={payment.id} className="success-item">
                <p>
                  <strong>Type:</strong>{" "}
                  {payment.payment_type === "subscription"
                    ? "Subscription"
                    : "One-time Payment"}
                </p>
                <p>
                  <strong>Amount:</strong> {payment.amount}{" "}
                  {payment.currency.toUpperCase()}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(payment.created_at).toLocaleDateString()}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </p>
                {isPaymentSuccessful ? (
                  <div className="success-buttons">
                    {payment.receipt_url && (
                      <a
                        href={payment.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="success-button"
                      >
                        🧾 View Receipt
                      </a>
                    )}
                    {payment.invoice_url && (
                      <a
                        href={payment.invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="success-button secondary"
                      >
                        📄 View Invoice
                      </a>
                    )}
                  </div>
                ) : isWaitingForReceipt ? (
                  <p className="waiting-receipt">
                    ⏳ Receipt is not available yet, please try again later or click "Refresh".
                  </p>
                ) : (
                  <p className="payment-failed">
                    ❌ Payment was not successful.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Success;
