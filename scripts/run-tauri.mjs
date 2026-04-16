import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { spawn, spawnSync } from 'node:child_process'

const mode = process.argv[2]
const rootDir = process.cwd()

if (!mode || !['dev', 'build', 'info'].includes(mode)) {
  console.error('Usage: node scripts/run-tauri.mjs <dev|build|info>')
  process.exit(1)
}

function hasCommand(command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: 'ignore',
    env: process.env,
  })

  return result.status === 0
}

function createTauriEnv() {
  const env = { ...process.env }

  if (process.platform === 'linux') {
    env.WEBKIT_DISABLE_DMABUF_RENDERER ??= '1'
    env.LIBGL_KOPPER_DISABLE ??= 'true'
  }

  if (env.MISSION_CONTROL_SOFTWARE_RENDERING === '1') {
    env.LIBGL_ALWAYS_SOFTWARE = '1'
    env.GSK_RENDERER ??= 'cairo'
  }

  return env
}

if (!hasCommand('cargo', ['--version'])) {
  console.error('Rust/Cargo is required for Mission Control Desktop.')
  console.error('Install Rust first, then retry `npm run tauri:%s`.', mode)
  process.exit(1)
}

const tauriBinaryPath = join(rootDir, 'node_modules', '.bin', 'tauri')
if (!existsSync(tauriBinaryPath)) {
  console.error('Local Tauri CLI is missing.')
  console.error('Run `npm install` to install @tauri-apps/cli, then retry `npm run tauri:%s`.', mode)
  process.exit(1)
}

const tauriArgs = ['exec', 'tauri', mode]

if (mode === 'build') {
  tauriArgs.push('--', '--bundles', 'deb')
}

const child = spawn('npm', tauriArgs, {
  cwd: rootDir,
  stdio: 'inherit',
  env: createTauriEnv(),
})

child.on('exit', (code) => {
  process.exit(code ?? 1)
})
