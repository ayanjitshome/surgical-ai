#!/usr/bin/env bash
# Install Vale (prose linter) locally if not already on PATH.
# Pins v3.9.1 for reproducibility; bump the version at the top when needed.
set -euo pipefail

VALE_VERSION="3.9.1"
INSTALL_DIR="${VALE_INSTALL_DIR:-$HOME/.local/bin}"
mkdir -p "$INSTALL_DIR"

if command -v vale >/dev/null 2>&1; then
  echo "vale already installed: $(vale --version)"
  exit 0
fi

uname_m="$(uname -m)"
uname_s="$(uname -s)"
case "$uname_s/$uname_m" in
  Linux/aarch64|Linux/arm64)  asset="vale_${VALE_VERSION}_Linux_arm64.tar.gz" ;;
  Linux/x86_64)               asset="vale_${VALE_VERSION}_Linux_64-bit.tar.gz" ;;
  Darwin/arm64)               asset="vale_${VALE_VERSION}_macOS_arm64.tar.gz" ;;
  Darwin/x86_64)              asset="vale_${VALE_VERSION}_macOS_64-bit.tar.gz" ;;
  *)                          echo "Unsupported platform: $uname_s/$uname_m" >&2; exit 1 ;;
esac

url="https://github.com/errata-ai/vale/releases/download/v${VALE_VERSION}/${asset}"
echo "Downloading $url"
tmp="$(mktemp -d)"
curl -sL "$url" | tar xz -C "$tmp"
mv "$tmp/vale" "$INSTALL_DIR/vale"
chmod +x "$INSTALL_DIR/vale"
rm -rf "$tmp"

echo "vale installed to $INSTALL_DIR/vale"
echo "Add $INSTALL_DIR to your PATH if it is not already:"
echo "  export PATH=\"$INSTALL_DIR:\$PATH\""
"$INSTALL_DIR/vale" --version
