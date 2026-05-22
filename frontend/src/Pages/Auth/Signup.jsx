import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaBriefcase, FaCheck, FaEye, FaEyeSlash, FaUserTie } from "react-icons/fa";
import { authApi, tokenStorage } from "../../lib/api";
import { showError } from "../../utils/toast";
import { validateEmail } from "../../utils/validation";
import LanguageSwitcher from "../../Components/LanguageSwitcher";

const roleOptions = [
  {
    role: "candidate",
    title: "Candidate",
    description: "Apply for jobs and track interview updates.",
    icon: FaUserTie,
  },
  {
    role: "recruiter",
    title: "Recruiter",
    description: "Post roles and manage candidates.",
    icon: FaBriefcase,
  },
];

const Signup = () => {
  const location = useLocation();
  const initialRole = location.state?.role === "recruiter" ? "recruiter" : "candidate";
  const [userRole, setUserRole] = useState(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const validatePassword = (password) => {
    const isValidLength = password.length >= 8;

    if (!isValidLength) {
      return "Password must be 8 or more characters.";
    }
    return "";
  };

  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    const errorMessage = validateEmail(newEmail);
    setEmailError(errorMessage);
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    const errorMessage = validatePassword(newPassword);
    setPasswordError(errorMessage);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      const message = "All fields are required.";
      setFormError(message);
      showError(message);
      return;
    }

    if (emailError || passwordError) {
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const payload = await authApi.signup({ name, email, password, role: userRole });
      tokenStorage.setToken(payload.token);
      tokenStorage.setRole(payload.user?.role || userRole);
      navigate(payload.user?.role === "recruiter" ? "/recruiter" : "/candidate");
    } catch (error) {
      const message = error.message || "Failed to create account";
      setFormError(message);
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen blueprint-grid-bg px-4 py-8 text-[#0a0a0a]">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[14px] border border-[#e5e5e5] bg-white shadow-[0_0_0_1px_rgba(10,10,10,0.1)] lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="blueprint-hero-panel hidden rounded-none border-0 border-r border-[#e5e5e5] p-10 lg:flex lg:flex-col lg:justify-between">
          <Link to="/" className="inline-flex w-fit items-center rounded-full px-3 py-2 text-sm font-medium text-[#737373] hover:bg-white hover:text-black">
            Job Tracker
          </Link>

          <div className="relative z-10">
            <p className="text-xs font-medium uppercase text-[#737373]">Create workspace</p>
            <h1 className="mt-3 max-w-md text-[40px] font-semibold leading-none text-black">
              Choose the account that matches your workflow.
            </h1>

            <div className="mt-10 rounded-[14px] border border-[#e5e5e5] bg-white p-4 shadow-[0_0_0_1px_rgba(10,10,10,0.1)]">
              <div className="grid grid-cols-2 gap-3">
                {roleOptions.map(({ role, title, icon: Icon }) => (
                  <div
                    key={role}
                    className={`rounded-[10px] border p-4 ${
                      userRole === role
                        ? "border-black bg-black text-white"
                        : "border-[#e5e5e5] bg-[#f2f2f2] text-[#0a0a0a]"
                    }`}
                  >
                    <Icon className="mb-5" />
                    <p className="text-sm font-medium">{role === "candidate" ? "Candidate" : "Recruiter"}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2 text-sm text-[#737373]">
                <div className="h-2 w-32 rounded-full bg-[#0a0a0a]" />
                <div className="h-2 w-full rounded-full bg-[#e5e5e5]" />
                <div className="h-2 w-4/5 rounded-full bg-[#e5e5e5]" />
              </div>
            </div>
          </div>
        </aside>

        <main className="flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-lg">
            <div className="mb-8">
              <p className="text-xs font-medium uppercase text-[#737373]">Create account</p>
              <h2 className="mt-2 text-[40px] font-semibold leading-none text-black">
                {userRole === "candidate" ? "Start applying with Job Tracker" : "Start hiring with Job Tracker"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#737373]">
                Select your account type, then create the workspace profile you need.
              </p>
            </div>
            <div className="mb-6">
              <LanguageSwitcher />
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              {roleOptions.map(({ role, title, description, icon: Icon }) => {
                const isSelected = userRole === role;

                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setUserRole(role);
                      setName("");
                      setFormError("");
                    }}
                    className={`rounded-[14px] border p-4 text-left transition ${
                      isSelected
                        ? "border-black bg-black text-white"
                        : "border-[#e5e5e5] bg-white text-[#0a0a0a] hover:-translate-y-0.5 hover:border-[#cfcfcf] hover:bg-[#f2f2f2]"
                    }`}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <Icon />
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${isSelected ? "border-white" : "border-[#e5e5e5]"}`}>
                        {isSelected && <FaCheck size={10} />}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{role === "candidate" ? t("auth.candidate") : t("auth.recruiter")}</p>
                    <p className={`mt-1 text-xs leading-5 ${isSelected ? "text-white/70" : "text-[#737373]"}`}>
                      {role === "candidate" ? "Search jobs, apply with a cover letter, read recruiter messages, and follow onboarding tasks." : "Publish roles, review candidates, schedule interviews, send offers, and start onboarding."}
                    </p>
                  </button>
                );
              })}
            </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-[#0a0a0a]">
                {userRole === "candidate" ? "Name" : "Company Name"}
              </label>
              <input
                type="text"
                id="name"
                placeholder={
                  userRole === "candidate"
                    ? "Enter your name...."
                    : "Enter your company name...."
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="block w-full rounded-[10px] border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-[#0a0a0a] outline-none transition-all placeholder:text-[#737373] focus:border-black focus:ring-2 focus:ring-black/10"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#0a0a0a]">
                Email
              </label>
              <input
                type="email"
                id="email"
                placeholder="youremail@gmail.com"
                value={email}
                onChange={handleEmailChange}
                required
                autoComplete="email"
                className="block w-full rounded-[10px] border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-[#0a0a0a] outline-none transition-all placeholder:text-[#737373] focus:border-black focus:ring-2 focus:ring-black/10"
              />
              {emailError && (
                <p className="mt-2 text-sm text-[#c22b10]">{emailError}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[#0a0a0a]">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Password (8 or more characters)"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  className="block w-full rounded-[10px] border border-[#e5e5e5] bg-white px-3 py-2 pr-10 text-sm text-[#0a0a0a] outline-none transition-all placeholder:text-[#737373] focus:border-black focus:ring-2 focus:ring-black/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 px-3 text-[#737373] hover:text-black"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {passwordError && (
                <p className="mt-2 text-sm text-[#c22b10]">{passwordError}</p>
              )}
            </div>
            {formError && (
              <div className="mt-2 rounded-[10px] border border-[#c22b10]/20 bg-[#c22b10]/5 px-3 py-2 text-sm text-[#c22b10]">
                {formError}
              </div>
            )}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="mb-2 flex w-full justify-center rounded-[10px] bg-black px-12 py-2.5 text-sm font-semibold text-white hover:bg-[#0a0a0a] disabled:opacity-60"
              >
                {isSubmitting ? "Creating account..." : "Create Account"}
              </button>
              <p className="text-sm text-[#737373]">
                Already have an account? {" "}
                <Link to="/login" className="font-medium text-black underline hover:no-underline">
                  Log in
                </Link>
              </p>
            </div>
          </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Signup;
