import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "../api/utils";

export function useFetchList(fetchFn, errorMessage = "Failed to load data.") {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await fetchFn();
      setData(list);
    } catch (err) {
      setError(getApiErrorMessage(err, errorMessage));
    } finally {
      setLoading(false);
    }
  }, [fetchFn, errorMessage]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const list = await fetchFn();
        if (!cancelled) {
          setData(list);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, errorMessage));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [fetchFn, errorMessage]);

  return { data, loading, error, reload, setError };
}
