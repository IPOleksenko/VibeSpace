import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import RequireAuth from "./Components/RequireAuth";
import FetchWithAuth from "./Components/FetchWithAuth";
import RedirectIfAuth from "./Components/RedirectIfAuth";
import Header from "./Components/Header";
import Loading from "./Components/Loading";
import Body from "./Components/Body";
import Footer from "./Components/Footer";
import "./css/index.css";
import "./css/Header.css";

FetchWithAuth();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <BrowserRouter>
            <RequireAuth />
            <RedirectIfAuth />
            <Loading />
            <Header />
            <Body>
                <App />
            </Body>
            <Footer />
        </BrowserRouter>
    </React.StrictMode>
);
