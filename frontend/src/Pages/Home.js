import React, { useEffect, useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL;

const Home = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const response = await fetch(`${API_URL}/api/user/`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Token ${token}`,
                        "Content-Type": "application/json"
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUser(data);
                } else {
                    console.error("Failed to fetch user data");
                }
            } catch (error) {
                console.error("Error fetching user:", error);
            }
        };

        fetchUser();
    }, []);

    return (
        <div className="home">
            <h1>Home</h1>
            {user ? (
                <div>
                    <p><strong>Username:</strong> {user.username}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Phone:</strong> {user.phone_number}</p>
                    {user.avatar_base64 && (
                        <img
                            src={`data:image/png;base64,${user.avatar_base64}`}
                            alt="User Avatar"
                            style={{ width: "100px", height: "100px", borderRadius: "50%" }}
                        />
                    )}
                </div>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
};

export default Home;
