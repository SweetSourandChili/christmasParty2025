"use client";

import { useEffect, useState } from "react";

export default function Snowflakes() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const snowflakes = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    animationDuration: 5 + Math.random() * 10,
    animationDelay: Math.random() * 5,
    fontSize: 0.5 + Math.random() * 1,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="snowflake"
          style={{
            left: `${flake.left}%`,
            animationDuration: `${flake.animationDuration}s`,
            animationDelay: `${flake.animationDelay}s`,
            fontSize: `${flake.fontSize}rem`,
          }}
        >
          ❄
        </div>
      ))}
    </div>
  );
}

