import React, { useState } from "react";
import api from "../api";

function Login({ onAuth, switchToSignup, switchToForgot }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  

  const handleLogin = async () => {
  setError("");

  // ✅ Frontend Validation
  if (!email.trim() || !password.trim()) {
    return setError("Email and Password are required");
  }

  if (!email.includes("@")) {
    return setError("Please enter a valid email");
  }

  try {
    const res = await api.post("/api/auth/login", {
      email,
      password,
    });

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    onAuth();
  } catch (err) {
    setError(err.response?.data?.message || "Invalid credentials");
  }
};

  return (
    <div className="h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="bg-[var(--card)] p-6 rounded w-80 text-[var(--text)]">
        <h2 className="text-cyan-600 text-xl mb-4">Login</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          className="w-full mb-2 p-2 rounded bg-[var(--sidebar)] text-[var(--text)] border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-slate-500"
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="relative mb-4">
            <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mb-2 p-2 rounded bg-[var(--sidebar)] text-[var(--text)] border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-slate-500"
            />

            <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-3 text-sm text-cyan-800 hover:text-cyan-500"
            >
                {showPassword ? "Hide" : "Show"}
            </button>
        </div>


        <button
            onClick={switchToForgot}
            className="relative bottom-3 text-cyan-600 hover:underline"
        >
            Forgot password?
        </button>

        {error && (
            <p className="text-red-400 text-sm mb-3">{error}</p>
        )}

        <button
          onClick={handleLogin}
          className="w-full bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] py-2 rounded"
        >
          Login
        </button>


        <p className="mt-4 text-sm text-slate-400 text-center">
            Don’t have an account?{" "}
            <button
                onClick={switchToSignup}
                className="text-cyan-600 hover:underline"
            >
                SignUp
            </button>
        </p>

      </div>
    </div>
  );
}

export default Login;