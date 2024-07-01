import DataTypes from 'sequelize'

export default (sequelize) => {
  return sequelize.define('shop_campaigns', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    shop: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      default: false
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pointsToEarn: {
      type: DataTypes.NUMBER,
      default: 0
    },
    forEveryAmountSpend: {
      type: DataTypes.NUMBER,
      default: 0
    },
    minimumPointsPerOrder: {
      type: DataTypes.NUMBER,
      default: 0
    },
    maximumPointsPerOrder: {
      type: DataTypes.NUMBER,
      allowNull: true,
    }
  })
}
