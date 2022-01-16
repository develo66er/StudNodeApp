const Sequelize = require('sequelize');
const sequelize = require('../utils/database');
// модель Sequelize для таблицы в базе student
const Student = sequelize.define('student',
    {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true
        },
        email: Sequelize.STRING,
        password: Sequelize.STRING,
        role: Sequelize.STRING

    }


);
module.exports = Student;