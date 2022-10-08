const { Sequelize } = require('sequelize')

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_DB,
  logging: process.env.SEQUELIZE_LOGGER === 'true' ? console.log : false,
  timezone: '+03:00',
})

module.exports = { sequelize }
