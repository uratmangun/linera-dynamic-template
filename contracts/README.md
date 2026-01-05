# Linera Smart Contracts

This folder contains Linera smart contracts. Each contract is organized as a separate subfolder following the standard Linera project structure.

## Structure

```
contracts/
├── README.md
├── counter/                    # Simple counter contract
│   ├── Cargo.toml
│   ├── rust-toolchain.toml
│   └── src/
│       ├── lib.rs              # ABI definitions
│       ├── state.rs            # Application state
│       ├── contract.rs         # Contract logic (mutations)
│       └── service.rs          # Service logic (queries)
└── <future_contract>/          # Add more contracts here
```

## Creating a New Contract

Use the Linera CLI to scaffold a new contract:

```bash
cd contracts
linera project new my_new_contract
```

This creates the standard structure with all necessary files.

## Building Contracts

Build a specific contract:

```bash
cd contracts/counter
cargo build --release --target wasm32-unknown-unknown
```

The compiled WASM files will be in:
- `target/wasm32-unknown-unknown/release/counter_contract.wasm`
- `target/wasm32-unknown-unknown/release/counter_service.wasm`

## Deploying Contracts

Deploy using the Linera CLI:

```bash
linera project publish-and-create contracts/counter --json-argument "0"
```

Save the returned Application ID for frontend integration.

## Current Contracts

### counter

A simple counter application demonstrating basic Linera smart contract functionality with cross-chain sync support.

**Operations:**
- `Increment { amount }` - Increment the counter by a specified amount
- `Decrement { amount }` - Decrement the counter by a specified amount
- `Reset` - Reset the counter to zero
- `SyncTo { target_chain }` - Sync the current counter value to another chain

**Messages:**
- `SyncValue { value }` - Cross-chain message to sync counter value

**Queries:**
- `value` - Get the current counter value

**Mutations:**
- `increment(amount)` - Schedule increment operation
- `decrement(amount)` - Schedule decrement operation
- `reset()` - Schedule reset operation
- `syncTo(targetChain)` - Schedule cross-chain sync

**Features:**
- **Basic Operations**: Increment, decrement, and reset counter
- **Cross-chain Sync**: Sync counter value to other chains via messages
- **Saturating Arithmetic**: Prevents overflow/underflow
