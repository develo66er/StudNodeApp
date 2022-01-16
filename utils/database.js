const Sequelize=require('sequelize');
const sequelize=new Sequelize('studiu','root','Arm@gedd0n',{
    dialect:'mysql',
    host:'localhost'
})
module.exports = sequelize;