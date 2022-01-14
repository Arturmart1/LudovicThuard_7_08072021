'use strict';
const { Sequelize, Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {}

  User.init({
    firstName: DataTypes.STRING, allowNull: false,
    lastName: DataTypes.STRING, allowNull: false,
    email: DataTypes.STRING, allowNull: false,
    password: DataTypes.STRING, allowNull: false,
    isAdmin: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
    imageProfile: DataTypes.STRING, allowNull: true,
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};