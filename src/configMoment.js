const moment = require('moment')
const moment2 = require('moment-timezone')

moment.locale('ru')
moment.defaultFormat = 'DD.MM.YYYY HH:mm:ss'
moment.tz.setDefault('Europe/Moscow')

moment2.locale('ru')
moment2.defaultFormat = 'DD.MM.YYYY HH:mm:ss'
moment2.tz.setDefault('Europe/Moscow')
