import express from "express";
import { authorize, requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { createJobSchema, updateJobSchema } from "../validators/jobPostValidators.js";
import { getJobPosts, getMine, getById, create, update, remove } from "../controllers/jobPostController.js";

const router = express.Router();

router.get("/", getJobPosts);
router.get("/mine", requireAuth, authorize("recruiter"), getMine);
router.get("/:id", getById);
router.post("/", requireAuth, authorize("recruiter"), validate(createJobSchema), create);
router.put("/:id", requireAuth, authorize("recruiter"), validate(updateJobSchema), update);
router.delete("/:id", requireAuth, authorize("recruiter"), remove);

export default router;
