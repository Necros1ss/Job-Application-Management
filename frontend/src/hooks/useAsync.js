import { useCallback, useEffect, useRef, useState } from "react";

const useAsync = (asyncFn, { immediate = true } = {}) => {
  const mountedRef = useRef(false);
  const fnRef = useRef(asyncFn);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(immediate));
  const [error, setError] = useState(null);

  useEffect(() => {
    fnRef.current = asyncFn;
  }, [asyncFn]);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fnRef.current(...args);
      if (mountedRef.current) {
        setData(result);
      }
      return result;
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (immediate) {
      execute().catch(() => undefined);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [execute, immediate]);

  return { data, loading, error, execute, retry: execute };
};

export default useAsync;
