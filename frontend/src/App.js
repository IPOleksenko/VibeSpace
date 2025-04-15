import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from "./Pages/Home";
import PageNotFound from "./Pages/PageNotFound";
import AuthForm from "./Pages/AuthForm";
import Settings from "./Pages/Settings";
import ProfileSearch from "./Pages/ProfileSearch";
import Profile from "./Pages/Profile";
import Chats from "./Pages/Chats";
import ChatMessages from "./Pages/ChatMessages";
import PostsCreate from "./Pages/PostsCreate";
import Payment from "./Pages/Payment";

function App() {
  useEffect(() => {
    const initGapi = () => {
      if (window.gapi) {
        window.gapi.load("auth2", () => {
          window.gapi.auth2.init({
            client_id: process.env.REACT_APP_CLIENT_ID
          });
        });
      }
    };

    initGapi();
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<AuthForm />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<ProfileSearch />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/chats" element={<Chats />} />
        <Route path="/chats/:chatId" element={<ChatMessages />} />
        <Route path="/post/create" element={<PostsCreate />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
}

export default App;
