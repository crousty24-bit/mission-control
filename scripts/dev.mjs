import { spawn } from 'node:child_process'

function startProcess(command, args, name) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  })

  child.on('exit', (code, signal) => {
    if (signal) {
      console.log(`${name} stopped with signal ${signal}`)
      return
    }

    if (code && code !== 0) {
      console.log(`${name} stopped with code ${code}`)
      shutdown(code)
    }
  })

  return child
}

const children = []
let shuttingDown = false

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return
  }

  shuttingDown = true

  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM')
    }
  }

  setTimeout(() => process.exit(exitCode), 100)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

const api = startProcess('node', ['server/index.js'], 'API server')
children.push(api)

setTimeout(() => {
  if (shuttingDown) {
    return
  }

  const vite = startProcess('npm', ['run', 'dev:front'], 'Vite dev server')
  children.push(vite)
}, 700)
