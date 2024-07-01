import sequelize from './database.js'
import ShopStoreFrontToken from './Models/ShopStoreFrontToken.model.js'
import ShopCampaigns from './Models/ShopCampaigns.model.js'
import WalletTransactions from './Models/WalletTransactions.model.js'

const db = {}
db.sequelize = sequelize
db.ShopStoreFrontToken = ShopStoreFrontToken(sequelize)
db.ShopCampaigns = ShopCampaigns(sequelize)
db.WalletTransactions = WalletTransactions(sequelize)

export default db
