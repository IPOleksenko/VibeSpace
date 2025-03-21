import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL;

const PostsCreate = () => {
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setError(null);

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("text", text);

    files.forEach(file => {
      formData.append("files", file);
    });

    try {
      const response = await fetch(`${API_URL}/api/posts/create/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setText('');
        setFiles([]);
        console.log("Post created:", data);
      } else {
        setError(data.error || "Error creating post");
        console.error("Error:", data);
      }
    } catch (err) {
      setError("Network error: " + err.message);
      console.error("Network error:", err);
    }
  };

  return (
    <div>
      <h2>Create a Post</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="Enter post text"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <input type="file" multiple onChange={handleFileChange} />

        {files.length > 0 && (
          <ul>
            {files.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
        )}

        <button type="submit">Submit</button>
      </form>
      {success && <p>Post successfully created!</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
    </div>
  );
};

export default PostsCreate;
