import { z } from "zod";

const paginationQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional().default(""),
  role: z.enum(["candidate", "recruiter", "admin"]).optional(),
  status: z.enum(["active", "hidden", "deleted"]).optional(),
  locked: z
    .union([z.literal("true"), z.literal("false")])
    .optional(),
  deleted: z
    .union([z.literal("true"), z.literal("false")])
    .optional(),
});

const idParam = z.object({
  id: z.coerce.number().int().positive(),
});

export const listUsersSchema = z.object({
  body: z.object({}).passthrough(),
  query: paginationQuery,
  params: z.object({}).passthrough(),
});

export const listJobsSchema = z.object({
  body: z.object({}).passthrough(),
  query: paginationQuery.extend({
    recruiterId: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}).passthrough(),
});

export const userActionSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: idParam,
});

export const jobActionSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: idParam,
});
