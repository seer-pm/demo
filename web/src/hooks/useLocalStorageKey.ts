import { useEffect, useState } from "react";

export function useLocalStorageKey(key: string, callback: (value: string | null) => void, pollingInterval = 1000) {
  const [value, setValue] = useState(() => localStorage.getItem(key));

  useEffect(() => {
    // Check localStorage periodically
    const interval = setInterval(() => {
      const currentValue = localStorage.getItem(key);
      if (currentValue !== value) {
        setValue(currentValue);
        callback(currentValue);
      }
    }, pollingInterval);

    // Also keep the storage event listener for changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        setValue(e.newValue);
        callback(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key, value, pollingInterval]);

  return value;
}
