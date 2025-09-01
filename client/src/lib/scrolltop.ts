import { useEffect, FC } from "react";
import { useLocation } from "wouter";

const ScrollToTop: FC = () => {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location]);

  return null;
};

export default ScrollToTop;
