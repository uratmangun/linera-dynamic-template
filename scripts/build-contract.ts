/**
 * Build Linera Contract
 *
 * This script builds the Linera smart contract for WebAssembly.
 *
 * Usage: bun run contract:build
 */

import { cargo } from "./linera-cli";
import { existsSync } from "fs";
import { join } from "path";

async function buildContract(): Promise<void> {
  console.log("\n========================================");
  console.log("   Linera Contract Build");
  console.log("========================================\n");

  const contractsDir = join(process.cwd(), "contracts");

  if (!existsSync(contractsDir)) {
    console.error("❌ Error: contracts directory not found");
    console.error("   Expected path:", contractsDir);
    process.exit(1);
  }

  try {
    // Build for WebAssembly target
    console.log("🔨 Building contract for wasm32-unknown-unknown...");
    const result = await cargo(
      ["build", "--release", "--target", "wasm32-unknown-unknown"],
      { cwd: contractsDir }
    );

    if (result.exitCode !== 0) {
      throw new Error(`Build failed: ${result.stderr}`);
    }

    const wasmDir = join(
      contractsDir,
      "target/wasm32-unknown-unknown/release"
    );

    console.log("\n========================================");
    console.log("🎉 Build Complete!");
    console.log("========================================");
    console.log("\n📦 WASM files:");
    console.log(`   ${wasmDir}/counter_contract.wasm`);
    console.log(`   ${wasmDir}/counter_service.wasm`);
    console.log("\n");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

// Main execution
buildContract();
