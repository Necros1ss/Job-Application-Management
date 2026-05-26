import { z } from "zod";

const emptyToUndefined = (value) => (value === "" ? undefined : value);

const futureDateTime = z
  .string()
  .trim()
  .datetime({ offset: true, message: "Interview datetime must be a valid ISO datetime" })
  .refine((value) => new Date(value).getTime() > Date.now(), "Interview datetime must be in the future");

const localDateTime = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Interview datetime must be a valid local datetime")
  .refine((value) => new Date(value).getTime() > Date.now(), "Interview datetime must be in the future");

const createInterviewBodySchema = z
  .object({
    applicationId: z.coerce.number().int().positive().optional(),
    application_id: z.coerce.number().int().positive().optional(),
    interviewerId: z.coerce.number().int().positive().optional(),
    interviewer_id: z.coerce.number().int().positive().optional(),
    interviewerName: z.string().trim().min(2).max(255).optional(),
    interviewer_name: z.string().trim().min(2).max(255).optional(),
    interviewDateTime: z.union([futureDateTime, localDateTime]).optional(),
    interview_datetime: z.union([futureDateTime, localDateTime]).optional(),
    mode: z.enum(["online", "offline"]).default("online"),
    meetLink: z.preprocess(emptyToUndefined, z.string().trim().url("Meet link must be a valid URL").optional()),
    meet_link: z.preprocess(emptyToUndefined, z.string().trim().url("Meet link must be a valid URL").optional()),
    location: z.preprocess(emptyToUndefined, z.string().trim().max(255).optional()),
    notes: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
  })
  .refine((body) => body.applicationId || body.application_id, {
    path: ["applicationId"],
    message: "applicationId is required",
  })
  .refine((body) => body.interviewerName || body.interviewer_name || body.interviewerId || body.interviewer_id, {
    path: ["interviewerId"],
    message: "interviewerId or interviewerName is required",
  })
  .refine((body) => body.interviewDateTime || body.interview_datetime, {
    path: ["interview_datetime"],
    message: "interview_datetime is required",
  });

export const createInterviewSchema = z.object({
  body: createInterviewBodySchema,
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});
