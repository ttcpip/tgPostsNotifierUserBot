const { exec } = require('shelljs')

async function executeFile(cmd, execTimeout) {
  return new Promise((_resolve, _reject) => {
    const timeout = setTimeout(() => {
      _reject(new Error(`Timeout ${execTimeout} exceeded`))
    }, execTimeout)

    const resolve = (p) => {
      clearTimeout(timeout)
      _resolve(p)
    }
    const reject = (p) => {
      clearTimeout(timeout)
      _reject(p)
    }

    const functionOutput = {
      stdout: Buffer.from(''),
      stderr: Buffer.from(''),
      exitCode: NaN,
    }

    const child = exec(
      cmd,
      {
        encoding: 'base64',
        async: true,
      },
      (code, stdout, stderr) => {
        functionOutput.exitCode = code
        functionOutput.stdout = Buffer.from(stdout, 'base64')
        functionOutput.stderr = Buffer.from(stderr, 'base64')
        resolve(functionOutput)
      },
    )

    child.on('exit', (exitCode, signal) => {
      if (signal) {
        reject(new Error(`Process exited with signal "${signal}"`))
        return
      }

      functionOutput.exitCode = exitCode
    })
  })
}

module.exports = { executeFile }
