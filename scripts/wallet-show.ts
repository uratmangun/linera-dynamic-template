/**
 * Show Linera Wallet Info
 *
 * This script displays the current wallet information.
 *
 * Usage: bun run wallet:show
 */

import { linera } from "./linera-cli";

async function showWallet(): Promise<void> {
  console.log("\n========================================");
  console.log("   Linera Wallet Info");
  console.log("========================================\n");

  try {
    const result = await linera(["wallet", "show"]);

    if (result.exitCode !== 0) {
      throw new Error(`Failed to show wallet: ${result.stderr}`);
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

// Main execution
showWallet();
