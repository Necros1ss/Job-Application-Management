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
    <div className="min-h-screen bg-white px-4 py-8 text-[#0a0a0a]">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[14px] border border-[#e5e5e5] bg-white shadow-[0_0_0_1px_rgba(10,10,10,0.1)] lg:grid-cols-[1.05fr_.95fr]">
        <div className="hidden border-r border-[#e5e5e5] bg-[#f2f2f2] p-10 text-[#0a0a0a] lg:flex lg:flex-col lg:justify-between">
          <Link to="/" className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[#737373] hover:bg-white hover:text-black">
            <FaArrowLeft /> Back to home
          </Link>
          <div>
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-[10px] border border-[#e5e5e5] bg-white text-black">
              <FaBriefcase />
            </div>
            <h1 className="max-w-md text-[40px] font-semibold leading-none text-black">Run hiring and HR from one workspace.</h1>
            <div className="mt-8 space-y-4">
              {["Recruitment pipeline", "Onboarding checklist", "Employee and leave management"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-medium text-[#0a0a0a]">
                  <FaCheckCircle className="text-black" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md">
            <Link to="/" className="mb-8 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[#737373] hover:bg-[#f2f2f2] hover:text-black lg:hidden">
              <FaArrowLeft /> Back to home
            </Link>
            <div className="mb-8">
              <p className="text-xs font-medium uppercase text-[#737373]">Welcome back</p>
              <h2 className="mt-2 text-[40px] font-semibold leading-none text-black">Log in to Job Tracker</h2>
              <p className="mt-3 text-sm leading-6 text-[#737373]">Access recruitment, onboarding, employee, attendance, and leave tools.</p>
            </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#0a0a0a]">
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
                className="block w-full rounded-[10px] border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-[#0a0a0a] outline-none transition-all placeholder:text-[#737373] focus:border-black focus:ring-2 focus:ring-black/10"
              />
            </div>
            <div>
              <span className="flex justify-between items-center">
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[#0a0a0a]">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-[#737373] hover:text-black hover:underline"
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
                  className="block w-full rounded-[10px] border border-[#e5e5e5] bg-white px-3 py-2 pr-12 text-sm text-[#0a0a0a] outline-none transition-all placeholder:text-[#737373] focus:border-black focus:ring-2 focus:ring-black/10"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 px-4 text-[#737373] hover:text-black"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            {formError && (
              <div className="mt-2 rounded-[10px] border border-[#c22b10]/20 bg-[#c22b10]/5 px-3 py-2 text-sm text-[#c22b10]">{formError}</div>
            )}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full justify-center rounded-[10px] bg-black px-12 py-2.5 text-sm font-semibold text-white hover:bg-[#0a0a0a] disabled:opacity-60"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
              <p className="mt-4 text-sm text-[#737373]">
                Don&apos;t have an account?{" "}
                <Link to="/signup" className="font-medium text-black hover:underline">
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
