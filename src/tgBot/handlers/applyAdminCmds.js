const { onAdminErr } = require('../helpers/onAdminErr')
const { executeFile } = require('../../common/executeFile')
const { toHHMMSS } = require('../../common/toHHMMSS')
const { noop } = require('../../common/noop')
const { getCircularReplacer } = require('../../common/getCircularReplacer')
const dedent = require('dedent')
const { inspect } = require('util')
const { GitRevisionPlugin } = require('git-revision-webpack-plugin')
const { SettingsManager } = require('../../settings/SettingsManager')
const { TgUserBotManager } = require('../../tgUserBot/TgUserBotManager')
const { customSerializeObject } = require('../../common/customSerializeObject')
const { markdownv2 } = require('telegram-format/dist/source')

const helpMessage = `
/kill - перезапуск этого админ бота

Формат номера: начиная с 7, без +. Например: 79953988279
/accLogin [номер] [пароль, если есть] - войти в тг аккаунт и сохрантиь номер
/accInfo - получить информацию о текущей залогиненном аккаунте
/accLogout - выйти из аккаунта

/tgChannelId [id] - посмотреть/установить айди тг канала

`

const helpCoder = `
/version
/kill

/exec [json | inspect | pretty]
[multiline js code]

/execcmd [raw | default] [?timeout ms]
[multiline cmd]

`

