import { ethers } from "ethers";

// Dynamic imports for Linera client from public folder
let lineraModule: any = null;

async function loadLineraFromPublic() {
  if (lineraModule) return lineraModule;

  // Load from public folder to avoid bundler issues with WASM workers
  const module = await import(/* webpackIgnore: true */ "/linera/linera_web.js");
  lineraModule = module;
  return module;
}

// Private key signer implementation using ethers.js
// Based on the Linera PrivateKeySigner pattern
class PrivateKeySigner {
  private wallet: ethers.Wallet;

  constructor(privateKey: string) {
    this.wallet = new ethers.Wallet(privateKey);
  }

  static create(): PrivateKeySigner {
    const wallet = ethers.Wallet.createRandom();
    return new PrivateKeySigner(wallet.privateKey);
  }

  get address(): string {
    return this.wallet.address;
  }

  async sign(owner: string, value: Uint8Array): Promise<string> {
    // Validate owner matches our wallet address
    if (owner.toLowerCase() !== this.wallet.address.toLowerCase()) {
      throw new Error(`Owner ${owner} does not match signer address ${this.wallet.address}`);
    }
    // Sign using EIP-191 personal_sign
    return await this.wallet.signMessage(value);
  }

  async containsKey(owner: string): Promise<boolean> {
    return owner.toLowerCase() === this.wallet.address.toLowerCase();
  }
}

// Re-export types for compatibility
type Faucet = any;
type Client = any;
type Wallet = any;
type Application = any;

const LINERA_RPC_URL = "https://faucet.testnet-conway.linera.net";
const COUNTER_APP_ID =
  "99f357923c7e3afe8bfa4355af2d835482f7920cf918eb08ef76a5dd7451177b";

export interface LineraProvider {
  client: Client;
  wallet: Wallet;
  faucet: Faucet;
  chainId: string;
}

export class LineraAdapter {
  private static instance: LineraAdapter | null = null;
  private provider: LineraProvider | null = null;
  private application: Application | null = null;
  private wasmInitPromise: Promise<unknown> | null = null;
  private connectPromise: Promise<LineraProvider> | null = null;
  private onConnectionChange?: () => void;

  private constructor() { }

  static getInstance(): LineraAdapter {
    if (!LineraAdapter.instance) LineraAdapter.instance = new LineraAdapter();
    return LineraAdapter.instance;
  }

  async connect(rpcUrl?: string): Promise<LineraProvider> {
    if (this.provider) return this.provider;
    if (this.connectPromise) return this.connectPromise;

    try {
      this.connectPromise = (async () => {
        console.log("🔗 Connecting to Linera...");

        // Load Linera from public folder
        const linera = await loadLineraFromPublic();

        try {
          if (!this.wasmInitPromise) this.wasmInitPromise = linera.default();
          await this.wasmInitPromise;
          console.log("✅ Linera WASM modules initialized successfully");
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (msg.includes("storage is already initialized")) {
            console.warn(
              "⚠️ Linera storage already initialized; continuing without re-init"
            );
          } else {
            throw e;
          }
        }

        const faucet = new linera.Faucet(rpcUrl || LINERA_RPC_URL);
        const wallet = await faucet.createWallet();

        // Create a signer with a random private key
        const signer = PrivateKeySigner.create();
        console.log("📋 Signer address:", signer.address);

        // Claim a chain from the faucet BEFORE creating the client
        // (Client constructor consumes the wallet)
        const chainId = await faucet.claimChain(wallet, signer.address);
        console.log("✅ Chain claimed:", chainId);

        // Create client with wallet, signer, and skip_process_inbox=false
        // Note: Client constructor returns a Promise
        const client = await new linera.Client(wallet, signer, false);
        console.log("✅ Linera wallet created successfully!");
        console.log("📋 Chain ID:", chainId);

        this.provider = {
          client,
          wallet,
          faucet,
          chainId,
        };
        console.log("🔄 Notifying connection state change (chain connected)");
        this.onConnectionChange?.();
        return this.provider;
      })();

      const provider = await this.connectPromise;
      return provider;
    } catch (error) {
      console.error("Failed to connect to Linera:", error);
      throw new Error(
        `Failed to connect to Linera network: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      this.connectPromise = null;
    }
  }

  async setApplication(appId?: string) {
    if (!this.provider) throw new Error("Not connected to Linera");

    const application = await (this.provider.client as any)
      .frontend()
      .application(appId || COUNTER_APP_ID);

    if (!application) throw new Error("Failed to get application");
    console.log("✅ Linera application set successfully!");
    this.application = application;
    console.log("🔄 Notifying connection state change (app set)");
    this.onConnectionChange?.();
  }

  async queryApplication<T>(query: object): Promise<T> {
    if (!this.application) throw new Error("Application not set");

    const result = await this.application.query(JSON.stringify(query));
    const response = JSON.parse(result);

    console.log("✅ Linera application queried successfully!");
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
