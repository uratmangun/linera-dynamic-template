# Linera Dynamic Template

A Next.js template for building dApps with [Dynamic](https://dynamic.xyz) wallet authentication and [Linera](https://linera.io) blockchain smart contract interaction.

## Features

- 🔐 Dynamic wallet login integration
- ⛓️ Linera blockchain smart contract interaction
- ⚡ Next.js 16 with React 19
- 🎨 Tailwind CSS styling
- 📦 Example counter smart contract (Rust/WASM)

## Use This Template

### Option 1: GitHub UI
Click the "Use this template" button on GitHub to create a new repository.

### Option 2: GitHub CLI
```bash
gh repo create my-linera-app --template uratmangun/linera-dynamic-template --clone
cd my-linera-app
pnpm install
```

## Getting Started

1. Clone and install dependencies:
```bash
pnpm install
```

2. Copy the environment file and add your Dynamic environment ID:
```bash
cp .env.example .env.local
```

3. Get your Dynamic environment ID from [Dynamic Dashboard](https://app.dynamic.xyz) and update `.env.local`:
```
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your-dynamic-environment-id-here
```

4. Start the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
├── src/
│   ├── app/           # Next.js app router pages
│   └── lib/           # Linera adapter and utilities
├── contracts/         # Rust smart contracts (WASM)
└── public/            # Static assets
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm lint` | Run linter |
| `pnpm format` | Format code |

## Linera CLI Commands

### Wallet Management

```bash
# Initialize wallet with devnet faucet
linera wallet init --faucet https://faucet.testnet-conway.linera.net

# Show wallet info
linera wallet show

# Check wallet balance
linera wallet balance
```

### Smart Contract

```bash
# Build contract
cd contracts/counter
cargo build --release --target wasm32-unknown-unknown

# Deploy contract (from project root)
linera project publish-and-create contracts/counter --json-argument "0"

# Interact with contract via GraphQL
linera service --port 8080
# Then open http://localhost:8080 in browser
```

## Smart Contract

The template includes an example counter smart contract in `contracts/`. See [contracts/README.md](contracts/README.md) for details.

## Tech Stack

- [Next.js 16](https://nextjs.org) - React framework
- [Dynamic](https://dynamic.xyz) - Wallet authentication
- [Linera](https://linera.io) - Blockchain platform
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Biome](https://biomejs.dev) - Linting and formatting

## License

MIT
