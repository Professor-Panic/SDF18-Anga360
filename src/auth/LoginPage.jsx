
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { useAuth } from "./authContext.js";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

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

    if (!formIsValid) return;

    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      navigate("/");
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoading(false);
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

        {formError && <p className="auth-error">{formError}</p>}

        <button className="auth-button" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="auth-footer">
        New to Anga360?{" "}
        <button
          type="button"
          onClick={() => navigate("/register")}
        >
          Create an account
        </button>
      </p>
    </AuthLayout>
  );
}
export default LoginPage;