import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi, tokenStorage } from "../../lib/api";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setFormError("All fields are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = await authApi.login({ email, password });
      tokenStorage.setToken(payload.token);
      tokenStorage.setRole(payload.user?.role || "candidate");
      setFormError("");
      navigate(payload.user?.role === "recruiter" ? "/recruiter" : "/dashboard");
    } catch (error) {
      setFormError(error.message || "Invalid email or password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen lg:flex max-w-screen-lg mx-auto gap-16 w-full py-12 px-4">
      <div className="lg:w-1/2 max-w-lg mx-auto md:pt-10">
        <h2 className="mb-10 mt-6 text-4xl font-semibold text-center">Welcome back!</h2>
        <div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="p-2">
                Email
              </label>
              <input
                type="text"
                id="email"
                placeholder="youremail@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="block w-full rounded-lg outline-none py-2 px-2.5 mt-2 text-gray-dark shadow-sm border border-gray"
              />
            </div>
            <div>
              <span className="flex justify-between items-center">
                <label htmlFor="password" className="p-2">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-tertiary-text hover:underline"
                >
                  Forgot password?
                </Link>
              </span>
              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="***********"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  className="block w-full rounded-lg outline-none py-2 px-2.5 text-gray-dark shadow-sm border border-gray"
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
            {formError && (
              <div className="text-[#c93434] text-sm mt-2">{formError}</div>
            )}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full justify-center rounded-lg bg-black p-3 text-sm font-semibold text-white mb-2"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
              <p className="text-sm text-dark-gray">
                Don&apos;t have an account?{" "}
                <Link to="/signup" className="underline hover:no-underline">
                  create one
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
