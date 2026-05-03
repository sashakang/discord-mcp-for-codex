# Local Discord Bot MCP

Dependency-free MCP server for Discord bot operations.

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

## Auth

Start Codex with one of these environment variables set:

```sh
export DISCORD_BOT_TOKEN="your_bot_token"
# or
export DISCORD_TOKEN="your_bot_token"
```

The bot must be invited to the target server and must have the relevant Discord permissions.
For DMs, pass the recipient's Discord user ID. The recipient may need to share a server with the bot and allow DMs from server members.
