#!/usr/bin/env bash
# The Pull installer
# Served at https://thepull.dev/install — also bundled in the repo for review.

set -euo pipefail

GH_OWNER="joshferrara"
GH_REPO="the-pull"
BIN_NAME="pull"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.local/bin}"

main() {
  echo "==> The Pull installer"
  os=$(uname -s | tr '[:upper:]' '[:lower:]')
  arch=$(uname -m)
  case "$arch" in
    x86_64|amd64) arch=amd64 ;;
    arm64|aarch64) arch=arm64 ;;
    *) echo "Unsupported arch: $arch" >&2; exit 1 ;;
  esac
  case "$os" in
    darwin|linux) ;;
    *) echo "Unsupported OS: $os" >&2; exit 1 ;;
  esac

  mkdir -p "$INSTALL_DIR"
  echo "==> Looking up latest release..."
  latest=$(curl -fsSL "https://api.github.com/repos/$GH_OWNER/$GH_REPO/releases/latest" | sed -n 's/.*"tag_name": "\(.*\)".*/\1/p' | head -1)
  if [ -z "$latest" ]; then
    echo "Could not find a release; see https://github.com/$GH_OWNER/$GH_REPO/releases" >&2
    exit 1
  fi
  url="https://github.com/$GH_OWNER/$GH_REPO/releases/download/$latest/${BIN_NAME}_${os}_${arch}.tar.gz"
  echo "==> Downloading $url"
  tmp=$(mktemp -d)
  # shellcheck disable=SC2064 # $tmp captured at trap-set time on purpose.
  trap "rm -rf '$tmp'" EXIT
  curl -fsSL "$url" | tar -xz -C "$tmp"
  mv "$tmp/$BIN_NAME" "$INSTALL_DIR/$BIN_NAME"
  chmod +x "$INSTALL_DIR/$BIN_NAME"

  case ":$PATH:" in
    *":$INSTALL_DIR:"*) ;;
    *)
      shellrc=""
      case "$SHELL" in
        *zsh) shellrc="$HOME/.zshrc" ;;
        *bash) shellrc="$HOME/.bashrc" ;;
      esac
      if [ -n "$shellrc" ]; then
        echo "export PATH=\"$INSTALL_DIR:\$PATH\"" >> "$shellrc"
        echo "==> Added $INSTALL_DIR to PATH in $shellrc"
      else
        echo "==> Add $INSTALL_DIR to your PATH manually."
      fi
      ;;
  esac

  echo "==> Installed $BIN_NAME $latest to $INSTALL_DIR/$BIN_NAME"
  echo "Next: run 'pull login' to get started."
}

main "$@"
