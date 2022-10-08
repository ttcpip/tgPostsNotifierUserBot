const { Client } = require('tdl')
const { TDLib } = require('tdl-tdlib-addon')

class TgUserBotManager {
  /** @type {Client} */
  static #client = null

  static initClient({ apiId, apiHash }) {
    this.#client = new Client(
      process.platform === 'win32' ? new TDLib() : new TDLib('./libtdjson.so'),
      {
        apiHash,
        apiId,
      },
    )
  }

  static get() {
    if (!this.#client) throw new Error(`Data not initialized!`)
    return this.#client
  }
}

module.exports = { TgUserBotManager }
