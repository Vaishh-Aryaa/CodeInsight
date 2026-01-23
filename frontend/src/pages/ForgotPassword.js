import { useState } from "react";
import api from "../api";

function ForgotPassword({ switchToLogin }) {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1: Forgot Password Request
  const handleForgot = async () => {
    setError("");
    setLoading(true);

    try {
      await api.post("/api/auth/forgot-password", { email });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }

    setLoading(false);
  };

  // Step 2: Reset Password Request
  const handleReset = async () => {
    setError("");
    setLoading(true);

    try {
      await api.post("/api/auth/reset-password", {
        email,
        newPassword: password,
      });

      alert("Password reset successful. Please login.");
      switchToLogin();
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed");
    }

    setLoading(false);
  };

  return (
    <div className="h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-slate-800 p-6 rounded w-80">
        {/* Title */}
        <h2 className="text-white mb-4 text-lg font-bold">
          {step === 1 ? "Forgot Password" : "Reset Password"}
        </h2>

        {/* Error Message */}
        {error && (
          <p className="text-red-400 text-sm mb-3 text-center">{error}</p>
        )}

        {/* ================= STEP 1 ================= */}
        {step === 1 && (
          <>
            <input
              placeholder="Enter your email"
              className="w-full mb-3 p-2 rounded bg-slate-900 text-white border border-slate-700"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button
              onClick={handleForgot}
              disabled={loading}
              className="w-full bg-cyan-500 py-2 rounded font-semibold disabled:opacity-50"
            >
              {loading ? "Checking..." : "Continue"}
            </button>

            <button
              onClick={switchToLogin}
              className="mt-3 text-sm text-cyan-400 hover:underline w-full"
            >
              Back to Login
            </button>
          </>
        )}

        {/* ================= STEP 2 ================= */}
        {step === 2 && (
          <>
            <div className="relative mb-3">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 rounded bg-slate-900 text-white border border-slate-700"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-3 text-sm text-slate-400"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full bg-cyan-500 py-2 rounded font-semibold disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;