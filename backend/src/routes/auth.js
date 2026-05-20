import express from "express";
import { forgotPassword, login, resetPassword, signup } from "../controllers/authController.js";
import { validate } from "../middlewares/validate.js";
import { forgotPasswordSchema, loginSchema, resetPasswordSchema, signupSchema } from "../validators/authValidators.js";

const router = express.Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

export default router;
