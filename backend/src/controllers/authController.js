import { authService } from "../services/authService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const REFRESH_COOKIE_NAME = "refresh_token";

const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/auth/refresh",
  maxAge: 30 * 24 * 60 * 60 * 1000,
});

const setRefreshCookie = (res, refreshToken) => {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, { ...refreshCookieOptions(), maxAge: undefined });
};

const parseCookies = (cookieHeader = "") =>
  cookieHeader.split(";").reduce((accumulator, cookiePart) => {
    const [rawKey, ...rawValue] = cookiePart.trim().split("=");
    if (!rawKey) return accumulator;
    accumulator[rawKey] = decodeURIComponent(rawValue.join("="));
    return accumulator;
  }, {});

const getCookie = (req, name) => parseCookies(req.headers.cookie || "")[name];

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const result = await authService.signup({ name, email, password, role }).catch(error => {
    if (error.message === "Email is already in use") error.status = 409;
    throw error;
  });
  setRefreshCookie(res, result.refreshToken);
  return res.status(201).json({ 
    token: result.accessToken, 
    accessToken: result.accessToken, 
    user: result.user 
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password }).catch(error => {
    if (error.message === "Invalid email or password") error.status = 401;
    else if (error.message === "Account has been removed" || error.message === "Account is locked") error.status = 403;
    throw error;
  });
  setRefreshCookie(res, result.refreshToken);
  return res.json({ 
    token: result.accessToken, 
    accessToken: result.accessToken, 
    user: result.user 
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = getCookie(req, REFRESH_COOKIE_NAME);
  try {
    const result = await authService.refresh(refreshToken);
    setRefreshCookie(res, result.refreshToken);
    return res.json({ 
      token: result.accessToken, 
      accessToken: result.accessToken, 
      user: result.user 
    });
  } catch (error) {
    clearRefreshCookie(res);
    error.status = 401;
    throw error;
  }
});

export const logout = asyncHandler(async (_req, res) => {
  clearRefreshCookie(res);
  return res.status(200).json({ message: "Logged out" });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  try {
    await authService.forgotPassword(req.body.email);
  } catch (error) {
    console.error("Forgot password failed:", error.message);
  }
  return res.status(200).json({ message: "If that email is registered, a reset link has been sent." });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  await authService.resetPassword(token, newPassword).catch(error => {
    if (error.message === "Invalid or expired reset token") error.status = 400;
    throw error;
  });
  return res.json({ message: "Password has been reset successfully" });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword).catch(error => {
    if (error.message === "User not found") error.status = 404;
    else if (error.message === "Current password is incorrect") error.status = 400;
    throw error;
  });
  return res.json({ message: "Password changed successfully" });
});
