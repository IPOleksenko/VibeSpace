import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const RedirectIfAuth = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const allowedPages = ["/auth"];

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token && allowedPages.includes(location.pathname)) {
            navigate("/");
        }
    }, [navigate, location.pathname]);

    return children;
};

export default RedirectIfAuth;