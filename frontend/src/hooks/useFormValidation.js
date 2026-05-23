import { useCallback, useMemo, useState } from "react";

const runValidators = (value, validators = [], values = {}) => {
  for (const validator of validators) {
    const message = validator(value, values);
    if (message) {
      return message;
    }
  }

  return "";
};

const validateValues = (values, rules) =>
  Object.entries(rules).reduce((nextErrors, [field, validators]) => {
    const message = runValidators(values[field], validators, values);
    if (message) {
      nextErrors[field] = message;
    }
    return nextErrors;
  }, {});

export const validators = {
  required:
    (message = "This field is required") =>
    (value) => {
      if (value === null || value === undefined) {
        return message;
      }

      if (typeof value === "string" && value.trim() === "") {
        return message;
      }

      if (Array.isArray(value) && value.length === 0) {
        return message;
      }

      return "";
    },

  minLength:
    (length, message = `Must be at least ${length} characters`) =>
    (value) => {
      if (!value) {
        return "";
      }

      return String(value).trim().length < length ? message : "";
    },

  maxLength:
    (length, message = `Must be ${length} characters or less`) =>
    (value) => {
      if (!value) {
        return "";
      }

      return String(value).trim().length > length ? message : "";
    },

  email:
    (message = "Please enter a valid email") =>
    (value) => {
      if (!value) {
        return "";
      }

      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim()) ? "" : message;
    },

  url:
    (message = "Please enter a valid URL") =>
    (value) => {
      if (!value) {
        return "";
      }

      try {
        new URL(String(value).trim());
        return "";
      } catch {
        return message;
      }
    },

  pattern:
    (regex, message = "Invalid format") =>
    (value) => {
      if (!value) {
        return "";
      }

      return regex.test(String(value)) ? "" : message;
    },
};

export const useFormValidation = (initialValues, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState(() => validateValues(initialValues, validationRules));

  const validateField = useCallback(
    (field, nextValues = values) => runValidators(nextValues[field], validationRules[field] || [], nextValues),
    [validationRules, values]
  );

  const setFieldValue = useCallback(
    (field, value) => {
      setValues((current) => {
        const nextValues = { ...current, [field]: value };
        setErrors((currentErrors) => ({
          ...currentErrors,
          [field]: validateField(field, nextValues),
        }));
        return nextValues;
      });
    },
    [validateField]
  );

  const handleChange = useCallback(
    (eventOrField, maybeValue) => {
      if (typeof eventOrField === "string") {
        setFieldValue(eventOrField, maybeValue);
        return;
      }

      const target = eventOrField.target;
      const value = target.type === "checkbox" ? target.checked : target.value;
      setFieldValue(target.name, value);
    },
    [setFieldValue]
  );

  const handleBlur = useCallback(
    (eventOrField) => {
      const field = typeof eventOrField === "string" ? eventOrField : eventOrField.target.name;
      setTouched((current) => ({ ...current, [field]: true }));
      setErrors((current) => ({ ...current, [field]: validateField(field) }));
    },
    [validateField]
  );

  const handleSubmit = useCallback(
    (onValid) => async (event) => {
      event?.preventDefault?.();
      const nextErrors = validateValues(values, validationRules);
      const allTouched = Object.keys(validationRules).reduce((nextTouched, field) => {
        nextTouched[field] = true;
        return nextTouched;
      }, {});

      setTouched(allTouched);
      setErrors(nextErrors);

      if (Object.keys(nextErrors).length > 0) {
        return false;
      }

      await onValid(values, event);
      return true;
    },
    [validationRules, values]
  );

  const reset = useCallback(
    (nextValues = initialValues) => {
      setValues(nextValues);
      setTouched({});
      setErrors(validateValues(nextValues, validationRules));
    },
    [initialValues, validationRules]
  );

  const isValid = useMemo(() => Object.keys(validateValues(values, validationRules)).length === 0, [values, validationRules]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    isValid,
    reset,
    setValues,
    setFieldValue,
  };
};
