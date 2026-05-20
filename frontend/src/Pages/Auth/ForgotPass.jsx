import { useState } from "react";
import { Link } from "react-router-dom";
import { FaEnvelope, FaCheck, FaArrowLeft } from "react-icons/fa";
import { authApi } from "../../lib/api";

const ForgotPass = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validateEmail = (value) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) return "Email is required.";
    if (!pattern.test(value)) return "Please enter a valid email address.";
    return "";
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await authApi.forgotPassword({ email });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Failed to send reset email. Please check your email address.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCheck size={40} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Check your email</h2>
          <p className="text-gray-500 mb-6 leading-relaxed">
            If an account with <strong className="text-gray-700">{email}</strong> exists,
            we sent a password reset link. Please check your inbox and spam folder.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Didn't receive the email?{" "}
            <button
              onClick={() => setSubmitted(false)}
              className="text-emerald-600 font-medium hover:underline"
            >
              Try again
            </button>
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-emerald-600 font-medium transition-colors"
          >
            <FaArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="max-w-md w-full">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-emerald-600 font-medium mb-8 transition-colors"
        >
          <FaArrowLeft size={16} />
          Back to Login
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
              <FaEnvelope size={24} className="text-emerald-600" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
          <p className="text-gray-500 mb-6 leading-relaxed">
            No worries, we'll send you reset instructions. Enter your email address and we'll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="you@example.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Remember your password?{" "}
          <Link to="/login" className="text-emerald-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPass;
