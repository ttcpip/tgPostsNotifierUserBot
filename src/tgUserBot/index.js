const dedent = require('dedent')
const { customSerializeObject } = require('../common/customSerializeObject')
const { noop } = require('../common/noop')
const { SettingsManager } = require('../settings/SettingsManager')
const { TgBotManager } = require('../tgBot/TgBotManager')
const { onUpdateNewMessage } = require('./handlers/updateNewMessage')
const { TgUserBotManager } = require('./TgUserBotManager')

async function initTgUserBot() {
  const settings = SettingsManager.get()
  const bot = TgBotManager.get()

  TgUserBotManager.initClient({
    apiId: settings.dataa.tgUserBotApiId,
    apiHash: settings.dataa.tgUserBotApiHash,
  })

  const client = TgUserBotManager.get()

  await client.connect()

  let isLogged = false
  try {
    if (!settings.dataa.tgUserBotPhoneNumber) throw new Error(`No number`)
    await client.login(() => ({
      type: 'user',
      getPhoneNumber: () => {
        if (settings.dataa.tgUserBotPhoneNumber)
          return Promise.resolve(settings.dataa.tgUserBotPhoneNumber)
        throw new Error(`No phone number while initialization`)
      },
      getAuthCode: () => {
        throw new Error(`No auth code while initialization`)
      },
      getPassword: () => {
        throw new Error(`No password while initialization`)
      },
      getName: () => {
        throw new Error(`No name while initialization`)
      },
    }))
    isLogged = true
  } catch (err) {
    await bot.telegram
      .sendMessage(
        settings.dataa.tgAdminChatId,
        dedent`
          Не удалось залогиниться в аккаунт ${
            settings.dataa.tgUserBotPhoneNumber
          }
          ${customSerializeObject(err)}
        `,
      )
      .catch(noop)
    console.error(`Не удалось залогиниться при инициализации:`)
    console.error(err)
  }

  if (isLogged) {
    const t = `Успешно вошел в аккаунт ${settings.dataa.tgUserBotPhoneNumber}`

    await bot.telegram.sendMessage(settings.dataa.tgAdminChatId, t).catch(noop)
    console.log(t)
  }

  client.on('update', (update) => {
    if (update._ === 'updateNewMessage') onUpdateNewMessage(client, update)
  })
}

module.exports = { initTgUserBot }
