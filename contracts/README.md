# Counter Smart Contract

A simple Linera smart contract example that implements a counter with increment, decrement, and reset operations.

## Project Structure

```
contracts/
├── Cargo.toml          # Project dependencies
├── src/
│   ├── lib.rs          # Shared types (state, operations, messages, ABI)
│   ├── contract.rs     # Contract binary (handles state modifications)
│   └── service.rs      # Service binary (handles GraphQL queries)
└── README.md
```

## Building

```bash
# Build for WebAssembly
cargo build --release --target wasm32-unknown-unknown
```

The compiled WASM files will be in:
- `target/wasm32-unknown-unknown/release/counter_contract.wasm`
- `target/wasm32-unknown-unknown/release/counter_service.wasm`

## Deploying

```bash
# Deploy to a Linera network
linera publish-and-create \
  target/wasm32-unknown-unknown/release/counter_contract.wasm \
  target/wasm32-unknown-unknown/release/counter_service.wasm \
  --json-argument "0"
```

## Operations

The contract supports the following operations:

- **Increment**: Add a value to the counter
  ```json
  { "Increment": { "amount": 10 } }
  ```

- **Decrement**: Subtract a value from the counter
  ```json
  { "Decrement": { "amount": 5 } }
  ```

- **Reset**: Reset the counter to zero
  ```json
  "Reset"
  ```

## GraphQL Queries

Query the current counter value:

```graphql
query {
  value
}
```

## Cross-Chain Messages

The contract supports syncing values across chains via the `SyncValue` message.

### Sync to Another Chain

Use the `syncTo` mutation to send the current counter value to another chain:

```graphql
mutation {
  syncTo(targetChain: "e476187f6ddfeb9d588c7b45d3df334d5501d6499b3f9ad5595cae86cce16a65")
}
```

This will:
1. Read the current counter value on your chain
2. Send a `SyncValue` message to the target chain
3. The target chain will update its counter to match your value
