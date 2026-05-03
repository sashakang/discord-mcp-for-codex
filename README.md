# Discord MCP for Codex

Dependency-free MCP server that lets Codex use a Discord bot to read and send messages in server channels and direct messages.

## Requirements

- Node.js 18 or newer
- A Discord bot token
- A Discord server where the bot has the permissions it needs

## Discord Bot Setup

1. Create an application in the Discord Developer Portal.
2. Add a bot user to the application.
3. Copy the bot token and keep it out of git.
4. Invite the bot to your server with the permissions you need.

For simple channel posting, the bot needs `Send Messages`. For reading channel history, it needs `Read Message History`. For creating channels, it needs `Manage Channels`.

DM tools require a Discord user ID. The recipient may need to share a server with the bot and allow DMs from server members.

## Codex Setup

Clone this repo and point Codex at `discord-mcp.mjs`:

```toml
[mcp_servers.discord]
command = "node"
args = ["/absolute/path/to/discord-mcp-for-codex/discord-mcp.mjs"]

[mcp_servers.discord.env]
DISCORD_BOT_TOKEN = "your_bot_token"
```

You can also use `DISCORD_TOKEN` instead of `DISCORD_BOT_TOKEN`.

## Tools

- `bot_identity`: get the current bot user
- `list_guilds`: list servers the bot can access
- `list_channels`: list channels in a server
- `read_messages`: read recent channel messages
- `send_message`: send a channel message
- `create_dm_channel`: create or return a DM channel with a user
- `send_dm`: send a DM to a user
- `read_dm_messages`: read recent DMs with a user
- `create_text_channel`: create a text channel

## Local Smoke Test

The smoke test does not call Discord or require a token. It only verifies that the MCP server starts and advertises the expected tools.

```sh
npm run smoke:test
```

## Security

Never commit Discord bot tokens. Keep tokens in Codex config, shell environment, or another local secret store.

If a bot token is ever pasted into a public issue, log, screenshot, or repository, rotate it in the Discord Developer Portal.

## License

MIT
