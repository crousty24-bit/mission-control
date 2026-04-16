#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -eq 0 ]]; then
  SUDO=""
else
  SUDO="sudo"
fi

APT_PACKAGES=(
  libwebkit2gtk-4.1-dev
  build-essential
  curl
  wget
  file
  libxdo-dev
  libssl-dev
  libayatana-appindicator3-dev
  librsvg2-dev
)

echo "==> Installing Ubuntu system dependencies for Tauri"
$SUDO apt-get update
$SUDO apt-get install -y "${APT_PACKAGES[@]}"

if ! command -v rustup >/dev/null 2>&1; then
  echo "==> Installing Rust via rustup"
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
fi

export PATH="$HOME/.cargo/bin:$PATH"

echo "==> Ensuring stable Rust toolchain"
rustup default stable

echo "==> Installing project npm dependencies"
npm install

echo "==> Tauri environment"
npm run tauri:info
