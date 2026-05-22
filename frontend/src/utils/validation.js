const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (value, { requiredMessage = "Email is required.", invalidMessage = "Please enter a valid email address." } = {}) => {
  if (!value) return requiredMessage;
  if (!EMAIL_PATTERN.test(value)) return invalidMessage;
  return "";
};