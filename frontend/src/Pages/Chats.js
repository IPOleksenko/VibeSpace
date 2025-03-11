import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL;

const Chats = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [fileId, setFileId] = useState(null);
  const [inputFileId, setInputFileId] = useState("");
  const [fileSrc, setFileSrc] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file to upload.");
      return;
    }
    setUploading(true);
    setMessage("");
    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_URL}/api/AWS/S3/upload/`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Token ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(`File uploaded successfully: ${data.file_url}`);
        setFileId(data.data.id);
        setInputFileId(data.data.id);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleGetFile = async () => {
    if (!inputFileId) {
      setMessage("No file to retrieve. Please enter a file id.");
      return;
    }
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_URL}/api/AWS/S3/get/?id=${inputFileId}`, {
        headers: {
          Authorization: `Token ${token}`
        }
      });
      if (!response.ok) {
        const errData = await response.json();
        setMessage(`Error: ${errData.error}`);
        return;
      }
      const blob = await response.blob();
      const fileURL = URL.createObjectURL(blob);
      setFileSrc(fileURL);
      setMessage("File retrieved successfully.");
    } catch (error) {
      setMessage("Failed to retrieve file.");
    }
  };

  const handleDelete = async () => {
    if (!inputFileId) {
      setMessage("No file to delete. Please enter a file id.");
      return;
    }
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_URL}/api/AWS/S3/delete/?id=${inputFileId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Token ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        setFileSrc(null);
        setFileId(null);
        setInputFileId("");
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage("Failed to delete file.");
    }
  };

  return (
    <div>
      <h2>Upload File</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? "Uploading..." : "Upload"}
      </button>
      {message && <p>{message}</p>}
      <div>
        <input
          type="text"
          value={inputFileId}
          onChange={(e) => setInputFileId(e.target.value)}
          placeholder="Enter file id"
        />
        <button onClick={handleGetFile}>Show File</button>
        <button onClick={handleDelete}>Delete File</button>
      </div>
      {fileSrc && <img src={fileSrc} alt="Uploaded File" />}
    </div>
  );
};

export default Chats;
