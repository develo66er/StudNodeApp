const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const sequelize = require('./utils/database');
const studentRoutes = require('./routes/student');
const professorRoutes = require('./routes/professor');
const isAuth=require('./middleware/is-Auth');

const authRoutes = require('./routes/auth');
const Document = require('./models/document');
const Student = require('./models/student');
const Professor = require('./models/professor');
const MossReport = require('./models/moss');

const Task = require('./models/task');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
//const fs = require('fs');
//определение хранилища для сессии
const store = new MySQLStore({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'armageddon',
    database: 'studiu'
});

//берем экземпляр приложения из express фрэймворка
const app = express();
// определение машины темплэйтов(какие шаблоны будем использовать для web  страниц, - html будет генерится на их основе)
app.set('view engine', 'ejs');
//настраиваем папку относительно проекта, где машина темплэйтов будет искать темплэйты по имени
app.set('views', 'views');
// определение парсера тела запросов(нужен для того, чтобы запросы видеть в удобном для программиста виде
// например все , что приходит при GET запросе(до знака вопроса) можно будет получить через req.params.{имя переменной}
//все , что приходит при GET запросе(после знака вопроса) можно будет получить через req.query.{имя переменной}
// все что приходит в теле POST запроса можно будет получить через req.body.{имя переменной})
// смотрите код контроллеров - там я так получаю все переменные, которые передаю из html
app.use(bodyParser.urlencoded({ extended: false }));

//определение где будут храниться статические/ общедоступные документы - таблицы стилей, изображения
app.use(express.static(__dirname));

app.use(express.static(path.join(__dirname, 'public')));

//определение сессии как так называемый middleware - то есть что, то , что стоит между приложением 
//и юзерским запросом и передача ей хранилища сессии как параметр(store:store)
app.use(
    session({secret:'my secret',resave:false,saveUninitialized:false,store:store})
);
// определение и подключение рутов, (смотрите файлы в папке routes), которые нужны для перенаправления 
// запросов нужному конторллеру(контроллеры подключаются в тех файлах и нужны для определения бизнес логики)
app.use(studentRoutes);
app.use(professorRoutes);
app.use(authRoutes);

// определение рутинга для главной, доиашней страницы
app.get('/',isAuth, (req, res, next) => {
    // здесь и дальше res.render -  это функция отображения view темплэйта, 
    //который ищется по имени(первый параметр 'main', здесь, например будет разрешаться
    // как - main=> /views/main.ejs), вторым параметром идет объект, иемющий как поля
    //  переменные, передающиеся view
    //req.session.{имя переменной сессии} - для каждого юзера его сессия хранит параметры, 
    //котрые я назначаю и иициализирую при процессе login  - смотрите auth.js в папке controllers
    // эти переменные живы и сопровождаются при всех юзерских запросах, пока он не сделает logout,
    // тогда сессия вместе с присоединенными к ней переменными убивается (session.destroy() в logout методе)
    res.render('main',{isAutenticated:req.session.isLoggedIn,role:req.session.role});
})

// определение отношений между sequelize сущностями
// один ко многим связь : один студент - много документов, 
//sequelize будет генерить поле связи в таблице documents c id студента
// посмотрите строение mysql таблиц чтобы увидеть это
// onDelete:'CASCADE' - означает, то, что при удалении какого то студента из базы, 
// все записи для его доков в таблице documents тоже будут удалены
Document.belongsTo(Student,{constraints:true,onDelete:'CASCADE'});
Student.hasMany(Document);
// определение один ко многим связи : один профессор проверяет работы у многих студентов
// потенциально здесь была бы возможна и другая связь - многие ко многим - это если дать 
// возможность разным студентам проверять работы у разных в не только одного преподавателя
Student.belongsTo(Professor,{constraints:true,onDelete:'CASCADE'});
Professor.hasMany(Student);
Document.belongsTo(Professor,{constraints:true,onDelete:'CASCADE'});
Professor.hasOne(Document);
Professor.hasMany(Task);
Task.belongsTo(Professor,{constraints:true,onDelete:'CASCADE'});
Task.hasOne(Document);
Document.belongsTo(Task,{constraints:true,onDelete:'CASCADE'});
Document.hasOne(MossReport);
MossReport.belongsTo(Document,{constraints:true,onDelete:'CASCADE'});
// синхронизация sequelize
sequelize
// асинхронная функция синхронизации sequelize  с базой mysql
.sync()
// здесь и далее  - промис, выполняется в случае удачного выполнения асинхронного запроса
.then((res)=>{
    console.log(res);
    app.listen(3030);
})
// здесь и далее  - промис, выполняется в случае ошибок при выполнении асинхронного запроса
.catch(err=>console.log(err));
