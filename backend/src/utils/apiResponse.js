export const successResponse = (data, message) => {
  const response = { success: true, data };
  if (message) {
    response.message = message;
  }
  return response;
};

export const errorResponse = (message, detail) => ({
  success: false,
  message,
  detail,
});

export const validationErrorResponse = (errors) => ({
  success: false,
  errors,
});

export const routeErrorResponse = (message, error) => ({
  message,
  ...(process.env.NODE_ENV === "production"
    ? {}
    : { detail: error?.message || "Unknown error" }),
});
