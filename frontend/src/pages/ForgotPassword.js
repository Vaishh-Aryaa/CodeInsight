import { useState } from "react";
import api from "../api";

function ForgotPassword({ switchToLogin, onAuth }) {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Step 1: Forgot Password Request
  const handleForgot = async () => {
    setError("");
    setLoading(true);

    if (!email.trim()) {
      setLoading(false);
      return setError("Email is required");
    }

    if (!email.includes("@")) {
      setLoading(false);
      return setError("Enter a valid email");
    }

    try {
      await api.post("/api/auth/forgot-password", { email });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Email not found");
    }

    setLoading(false);
  };

  // ✅ Step 2: Reset Password Request
  const handleReset = async () => {
    setError("");
    setLoading(true);

    if (!password.trim()) {
      setLoading(false);
      return setError("Password cannot be empty");
    }

    if (password.length < 6) {
      setLoading(false);
      return setError("Password must be at least 6 characters");
    }

    try {
      const res = await api.post("/api/auth/reset-password", {
        email,
        newPassword: password,
      });

      // ✅ Auto-login after reset
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      alert("Password reset successful!");
      onAuth();
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed");
    }

    setLoading(false);
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="bg-[var(--card)] p-6 rounded w-80 text-[var(--text)]">
        <h2 className="text-cyan-600 text-xl mb-4">
          {step === 1 ? "Forgot Password" : "Reset Password"}
        </h2>

        {error && (
          <p className="text-red-400 text-sm mb-3 text-center">{error}</p>
        )}

        {/* ✅ STEP 1 */}
        {step === 1 && (
          <>
            <input
              placeholder="Enter your email"
              className="w-full mb-2 p-2 rounded bg-[var(--sidebar)] text-[var(--text)] border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button
              onClick={handleForgot}
              disabled={loading}
              className="w-full bg-[var(--primary)] text-white py-2 rounded hover:bg-[var(--primary-dark)]"
            >
              {loading ? "Checking..." : "Continue"}
            </button>

            <button
              onClick={switchToLogin}
              className="mt-3 text-sm text-gray-500 hover:underline w-full"
            >
              Back to Login
            </button>
          </>
        )}

        {/* ✅ STEP 2 */}
        {step === 2 && (
          <>
            <div className="relative mb-3">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 rounded bg-[var(--sidebar)] text-[var(--text)] border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-3 text-sm text-cyan-800 hover:text-cyan-500"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full bg-[var(--primary)] text-white py-2 rounded hover:bg-[var(--primary-dark)]"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <button
              onClick={switchToLogin}
              className="mt-3 text-sm text-gray-500 hover:underline w-full"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;