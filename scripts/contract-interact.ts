/**
 * Interact with Deployed Linera Contract
 *
 * This script interacts with a deployed Linera counter contract
 * using the local linera service GraphQL endpoint.
 *
 * Usage:
 *   bun run contract:interact service            - Start GraphQL service (run first in separate terminal)
 *   bun run contract:interact query              - Query current value
 *   bun run contract:interact increment <amount> - Increment by amount
 *   bun run contract:interact decrement <amount> - Decrement by amount
 *   bun run contract:interact reset              - Reset to 0
 *
 * Environment:
 *   APP_ID   - Application ID
 *   CHAIN_ID - Chain ID
 *   PORT     - Service port (default: 8080)
 */

import { linera } from "./linera-cli";

type Command = "query" | "increment" | "decrement" | "reset" | "service";

// Your deployed application and chain IDs
const DEFAULT_APP_ID = process.env.APP_ID || "99f357923c7e3afe8bfa4355af2d835482f7920cf918eb08ef76a5dd7451177b";
const DEFAULT_CHAIN_ID = process.env.CHAIN_ID || "5a207eca607b5b4b7f7bd5b6f848bb0d9de4ccd82fc6bcf029e78048c47aafee";
const SERVICE_PORT = parseInt(process.env.PORT || "8080", 10);

/**
 * Query the counter value via local linera service GraphQL endpoint
 */
async function queryValue(chainId: string, appId: string): Promise<void> {
  console.log("📊 Querying current counter value...\n");
  console.log(`   Chain ID: ${chainId}`);
  console.log(`   Application ID: ${appId}`);

  const url = `http://localhost:${SERVICE_PORT}/chains/${chainId}/applications/${appId}`;
  console.log(`   Endpoint: ${url}\n`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "{ value }" }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    console.log("📦 Response:", JSON.stringify(data, null, 2));

    if (data.data?.value !== undefined) {
      console.log(`\n✅ Current counter value: ${data.data.value}`);
    }
  } catch (error: any) {
    if (error.cause?.code === "ECONNREFUSED") {
      console.error("❌ Error: Cannot connect to linera service");
      console.error(`   Make sure the service is running on port ${SERVICE_PORT}`);
      console.error("\n   Start it with: bun run contract:interact service\n");
      process.exit(1);
    }
    console.error("❌ Error querying:", error.message);
    throw error;
  }
}

/**
 * Execute an operation on the contract via GraphQL mutation
 */
async function executeOperation(
  chainId: string,
  appId: string,
  operation: string,
  amount?: number
): Promise<void> {
  let mutation: string;

  switch (operation) {
    case "increment":
      if (amount === undefined) {
        throw new Error("Increment requires an amount");
      }
      mutation = `mutation { increment(value: ${amount}) }`;
      console.log(`📈 Incrementing counter by ${amount}...\n`);
      break;
    case "decrement":
      if (amount === undefined) {
        throw new Error("Decrement requires an amount");
      }
      mutation = `mutation { decrement(value: ${amount}) }`;
      console.log(`📉 Decrementing counter by ${amount}...\n`);
      break;
    case "reset":
      mutation = `mutation { reset }`;
      console.log("🔄 Resetting counter to 0...\n");
      break;
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  const url = `http://localhost:${SERVICE_PORT}/chains/${chainId}/applications/${appId}`;
  console.log(`   Chain ID: ${chainId}`);
  console.log(`   Application ID: ${appId}`);
  console.log(`   Endpoint: ${url}`);
  console.log(`   Mutation: ${mutation}\n`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: mutation }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    console.log("📦 Response:", JSON.stringify(data, null, 2));

    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    console.log("\n✅ Operation executed successfully!");
  } catch (error: any) {
    if (error.cause?.code === "ECONNREFUSED") {
      console.error("❌ Error: Cannot connect to linera service");
      console.error(`   Make sure the service is running on port ${SERVICE_PORT}`);
      console.error("\n   Start it with: bun run contract:interact service\n");
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Start the linera service (optional - for local development)
 */
async function startService(): Promise<void> {
  const port = 8080;
  console.log(`🚀 Starting Linera service on port ${port}...\n`);
  console.log(`📡 GraphiQL IDE: http://localhost:${port}`);
  console.log(`📡 Application endpoint: http://localhost:${port}/chains/${DEFAULT_CHAIN_ID}/applications/${DEFAULT_APP_ID}`);
  console.log("\n⏹️  Press Ctrl+C to stop\n");

  await linera(["service", "--port", String(port)]);
}

async function main(): Promise<void> {
  console.log("\n========================================");
  console.log("   Linera Contract Interaction");
  console.log("========================================\n");

  const command = process.argv[2] as Command;

  if (!command) {
    console.log("Usage:");
    console.log("  bun run contract:interact service            - Start GraphQL service (required first)");
    console.log("  bun run contract:interact query              - Query current value");
    console.log("  bun run contract:interact increment <amount> - Increment by amount");
    console.log("  bun run contract:interact decrement <amount> - Decrement by amount");
    console.log("  bun run contract:interact reset              - Reset to 0");
    console.log("");
    console.log("Environment:");
    console.log(`  APP_ID   - Application ID (current: ${DEFAULT_APP_ID})`);
    console.log(`  CHAIN_ID - Chain ID (current: ${DEFAULT_CHAIN_ID})`);
    process.exit(0);
  }

  // Parse arguments based on command
  let amount: number | undefined;

  if (command === "increment" || command === "decrement") {
    amount = parseInt(process.argv[3], 10);
    if (isNaN(amount)) {
      console.error(`❌ Error: ${command} requires a numeric amount`);
      process.exit(1);
    }
  }

  try {
    switch (command) {
      case "service":
        await startService();
        break;
      case "query":
        await queryValue(DEFAULT_CHAIN_ID, DEFAULT_APP_ID);
        break;
      case "increment":
      case "decrement":
      case "reset":
        await executeOperation(DEFAULT_CHAIN_ID, DEFAULT_APP_ID, command, amount);
        break;
      default:
        console.error(`❌ Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();
