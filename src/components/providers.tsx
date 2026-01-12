"use client";

import dynamic from "next/dynamic";
import { type ReactNode } from "react";

// Dynamically import RainbowProvider with SSR disabled to avoid hydration issues
const RainbowProvider = dynamic(
  () => import("./rainbow-provider").then((mod) => mod.RainbowProvider),
  { ssr: false },
);

export function Providers({ children }: { children: ReactNode }) {
  return <RainbowProvider>{children}</RainbowProvider>;
}
