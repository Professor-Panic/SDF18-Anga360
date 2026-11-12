import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./auth.css";

function RegisterPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const [fullNameError, setFullNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [privacyError, setPrivacyError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    let formIsValid = true;

    if (fullName === "") {
      setFullNameError("Full name is required");
      formIsValid = false;
    } else {
      setFullNameError("");
    }

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

    if (!acceptedPrivacy) {
      setPrivacyError("Please accept the privacy notice to continue");
      formIsValid = false;
    } else {
      setPrivacyError("");
    }

    if (formIsValid) {
      navigate("/dashboard");
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">
          Accounts let you save flights and revisit recent searches. Searching
          never needs one.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <label className="auth-label" htmlFor="fullName">
            Full name
          </label>
          <input
            className="auth-input"
            id="fullName"
            type="text"
            placeholder="Amina Otieno"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
          {fullNameError && <p className="auth-error">{fullNameError}</p>}

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
          <p className="auth-hint">
            Enter a password with at least 8 characters.
          </p>

          <div className="auth-checkbox-row">
            <input
              id="privacy"
              type="checkbox"
              checked={acceptedPrivacy}
              onChange={(event) => setAcceptedPrivacy(event.target.checked)}
            />
            <label htmlFor="privacy">
              I have read the privacy notice explaining what personal
              information Anga360 collects and why.
            </label>
          </div>
          {privacyError && <p className="auth-error">{privacyError}</p>}

          <button className="auth-button" type="submit">
            Create account
          </button>
        </form>

        <p className="auth-footer">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;