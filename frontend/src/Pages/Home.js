import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../css/Profile.css";

const API_URL = process.env.REACT_APP_API_URL;

// Slider for media in a post
const MediaSlider = ({ media, renderMediaItem }) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const handlePrevMedia = () => {
    setCurrentMediaIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const handleNextMedia = () => {
    setCurrentMediaIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="media-slider">
      {renderMediaItem(media[currentMediaIndex])}
      <div className="slider-controls">
        <button onClick={handlePrevMedia}>Previous</button>
        <span>
          {currentMediaIndex + 1} / {media.length}
        </span>
        <button onClick={handleNextMedia}>Next</button>
      </div>
    </div>
  );
};

// Function to generate avatar src
const getAvatarSrc = (avatarBase64) => {
  if (!avatarBase64) return null;
  if (avatarBase64.startsWith("data:image")) {
    return avatarBase64;
  }
  return `data:image/jpeg;base64,${avatarBase64}`;
};

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No authorization token!");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/posts/subscriptions/get/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${data.detail || "Unknown error"}`);
        }

        setPosts(data);

        // Get unique author IDs and load their data
        const authorIds = [...new Set(data.map((post) => post.user))];
        authorIds.forEach((authorId) => {
          fetchUserInfo(authorId);
        });
      } catch (error) {
        console.error("Error loading posts:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const fetchUserInfo = async (userId) => {
    if (usersMap[userId]) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/accounts/user/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Error fetching user");
      }

      const userInfo = {
        username: data.username,
        // Use avatar_base64 and getAvatarSrc to generate valid src
        avatar: data.avatar_base64 ? getAvatarSrc(data.avatar_base64) : null,
      };

      setUsersMap((prev) => ({ ...prev, [userId]: userInfo }));
    } catch (error) {
      console.error(`Error fetching data for user ${userId}:`, error.message);
    }
  };

  const getMediaSrc = (media) => {
    if (!media || !media.file_url) return null;
    return media.file_url.startsWith("http")
      ? media.file_url
      : `${API_URL}${media.file_url}`;
  };

  const renderMediaItem = (mediaItem) => {
    const mediaSrc = getMediaSrc(mediaItem);
    if (!mediaSrc) return null;
    const lowerUrl = mediaSrc.toLowerCase();

    if (lowerUrl.match(/\.(jpg|jpeg|png|gif)$/)) {
      return <img src={mediaSrc} alt="Media" className="fixed-media" />;
    } else if (lowerUrl.match(/\.(mp4|webm)$/)) {
      return (
        <video controls className="fixed-media">
          <source
            src={mediaSrc}
            type={`video/${lowerUrl.endsWith(".mp4") ? "mp4" : "webm"}`}
          />
          Your browser does not support video.
        </video>
      );
    } else {
      return (
        <a href={mediaSrc} download className="download-button">
          Download File
        </a>
      );
    }
  };

  return (
    <div className="home-feed-container">
      <h2>Subscription Feed</h2>
      {loading ? (
        <p>Loading...</p>
      ) : posts.length > 0 ? (
        posts.map((post, index) => {
          const authorId = post.user;
          const authorInfo = usersMap[authorId];
          return (
            <div key={post.id} className="post">
              <div className="post-author">
                <Link to={`/profile/${authorId}`} className="author-link">
                  {authorInfo?.avatar && (
                    <img src={authorInfo.avatar} alt="Avatar" className="avatar" />
                  )}
                  <strong>{authorInfo?.username || "Unknown Author"}</strong>
                </Link>
              </div>
              {post.text && <p>{post.text}</p>}

              {post.media && post.media.length > 0 && (
                <div className="post-media">
                  {post.media.length === 1
                    ? renderMediaItem(post.media[0])
                    : <MediaSlider media={post.media} renderMediaItem={renderMediaItem} />}
                </div>
              )}
              <span className="post-date">
                Posted {new Date(post.uploaded_at).toLocaleString()}
              </span>
              {index < posts.length - 1 && <hr className="post-divider" />}
            </div>
          );
        })
      ) : (
        <p>No posts yet</p>
      )}
    </div>
  );
};

export default Home;
