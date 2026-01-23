import React, { useState } from "react";
import api from "../api";

function Login({ onAuth, switchToSignup, switchToForgot }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
  setError(""); // clear old error

  try {
    const res = await api.post("/api/auth/login", {
      email,
      password,
    });

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    onAuth();
  } catch (err) {
    setError(err.response?.data?.error || "Login failed");
  }
};

  return (
    <div className="h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-slate-800 p-6 rounded w-80">
        <h2 className="text-cyan-400 text-xl mb-4">Login</h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-2 p-2 rounded bg-slate-900 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-slate-500"
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="relative mb-4">
            <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mb-2 p-2 rounded bg-slate-900 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-slate-500"
            />

            <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-3 text-sm text-slate-500 hover:text-slate-300"
            >
                {showPassword ? "Hide" : "Show"}
            </button>
        </div>


        <button
            onClick={switchToForgot}
            className="relative bottom-3 text-cyan-400 hover:underline"
        >
            Forgot password?
        </button>

        {error && (
            <p className="text-red-400 text-sm mb-3">{error}</p>
        )}

        <button
          onClick={handleLogin}
          className="w-full bg-cyan-500 py-2 rounded"
        >
          Login
        </button>


        <p className="mt-4 text-sm text-slate-400 text-center">
            Don’t have an account?{" "}
            <button
                onClick={switchToSignup}
                className="text-cyan-400 hover:underline"
            >
                Sign up
            </button>
        </p>

      </div>
    </div>
  );
}

export default Login;
