const dedent = require('dedent')
const { html } = require('telegram-format')
const { TgBotManager } = require('./TgBotManager')
const { SettingsManager } = require('../settings/SettingsManager')
const { applyAdminCmds } = require('./handlers/applyAdminCmds')
const { default: TelegrafQuestion } = require('telegraf-question')

async function initTgBot(tgBotToken) {
  TgBotManager.init(tgBotToken)
  const bot = TgBotManager.get()

  bot.catch((err, ctx) => {
    console.error(
      `Error from bot.catch, ctx.from.id=${ctx?.from?.id}, ctx.from.username=${ctx?.from?.username}`,
    )
    console.error(err)
  })

  bot.use(new TelegrafQuestion({ cancelTimeout: 5 * 60 * 1000 }))
  bot.on('text', async (ctx, next) => {
    if (ctx.message.text === '/id') {
      const message = dedent`
        Account id: ${html.monospace(`${ctx.from.id}`)}
        Chat id: ${html.monospace(`${ctx.chat.id}`)}
      `
      return await ctx.replyWithHTML(message)
    }
    return await next()
  })

  bot.use((ctx, next) => {
    const isAdmin = ctx.chat.id === SettingsManager.get().dataa.tgAdminChatId
    if (!isAdmin) return
    next()
  })

  applyAdminCmds(bot)

  await bot.launch({
    polling: { allowedUpdates: ['message', 'callback_query'] },
  })

  if (!bot.options.username) throw new Error(`Couldn't login as telegram bot`)

  console.log(`Started tg bot @${bot.options.username}`)
}

module.exports = { initTgBot }
