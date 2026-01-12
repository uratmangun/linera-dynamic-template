"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { lineraAdapter, type LineraProvider } from "@/lib/linera-adapter";

interface BlockLog {
  height: number;
  hash: string;
}

export default function CounterApp() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [mounted, setMounted] = useState(false);
  const [count, setCount] = useState(0);
  const [chainId, setChainId] = useState<string | null>(null);
  const [logs, setLogs] = useState<BlockLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providerRef = useRef<LineraProvider | null>(null);
  const [chainConnected, setChainConnected] = useState(false);
  const [appConnected, setAppConnected] = useState(false);
  const [applicationId, setApplicationId] = useState("");
  const [targetChainId, setTargetChainId] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  // Clone template state
  const [repoName, setRepoName] = useState("my-linera-app");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [copied, setCopied] = useState(false);

  const hasSpaces = repoName.includes(" ");
  const cloneCommand = `gh repo create ${repoName || "my-linera-app"} --template uratmangun/linera-dynamic-template --${visibility} --clone`;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(cloneCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    setMounted(true);
    setChainConnected(lineraAdapter.isChainConnected());
    setAppConnected(lineraAdapter.isApplicationSet());
  }, []);

  // Reset Linera adapter when wallet disconnects
  useEffect(() => {
    if (!isConnected || !address) {
      // User disconnected wallet - reset Linera state
      lineraAdapter.reset();
      providerRef.current = null;
      setChainConnected(false);
      setAppConnected(false);
      setChainId(null);
      setLogs([]);
      setCount(0);
      setError(null);
      setApplicationId("");
      setTargetChainId("");
    }
  }, [isConnected, address]);

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

  async function handleConnect() {
    if (!walletClient || !address) {
      setError(
        "No wallet connected. Please connect a wallet to sign Linera transactions.",
      );
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const provider = await lineraAdapter.connect(walletClient, address);
      providerRef.current = provider;
      setChainConnected(true);
      setChainId(provider.chainId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect to Linera",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSetApplication() {
    if (!applicationId.trim()) {
      setError("Please enter an Application ID");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await lineraAdapter.setApplication(applicationId.trim());
      await getCount();
      setAppConnected(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect to application",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!chainConnected || !providerRef.current) return;
    const client = providerRef.current.client;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!client || typeof (client as any).onNotification !== "function") return;

    const handler = (notification: unknown) => {
      const newBlock: BlockLog | undefined = (
        notification as { reason: { NewBlock: BlockLog } }
      )?.reason?.NewBlock;
      if (!newBlock) return;
      setLogs((prev) => [newBlock, ...prev]);
      getCount();
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (client as any).onNotification(handler);
    } catch (err) {
      console.error("Failed to set notification handler:", err);
    }
    return () => {};
  }, [chainConnected, getCount]);

  async function handleIncrement() {
    try {
      await lineraAdapter.queryApplication({
        query: "mutation { increment(value: 1) }",
      });
      await getCount();
    } catch (err) {
      console.error("Failed to increment:", err);
      setError(err instanceof Error ? err.message : "Failed to increment");
    }
  }

  async function handleSync() {
    if (!targetChainId.trim()) {
      setError("Please enter a target chain ID to sync to");
      return;
    }
    setIsSyncing(true);
    setError(null);
    try {
      await lineraAdapter.queryApplication({
        query: `mutation { syncTo(targetChain: "${targetChainId.trim()}") }`,
      });
    } catch (err) {
      console.error("Failed to sync:", err);
      setError(
        err instanceof Error ? err.message : "Failed to sync to target chain",
      );
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="w-full max-w-3xl px-6 py-12">
        <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-zinc-900">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
              Linera Counter
            </h1>
            <ConnectButton />
          </div>

          {/* Clone Template Section */}
          <div className="mb-8 rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-800/50">
            <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-white">
              Clone this template
            </h2>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              Use the GitHub CLI to create a new repository from this template:
            </p>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-1 flex-col gap-1">
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="Repository name"
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 ${
                    hasSpaces
                      ? "border-amber-500 focus:border-amber-500 focus:ring-amber-500"
                      : "border-zinc-300 focus:border-sky-500 focus:ring-sky-500 dark:border-zinc-600 dark:focus:border-sky-500"
                  }`}
                />
                {hasSpaces && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Repository names cannot contain spaces. Use hyphens instead.
                  </p>
                )}
              </div>
              <select
                value={visibility}
                onChange={(e) =>
                  setVisibility(e.target.value as "public" | "private")
                }
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-sky-500"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div className="relative mb-4 rounded-lg bg-zinc-900 p-4 dark:bg-zinc-950">
              <code className="block pr-10 text-sm text-sky-400">
                {cloneCommand}
              </code>
              <button
                type="button"
                onClick={copyToClipboard}
                className="absolute right-2 top-2 rounded p-1.5 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                aria-label="Copy command"
              >
                {copied ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <title>Copied</title>
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <title>Copy</title>
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                )}
              </button>
            </div>
            <details className="text-sm text-zinc-500 dark:text-zinc-400">
              <summary className="cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300">
                CLI Options
              </summary>
              <ul className="mt-2 list-inside list-disc space-y-1 pl-2">
                <li>
                  <code className="rounded bg-zinc-200 px-1.5 py-0.5 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                    --public
                  </code>{" "}
                  — Create a public repository
                </li>
                <li>
                  <code className="rounded bg-zinc-200 px-1.5 py-0.5 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                    --private
                  </code>{" "}
                  — Create a private repository
                </li>
                <li>
                  <code className="rounded bg-zinc-200 px-1.5 py-0.5 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                    --clone
                  </code>{" "}
                  — Clone the new repository locally
                </li>
              </ul>
            </details>
          </div>

          <div className="mb-8">
            <p className="mb-2 text-zinc-600 dark:text-zinc-400">
              This is a simple application tracking some on-chain state that
              remembers the value of an integer counter.
            </p>
            <p className="mb-2 text-zinc-600 dark:text-zinc-400">
              Connect your wallet using RainbowKit, then click &quot;Connect to
              Linera&quot; to claim a chain from the testnet faucet.
            </p>
            <p className="text-zinc-600 dark:text-zinc-400">
              Then click the button to increment the counter.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
              <p className="text-red-500 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="mb-8 flex flex-col items-center gap-4">
            {chainConnected && appConnected && (
              <p className="text-2xl font-semibold text-zinc-900 dark:text-white">
                Clicks:{" "}
                <span className="text-sky-600 dark:text-sky-400">{count}</span>
              </p>
            )}

            {mounted && isConnected && !chainConnected && (
              <button
                type="button"
                onClick={handleConnect}
                disabled={isLoading}
                className="rounded-lg bg-sky-600 px-6 py-3 font-medium text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Connecting..." : "Connect to Linera"}
              </button>
            )}

            {mounted && !isConnected && !chainConnected && (
              <p className="text-zinc-500 dark:text-zinc-400">
                Please connect your wallet using the button above to get
                started.
              </p>
            )}

            {chainConnected && !appConnected && (
              <div className="w-full space-y-4">
                <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800">
                  <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                    Deploy your smart contract to chain{" "}
                    <code className="rounded bg-zinc-200 px-1 py-0.5 text-xs dark:bg-zinc-700">
                      {chainId}
                    </code>{" "}
                    using the CLI, then enter the Application ID below.
                  </p>
                  <label
                    htmlFor="applicationId"
                    className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Application ID
                  </label>
                  <input
                    id="applicationId"
                    type="text"
                    value={applicationId}
                    onChange={(e) => setApplicationId(e.target.value)}
                    placeholder="Enter your deployed contract's Application ID"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 font-mono text-sm text-zinc-900 placeholder-zinc-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSetApplication}
                  disabled={isLoading || !applicationId.trim()}
                  className="w-full rounded-lg bg-sky-600 px-6 py-3 font-medium text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? "Connecting..." : "Connect to Application"}
                </button>
              </div>
            )}

            {chainConnected && appConnected && (
              <div className="w-full space-y-4">
                <div className="flex justify-center gap-3">
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

                <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800">
                  <h3 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Cross-Chain Sync
                  </h3>
                  <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
                    Sync the counter value to another chain after incrementing.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={targetChainId}
                      onChange={(e) => setTargetChainId(e.target.value)}
                      placeholder="Target Chain ID"
                      className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 placeholder-zinc-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500"
                    />
                    <button
                      type="button"
                      onClick={handleSync}
                      disabled={isSyncing || !targetChainId.trim()}
                      className="rounded-lg bg-teal-600 px-4 py-2 font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSyncing ? "Syncing..." : "Sync"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {chainConnected && (
            <div className="space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-700">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Chain ID:{" "}
                <code className="break-all rounded bg-zinc-100 px-2 py-1 font-mono text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {chainId || "..."}
                </code>
              </h2>

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
