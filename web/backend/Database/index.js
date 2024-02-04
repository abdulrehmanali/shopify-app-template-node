import sequelize from './database.js'
import ShopStoreFrontToken from './Models/ShopStoreFrontToken.model.js'
const db = {}
db.sequelize = sequelize
db.ShopStoreFrontToken = ShopStoreFrontToken(sequelize)

export default db
