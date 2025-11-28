/**
 * Linera CLI Wrapper
 *
 * Utility functions to execute Linera CLI commands from TypeScript.
 */

import { spawn } from "child_process";

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Execute a shell command and return the result
 */
export async function exec(
  command: string,
  args: string[] = [],
  options: { cwd?: string; env?: Record<string, string> } = {}
): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd: options.cwd || process.cwd(),
      env: { ...process.env, ...options.env },
      shell: true,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      const text = data.toString();
      stdout += text;
      process.stdout.write(text);
    });

    proc.stderr.on("data", (data) => {
      const text = data.toString();
      stderr += text;
      process.stderr.write(text);
    });

    proc.on("close", (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code ?? 0,
      });
    });

    proc.on("error", (err) => {
      reject(err);
    });
  });
}

/**
 * Execute a linera CLI command
 */
export async function linera(
  args: string[],
  options: { cwd?: string; env?: Record<string, string> } = {}
): Promise<CommandResult> {
  console.log(`\n🔧 Running: linera ${args.join(" ")}\n`);
  return exec("linera", args, options);
}

/**
 * Execute cargo command
 */
export async function cargo(
  args: string[],
  options: { cwd?: string } = {}
): Promise<CommandResult> {
  console.log(`\n🔧 Running: cargo ${args.join(" ")}\n`);
  return exec("cargo", args, options);
}
