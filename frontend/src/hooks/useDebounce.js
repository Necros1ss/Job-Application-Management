import { useEffect, useState } from "react";

export const useDebouncedValue = (value, delay = 400) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => window.clearTimeout(timerId);
  }, [value, delay]);

  return debouncedValue;
};

export default useDebouncedValue;
