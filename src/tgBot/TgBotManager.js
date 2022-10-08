const { Telegraf } = require('telegraf')

class TgBotManager {
  /** @type {Telegraf<import('telegraf').Context>} */
  static #tgBot = null

  static init(tgBotToken) {
    this.#tgBot = new Telegraf(tgBotToken)
  }

  static get() {
    if (!this.#tgBot) throw new Error(`Data not initialized!`)
    return this.#tgBot
  }
}

module.exports = { TgBotManager }
