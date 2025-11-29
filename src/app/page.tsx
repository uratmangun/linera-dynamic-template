"use client";

import dynamic from "next/dynamic";

const CounterApp = dynamic(() => import("@/components/counter-app"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="text-zinc-500 dark:text-zinc-400">Loading...</div>
    </div>
  ),
});

export default function Home() {
  return <CounterApp />;
}
