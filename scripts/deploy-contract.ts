/**
 * Deploy Linera Contract
 *
 * This script deploys the Linera smart contract to the network.
 *
 * Usage: bun run contract:deploy [--chain <chainId>] [initial-value]
 */

import { linera } from "./linera-cli";
import { existsSync } from "fs";
import { join } from "path";

function parseArgs(): { chainId?: string; initialValue: string } {
  const args = process.argv.slice(2);
  let chainId: string | undefined;
  let initialValue = "0";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--chain" && args[i + 1]) {
      chainId = args[i + 1];
      i++; // Skip next arg
    } else if (!args[i].startsWith("--")) {
      initialValue = args[i];
    }
  }

  return { chainId, initialValue };
}

async function deployContract(initialValue: string, chainId?: string): Promise<void> {
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
    if (chainId) {
      console.log(`   Chain ID: ${chainId}`);
    }
    console.log(`   Contract: ${contractWasm}`);
    console.log(`   Service: ${serviceWasm}`);

    const deployArgs = ["publish-and-create", contractWasm, serviceWasm];

    // Chain ID is a positional argument (PUBLISHER), must come after service wasm
    if (chainId) {
      deployArgs.push(chainId);
    }

    deployArgs.push("--json-argument", initialValue);

    const result = await linera(deployArgs);

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
const { chainId, initialValue } = parseArgs();
deployContract(initialValue, chainId);
