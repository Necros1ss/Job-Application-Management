import { z } from "zod";

const EMPLOYMENT_TYPES = ["full-time", "part-time", "contract", "internship"];

const emptyToUndefined = (value) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
};

const optionalTrimmedString = (max = 10000) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

const employmentTypeSchema = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .trim()
    .toLowerCase()
    .refine((value) => EMPLOYMENT_TYPES.includes(value), {
      message: "Employment type must be full-time, part-time, contract, or internship",
    })
    .optional()
);

const futureDateSchema = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Deadline must use YYYY-MM-DD format")
    .refine((value) => {
      const deadline = new Date(`${value}T00:00:00.000Z`);
      if (Number.isNaN(deadline.getTime())) {
        return false;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return deadline >= today;
    }, "Deadline must be today or a future date")
    .optional()
);

const jobBodySchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(255),
  description: z.string().trim().min(50, "Description must be at least 50 characters").max(10000),
  location: optionalTrimmedString(255),
  salary: optionalTrimmedString(100),
  deadline: futureDateSchema,
  employment_type: employmentTypeSchema,
  experience: optionalTrimmedString(100),
  responsibilities: optionalTrimmedString(10000),
  requirements: optionalTrimmedString(10000),
});

export const createJobSchema = z.object({
  body: jobBodySchema,
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const updateJobSchema = z.object({
  body: jobBodySchema.partial(),
  query: z.object({}).passthrough(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});
