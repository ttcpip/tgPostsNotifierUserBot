require('./configUtil')
require('./configEnv')

const { initDatabase } = require('./database')
const { SettingsManager } = require('./settings/SettingsManager')
const { initTgBot } = require('./tgBot')
const { initTgUserBot } = require('./tgUserBot')

const main = async () => {
  console.log(`Calling initDatabase...`)
  await initDatabase()
  console.log(`initDatabase done`)

  setInterval(async () => {
    try {
      await SettingsManager.get().reload()
    } catch (err) {
      console.error(`At setInterval for await SettingsManager.get().reload()`)
      console.error(err)
    }
  }, 30 * 1000)

  console.log(`Calling SettingsManager.init...`)
  await SettingsManager.init()
  console.log(`SettingsManager.init done`)

  const settings = SettingsManager.get().dataa

  console.log(`Calling initTgBot...`)
  await initTgBot(settings.tgBotToken)
  console.log(`initTgBot done`)

  console.log(`Calling initTgUserBot...`)
  await initTgUserBot()
  console.log(`initTgUserBot done`)
}

main().catch((err) => {
  console.error(`At main():`)
  console.error(err)
  console.error(`Terminating...`)
  process.exit(1)
})
