import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { authApi } from "../../lib/api";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const token = new URLSearchParams(location.search).get("token");

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!token) {
      setFormError("Reset token is missing.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setFormError("All fields are required.");
      return;
    }

    if (newPassword.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      await authApi.resetPassword({ token, newPassword });
      navigate("/login");
    } catch (error) {
      setFormError(error.message || "Failed to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen lg:flex max-w-screen-lg mx-auto gap-16 w-full py-12 px-4">
      <div className="lg:w-1/2 max-w-lg mx-auto md:pt-10">
        <h2 className="mb-10 mt-6 text-4xl font-semibold">Reset Password</h2>
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div>
            <label htmlFor="newPassword" className="p-2">
              New Password
            </label>
            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                id="newPassword"
                placeholder="Password (8 or more characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="block w-full rounded-lg outline-none py-2 px-2.5 pr-10 text-gray-dark shadow-sm border border-gray"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 px-3 text-gray hover:text-black"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="p-2">
              Confirm Password
            </label>
            <div className="relative mt-2">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="block w-full rounded-lg outline-none py-2 px-2.5 pr-10 text-gray-dark shadow-sm border border-gray"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 px-3 text-gray hover:text-black"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          {formError && <p className="text-[#c93434] text-sm mt-2">{formError}</p>}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full justify-center rounded-lg bg-black p-3 text-sm font-semibold text-white mb-2"
            >
              {isSubmitting ? "Resetting..." : "Reset password"}
            </button>
            <p className="text-sm text-dark-gray">
              Back to{" "}
              <Link to="/login" className="underline hover:no-underline">
                Login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
