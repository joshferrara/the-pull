# pull

The Pull CLI — daily AI brief in your terminal.

## Install

```sh
# Homebrew
brew tap joshferrara/the-pull
brew install --cask pull

# Scoop
scoop bucket add the-pull https://github.com/joshferrara/scoop-the-pull
scoop install pull

# Direct
curl -fsSL https://thepull.dev/install | sh
```

## Quick start

```sh
pull login         # email magic link
pull               # launch the TUI (or `pull tui`)
pull print         # markdown to stdout
pull print --json  # JSON for agents
pull saved         # bookmarked items
pull search <q>    # search local archive
```

`pull` auto-detects whether stdout is a TTY:
- TTY → launches the Bubble Tea TUI
- piped → emits markdown (so `pull | grep MCP` works for agents)

## Configuration

```sh
pull config get base_url          # https://thepull.dev
pull config set base_url <url>    # for staging/dev
```

Local data lives in:
- `~/.config/the-pull/config.toml` — config
- `~/.local/share/the-pull/cache/briefs/` — cached briefs
- `~/.local/share/the-pull/data.db` — saved items, read state

API token is stored in the OS keychain (Keychain on macOS, libsecret on Linux,
Credential Manager on Windows), falling back to `~/.config/the-pull/token`
with mode `0600` if no keychain is available.

## Verifying releases

Release artifacts are signed with [cosign](https://github.com/sigstore/cosign).
The public key is published at <https://github.com/joshferrara/the-pull/blob/main/cosign.pub>.

```sh
cosign verify-blob \
  --key https://raw.githubusercontent.com/joshferrara/the-pull/main/cosign.pub \
  --signature checksums.txt.sig \
  checksums.txt
```

## License

MIT — see the LICENSE in the repo root.
