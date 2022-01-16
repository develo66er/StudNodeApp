const Sequelize = require('sequelize');
const sequelize = require('../utils/database');
// модель Sequelize для таблицы в базе documents
const Task = sequelize.define('task',
    {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true
        },
        description: Sequelize.STRING,
        path: Sequelize.STRING
    }
);

module.exports = Task;