import { useEffect, useRef } from "react";
// biome-ignore lint/suspicious/noExplicitAny:
export function usePreserveData(data: any) {
  const previousDataRef = useRef(data);

  useEffect(() => {
    // Only update the ref if the new data is not undefined
    if (data !== undefined) {
      previousDataRef.current = data;
    }
  }, [data]);

  // Return the current data if it exists, otherwise return the preserved data
  return data !== undefined ? data : previousDataRef.current;
}
