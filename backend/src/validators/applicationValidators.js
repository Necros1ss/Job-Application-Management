import { z } from "zod";

const emptyToUndefined = (value) => (value === "" ? undefined : value);

export const createApplicationSchema = z.object({
  body: z.object({
    jobId: z.coerce.number().int().positive("jobId must be a positive integer"),
    coverLetter: z.preprocess(
      emptyToUndefined,
      z.string().trim().max(2000, "Cover letter must be 2000 characters or less").optional()
    ),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(["applied", "reviewed", "scheduled_interview", "accepted", "rejected"]),
  }),
  query: z.object({}).passthrough(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const rejectApplicationSchema = z.object({
  body: z.object({
    reason: z.string().trim().min(10, "Reason must be at least 10 characters").max(1000),
    emailBody: z.string().trim().min(20, "Email body must be at least 20 characters").max(3000),
  }),
  query: z.object({}).passthrough(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const addNoteSchema = z.object({
  body: z.object({
    note: z.string().trim().min(1, "Note is required").max(2000, "Note must be 2000 characters or less"),
  }),
  query: z.object({}).passthrough(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});
