import type { Signer } from "@linera/client";
import type { WalletClient } from "viem";

export class WagmiSigner implements Signer {
  private walletClient: WalletClient;
  private walletAddress: string;

  constructor(walletClient: WalletClient, address: string) {
    this.walletClient = walletClient;
    this.walletAddress = address;
  }

  get address(): string {
    return this.walletAddress;
  }

  async containsKey(owner: string): Promise<boolean> {
    return owner.toLowerCase() === this.walletAddress.toLowerCase();
  }

  async sign(owner: string, value: Uint8Array): Promise<string> {
    if (!this.walletAddress || !owner) {
      throw new Error("No wallet found");
    }

    if (owner.toLowerCase() !== this.walletAddress.toLowerCase()) {
      throw new Error("Owner does not match connected wallet");
    }

    try {
      // Convert Uint8Array to hex string
      const msgHex: `0x${string}` = `0x${uint8ArrayToHex(value)}`;

      // Use personal_sign via viem's walletClient
      const signature = await this.walletClient.request({
        method: "personal_sign",
        params: [msgHex, this.walletAddress as `0x${string}`],
      });

      if (!signature) throw new Error("Failed to sign message");
      return signature as string;
    } catch (error: unknown) {
      console.error("Failed to sign message:", error);
      throw new Error(
        `Wagmi signature request failed: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b: number) => b.toString(16).padStart(2, "0"))
    .join("");
}
