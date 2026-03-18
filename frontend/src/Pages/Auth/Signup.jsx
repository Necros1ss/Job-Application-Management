import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { authApi, tokenStorage } from "../../lib/api";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const selectedRole = location.state?.role;
  const userRole = selectedRole === "recruiter" ? "recruiter" : "candidate";

  useEffect(() => {
    if (!selectedRole) {
      navigate("/signup", { replace: true });
    }
  }, [selectedRole, navigate]);

  if (!selectedRole) {
    return null;
  }

  const validateEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return "Please enter a valid email address.";
    }
    return "";
  };

  const validatePassword = (password) => {
    const isValidLength = password.length > 5;

    if (!isValidLength) {
      return "Password must be longer than 5 characters.";
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
    if (emailError || passwordError) {
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const payload = await authApi.signup({ name, email, password, role: userRole });
      tokenStorage.setToken(payload.token);
      tokenStorage.setRole(payload.user?.role || userRole);
      navigate(payload.user?.role === "recruiter" ? "/recruiter" : "/dashboard");
    } catch (error) {
      setFormError(error.message || "Failed to create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen lg:flex max-w-screen-lg mx-auto gap-16 w-full py-12 px-4">
      <div className="lg:w-1/2 max-w-lg mx-auto md:pt-10">
        <h2 className="mb-10 mt-6 text-4xl font-semibold">
          {userRole === "candidate"
            ? "Sign up to find your job"
            : "Sign up to hire talent"}
        </h2>
        <div>
          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label htmlFor="name" className="p-2">
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
                className="block w-full rounded-lg outline-none py-2 px-2.5 mt-2 text-gray-dark shadow-sm border border-gray"
              />
            </div>
            <div>
              <label htmlFor="email" className="p-2">
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
                className="block w-full rounded-lg outline-none py-2 px-2.5 mt-2 text-gray-dark shadow-sm border border-gray"
              />
              {emailError && (
                <p className="text-[#c93434] text-sm mt-2">{emailError}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="p-2">
                Password
              </label>
              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Password (5 or more characters)"
                  value={password}
                  onChange={handlePasswordChange}
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
              {passwordError && (
                <p className="text-[#c93434] text-sm mt-2">{passwordError}</p>
              )}
            </div>
            {formError && <p className="text-[#c93434] text-sm mt-2">{formError}</p>}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full justify-center rounded-lg bg-black p-3 text-sm font-semibold text-white mb-2"
              >
                {isSubmitting ? "Creating account..." : "Create Account"}
              </button>
              <p className="text-sm text-dark-gray">
                Already have an account?{" "}
                <Link to="/login" className="underline hover:no-underline">
                  Login
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
