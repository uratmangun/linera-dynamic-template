---
trigger: always_on
description: "Enforces use of pnpm as primary package manager with bun, yarn, and npm as fallbacks for Node.js dependency management"
---

# Node.js Package Manager Standards

## Required Package Managers

**MANDATORY**: Use `pnpm` as the primary package manager, with fallbacks to `bun`, then `yarn`, and finally `npm` as last resort when others are unavailable or encounter errors.

### Preferred Order

1. **pnpm** - Efficient disk usage, strict dependency resolution, fast performance
2. **bun** - Ultra-fast package manager with built-in runtime and superior performance
3. **yarn** - Reliable package manager with good performance
4. **npm** - Last resort fallback when other package managers are unavailable

### Installation Commands

```bash
# Using pnpm (preferred)
pnpm install
pnpm add <package>
pnpm remove <package>
pnpm run <script>

# Using bun (fallback)
bun install
bun add <package>
bun remove <package>
bun run <script>

# Using yarn (fallback)
yarn install
yarn add <package>
yarn remove <package>
yarn run <script>

# Using npm (last resort)
npm install
npm install <package>
npm uninstall <package>
npm run <script>
```

### Project Detection

- If `pnpm-lock.yaml` exists, use `pnpm`
- If `bun.lockb` exists and pnpm is unavailable, use `bun`
- If `yarn.lock` exists and pnpm/bun are unavailable, use `yarn`
- If `package-lock.json` exists and all others are unavailable, use `npm`
- Always try `pnpm` first, then fallback to `bun`, `yarn`, and finally `npm`

### Script Execution

Always use the detected package manager for running scripts:

- `pnpm dev` (preferred)
- `bun dev` (fallback)
- `yarn dev` (fallback)
- `npm run dev` (last resort)

This ensures optimal performance with pnpm's efficient disk usage and strict dependency resolution, while maintaining reliable fallback options for maximum compatibility across different environments.
