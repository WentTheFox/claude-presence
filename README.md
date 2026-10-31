# Discord Presence for Claude Code

Discord Rich Presence for [Claude Code](https://claude.ai/code) CLI. Automatically shows your AI coding session on your Discord profile.

![Discord](https://img.shields.io/badge/Discord-Rich%20Presence-5865F2?style=flat&logo=discord&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-%3E%3D18-339933?style=flat&logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat)

## Quick Start (2 commands)

**Works out of the box.** No Discord bot setup required - the app comes pre-configured with a shared Discord Application so you can start immediately.

```bash
npm install -g github:WentTheFox/claude-presence
claude-presence setup
```

> **Install from GitHub, not from the npm name.** The `claude-presence` name on npm belongs to an unrelated package by a different author. Installing from GitHub requires `git` on your PATH. This is a fork of [backyarddd/claude-presence](https://github.com/backyarddd/claude-presence), so make sure you use the `WentTheFox` path above.

### Install locally (without GitHub)

If you'd rather not install from GitHub, get the source onto your machine some other way (a clone, a downloaded archive, a copy from a USB stick) and install from that folder. No `git` is needed at install time, only Node.js and npm (which fetches the one dependency from the npm registry).

**Option 1: packed tarball (recommended).** Installs a self-contained copy, so you can delete the source folder afterwards:

```bash
cd claude-presence
npm pack                                   # creates claude-presence-<version>.tgz
npm install -g ./claude-presence-*.tgz
claude-presence setup
```

**Option 2: link the folder.** Good for hacking on the code, since edits apply immediately. The hooks point into this folder, so don't move or delete it:

```bash
cd claude-presence
npm install        # or: pnpm install
npm link
claude-presence setup
```

To update a local install, pull or copy in the new source, repeat the same steps, and re-run `claude-presence setup` (see [Updating](#updating)).

That's it. Start a **new** Claude Code session and your Discord profile will show your Claude Code session.

`setup` writes hooks and a statusline into `~/.claude/settings.json` (or `$CLAUDE_CONFIG_DIR/settings.json`). Sessions that are already running do not pick them up until they restart.

## What It Shows

| Field | Example |
|-------|---------|
| **Details** | `Working on my-app` (git project name, never the branch; `Using Claude Code` if hidden by the [blocklist](#hiding-projects)) |
| **Button** | `View Repository`, only when the `origin` remote is a **public** GitHub repo and the path isn't blocklisted |
| **Model** | `Opus 5 (1M context)`, `Sonnet 5`, `Haiku 4.5` |
| **Tokens** | `29.5k tokens` |
| **Elapsed** | `01:23:45 elapsed` |
| **Activity** | `Editing app.tsx`, `Running terminal command`, `Searching codebase` |
| **Status icon** | Coding / Thinking / Idle |
| **Multi-session** | `[3 sessions]` with aggregated totals |

The model line is Claude Code's own display name, so it tracks whatever you have selected - including context-tier variants like `Opus 5 (1M context)`.

### Activity Detection

| Tool Claude used | Discord shows |
|---------------------|---------------|
| `Write`, `Edit`, `NotebookEdit` | `Editing filename.ts` |
| `Read` | `Reading filename.ts` |
| `Bash` | `Running terminal command` |
| `Grep` | `Searching codebase` |
| `Glob` | `Finding files` |
| `WebSearch` | `Searching the web` |
| `WebFetch` | `Fetching web content` |
| `Agent` | `Running subagent` |
| `Skill` | `Using a skill` |
| Anything else | `Using <ToolName>` |
| Turn finished, or 2 min of silence | `Waiting for input` |

### Hiding Projects

Create `~/.claude/claude-presence-blocklist` (or `$CLAUDE_CONFIG_DIR/claude-presence-blocklist`). It sits outside the repo, so it is never committed, and setup/uninstall leave it alone. One glob per line, `#` for comments:

```
# hide everything under these
~/git/private
~/work/*/internal
**/client-*
```

`*` matches within one path segment, `**` across segments, `?` one character, and `~` is your home directory. A pattern also covers everything below a matching directory. Both the working directory and the git root are checked. A hidden session shows `Using Claude Code` instead. Hidden projects never get a `View Repository` button either. Changes apply on the next presence update, no restart needed.

**Repository button:** public status is checked with one unauthenticated request to `github.com` (cached for an hour, 10 minutes if not public). Private repos, other hosts, and any failure show no button.

### Multi-Session Support

Running multiple Claude Code instances? The presence automatically:
- Shows the count: `Working on my-app [3 sessions]`
- Aggregates total tokens across all sessions
- Displays the most recently active session's details
- Shows per-session token breakdown on hover

## Commands

| Command | Description |
|---------|-------------|
| `claude-presence setup` | Install or repoint hooks in Claude Code settings |
| `claude-presence uninstall` | Remove everything and restore original settings |
| `claude-presence status` | Show hook status, active sessions, diagnostics |
| `claude-presence --version` | Show version |
| `claude-presence --help` | Show help |

## How It Works

claude-presence uses Claude Code's [hook system](https://docs.anthropic.com/en/docs/claude-code/hooks) to capture session data:

```
Claude Code
  |
  |-- SessionStart -----> Spawns background daemon
  |-- StatusLine -------> Captures tokens, model
  |-- PostToolUse ------> Tracks activity (editing, searching, etc.)
  |-- Stop -------------> Detects idle state
  |-- SessionEnd -------> Kills daemon, cleans up
  |
  v
Bridge File (JSON)  <-->  Background Daemon  --->  Discord RPC
```

- **Hook scripts** are short-lived processes invoked by Claude Code on events
- **Bridge file** is a JSON file in your temp directory that hooks write to
- **Background daemon** watches the bridge file and pushes updates to Discord
- **StatusLine wrapper** chains with your existing statusline (GSD, etc.) so nothing breaks

Hook commands embed the absolute path of the installed package, which is why `setup` repoints existing entries instead of skipping them - see [Updating](#updating).

## Features

- **Zero config** - works immediately after `npm install -g` and `setup`
- **Pre-configured Discord app** - no bot creation needed
- **Non-destructive** - your own hooks in the same events are left untouched
- **StatusLine chaining** - preserves your existing statusline
- **Multi-session aggregation** - tracks all concurrent instances
- **Graceful degradation** - if Discord isn't running, no errors
- **Auto-reconnect** - daemon reconnects if Discord restarts
- **Orphan protection** - daemon self-terminates if session dies
- **Clean uninstall** - restores settings exactly as they were

## Advanced: Use Your Own Discord Application (Optional)

If you want to customize the app name, images, or run your own Discord Application:

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application** and name it whatever you want (this shows on your Discord profile)
3. Copy the **Application ID**
4. Go to **Rich Presence** > **Art Assets** and upload these images. They are not shipped with the install, so download them from the [`assets/` folder in this repo](https://github.com/WentTheFox/claude-presence/tree/main/assets) (or from your local copy):

| Asset Name (exact) | File | Description |
|-----------|------|-------------|
| `claude-logo` | `assets/claude-logo.png` | Main large image |
| `status-coding` | `assets/status-coding.png` | Small icon for coding |
| `status-thinking` | `assets/status-thinking.png` | Small icon for thinking |
| `status-idle` | `assets/status-idle.png` | Small icon for idle |

5. Set your Application ID as an environment variable:

```bash
# Bash / Zsh - add to ~/.bashrc or ~/.zshrc
export CLAUDE_PRESENCE_CLIENT_ID="your-application-id-here"
```

```powershell
# PowerShell - add to $PROFILE
$env:CLAUDE_PRESENCE_CLIENT_ID = "your-application-id-here"
```

This overrides the built-in default. The daemon reads it at session start, so open a new Claude Code session after setting it.

## Updating

```bash
npm install -g github:WentTheFox/claude-presence
claude-presence setup
```

For a [local install](#install-locally-without-github), rebuild the tarball (or re-link) from the updated source instead, then run `setup`.

Run `setup` after every update. Hook commands contain the absolute path of the installed package, and `setup` rewrites any existing claude-presence hook to point at the current install - so a reinstall, a changed npm prefix, or a Node version switch is repaired by re-running it. Your own hooks in the same events are never touched.

## Uninstall

```bash
claude-presence uninstall   # remove hooks first, while the CLI still exists
npm uninstall -g claude-presence
```

Restores your original Claude Code settings exactly as they were. Only claude-presence's own hooks are removed - hooks of yours that share an event, or even the same hook entry, are left in place. Run `uninstall` **before** removing the package - the hook paths point at the installed files, so uninstalling the package first leaves dead hooks in `settings.json`.

## Development

```bash
pnpm install
pnpm test    # node:test suite covering settings.json rewriting
```

## Troubleshooting

**Presence not showing:**
- Discord desktop app must be running (not browser)
- Run `claude-presence status` to check hooks are installed
- Start a **new** Claude Code session (the daemon spawns on session start)
- Check Discord Settings > Activity Privacy > "Display current activity" is enabled

**StatusLine broken after install:**
```bash
claude-presence uninstall
claude-presence setup
```

**Presence stuck or not clearing:**
```bash
claude-presence status    # check for orphaned daemons
claude-presence uninstall # force cleanup
```

**`claude-presence: command not found`:**
- npm's global bin directory is not on your PATH. Run `npm prefix -g` - that directory (or its `bin` subfolder on macOS/Linux) must be on your PATH.
- An older copy linked with `npm link` can shadow the global install. Check with `which -a claude-presence` (`where claude-presence` on Windows) and remove the stale one.

**Hooks broke after switching Node versions (nvm, fnm, volta):**
Each Node version has its own global folder, so the installed package moved. Reinstall on the new version and re-run `setup` - it repoints the hooks:
```bash
npm install -g github:WentTheFox/claude-presence   # or reinstall from your local copy
claude-presence setup
```

## Requirements

- Node.js >= 18
- `git` (only if installing from GitHub; not needed for a [local install](#install-locally-without-github))
- Discord desktop app
- Claude Code CLI

## License

MIT, see [LICENSE](LICENSE). Copyright (c) 2026 backyarddd. This fork is maintained by [WentTheFox](https://github.com/WentTheFox).

Status icons from [Heroicons](https://heroicons.com) (MIT License).
