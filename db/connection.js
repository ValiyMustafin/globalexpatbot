const sequelize = require('./db')

const start_db = async () => {
    try {
      await sequelize.authenticate()
      await sequelize.sync()
    } catch (e) {
      console.log(e)
    }
  }

  module.exports.start_db = start_db