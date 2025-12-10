"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import IllusionOverlay from "./IllusionOverlay";

interface IllusionContextType {
  isActive: boolean;
  checkIllusion: () => Promise<void>;
}

const IllusionContext = createContext<IllusionContextType>({
  isActive: false,
  checkIllusion: async () => {},
});

export function useIllusion() {
  return useContext(IllusionContext);
}

export default function IllusionProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [mounted, setMounted] = useState(false);

  const checkIllusion = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setIsActive(data.illusionMode || false);
      }
    } catch {
      // Silently fail - illusion mode stays false
    }
  };

  // Poll for illusion mode changes every 3 seconds
  useEffect(() => {
    setMounted(true);
    checkIllusion();
    
    const interval = setInterval(checkIllusion, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <IllusionContext.Provider value={{ isActive, checkIllusion }}>
      {children}
      {mounted && <IllusionOverlay isActive={isActive} />}
    </IllusionContext.Provider>
  );
}

