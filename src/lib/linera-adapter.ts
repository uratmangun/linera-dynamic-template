import type { Faucet, Client, Wallet, Application } from "@linera/client";
import type { WalletClient } from "viem";
import { WagmiSigner } from "./wagmi-signer";
import { loadLinera } from "./linera-loader";

const LINERA_RPC_URL = "https://faucet.testnet-conway.linera.net";
const COUNTER_APP_ID =
  "99f357923c7e3afe8bfa4355af2d835482f7920cf918eb08ef76a5dd7451177b";

export interface LineraProvider {
  client: Client;
  wallet: Wallet;
  faucet: Faucet;
  address: string;
  chainId: string;
}

export class LineraAdapter {
  private static instance: LineraAdapter | null = null;
  private provider: LineraProvider | null = null;
  private application: Application | null = null;

  private connectPromise: Promise<LineraProvider> | null = null;
  private onConnectionChange?: () => void;

  private constructor() {}

  static getInstance(): LineraAdapter {
    if (!LineraAdapter.instance) LineraAdapter.instance = new LineraAdapter();
    return LineraAdapter.instance;
  }

  async connect(
    walletClient: WalletClient,
    address: string,
    rpcUrl?: string,
  ): Promise<LineraProvider> {
    if (this.provider) return this.provider;
    if (this.connectPromise) return this.connectPromise;

    if (!walletClient || !address) {
      throw new Error(
        "Wallet client and address are required for Linera connection",
      );
    }

    try {
      this.connectPromise = (async () => {
        console.log("Connecting with wagmi wallet:", address);

        // Load Linera from public folder to avoid file:// URL issues
        const linera = await loadLinera();
        console.log("Linera WASM modules initialized successfully");

        const faucet = new linera.Faucet(rpcUrl || LINERA_RPC_URL);
        const wallet = await faucet.createWallet();
        const chainId = await faucet.claimChain(wallet, address);

        const signer = new WagmiSigner(walletClient, address);
        // Third parameter is skip_process_inbox (false = process inbox)
        // Client constructor may return a Promise in WASM bindings
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const client = await Promise.resolve(
          new (linera.Client as any)(wallet, signer, true),
        );
        console.log("Linera wallet created successfully!");
        console.log("Client methods:", Object.keys(client));
        console.log("Linera wallet created successfully!");
        console.log("Client methods:", Object.keys(client));

        this.provider = {
          client,
          wallet,
          faucet,
          chainId,
          address,
        };

        this.onConnectionChange?.();
        return this.provider;
      })();

      const provider = await this.connectPromise;
      return provider;
    } catch (error) {
      console.error("Failed to connect to Linera:", error);
      throw new Error(
        `Failed to connect to Linera network: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    } finally {
      this.connectPromise = null;
    }
  }

  async setApplication(appId?: string) {
    if (!this.provider) throw new Error("Not connected to Linera");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const application = await (this.provider.client as any)
      .frontend()
      .application(appId || COUNTER_APP_ID);

    if (!application) throw new Error("Failed to get application");
    console.log("Linera application set successfully!");
    this.application = application;
    this.onConnectionChange?.();
  }

  async queryApplication<T>(query: object): Promise<T> {
    if (!this.application) throw new Error("Application not set");

    const result = await this.application.query(JSON.stringify(query));
    const response = JSON.parse(result);

    console.log("Linera application queried successfully!");
    return response as T;
  }

  getProvider(): LineraProvider {
    if (!this.provider) throw new Error("Provider not set");
    return this.provider;
  }

  getFaucet(): Faucet {
    if (!this.provider?.faucet) throw new Error("Faucet not set");
    return this.provider.faucet;
  }

  getWallet(): Wallet {
    if (!this.provider?.wallet) throw new Error("Wallet not set");
    return this.provider.wallet;
  }

  getApplication(): Application {
    if (!this.application) throw new Error("Application not set");
    return this.application;
  }

  isChainConnected(): boolean {
    return this.provider !== null;
  }

  isApplicationSet(): boolean {
    return this.application !== null;
  }

  onConnectionStateChange(callback: () => void): void {
    this.onConnectionChange = callback;
  }

  offConnectionStateChange(): void {
    this.onConnectionChange = undefined;
  }

  reset(): void {
    this.application = null;
    this.provider = null;
    this.connectPromise = null;
    this.onConnectionChange?.();
  }
}

// Export singleton instance
export const lineraAdapter = LineraAdapter.getInstance();
