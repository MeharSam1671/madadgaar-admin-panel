import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import Auth from "./Components/Login/login";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { auth } from "./Firestore/firestore"; // ✅ Import Firebase auth

const RootComponent = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user); // ✅ Set user state when authentication changes
    });

    return () => unsubscribe(); // ✅ Cleanup listener
  }, []);

  return (
    <BrowserRouter>
      {user ? <App /> : <Auth />} {/* ✅ If user exists, show App, otherwise show Auth */}
    </BrowserRouter>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>
);
