#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output, stderr as errorOutput } from "node:process";
import { spawn } from "node:child_process";

const DEFAULT_HANDLE = "YOUR-HANDLE";
const SITE = "family-tree-maker";
const DIST_PATH = "./dist";

function normalizeHandle(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (trimmed.endsWith(".bsky.social")) {
    return trimmed;
  }
  return `${trimmed}.bsky.social`;
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
    const answer = await rl.question("Enter your Bluesky handle: ");
    return normalizeHandle(answer);
  } finally {
    rl.close();
  }
}

async function main() {
  const handle = await resolveHandle();
  if (!handle || handle === ".bsky.social") {
    errorOutput.write("Invalid Bluesky handle. Aborting deploy.\n");
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
