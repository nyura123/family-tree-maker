#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output, stderr as errorOutput } from "node:process";
import { spawn } from "node:child_process";

const DEFAULT_HANDLE = "YOUR-HANDLE";
const SITE = "family-tree-maker";
const DIST_PATH = "./dist";

// Handle validation per the ATProto handle spec: https://atproto.com/specs/handle
const HANDLE_REGEX =
  /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

const RESERVED_TLDS = new Set([
  "alt", "arpa", "example", "internal", "invalid",
  "local", "localhost", "onion",
]);

function normalizeHandle(value) {
  let handle = String(value || "").trim();
  if (handle.startsWith("@")) handle = handle.slice(1);
  return handle.toLowerCase();
}

function validateHandle(handle) {
  if (!handle) return "Handle is empty.";
  if (handle.length > 253) return "Handle exceeds 253 characters.";
  if (!HANDLE_REGEX.test(handle)) return "Handle syntax is invalid.";
  const tld = handle.split(".").at(-1).toLowerCase();
  if (RESERVED_TLDS.has(tld)) return `Handle uses a reserved TLD (.${tld}).`;
  return null;
}

async function resolveHandle() {
  const envHandle = process.env.WISP_HANDLE;
  if (envHandle && envHandle.trim()) {
    return normalizeHandle(envHandle);
  }

  if (DEFAULT_HANDLE !== "YOUR-HANDLE") {
    return normalizeHandle(DEFAULT_HANDLE);
  }

  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question("Enter your atproto handle: ");
    return normalizeHandle(answer);
  } finally {
    rl.close();
  }
}

async function main() {
  const handle = await resolveHandle();
  const validationError = validateHandle(handle);
  if (validationError) {
    errorOutput.write(`Invalid atproto handle: ${validationError} Aborting deploy.\n`);
    process.exit(1);
  }

  const args = ["deploy", handle, "--path", DIST_PATH, "--site", SITE];
  const child = spawn("wisp-cli", args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  child.on("error", (error) => {
    errorOutput.write(`Failed to run wisp-cli: ${error.message}\n`);
    process.exit(1);
  });

  child.on("exit", (code) => {
    process.exit(code ?? 1);
  });
}

main();
