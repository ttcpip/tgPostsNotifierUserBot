const moment = require('moment-timezone')

const getCurrentTs = () => moment().unix()

module.exports = {
  momentt: moment,
  getCurrentTs,
}
