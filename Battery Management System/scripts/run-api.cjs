const { spawn } = require('child_process')
const path = require('path')

const serverDir = path.join(__dirname, '..', 'server')
const py = process.platform === 'win32' ? 'python' : 'python3'

const child = spawn(py, ['app.py'], {
  cwd: serverDir,
  stdio: 'inherit',
  shell: true,
})

child.on('exit', (code) => process.exit(code ?? 0))
