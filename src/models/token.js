module.exports = (sequelize, DataTypes) => {
  "use strict";
  var Token = sequelize.define(
    "Token",
    {
      "tokenId": {
        "type": DataTypes.CHAR(32),
        "primaryKey": true
      },
      "dateExpiry":{
        "type": DataTypes.DATE,
        "allowNull": false
      },
      "identitySignature":{
        "type": DataTypes.CHAR(60),
        "allowNull": false
      }
    },
    {
      "classMethods": {
        associate: (models) => {
          Token.belongsTo(models.Key);
        }
      },
      "timestamps": false
    }
  );

  return Token;
};