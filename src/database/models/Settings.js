const { Model, DataTypes } = require('sequelize')
const { sequelize } = require('../sequelize')

class Settings extends Model {
  /** @returns {import('./SettingsDataExamle.json')} */
  get dataa() {
    return this.data
  }

  // eslint-disable-next-line class-methods-use-this
  set dataa(val) {
    this.data = val
  }
}
Settings.init(
  {
    data: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Settings',
    tableName: 'settings',
    timestamps: false,
  },
)

module.exports = { Settings }
