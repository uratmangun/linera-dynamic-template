/**
 * Initialize Linera Wallet via CLI
 *
 * This script initializes a Linera wallet and requests a chain from the faucet.
 *
 * Usage: bun run wallet:init [faucet-url]
 */

import { linera } from "./linera-cli";

const DEFAULT_FAUCET_URL = "https://faucet.testnet-conway.linera.net";

async function initWallet(faucetUrl: string): Promise<void> {
  console.log("\n========================================");
  console.log("   Linera Wallet Initialization (CLI)");
  console.log("========================================\n");

  try {
    // Step 1: Initialize the wallet with the faucet
    console.log("📦 Step 1: Initializing wallet...");
    const initResult = await linera([
      "wallet",
      "init",
      "--faucet",
      faucetUrl,
    ]);

    if (initResult.exitCode !== 0) {
      // Check if wallet already exists
      if (initResult.stderr.includes("already exists")) {
        console.log("⚠️  Wallet already exists, skipping initialization.");
      } else {
        throw new Error(`Wallet init failed: ${initResult.stderr}`);
      }
    } else {
      console.log("✅ Wallet initialized successfully!");
    }

    // Step 2: Request a new chain from the faucet
    console.log("\n📦 Step 2: Requesting chain from faucet...");
    const chainResult = await linera([
      "wallet",
      "request-chain",
      "--faucet",
      faucetUrl,
    ]);

    if (chainResult.exitCode !== 0) {
      throw new Error(`Chain request failed: ${chainResult.stderr}`);
    }

    console.log("\n✅ Chain requested successfully!");

    // Step 3: Show wallet info
    console.log("\n📦 Step 3: Showing wallet info...");
    await linera(["wallet", "show"]);

    console.log("\n========================================");
    console.log("🎉 Wallet Setup Complete!");
    console.log("========================================\n");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

// Main execution
const faucetUrl = process.argv[2] || DEFAULT_FAUCET_URL;
initWallet(faucetUrl);
