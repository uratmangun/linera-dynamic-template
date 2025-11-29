import type { Signer } from "@linera/client";
import type { Wallet as DynamicWallet } from "@dynamic-labs/sdk-react-core";
import { isEthereumWallet } from "@dynamic-labs/ethereum";

export class DynamicSigner implements Signer {
    private dynamicWallet: DynamicWallet;

    constructor(dynamicWallet: DynamicWallet) {
        this.dynamicWallet = dynamicWallet;
    }

    get address(): string {
        return this.dynamicWallet.address;
    }

    async containsKey(owner: string): Promise<boolean> {
        const walletAddress = this.dynamicWallet.address;
        return owner.toLowerCase() === walletAddress.toLowerCase();
    }

    async sign(owner: string, value: Uint8Array): Promise<string> {
        const primaryWalletAddress = this.dynamicWallet.address;

        if (!primaryWalletAddress || !owner) {
            throw new Error("No primary wallet found");
        }

        if (owner.toLowerCase() !== primaryWalletAddress.toLowerCase()) {
            throw new Error("Owner does not match primary wallet");
        }

        try {
            // Ensure this is an Ethereum wallet (external wallet like MetaMask)
            if (!isEthereumWallet(this.dynamicWallet)) {
                throw new Error("Wallet is not an Ethereum wallet. Please connect an external wallet like MetaMask.");
            }

            // Convert Uint8Array to hex string
            const msgHex: `0x${string}` = `0x${uint8ArrayToHex(value)}`;

            // Get the wallet client from the external wallet
            const walletClient = await this.dynamicWallet.getWalletClient();

            // Use personal_sign directly on the external wallet
            // This triggers MetaMask/external wallet's native signing UI
            const signature = await walletClient.request({
                method: "personal_sign",
                params: [msgHex, primaryWalletAddress as `0x${string}`],
            });

            if (!signature) throw new Error("Failed to sign message");
            return signature as string;
        } catch (error: unknown) {
            console.error("Failed to sign message:", error);
            throw new Error(
                `Dynamic signature request failed: ${error instanceof Error ? error.message : error}`
            );
        }
    }
}

function uint8ArrayToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map((b: number) => b.toString(16).padStart(2, "0"))
        .join("");
}
