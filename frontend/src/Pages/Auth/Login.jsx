import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi, tokenStorage } from "../../lib/api";
import { FaArrowLeft, FaBriefcase, FaCheckCircle, FaEye, FaEyeSlash } from "react-icons/fa";
import { showError } from "../../utils/toast";

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
      navigate(payload.user?.role === "recruiter" ? "/recruiter" : "/candidate");
    } catch (error) {
      const message = error.message || "Invalid email or password.";
      setFormError(message);
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8f5] px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-[1.05fr_.95fr]">
        <div className="relative hidden bg-cover bg-center p-10 text-white lg:flex lg:flex-col lg:justify-between"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(25,33,29,.86), rgba(25,33,29,.72)), url('https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=85')",
          }}
        >
          <Link to="/" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-white/80 hover:text-white">
            <FaArrowLeft /> Back to home
          </Link>
          <div>
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white">
              <FaBriefcase />
            </div>
            <h1 className="text-4xl font-extrabold leading-tight">Run hiring and HR from one workspace.</h1>
            <div className="mt-8 space-y-4">
              {["Recruitment pipeline", "Onboarding checklist", "Employee and leave management"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-semibold text-white/85">
                  <FaCheckCircle className="text-emerald-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md">
            <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-emerald-700 lg:hidden">
              <FaArrowLeft /> Back to home
            </Link>
            <div className="mb-8">
              <p className="text-sm font-bold uppercase tracking-wider text-emerald-700">Welcome back</p>
              <h2 className="mt-2 text-4xl font-extrabold text-gray-950">Log in to Job Tracker</h2>
              <p className="mt-3 text-sm leading-6 text-gray-500">Access recruitment, onboarding, employee, attendance, and leave tools.</p>
            </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
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
                className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div>
              <span className="flex justify-between items-center">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-emerald-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="***********"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  className="block w-full rounded-xl border border-gray-200 px-4 py-3 pr-12 text-sm text-gray-800 outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 px-4 text-gray-400 hover:text-gray-800"
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
                className="flex w-full justify-center rounded-xl bg-emerald-600 p-3 text-sm font-bold text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700 disabled:opacity-60"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
              <p className="mt-4 text-sm text-gray-500">
                Don&apos;t have an account?{" "}
                <Link to="/signup" className="font-semibold text-emerald-700 hover:underline">
                  Create one
                </Link>
              </p>
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
