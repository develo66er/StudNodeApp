const Sequelize = require('sequelize');
const sequelize = require('../utils/database');
// модель Sequelize для таблицы в базе documents
const Document = sequelize.define('moss',
    {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true
        },
        name:Sequelize.STRING,
        path: Sequelize.STRING
    }
);

module.exports = Document;