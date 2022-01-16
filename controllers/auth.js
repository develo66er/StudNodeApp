const Student = require('../models/student');
const Professor = require('../models/professor');
const bcrypt = require('bcryptjs');
exports.getLogin = (req, res, next) => {
    res.render('login', { isAutenticated: false, role: 'u',message:'' });
};
// процесс авторизации, используется модуль bcrypt
getCompare = (req, res, password, user) => {
    // сравниваем зашифрованные пароли этого пользователя и пользователя в системе с этим мылом
    bcrypt.compare(password, user[0].password)
        .then((matched) => {
            //console.log('matched' + matched);
            // если совпало
            if (matched) {
                // устанавливаем переменные сессии, которые нам будут нужны в работе приложения
                req.session.isLoggedIn = true;
                req.session.user = user[0];
                req.session.role = user[0].role;
                console.log('role ' + user[0].role);
                // сессия сохраняется в базе
                return req.session.save(err => {
                    console.log(err);
                    res.redirect('/');
                });

            }
            // иначе перенаправляем на домашнюю страницу
            return res.render('login', { isAutenticated: false, role: 'u', message: 'неправильный логин или пароль' });

        }).catch(err => console.log(err));
}
// контроллер реализующий бизнес логику входа юзера в систему
exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    console.log('--------------------' + email + ' : ' + password);
    // если email не указан, засиавляем заполнять форму заново
    if (!email) {
        return res.render('login', { isAutenticated: false, role: 'u', message: 'неправильный логин' });
    }
    //необходимо убедиться, что введенный емэйл существует в системе
    // сначало ищем емэйл среди зарегистрированных профессоров
    Professor.findAll({
        where: {
            email: email
        }
    }).then(user => {

        if (!user || user.length == 0) {
            // потом ищем среди студентов
            Student.findAll({
                where: {
                    email: email
                }
            }).then((user) => {
                // если юзер не был найден в итоге, перенаправляем его на логгинг
                if (!user || user.length == 0) return res.render('login', { isAutenticated: false, role: 'u', message: 'неправильный логин или пароль' });
                // иначе переходим к процессу авторизции (то есть он - студент)
                else return getCompare(req, res, password, user);
            }).catch((err) => console.log(err));

        }
        // если юзер оказался профессором, то переходи к авторизации
        else return getCompare(req, res, password, user);

    })
        .catch(err => console.log(err));
};
//выход пользователя из системы
exports.postLogout = (req, res, next) => {
    // разрушаем сессию
    req.session.destroy();
    return res.redirect('/');
};
// возвращение формы регистрации
exports.getSignup = (req, res, next) => {
    res.render('signup', { isAutenticated: false, role: 'u', message:'' });
};
// процесс регистрации
exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const asProfessor = req.body.asProfessor;
    // необходимо удостовериться что юзер с таким мылом не был зарегистрирован в системе
    // ищем сначало среди профессоров
    Professor.findAll({
        where: {
            email: email
        }
    }).then((professor) => {
        //console.log(professor);
        //если профессор был найден, предлагаем зарегистрироваться с другим мылом
        if (professor && professor.length > 0) {
            return res.render('signup', { isAutenticated: false, role: 'u', message: 'такой пользователь уже существует' });
        }
        //иначе ищем среди студентов
        Student.findAll({
            where: {
                email: email
            }
        }).then((student) => {
            // если студент был найден, то предлагаем зарегится под другим мылом
            if (student && student.length > 0) {
                return res.render('signup', { isAutenticated: false, role: 'u', message: 'такой пользователь уже существует' });
            }
            // если все ок и такого юзера в системе еще не бяло, шифруем пароль 
            bcrypt.hash(password, 12).then((hashedPass) => {
                // если был установлен флажок " я  - профессор " при регистрации, то создаем профессора
                if (asProfessor) {
                    // сохраняем профессора в базе- все делает за нас Sequelize, мы только передаем данные в модель
                    Professor.create({ email: email, password: hashedPass, role: 'p' })
                        .then((r) => {
                            console.log(r);
                            return res.redirect('/login');
                        })
                        .catch((err) => {
                            console.log(err);
                            return res.redirect('/signup');
                        });
                } else {
                    // иначе создается и сохраняется в базе студент
                    Student.create({
                        email: email,
                        password: hashedPass,
                        role: 's', documents: []
                    })
                        .then((r) => {
                            console.log(r);
                            return res.redirect('/login');
                        })
                        .catch((err) => {
                            console.log(err);
                        });
                }
            }).catch((err) => {
                console.log(err);
            });

        }

        ).catch((err) => {
            console.log(err);
        });
    })

}
