import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/ProfileSearch.css";

const API_URL = process.env.REACT_APP_API_URL;

const ProfileSearch = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim() !== "") {
        fetchSuggestions(query);
      } else {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const fetchSuggestions = async (query) => {
    try {
      const response = await fetch(
        `${API_URL}/api/user/search/?query=${encodeURIComponent(query)}`
      );
      if (response.ok) {
        const data = await response.json();
        let results = Array.isArray(data) ? data : data ? [data] : [];
        results = results.sort((a, b) => {
          const usernameA = a.username.toLowerCase();
          const usernameB = b.username.toLowerCase();
          const queryLower = query.toLowerCase();
          const indexA = usernameA.indexOf(queryLower);
          const indexB = usernameB.indexOf(queryLower);
          if (indexA === 0 && indexB !== 0) return -1;
          if (indexB === 0 && indexA !== 0) return 1;
          if (indexA !== indexB) return indexA - indexB;
          return usernameA.length - usernameB.length;
        });
        setSuggestions(results);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      setSuggestions([]);
    }
  };

  const getAvatarSrc = (avatarBase64) => {
    if (!avatarBase64) return null;
    if (avatarBase64.startsWith("data:image")) {
      return avatarBase64;
    }
    return `data:image/jpeg;base64,${avatarBase64}`;
  };

  const handleSelect = (user) => {
    navigate(`/profile/${user.id}`);
  };

  return (
    <div className="user-search-container">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter ID or username..."
        className="user-search-input"
      />
      {suggestions.length > 0 && (
        <ul className="user-search-suggestions">
          {suggestions.map((user) => (
            <li
              key={user.id}
              onClick={() => handleSelect(user)}
              className="user-search-suggestion-item"
            >
              <div className="user-search-avatar-container">
                {user.avatar_base64 ? (
                  <img
                    src={getAvatarSrc(user.avatar_base64)}
                    alt={user.username}
                    className="user-search-avatar"
                  />
                ) : null}
              </div>
              <span>{user.username} (ID: {user.id})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProfileSearch;
