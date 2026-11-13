import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    let formIsValid = true;

    if (email === "") {
      setEmailError("Email is required");
      formIsValid = false;
    } else if (!email.includes("@")) {
      setEmailError("Enter a valid email address");
      formIsValid = false;
    } else {
      setEmailError("");
    }

    if (password === "") {
      setPasswordError("Password is required");
      formIsValid = false;
    } else {
      setPasswordError("");
    }

    if (formIsValid) {
      navigate("/dashboard");
    }
  }

  return (
    <AuthLayout activeTab="login">
      <h1 className="auth-title">Welcome back</h1>
      <p className="auth-subtitle">
        Log in to see your saved flights and linked trips.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <label className="auth-label" htmlFor="email">
          Email
        </label>
        <input
          className="auth-input"
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        {emailError && <p className="auth-error">{emailError}</p>}

        <label className="auth-label" htmlFor="password">
          Password
        </label>
        <input
          className="auth-input"
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {passwordError && <p className="auth-error">{passwordError}</p>}

        <button className="auth-button" type="submit">
          Log in
        </button>
      </form>

      <p className="auth-footer">
        New to Anga360? <Link to="/register">Create an account</Link>
      </p>
    </AuthLayout>
  );
}

export default LoginPage;