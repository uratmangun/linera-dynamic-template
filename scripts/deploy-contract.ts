/**
 * Deploy Linera Contract
 *
 * This script deploys the Linera smart contract to the network.
 *
 * Usage: bun run contract:deploy [initial-value]
 */

import { linera } from "./linera-cli";
import { existsSync } from "fs";
import { join } from "path";

async function deployContract(initialValue: string): Promise<void> {
  console.log("\n========================================");
  console.log("   Linera Contract Deployment");
  console.log("========================================\n");

  const contractsDir = join(process.cwd(), "contracts");
  const wasmDir = join(contractsDir, "target/wasm32-unknown-unknown/release");

  const contractWasm = join(wasmDir, "counter_contract.wasm");
  const serviceWasm = join(wasmDir, "counter_service.wasm");

  // Check if WASM files exist
  if (!existsSync(contractWasm)) {
    console.error("❌ Error: Contract WASM not found");
    console.error("   Expected:", contractWasm);
    console.error("\n   Run 'bun run contract:build' first.");
    process.exit(1);
  }

  if (!existsSync(serviceWasm)) {
    console.error("❌ Error: Service WASM not found");
    console.error("   Expected:", serviceWasm);
    console.error("\n   Run 'bun run contract:build' first.");
    process.exit(1);
  }

  try {
    console.log(`📦 Deploying contract with initial value: ${initialValue}`);
    console.log(`   Contract: ${contractWasm}`);
    console.log(`   Service: ${serviceWasm}`);

    const result = await linera([
      "publish-and-create",
      contractWasm,
      serviceWasm,
      "--json-argument",
      initialValue,
    ]);

    if (result.exitCode !== 0) {
      throw new Error(`Deployment failed: ${result.stderr}`);
    }

    console.log("\n========================================");
    console.log("🎉 Deployment Complete!");
    console.log("========================================\n");

    // Extract application ID from output if available
    const appIdMatch = result.stdout.match(/Application ID:\s*(\S+)/i);
    if (appIdMatch) {
      console.log(`📝 Application ID: ${appIdMatch[1]}`);
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

// Main execution
const initialValue = process.argv[2] || "0";
deployContract(initialValue);
