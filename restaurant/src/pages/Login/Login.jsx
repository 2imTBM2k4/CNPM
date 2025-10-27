import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './Login.css'; // Tạo file CSS cơ bản nếu muốn (ví dụ: form centered, inputs styled)

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    login(email, password);
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Restaurant Admin Login</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
        {/* Nếu cần register: <p>Or <a href="/register">Register</a></p> */}
        <p>
        Don't have an account?{' '}
        <a href="/register" onClick={() => navigate('/register')}>
          Register now
        </a>
      </p>
      </form>
    </div>
  );
};

export default Login;