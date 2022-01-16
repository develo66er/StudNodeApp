const Sequelize = require('sequelize');
const sequelize = require('../utils/database');
// модель Sequelize для таблицы в базе professor
const Professor = sequelize.define('professor',
{
    id:{
        type:Sequelize.INTEGER,
        autoIncrement:true,
        allowNull:false,
        primaryKey:true
    },
    email:Sequelize.STRING,
    password:Sequelize.STRING,
    role:Sequelize.STRING
}
);
module.exports = Professor;