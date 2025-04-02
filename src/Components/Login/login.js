import { useState } from "react";
import { auth, Provider } from "../../Firestore/firestore";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // ❌ State for error message
  const navigate = useNavigate();

  const isValidEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const Signin = async () => {
    if (!isValidEmail(email)) {
      setError("Invalid email format! Please enter a valid email."); // ❌ Show error
      return;
    }
    setError(""); 

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/app");
    } catch (error) {
        if (error.code === "auth/email-already-in-use") {
            setError("Email Already Registered! Please use a different email.");
          } else if (error.code === "auth/weak-password") {
            setError("Password should be at least 6 characters long.");
          } else {
            setError(error.message); 
          }
    }
  };

  const SigninWithGoogle = async () => {
    try {
      await signInWithPopup(auth, Provider);
      navigate("/app");
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div class="d-flex justify-content-center align-items-center vh-100 bg-dark">
        <div className="container w-50 text-center">
      <h2 class="text-light">Login</h2>
      &nbsp;
      <input
        placeholder="Email"
        className="form-control my-2"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        placeholder="Password"
        type="password"
        className="form-control my-2"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <p className="text-danger">{error}</p>}

      <button onClick={Signin} className="btn btn-primary  d-block mx-auto">
        Sign in
      </button>
      <br />
      <button
        onClick={SigninWithGoogle}
        className="btn btn-success p-2 d-block mx-auto"
      >
        Sign in with Google
      </button>
    </div>
    </div>
  );
};

export default Auth;
