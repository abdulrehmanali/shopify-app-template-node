import DataTypes from 'sequelize'

export default (sequelize) => {
  return sequelize.define('product_rewards', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    shop: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      default: false
    },
    productId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pointsToEarnPerItem: {
      type: DataTypes.NUMBER,
      default: 0
    },
  })
}
