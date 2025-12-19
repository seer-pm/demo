import { useEffect, useState } from "react";

export function useIsSmallScreen(width = 640) {
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < width);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  return isSmallScreen;
}
