"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type PrivacyContextValue = {
  privacyEnabled: boolean;
  setPrivacyEnabled: (enabled: boolean) => void;
};

const PrivacyContext = createContext<PrivacyContextValue | null>(null);

export function PrivacyProvider({
  initialEnabled,
  children,
}: {
  initialEnabled: boolean;
  children: ReactNode;
}) {
  const [privacyEnabled, setPrivacyEnabled] = useState(initialEnabled);
  const value = useMemo(
    () => ({ privacyEnabled, setPrivacyEnabled }),
    [privacyEnabled],
  );

  return (
    <PrivacyContext.Provider value={value}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const context = useContext(PrivacyContext);

  if (!context) {
    throw new Error("usePrivacy harus digunakan di dalam PrivacyProvider.");
  }

  return context;
}
