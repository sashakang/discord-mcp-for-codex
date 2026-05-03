#!/usr/bin/env node

import { spawn } from "node:child_process";
import { once } from "node:events";
import { createInterface } from "node:readline";

const expectedTools = new Set([
  "bot_identity",
  "list_guilds",
  "list_channels",
  "read_messages",
  "send_message",
  "create_dm_channel",
  "send_dm",
  "read_dm_messages",
  "create_text_channel"
]);

const child = spawn(process.execPath, ["./discord-mcp.mjs"], {
  cwd: new URL("..", import.meta.url),
  stdio: ["pipe", "pipe", "inherit"]
});

const rl = createInterface({ input: child.stdout });
const responses = [];
rl.on("line", (line) => responses.push(JSON.parse(line)));

child.stdin.write(
  JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: { protocolVersion: "2024-11-05" }
  }) + "\n"
);
child.stdin.write(
  JSON.stringify({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {}
  }) + "\n"
);
child.stdin.end();

await once(child, "exit");

if (responses.length !== 2) {
  throw new Error(`Expected 2 JSON-RPC responses, received ${responses.length}.`);
}

const initialize = responses.find((response) => response.id === 1);
const toolsList = responses.find((response) => response.id === 2);

if (initialize?.result?.serverInfo?.name !== "local-discord-bot-mcp") {
  throw new Error("Initialize response did not include expected serverInfo.");
}

const actualTools = new Set(toolsList?.result?.tools?.map((tool) => tool.name));
for (const tool of expectedTools) {
  if (!actualTools.has(tool)) {
    throw new Error(`Missing expected tool: ${tool}`);
  }
}

console.log(`Smoke test passed: ${actualTools.size} tools advertised.`);
