"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDynamicContext, useIsLoggedIn } from "@dynamic-labs/sdk-react-core";
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import { lineraAdapter, type LineraProvider } from "@/lib/linera-adapter";

interface BlockLog {
    height: number;
    hash: string;
}

export default function CounterApp() {
    const { primaryWallet } = useDynamicContext();
    const isLoggedIn = useIsLoggedIn();
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

    useEffect(() => {
        setMounted(true);
        setChainConnected(lineraAdapter.isChainConnected());
        setAppConnected(lineraAdapter.isApplicationSet());
    }, []);

    // Reset Linera adapter when Dynamic wallet disconnects
    useEffect(() => {
        if (!isLoggedIn || !primaryWallet) {
            // User logged out or wallet disconnected - reset Linera state
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
    }, [isLoggedIn, primaryWallet]);

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
        if (!primaryWallet) {
            setError("No wallet connected. Please connect a wallet to sign Linera transactions.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const provider = await lineraAdapter.connect(primaryWallet);
            providerRef.current = provider;
            setChainConnected(true);
            setChainId(provider.chainId);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to connect to Linera");
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
            setError(err instanceof Error ? err.message : "Failed to connect to application");
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (!chainConnected || !providerRef.current) return;
        const client = providerRef.current.client;
        if (!client || typeof client.onNotification !== 'function') return;

        const handler = (notification: unknown) => {
            const newBlock: BlockLog | undefined = (
                notification as { reason: { NewBlock: BlockLog } }
            )?.reason?.NewBlock;
            if (!newBlock) return;
            setLogs((prev) => [newBlock, ...prev]);
            getCount();
        };

        try {
            client.onNotification(handler);
        } catch (err) {
            console.error('Failed to set notification handler:', err);
        }
        return () => { };
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
            setError(err instanceof Error ? err.message : "Failed to sync to target chain");
        } finally {
            setIsSyncing(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
            <div className="w-full max-w-3xl px-6 py-12">
                <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-zinc-900">
                    <div className="mb-8 flex items-center justify-between">
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Linera Counter</h1>
                        <DynamicWidget />
                    </div>

                    <div className="mb-8">
                        <p className="mb-2 text-zinc-600 dark:text-zinc-400">
                            This is a simple application tracking some on-chain state that remembers the value of an integer counter.
                        </p>
                        <p className="mb-2 text-zinc-600 dark:text-zinc-400">
                            Connect your wallet using Dynamic, then click "Connect to Linera" to claim a chain from the testnet faucet.
                        </p>
                        <p className="text-zinc-600 dark:text-zinc-400">Then click the button to increment the counter.</p>
                    </div>

                    {error && (
                        <div className="mb-6 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                            <p className="text-red-500 dark:text-red-300">{error}</p>
                        </div>
                    )}

                    <div className="mb-8 flex flex-col items-center gap-4">
                        {chainConnected && appConnected && (
                            <p className="text-2xl font-semibold text-zinc-900 dark:text-white">
                                Clicks: <span className="text-sky-600 dark:text-sky-400">{count}</span>
                            </p>
                        )}

                        {mounted && isLoggedIn && !chainConnected && (
                            <button
                                type="button"
                                onClick={handleConnect}
                                disabled={isLoading}
                                className="rounded-lg bg-sky-600 px-6 py-3 font-medium text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isLoading ? "Connecting…" : "Connect to Linera"}
                            </button>
                        )}

                        {mounted && !isLoggedIn && !chainConnected && (
                            <p className="text-zinc-500 dark:text-zinc-400">
                                Please connect your wallet using the button above to get started.
                            </p>
                        )}

                        {chainConnected && !appConnected && (
                            <div className="w-full space-y-4">
                                <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800">
                                    <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                                        Deploy your smart contract to chain <code className="rounded bg-zinc-200 px-1 py-0.5 text-xs dark:bg-zinc-700">{chainId}</code> using the CLI, then enter the Application ID below.
                                    </p>
                                    <label htmlFor="applicationId" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                                    {isLoading ? "Connecting…" : "Connect to Application"}
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
                                    <h3 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Cross-Chain Sync</h3>
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
                                            {isSyncing ? "Syncing…" : "Sync"}
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
                                    {chainId || "…"}
                                </code>
                            </h2>

                            {logs.length > 0 && (
                                <>
                                    <h3 className="text-md font-semibold text-zinc-900 dark:text-white">Blocks</h3>
                                    <ul className="max-h-64 space-y-2 overflow-y-auto">
                                        {logs.map((log, index) => (
                                            <li key={`${log.hash}-${index}`} className="rounded bg-zinc-100 px-3 py-2 font-mono text-sm dark:bg-zinc-800">
                                                <span className="font-semibold text-zinc-900 dark:text-white">{log.height}</span>:{" "}
                                                <span className="break-all text-zinc-600 dark:text-zinc-400">{log.hash}</span>
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
