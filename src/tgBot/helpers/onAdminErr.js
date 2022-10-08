const { customSerializeObject } = require('../../common/customSerializeObject')
const { noop } = require('../../common/noop')

/**
 * @param {import('telegraf').Context} ctx
 * @param {Error} err
 */
async function onAdminErr(ctx, err) {
  try {
    console.error(`Ошибка при обработке сообщения в тг админке:`)
    console.error(err)

    err.isAdminHandlingErr = true

    const temp = await ctx
      .reply(`При обработке произошла ошибка: ${err.message}`, {
        reply_to_message_id: ctx?.message?.message_id,
        allow_sending_without_reply: true,
        disable_web_page_preview: true,
      })
      .catch(noop)

    const errInfo = customSerializeObject(err)

    try {
      await ctx.reply(errInfo, {
        reply_to_message_id: temp ? temp.message_id : 0,
        allow_sending_without_reply: true,
        disable_web_page_preview: true,
      })
    } catch {
      const filename = `output_${Date.now()}.txt`
      const source = Buffer.from(errInfo, 'utf8')
      const caption = `Too long output`

      await ctx.replyWithDocument(
        { filename, source },
        {
          caption,
          reply_to_message_id: temp ? temp.message_id : 0,
          allow_sending_without_reply: true,
        },
      )
    }
  } catch (err) {
    console.error(`At onAdminErr:`)
    console.error(err)
  }
}

module.exports = { onAdminErr }
