const API_URL = process.env.REACT_APP_API_URL;

// Function to handle logout
const handleLogout = (message) => {
  alert(message);
  localStorage.removeItem("token");
  window.location.href = "/auth";
};

// Function to check for the presence of a token in localStorage
const checkAuthToken = () => {
  if (window.location.pathname === "/auth") return; // Do not check on the authentication page
  const token = localStorage.getItem("token");
  if (!token) {
    handleLogout("You are not logged in.");
  }
};

// Function to check the user's status
const checkUserStatus = async () => {
  if (window.location.pathname === "/auth") return;
  const token = localStorage.getItem("token");
  if (!token) return;
  try {
    const response = await fetch(`${API_URL}/api/user/`, {
      method: "GET",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      const data = await response.json();
      if (response.status === 401) {
        handleLogout("Unauthorized: You have been logged out due to invalid login credentials.");
      } else if (response.status === 403 && data.forceLogout) {
        handleLogout("Your account has been deactivated. You will be logged out.");
      }
    }
  } catch (error) {
    console.error("Error checking user status:", error);
  }
};

// Start checking for token presence
const monitorToken = () => {
  checkAuthToken();
  setInterval(checkAuthToken, 5000);
};

// Start checking user status
const monitorUserStatus = () => {
  checkUserStatus();
  setInterval(() => {
    checkUserStatus().catch(console.error);
  }, 30000);
};

// Start background checks
monitorToken();
monitorUserStatus();

// Listen for changes in localStorage (e.g., token deletion in another tab)
window.addEventListener("storage", (event) => {
  if (event.key === "token" && !event.newValue) {
    window.location.href = "/auth";
  }
});

export { checkAuthToken, checkUserStatus };
