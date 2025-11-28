/**
 * Linera Wallet Creation Script
 *
 * This script programmatically creates a wallet/chain on the Linera network
 * by querying the faucet's GraphQL API.
 *
 * The faucet exposes a GraphQL mutation `claim(owner: AccountOwner)` that
 * creates a new chain for the specified owner.
 *
 * Usage: bun run scripts/create-wallet.ts [faucet-url]
 */

import { randomBytes } from "crypto";

// Default faucet URL for Linera Testnet
const DEFAULT_FAUCET_URL = "https://faucet.testnet-conway.linera.net";

interface ClaimResult {
  origin: {
    Child: {
      parent: string;
      block_height: number;
      chain_index: number;
    };
  };
  timestamp: number;
  config: {
    ownership: {
      owners: Record<string, number>;
    };
    epoch: string;
    balance: string;
  };
}

interface ClaimResponse {
  data?: {
    claim: ClaimResult;
  };
  errors?: Array<{ message: string }>;
}

/**
 * Generate a random owner address
 * In Linera, AccountOwner can be:
 * - Reserved(u8): 0x00 to 0xff (1 byte)
 * - Address32(CryptoHash): 0x + 64 hex chars (32 bytes)
 * - Address20([u8; 20]): 0x + 40 hex chars (20 bytes, EVM-compatible)
 */
function generateRandomOwner(): string {
  // Generate 32 random bytes and convert to hex with 0x prefix
  const bytes = randomBytes(32);
  return `0x${bytes.toString("hex")}`;
}

async function createWallet(faucetUrl: string): Promise<void> {
  console.log("🚀 Starting wallet creation...");

  try {
    console.log(`🔗 Connecting to faucet: ${faucetUrl}`);

    // Generate a random owner for the new chain
    const owner = generateRandomOwner();
    console.log(`🔑 Generated owner: ${owner}`);

    // GraphQL mutation to claim a new chain
    // The faucet expects: mutation { claim(owner: "...") }
    const query = `mutation { claim(owner: "${owner}") }`;

    console.log("💼 Requesting new chain from faucet via GraphQL...");

    const response = await fetch(faucetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Faucet request failed: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as ClaimResponse;

    if (data.errors && data.errors.length > 0) {
      throw new Error(`GraphQL errors: ${data.errors.map((e) => e.message).join(", ")}`);
    }

    if (!data.data?.claim) {
      throw new Error("No chain ID returned from faucet");
    }

    const claimResult = data.data.claim;

    // Extract chain info from the response
    const parentChainId = claimResult.origin.Child.parent;
    const blockHeight = claimResult.origin.Child.block_height;
    const chainIndex = claimResult.origin.Child.chain_index;
    const balance = claimResult.config.balance;
    const epoch = claimResult.config.epoch;

    console.log("\n========================================");
    console.log("🎉 Wallet/Chain Setup Complete!");
    console.log("========================================");
    console.log(`Parent Chain ID: ${parentChainId}`);
    console.log(`Block Height: ${blockHeight}`);
    console.log(`Chain Index: ${chainIndex}`);
    console.log(`Owner: ${owner}`);
    console.log(`Balance: ${balance}`);
    console.log(`Epoch: ${epoch}`);
    console.log("========================================\n");

    console.log("📝 Your chain was created from parent chain:");
    console.log(`   Parent: ${parentChainId}`);
    console.log(`   At block height: ${blockHeight}, index: ${chainIndex}`);
  } catch (error) {
    console.error("❌ Error creating wallet:", error);
    process.exit(1);
  }
}

// Main execution
const faucetUrl = process.argv[2] || DEFAULT_FAUCET_URL;

console.log("\n========================================");
console.log("   Linera Wallet Creation Script");
console.log("========================================\n");

createWallet(faucetUrl);
