import React, { useState } from "react";
import api from "../api";

function Signup({ onAuth, switchToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async () => {
  setError("");

  // ✅ Frontend Validation
  if (!name.trim() || !email.trim() || !password.trim()) {
    return setError("All fields are required");
  }

  if (!email.includes("@")) {
    return setError("Enter a valid email");
  }

  if (password.length < 6) {
    return setError("Password must be at least 6 characters");
  }

  try {
    const res = await api.post("/api/auth/signup", {
      name,
      email,
      password,
    });

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    onAuth();
  } catch (err) {
    setError(err.response?.data?.message || "Signup failed");
  }
};

  return (
    <div className="h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="bg-[var(--card)] p-6 rounded w-80 text-[var(--text)]">
        <h2 className="text-gray-600 text-xl mb-4">SignUp</h2>

        <input
          placeholder="Name"
          value={name}
          className="w-full mb-2 p-2 rounded bg-[var(--sidebar)] text-[var(--text)] border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-slate-500"
          onChange={(e) => setName(e.target.value)}
        />
        <input
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
                className="absolute right-2 top-3 text-sm text-gray-700 hover:text-gray-500"
            >
                {showPassword ? "Hide" : "Show"}
            </button>
        </div>

        {error && (
          <p className="text-red-400 text-sm mb-3 text-center">
            {error}
          </p>
        )}


        <button
          onClick={handleSignup}
          className="w-full bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] py-2 rounded"
        >
          Create Account
        </button>

        <p className="mt-4 text-sm text-slate-400 text-center">
            Already have an account?{" "}
            <button
                onClick={switchToLogin}
                className="text-gray-700 hover:underline"
            >
                Login
            </button>
        </p>

      </div>
    </div>
  );
}

export default Signup;