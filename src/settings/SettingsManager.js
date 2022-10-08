const { Settings } = require('../database/models')

class SettingsManager {
  /** @type {Settings} */
  static #settings = null

  static async init() {
    const instance = await Settings.findOne()
    if (!instance) throw new Error(`Settings row not found`)
    this.#settings = instance
  }

  static get() {
    if (!this.#settings) throw new Error(`Data not initialized!`)
    return this.#settings
  }
}

module.exports = { SettingsManager }
