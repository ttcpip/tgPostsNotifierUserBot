const dedent = require('dedent')
const { customSerializeObject } = require('../../common/customSerializeObject')
const { SettingsManager } = require('../../settings/SettingsManager')
const { TgBotManager } = require('../../tgBot/TgBotManager')

/**
 * @param {import("tdl").Client} client
 * @param {import("tdlib-types").Update} update
 */
async function onUpdateNewMessage(client, update) {
  try {
    if (update._ !== 'updateNewMessage') throw new Error('Invalid update type')

    const settings = SettingsManager.get()
    const { message } = update
    if (
      !(
        !message.is_outgoing &&
        message.content &&
        message.content._ === 'messagePinMessage' &&
        message.chat_id === settings.dataa.tgChannelId
      )
    )
      return

    console.log(`Detected new pin at the chat: `, message.chat_id)
    const chatInfo = await client.invoke({
      _: 'getChat',
      chat_id: message.chat_id,
    })

    const notifyMsg = dedent`
      ⚡️⚡️⚡️ Замечено прикрепление сообщения

      Чат: ${chatInfo.title}
      Айди: ${chatInfo.id}
      Айди сообщения: ${message.content.message_id}

      ${
        !chatInfo.has_protected_content
          ? ''
          : `❗️ В данном чате запрещено копирование, поэтому пересылка сообщения невозможна`
      }
    `
    await TgBotManager.get().telegram.sendMessage(
      settings.dataa.tgAdminChatId,
      notifyMsg,
    )

    let isForwarded = false
    if (!chatInfo.has_protected_content) {
      try {
        const resp = await client.invoke({
          _: 'forwardMessages',
          chat_id: settings.dataa.tgAdminChatId,
          from_chat_id: message.chat_id,
          message_ids: [message.content.message_id],
        })
        if (resp.total_count > 0) isForwarded = true
      } catch (err) {
        console.error(
          `At onUpdateNewMessage when client.invoke 'forwardMessages':`,
        )
        console.error(err)
      }
    }

    if (isForwarded) return

    const resp = await client.invoke({
      _: 'getMessage',
      chat_id: message.chat_id,
      message_id: message.content.message_id,
    })

    const msg = dedent`
      ℹ️ Тип закрепленного сообщения: ${resp.content._}
      Текст:
      ${
        resp.content?.text?.text ||
        resp.content?.caption?.text ||
        'Сообщение без текста'
      }
    `.substring(0, 4096)
    const { message_id: sentMsgId } =
      await TgBotManager.get().telegram.sendMessage(
        settings.dataa.tgAdminChatId,
        msg,
      )

    const filename = `raw_message_info_${Date.now()}.txt`
    const source = Buffer.from(customSerializeObject(resp), 'utf8')

    await await TgBotManager.get().telegram.sendDocument(
      settings.dataa.tgAdminChatId,
      { filename, source },
      {
        reply_to_message_id: sentMsgId || 0,
        allow_sending_without_reply: true,
      },
    )
  } catch (err) {
    console.error(`At onUpdateNewMessage:`)
    console.error(err)
  }
}

module.exports = { onUpdateNewMessage }
