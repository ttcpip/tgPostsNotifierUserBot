const { sequelize } = require('./sequelize')

async function initDatabase() {
  await sequelize.authenticate()
}

module.exports = { initDatabase }
