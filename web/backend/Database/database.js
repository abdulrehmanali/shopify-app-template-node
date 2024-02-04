import Sequelize from 'sequelize'
const sequelize = new Sequelize(process.env.MYSQL_DATABASE, process.env.MYSQL_USERNAME, process.env.MYSQL_PASSWORD, {
  host: process.env.MYSQL_URL,
  port: process.env.MYSQL_PORT,
  dialect: 'mysql',
})
sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully with database.')
  })
  .catch((error) => {
    console.error('Unable to connect to the database: ', error)
  })
export default sequelize
