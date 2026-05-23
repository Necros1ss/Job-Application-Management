import { promises as fs } from "fs";
import { validationErrorResponse } from "../utils/apiResponse.js";

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    if (req.file?.path) {
      fs.unlink(req.file.path).catch(() => {});
    }

    return res.status(400).json(
      validationErrorResponse(
        result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        }))
      )
    );
  }

  req.validated = result.data;
  return next();
};
