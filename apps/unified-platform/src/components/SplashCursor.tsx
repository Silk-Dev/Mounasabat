import React, { useEffect, useRef } from "react";

const SplashCursor: React.FC = () => {
  const splashRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (splashRef.current) {
        splashRef.current.style.left = `${e.clientX}px`;
        splashRef.current.style.top = `${e.clientY}px`;
        splashRef.current.classList.remove("animate-splash");
        // Force reflow to restart animation
        void splashRef.current.offsetWidth;
        splashRef.current.classList.add("animate-splash");
      }
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div
      ref={splashRef}
      className="pointer-events-none fixed z-[9999] w-16 h-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[#F16462]/60 to-[#FFF1E8]/60 blur-md opacity-70 animate-splash"
      style={{ transition: "left 0.1s, top 0.1s" }}
    />
  );
};

export default SplashCursor; 