/** @param {import('telegraf').Context} ctx */
async function adminCmdsHandler(ctx) {
  const text = (ctx.message.text || ctx.message.caption || '').replace(
    `@${ctx.botInfo.username}`,
    '',
  )
  const lines = text.split('\n')
  const [line1, line2, line3, line4, line5] = lines
  const firstLineSplitedBySpaces = line1.split(' ')
  const [command, arg1, arg2, arg3, arg4] = firstLineSplitedBySpaces

  const settings = SettingsManager.get()

  if (command === '/help') {
    return await ctx.replyWithHTML(helpMessage, {
      disable_web_page_preview: true,
    })
  }

  // #region Coder cmds
  if (command === '/helpCoder') return await ctx.reply(helpCoder)

  if (command === '/exec') {
    const lines = text.split('\n')
    const jsCode = lines.slice(1).join('\n')
    // eslint-disable-next-line no-eval
    const output = await eval(`(async () => { ${jsCode} })()`)

    const outputType = arg1 || 'json'
    let message = null
    switch (outputType) {
      case 'json':
        message = JSON.stringify(output, getCircularReplacer(), 2)
        break

      case 'inspect':
        message = inspect(output, {
          showHidden: true,
          depth: 5,
        })
        break

      case 'pretty':
        message = output
        break

      default:
        break
    }
    const isJson = outputType === 'json'

    try {
      return await ctx.reply(
        `${message && message.length ? message : 'No output'}`,
      )
    } catch (err) {
      const filename = `output_${Date.now()}.${isJson ? 'json' : 'txt'}`
      const source = Buffer.from(message, 'utf8')
      const messageText = `Too long output`

      return await ctx.replyWithDocument(
        {
          filename,
          source,
        },
        { caption: messageText },
      )
    }
  }

  if (command === '/execcmd') {
    const cmd = [...lines].slice(1).join('\n')
    if (!cmd) return await ctx.reply(`Не введена команда`)

    const mode = arg1 || 'default'
    const timeout = Number.isFinite(+arg2) ? +arg2 : 3 * 60000
    const result = await executeFile(cmd, timeout)

    let messageId = NaN
    if (mode === 'default') {
      const temp = await ctx.reply(`Exit code: ${result.exitCode}`)
      messageId = temp.message_id
    } else if (mode === 'raw') {
      try {
        const temp = await ctx.reply(dedent`
          Exit code: ${result.exitCode}

          stdout:
          ${result.stdout.toString('utf8')}

          =======

          stderr:
          ${result.stderr.toString('utf8')}
        `)
        messageId = temp.message_id
      } catch (err) {
        const temp = await ctx
          .reply(
            dedent`
              Exit code: ${result.exitCode}
              Could't send result message: ${err.message}
            `,
          )
          .catch(noop)
        if (temp) messageId = temp.message_id
      }
    }

    if (result.stdout.length > 0) {
      await ctx.replyWithDocument(
        {
          filename: `stdout_${Date.now()}.txt`,
          source: result.stdout,
        },
        {
          reply_to_message_id: messageId,
          allow_sending_without_reply: true,
        },
      )
    }

    if (result.stderr.length > 0) {
      await ctx.replyWithDocument(
        {
          filename: `stderr_${Date.now()}.txt`,
          source: result.stderr,
        },
        {
          reply_to_message_id: messageId,
          allow_sending_without_reply: true,
        },
      )
    }

    return true
  }

  if (command === '/kill') {
    await ctx.reply(`Сейчас бот самоубьется`)

    setTimeout(() => {
      console.log(`Делаю process.exit(0) из-за адм команды /kill`)
      process.exit(0)
    }, 700)

    return true
  }

  if (command === '/version') {
    const g = new GitRevisionPlugin()
    const info = dedent`
      version: ${g.version()}
      branch: ${g.branch()}
      last commit: ${g.lastcommitdatetime()}

      uptime: ${toHHMMSS(process.uptime())}
    `
    return await ctx.reply(info)
  }
  // #endregion

  if (command === '/accLogin') {
    const number = arg1
    if (!number) return await ctx.reply(`Некорректно введен номер`)

    const password = arg2 || 'nopass'
    const getAuthCode = async (retry) => {
      const resp = await ctx.ask(
        {
          text:
            `Введите код для входа в тг аккаунт ${settings.dataa.tgUserBotPhoneNumber}` +
            (retry ? ` (повторный запрос)` : ''),
        },
        'Отменено',
        'text',
        { text: 'Некорректно введен код' },
        (ctx) => !!ctx.message?.text,
      )
      const code = resp?.message?.text

      if (!resp || !code) return await getAuthCode(retry)

      return code
    }

    const client = TgUserBotManager.get()

    let isAlreadyLogged = false
    try {
      const currentLoggedAccInfo = await client.invoke({ _: 'getMe' })
      if (
        currentLoggedAccInfo &&
        currentLoggedAccInfo.phone_number === number
      ) {
        await ctx.reply(
          `Вход уже произведен для аккаунта: ${currentLoggedAccInfo.phone_number}`,
        )
        isAlreadyLogged = true
      }
    } catch (err) {
      /** */
    }

    if (!isAlreadyLogged) {
      const onErr = async (err) => {
        await ctx
          .reply(
            dedent`
            Ошибка на стороне клиента:
            ${markdownv2.monospaceBlock(customSerializeObject(err) || '')}
          `,
            {
              reply_to_message_id: ctx.message.message_id,
              allow_sending_without_reply: true,
              parse_mode: 'MarkdownV2',
            },
          )
          .catch(noop)
      }
      client.on('error', onErr)

      await client.login(() => ({
        type: 'user',
        getPhoneNumber: () => {
          return Promise.resolve(number)
        },
        getAuthCode,
        getPassword: () => {
          return Promise.resolve(password)
        },
        getName: () =>
          Promise.resolve({
            firstName: 'firstName',
            lastName: 'lastName',
          }),
      }))

      client.off('error', onErr)

      await ctx.reply(`Авторизация прошла успешно для аккаунта: ${number}`)
    }

    settings.dataa = {
      ...settings.dataa,
      tgUserBotPhoneNumber: number,
    }
    await settings.save()

    return await ctx.reply(`Установка номера прошла успешно: ${number}`)
  }
  if (command === '/accInfo') {
    const client = TgUserBotManager.get()
    const settings = SettingsManager.get()
    await ctx.reply(
      `Текущий сохраненный номер: ${
        settings.dataa.tgUserBotPhoneNumber || 'нету'
      }`,
    )
    if (!settings.dataa.tgUserBotPhoneNumber) return

    const u = await client.invoke({ _: 'getMe' })
    return await ctx.reply(dedent`
      Залогиненный юзер: @${u.username || '[no username]'}
      ${u.phone_number}
      ${u.first_name} ${u.last_name}
    `)
  }
  if (command === '/accLogout') {
    const client = TgUserBotManager.get()
    await client.invoke({
      _: 'logOut',
    })

    const settings = SettingsManager.get()
    settings.dataa = { ...settings.dataa, tgUserBotPhoneNumber: '' }
    await settings.save()

    return await ctx.reply(
      `Успешно вышел с аккаунта. Перед добавлением аккаунта нужно перезапустить бота`,
    )
  }

  if (command === '/tgChannelId') {
    const settings = SettingsManager.get()
    if (!arg1) {
      await ctx.reply(`Текущий тг айди: ${settings.dataa.tgChannelId}`)

      const chatInfo = await TgUserBotManager.get().invoke({
        _: 'getChat',
        chat_id: settings.dataa.tgChannelId,
      })
      await ctx.reply(dedent`
        📝 Информация о чате
      
        Заголовок: ${chatInfo.title}
        
        Тип: ${chatInfo.type._}
      `)

      return
    }
    const tgChannelId = +arg1
    if (!Number.isFinite(tgChannelId))
      return await ctx.reply(`Тг айди введет некорректно`)

    settings.dataa = { ...settings.dataa, tgChannelId }
    await settings.save()

    return await ctx.reply(`Тг айди успешно установлен`)
  }
}

/** @param {import('telegraf').Telegraf<import('telegraf').Context>} bot */
function applyAdminCmds(bot) {
  bot.on('text', (ctx) => {
    Promise.resolve()
      .then(async () => await adminCmdsHandler(ctx))
      .catch(async (err) => await onAdminErr(ctx, err))
  })
}

module.exports = { applyAdminCmds }
