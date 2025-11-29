"use client";

import dynamic from "next/dynamic";
import { type ReactNode } from "react";

// Dynamically import DynamicProvider with SSR disabled to avoid WalletConnect bundling issues
const DynamicProvider = dynamic(
    () => import("./dynamic-provider").then((mod) => mod.DynamicProvider),
    { ssr: false }
);

export function Providers({ children }: { children: ReactNode }) {
    return <DynamicProvider>{children}</DynamicProvider>;
}
