export const sanitizeText = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/[\u0000-\u001f\u007f-\u009f]/g, "").trim();
};

export const sanitizeOptionalText = (value) => {
  const sanitized = sanitizeText(value);
  return sanitized.length > 0 ? sanitized : "";
};

export const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const parsePagination = (query = {}) => {
  const page = parsePositiveInt(query.page, 1);
  const limit = Math.min(parsePositiveInt(query.limit, 10), 100);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};
