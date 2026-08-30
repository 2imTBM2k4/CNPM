import React, { useContext, useState, useEffect, useRef } from "react";
import "./LoginPopup.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";

const LoginPopup = ({ setShowLogin }) => {
  const { url, setToken } = useContext(StoreContext);
  const navigate = useNavigate();
  const dialogRef = useRef(null);

  const [currState, setCurrState] = useState("Login");
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowLogin(false);
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'button, input, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    const firstInput = dialogRef.current?.querySelector("input");
    firstInput?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setShowLogin]);

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value }));
  };

  const onLogin = async (event) => {
    event.preventDefault();
    let newUrl = url;
    if (currState === "Login") {
      newUrl += "/api/user/login";
    } else {
      newUrl += "/api/user/register";
    }

    // Luôn đăng ký với role "user"
    const postData = { ...data, role: "user" };

    try {
      const response = await axios.post(newUrl, postData);

      if (response.data.success) {
        setToken(response.data.token);
        localStorage.setItem("token", response.data.token);
        setShowLogin(false);
        navigate("/");
      } else {
        toast.error(response.data.message);
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Something went wrong. Please try again."
      );
    }
  };

  const onForgotPassword = async (event) => {
    event.preventDefault();
    setForgotLoading(true);
    try {
      const response = await axios.post(`${url}/api/user/forgot-password`, {
        email: forgotEmail,
      });
      if (response.data.success) {
        setForgotSent(true);
      } else {
        toast.error(response.data.message);
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to send reset email"
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const switchToForgot = () => {
    setCurrState("Forgot");
    setForgotEmail(data.email || "");
    setForgotSent(false);
  };

  const switchToLogin = () => {
    setCurrState("Login");
    setForgotSent(false);
  };

  // ---------- Forgot Password view ----------
  if (currState === "Forgot") {
    return (
      <div className="login-popup" onClick={(e) => e.target === e.currentTarget && setShowLogin(false)}>
        <form onSubmit={onForgotPassword} className="login-popup-container" ref={dialogRef} role="dialog" aria-label="Forgot Password">
          <div className="login-popup-title">
            <button type="button" className="login-back-btn" onClick={switchToLogin} aria-label="Back to login">
              <ArrowLeft size={20} />
            </button>
            <h2>Forgot Password</h2>
            <button type="button" className="login-close-btn" onClick={() => setShowLogin(false)} aria-label="Close">
              &times;
            </button>
          </div>

          {forgotSent ? (
            <div className="forgot-success">
              <div className="forgot-success-icon">
                <Mail size={32} />
              </div>
              <p className="forgot-success-title">Check your email</p>
              <p className="forgot-success-desc">
                We sent a password reset link to <strong>{forgotEmail}</strong>. The link expires in 15 minutes.
              </p>
              <button type="button" onClick={switchToLogin}>Back to Login</button>
            </div>
          ) : (
            <>
              <p className="forgot-desc">
                Enter the email address you used to create your account and we'll send you a link to reset your password.
              </p>
              <div className="login-popup-inputs">
                <input
                  name="forgotEmail"
                  onChange={(e) => setForgotEmail(e.target.value)}
                  value={forgotEmail}
                  type="email"
                  placeholder="Your email address"
                  required
                  autoFocus
                />
              </div>
              <button type="submit" disabled={forgotLoading} className={forgotLoading ? "loading" : ""}>
                {forgotLoading ? (
                  <><Loader2 size={16} className="spin-icon" /> Sending...</>
                ) : (
                  "Send Reset Link"
                )}
              </button>
              <p>
                Remember your password?{" "}
                <span onClick={switchToLogin}>Login here</span>
              </p>
            </>
          )}
        </form>
      </div>
    );
  }

  // ---------- Login / Sign Up view ----------
  return (
    <div className="login-popup" onClick={(e) => e.target === e.currentTarget && setShowLogin(false)}>
      <form onSubmit={onLogin} className="login-popup-container" ref={dialogRef} role="dialog" aria-label={currState}>
        <div className="login-popup-title">
          <h2>{currState}</h2>
          <button type="button" className="login-close-btn" onClick={() => setShowLogin(false)} aria-label="Close">
            &times;
          </button>
        </div>
        <div className="login-popup-inputs">
          {/* Chỉ hiện input name khi Sign Up */}
          {currState === "Sign Up" && (
            <input
              name="name"
              onChange={onChangeHandler}
              value={data.name}
              type="text"
              placeholder="Your name"
              required
            />
          )}
          <input
            name="email"
            onChange={onChangeHandler}
            value={data.email}
            type="email"
            placeholder="Your email"
            required
          />
          <input
            name="password"
            onChange={onChangeHandler}
            value={data.password}
            type="password"
            placeholder="Password"
            required
          />
        </div>
        <button type="submit">
          {currState === "Sign Up" ? "Create account" : "Login"}
        </button>

        {currState === "Login" && (
          <p className="forgot-link">
            <span onClick={switchToForgot}>Forgot password?</span>
          </p>
        )}

        {currState === "Login" ? (
          <p>
            Create a new account?{" "}
            <span onClick={() => setCurrState("Sign Up")}>Click here</span>
          </p>
        ) : (
          <p>
            Already have an account?{" "}
            <span onClick={() => setCurrState("Login")}>Login here</span>
          </p>
        )}
      </form>
    </div>
  );
};

export default LoginPopup;
