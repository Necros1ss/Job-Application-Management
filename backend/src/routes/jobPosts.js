import express from "express";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { createJobSchema, updateJobSchema } from "../validators/jobPostValidators.js";
import { getJobPosts, getMine, getById, create, update, remove } from "../controllers/jobPostController.js";

const router = express.Router();

router.get("/", getJobPosts);
router.get("/mine", requireAuth, getMine);
router.get("/:id", getById);
router.post("/", requireAuth, validate(createJobSchema), create);
router.put("/:id", requireAuth, validate(updateJobSchema), update);
router.delete("/:id", requireAuth, remove);

export default router;
