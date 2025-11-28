/**
 * Check Linera Wallet Balance
 *
 * This script displays the current balance of your wallet.
 *
 * Usage: bun run wallet:balance
 */

import { linera } from "./linera-cli";

async function checkBalance(): Promise<void> {
  console.log("\n========================================");
  console.log("   Linera Wallet Balance");
  console.log("========================================\n");

  try {
    const result = await linera(["query-balance"]);

    if (result.exitCode !== 0) {
      throw new Error(`Failed to query balance: ${result.stderr}`);
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

// Main execution
checkBalance();
