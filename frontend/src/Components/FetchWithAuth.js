const API_URL = process.env.REACT_APP_API_URL;

const FetchWithAuth = async () => {
    const token = localStorage.getItem("token");

    if (!token) return Promise.resolve();

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
            if (response.status === 403 && data.forceLogout) {
                handleLogout();
            }
        }
    } catch (error) {
        console.error("Error checking user status:", error);
    }

    return Promise.resolve();
};

const handleLogout = () => {
    alert("Your account has been deactivated. You will be logged out.");
    localStorage.removeItem("token");
    window.location.href = "/auth"; 
};

const monitorUserStatus = () => {
    FetchWithAuth();
    setInterval(() => FetchWithAuth().catch(console.error), 30000);
};

// Start background user status check
monitorUserStatus();

// Track changes in `localStorage`
window.addEventListener("storage", (event) => {
    if (event.key === "token" && !event.newValue) {
        window.location.href = "/auth";
    }
});

export default FetchWithAuth;
