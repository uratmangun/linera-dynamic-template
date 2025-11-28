"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { lineraAdapter, type LineraProvider } from "@/lib/linera-adapter";

interface BlockLog {
  height: number;
  hash: string;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [count, setCount] = useState(0);
  const [chainId, setChainId] = useState<string | null>(null);
  const [logs, setLogs] = useState<BlockLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providerRef = useRef<LineraProvider | null>(null);
  const [chainConnected, setChainConnected] = useState(false);
  const [appConnected, setAppConnected] = useState(false);

  // Prevent hydration mismatch by waiting for mount
  useEffect(() => {
    setMounted(true);
    setChainConnected(lineraAdapter.isChainConnected());
    setAppConnected(lineraAdapter.isApplicationSet());
  }, []);

  // Get count from application
  const getCount = useCallback(async () => {
    try {
      const result = await lineraAdapter.queryApplication<{
        data: { value: number };
      }>({ query: "query { value }" });
      setCount(result.data.value);
    } catch (err) {
      console.error("Failed to get count:", err);
    }
  }, []);

  // Connect to Linera chain
  async function handleConnect() {
    setIsLoading(true);
    setError(null);

    try {
      const provider = await lineraAdapter.connect();
      providerRef.current = provider;
      setChainConnected(true);
      setChainId(provider.chainId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect to Linera"
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Connect to application
  async function handleSetApplication() {
    setIsLoading(true);
    try {
      await lineraAdapter.setApplication("99f357923c7e3afe8bfa4355af2d835482f7920cf918eb08ef76a5dd7451177b");
      await getCount();
      setAppConnected(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect to application"
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Subscribe to notifications when connected
  useEffect(() => {
    const provider = providerRef.current;
    const client = provider?.client;
    if (!client) return;

    const handler = (notification: unknown) => {
      const newBlock: BlockLog | undefined = (
        notification as { reason: { NewBlock: BlockLog } }
      )?.reason?.NewBlock;
      if (!newBlock) return;
      setLogs((prev) => [newBlock, ...prev]);
      getCount();
    };

    client.onNotification(handler);
    return () => client.onNotification(() => {});
  }, [chainConnected, getCount]);

  // Increment counter
  async function handleIncrement() {
    try {
      await lineraAdapter.queryApplication({
        query: "mutation { increment(value: 1) }",
      });
    } catch (err) {
      console.error("Failed to increment:", err);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="w-full max-w-3xl px-6 py-12">
        <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-zinc-900">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
              Linera Counter
            </h1>
          </div>

          {/* Description */}
          <div className="mb-8">
            <p className="mb-2 text-zinc-600 dark:text-zinc-400">
              This is a simple application tracking some on-chain state that
              remembers the value of an integer counter.
            </p>
            <p className="mb-2 text-zinc-600 dark:text-zinc-400">
              Click "Connect to Linera" to create a new wallet and claim a chain from the testnet faucet.
            </p>
            <p className="text-zinc-600 dark:text-zinc-400">
              Then click the button to increment the counter.
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
              <p className="text-red-500 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mb-8 flex flex-col items-center gap-4">
            {chainConnected && appConnected && (
              <p className="text-2xl font-semibold text-zinc-900 dark:text-white">
                Clicks:{" "}
                <span className="text-sky-600 dark:text-sky-400">{count}</span>
              </p>
            )}

            {mounted && !chainConnected && (
              <button
                type="button"
                onClick={handleConnect}
                disabled={isLoading}
                className="rounded-lg bg-sky-600 px-6 py-3 font-medium text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Connecting…" : "Connect to Linera"}
              </button>
            )}

            {chainConnected && !appConnected && (
              <button
                type="button"
                onClick={handleSetApplication}
                disabled={isLoading}
                className="rounded-lg bg-sky-600 px-6 py-3 font-medium text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Connecting…" : "Connect to App"}
              </button>
            )}

            {chainConnected && appConnected && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={getCount}
                  className="rounded-lg bg-zinc-200 px-6 py-3 font-medium text-zinc-800 transition-colors hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
                >
                  Get Count
                </button>
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="rounded-lg bg-sky-600 px-6 py-3 font-medium text-white transition-colors hover:bg-sky-700"
                >
                  Increment
                </button>
              </div>
            )}
          </div>

          {/* Connection Info */}
          {chainConnected && (
            <div className="space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-700">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Chain ID:{" "}
                <code className="break-all rounded bg-zinc-100 px-2 py-1 font-mono text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {chainId || "…"}
                </code>
              </h2>

              {/* Logs */}
              {logs.length > 0 && (
                <>
                  <h3 className="text-md font-semibold text-zinc-900 dark:text-white">
                    Blocks
                  </h3>
                  <ul className="max-h-64 space-y-2 overflow-y-auto">
                    {logs.map((log, index) => (
                      <li
                        key={`${log.hash}-${index}`}
                        className="rounded bg-zinc-100 px-3 py-2 font-mono text-sm dark:bg-zinc-800"
                      >
                        <span className="font-semibold text-zinc-900 dark:text-white">
                          {log.height}
                        </span>
                        :{" "}
                        <span className="break-all text-zinc-600 dark:text-zinc-400">
                          {log.hash}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
