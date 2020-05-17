import './index.css'
import {Terminal} from 'xterm'
import {FitAddon} from 'xterm-addon-fit'
import LocalEchoController from 'local-echo'

import csgoCommands from './commands.json'


async function runTerminal(term) {
  const localEcho = new LocalEchoController(term, {historySize: 500})

  localEcho.addAutocompleteHandler((index, tokens) => {
    return csgoCommands
  })

  if (localStorage.history) {
    const {entries, cursor} = JSON.parse(localStorage.history)
    localEcho.history.entries = entries || []
    localEcho.history.cursor = cursor || 0
  }

  while (true) {
    const command = await localEcho.read('# ')

    if (command.startsWith('rcon_password')) {
      localStorage.password = command.split('rcon_password ')[1]
      localEcho.println('Saved.')
    } else {
      let resp
      try {
        resp = await fetch(process.env.RCONWEBAPI_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            'RconRequest': {
              'Address': process.env.RCON_SERVER,
              'Password': localStorage.password,
              'Command': command,
            }
          }),
        })
      } catch (err) {
        localEcho.println(`error: ${err}`)
        continue
      }

      if (!resp.ok) {
        localEcho.println(`request failed: ${resp.status}`)
        continue
      }

      let respData
      try {
        respData = await resp.json()
      } catch (err) {
        localEcho.println(`parsing response failed: ${err}`)
        continue
      }

      const output = respData.RconResponse && respData.RconResponse.Output
      if (output === undefined) {
        localEcho.println(`unexpected data received: ${JSON.stringify(respData.RconResponse.Output)}`)
      } else {
        localEcho.println(output)
      }
    }

    const {entries, cursor} = localEcho.history
    localStorage.history = JSON.stringify({entries, cursor})
  }
}

function init() {
  const term = new Terminal()
  const fitAddon = new FitAddon()
  term.loadAddon(fitAddon)

  term.open(document.body)
  fitAddon.fit()
  window.addEventListener('resize', () => fitAddon.fit())

  term.focus()

  runTerminal(term)
}

init()
