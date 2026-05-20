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
