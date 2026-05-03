#!/usr/bin/env node

import readline from "node:readline";

const API_BASE = "https://discord.com/api/v10";
const SERVER_INFO = {
  name: "local-discord-bot-mcp",
  version: "1.0.0"
};

const tools = [
  {
    name: "bot_identity",
    description: "Get the Discord bot user's identity.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: "list_guilds",
    description: "List Discord servers the bot can access.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: "list_channels",
    description: "List channels in a Discord server by guild ID.",
    inputSchema: {
      type: "object",
      properties: {
        guild_id: {
          type: "string",
          description: "Discord guild/server ID."
        }
      },
      required: ["guild_id"],
      additionalProperties: false
    }
  },
  {
    name: "read_messages",
    description: "Read recent messages from a Discord channel by channel ID.",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "Discord channel ID."
        },
        limit: {
          type: "number",
          description: "Number of messages to read, 1-100.",
          minimum: 1,
          maximum: 100
        }
      },
      required: ["channel_id"],
      additionalProperties: false
    }
  },
  {
    name: "send_message",
    description: "Send a text message to a Discord channel by channel ID.",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "Discord channel ID."
        },
        content: {
          type: "string",
          description: "Message text to send."
        }
      },
      required: ["channel_id", "content"],
      additionalProperties: false
    }
  },
  {
    name: "create_dm_channel",
    description: "Create or return a direct-message channel with a Discord user by user ID.",
    inputSchema: {
      type: "object",
      properties: {
        user_id: {
          type: "string",
          description: "Discord user ID for the DM recipient."
        }
      },
      required: ["user_id"],
      additionalProperties: false
    }
  },
  {
    name: "send_dm",
    description: "Send a direct message to a Discord user by user ID.",
    inputSchema: {
      type: "object",
      properties: {
        user_id: {
          type: "string",
          description: "Discord user ID for the DM recipient."
        },
        content: {
          type: "string",
          description: "Message text to send."
        }
      },
      required: ["user_id", "content"],
      additionalProperties: false
    }
  },
  {
    name: "read_dm_messages",
    description: "Read recent direct-message messages with a Discord user by user ID.",
    inputSchema: {
      type: "object",
      properties: {
        user_id: {
          type: "string",
          description: "Discord user ID for the DM recipient."
        },
        limit: {
          type: "number",
          description: "Number of messages to read, 1-100.",
          minimum: 1,
          maximum: 100
        }
      },
      required: ["user_id"],
      additionalProperties: false
    }
  },
  {
    name: "create_text_channel",
    description: "Create a text channel in a Discord server by guild ID.",
    inputSchema: {
      type: "object",
      properties: {
        guild_id: {
          type: "string",
          description: "Discord guild/server ID."
        },
        name: {
          type: "string",
          description: "New channel name."
        },
        topic: {
          type: "string",
          description: "Optional channel topic."
        }
      },
      required: ["guild_id", "name"],
      additionalProperties: false
    }
  }
];

const rl = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity
});

rl.on("line", async (line) => {
  if (!line.trim()) return;

  let request;
  try {
    request = JSON.parse(line);
  } catch {
    writeMessage({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32700, message: "Parse error" }
    });
    return;
  }

  if (!("id" in request)) {
    return;
  }

  try {
    const result = await handleRequest(request);
    writeMessage({ jsonrpc: "2.0", id: request.id, result });
  } catch (error) {
    writeMessage({
      jsonrpc: "2.0",
      id: request.id,
      error: {
        code: error.code || -32000,
        message: error.message || "Internal error"
      }
    });
  }
});

async function handleRequest(request) {
  switch (request.method) {
    case "initialize":
      return {
        protocolVersion: request.params?.protocolVersion || "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO
      };
    case "ping":
      return {};
    case "tools/list":
      return { tools };
    case "tools/call":
      return callTool(request.params || {});
    default:
      throw jsonRpcError(-32601, `Method not found: ${request.method}`);
  }
}

async function callTool(params) {
  const name = params.name;
  const args = params.arguments || {};

  switch (name) {
    case "bot_identity":
      return textResult(await discord("GET", "/users/@me"));
    case "list_guilds":
      return textResult(await discord("GET", "/users/@me/guilds"));
    case "list_channels":
      requireString(args, "guild_id");
      return textResult(await discord("GET", `/guilds/${args.guild_id}/channels`));
    case "read_messages": {
      requireString(args, "channel_id");
      const limit = clampNumber(args.limit || 20, 1, 100);
      return textResult(
        await discord("GET", `/channels/${args.channel_id}/messages?limit=${limit}`)
      );
    }
    case "send_message":
      requireString(args, "channel_id");
      requireString(args, "content");
      return textResult(
        await discord("POST", `/channels/${args.channel_id}/messages`, {
          content: args.content
        })
      );
    case "create_dm_channel":
      requireString(args, "user_id");
      return textResult(await createDmChannel(args.user_id));
    case "send_dm": {
      requireString(args, "user_id");
      requireString(args, "content");
      const channel = await createDmChannel(args.user_id);
      return textResult(
        await discord("POST", `/channels/${channel.id}/messages`, {
          content: args.content
        })
      );
    }
    case "read_dm_messages": {
      requireString(args, "user_id");
      const limit = clampNumber(args.limit || 20, 1, 100);
      const channel = await createDmChannel(args.user_id);
      return textResult(
        await discord("GET", `/channels/${channel.id}/messages?limit=${limit}`)
      );
    }
    case "create_text_channel":
      requireString(args, "guild_id");
      requireString(args, "name");
      return textResult(
        await discord("POST", `/guilds/${args.guild_id}/channels`, {
          name: args.name,
          topic: args.topic,
          type: 0
        })
      );
    default:
      throw jsonRpcError(-32602, `Unknown tool: ${name}`);
  }
}

async function createDmChannel(userId) {
  return discord("POST", "/users/@me/channels", {
    recipient_id: userId
  });
}

async function discord(method, path, body) {
  const token = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;
  if (!token) {
    throw jsonRpcError(
      -32001,
      "Missing DISCORD_BOT_TOKEN or DISCORD_TOKEN environment variable."
    );
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const responseBody = await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = responseBody.message ? `: ${responseBody.message}` : "";
    throw jsonRpcError(-32002, `Discord API ${response.status}${details}`);
  }

  return responseBody;
}

function textResult(value) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(value, null, 2)
      }
    ]
  };
}

function requireString(args, key) {
  if (typeof args[key] !== "string" || args[key].trim() === "") {
    throw jsonRpcError(-32602, `Missing or invalid string argument: ${key}`);
  }
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw jsonRpcError(-32602, "Limit must be a number.");
  }
  return Math.max(min, Math.min(max, Math.trunc(number)));
}

function jsonRpcError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function writeMessage(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}
