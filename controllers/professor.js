const plagiarism = require('plagiarism');
const MossClient = require('moss-node-client')
var https = require('https');
const Student = require('../models/student');
const Document = require('../models/document');
const Task = require('../models/task');
const fetch = require("node-fetch");
const Professor = require('../models/professor');
const fs = require('fs');

// возвращаем страницу профессора со списком студентов для определенного задания
exports.getProfessor = (req, res, next) => {
        const taskId = req.params.taskId;
        const user = req.session.user;
        const where = taskId ? {
                where: {
                        taskId: taskId,
                        studentId: null
                }
        } : {
                        where: {
                                studentId: null
                        }
                };
        /* // выбираем всех студентов для данного профессора и передаем их view  в переменной students
         Professor.findAll().then((professors) => {
                 // как находим, создаем у него документ, который он подгрузил
                 if (professors.length > 0) {
                         professors[0].getDocument(where).then((document) => {
                                 getProfessorView(user, res, taskId, req.session.isLoggedIn, req.session.role, false, null);
 
                         }).catch();
                 } else res.redirect('/');
         }).catch(err => console.log(err));*/
        getProfessorView(user, res, taskId, req.session.isLoggedIn, req.session.role, false);


}
getProfessorView = (user, res, taskId, isLoggedIn, role, checked) => {
        const checkedOpt = checked ? "checked" : "";

        return fetchAllStudents(user.id, (students) => {
                if (taskId === null || taskId === undefined) taskId = 1;

                const stArr = [];
                let currTask = [];

                Promise.all(students.map(student => {
                        return student.getDocuments({
                                where: {
                                        taskId: taskId
                                }
                        })
                                .then(documents => {
                                        if (documents && documents.length > 0) {
                                                const docs = [];
                                                documents.forEach(document => {
                                                        document.getMoss().then(moss => {
                                                                docs.push({ document: document, moss: moss });
                                                        }).catch();
                                                });
                                                stArr.push({ student: student, documents: docs });

                                        }


                                }).catch(err => console.log(err));
                }))
                        .then(() => {
                                Task.findAll({
                                        where: {
                                                professorId: user.id
                                        }
                                }).then(tasks => {
                                        Task.findAll({
                                                where: {
                                                        id: taskId
                                                }
                                        }).then(task => {
                                                return res.render('professor', {
                                                        message: '',
                                                        isAutenticated: isLoggedIn,
                                                        role: role,
                                                        students: stArr,
                                                        checkedOP: checkedOpt,
                                                        tasks: tasks,
                                                        currentTask: task
                                                });
                                        }).catch(err => console.log(err));

                                }).catch(err => console.log(err));

                        }).catch(err => console.log(err));

        });

}
// запрашиваем все документы конкретного студента, идентификатор был описан в рутинге
exports.antiplagiate = (req, res, next) => {

        const studentId = req.body.student_id;
        const documentId = req.body.document_id;
        const taskId = req.body.task_id;
        let filedata = req.file;
        const lang = req.body.select_lang

        console.log('filedata' + filedata);
        // если файл не был загружен
        if (!filedata)
                res.render('professor', { message: 'файл не был загружен' });
        else {
                Student.findAll({
                        where: {
                                id: studentId
                        }
                }).then(students => {
                        if (students && students.length > 0) {
                                students[0].getDocuments({
                                        where: {
                                                id: documentId
                                        }
                                }).then(documents => {
                                        if (documents && documents.length > 0) {
                                                plagiarismCheck(documents[0].path, (r) => {
                                                        // через какое то время получаем ответ с сервера
                                                        // и присваиваем его в случае удачи объекту
                                                        score = r;
                                                        saveScore(documents[0], score).then(r => {
                                                                console.log(r);
                                                                return res.redirect('/professor');


                                                        }).catch(err => {
                                                        });
                                                });

                                                plagiarismCheckMoss(filedata.path, documents[0].path, lang, (url) => {
                                                        var dir = 'moss/';
                                                        if (!fs.existsSync(dir)) {
                                                                fs.mkdirSync(dir);
                                                        }
                                                        const file_name = documents[0].name + '_report';
                                                        const localPath = dir + file_name;
                                                        saveImageToDisk(url, localPath);
                                                        documents[0].createMoss({ name: file_name, path: localPath }).then(r => {
                                                                return getProfessorView(req.session.user, res, r.id, req.session.isLoggedIn, req.session.role, true);

                                                        }).catch(err => { 

                                                                console.log(err);
                                                                return res.redirect('/professor');

                                                         });


                                                });
                                        }else{
                                                return res.redirect('/professor');

                                        }
                                }).catch(err => console.log(err));
                        } else {
                                return res.redirect('/professor');
                        }
                }).catch(err => console.log(err));
        }
        return res.redirect('/professor');

};
saveScore = (document, score) => {

        document.plagiate_score = score;
        // sequelize сохраняет изменения
        return document.save();
}
// загрузка файла студента для профессора
exports.downloadFile = (req, res, next) => {
        const file = __dirname + '/../uploads/' + req.params.name;
        res.download(file);
};

// загрузка файла Moss
exports.downloadMossFile = (req, res, next) => {
        const file = __dirname + '/../moss/' + req.params.name;
        res.download(file);
};
// изменение деталей документа : оценка + антиплагиат
exports.mark = (req, res, next) => {

        const student_id = req.body.student_id;
        const document_id = req.body.document_id;
        const mark = req.body.mark;

        let Item;
        let Items = [];
        let mossCheck = false;
        let lang;

        Student.findAll({
                where: {
                        id: student_id
                }
        }).then(students => {
                if (students && students.length > 0) {
                        students[0].getDocuments({
                                where: {
                                        id: document_id
                                }
                        }).then(documents => {
                                if (documents && documents.length > 0) {
                                        documents[0].mark = mark;
                                        documents[0].save();
                                }
                                res.redirect('/professor');

                        }).catch();
                } else {
                        res.redirect('/professor');
                }
        }).catch(err => {
                console.log(err);
                res.redirect('/professor');
        });

};
const saveImageToDisk = (url, localPath) => {

        fetch(url)
                .then(resp => resp.text()).then(body => {
                        console.log('body------' + body);
                        fs.writeFile(localPath, body, () => console.log('-----------------------------all ok'));

                });


}

exports.addTask = (req, res, next) => {
        let filedata = req.file;
        const desc = req.body.description;

        console.log('????????????????' + filedata);
        // если файл не был загружен
        if (!filedata)
                res.render('professor', { message: 'файл не был загружен' });
        else {
                // иначе, берем юзера из сессии(залогиненый пользователь)
                const user = req.session.user;

                //Ищем его в базе
                Professor.findAll({
                        where: {
                                id: user.id
                        }
                }).then((professors) => {
                        // как находим, создаем у него документ, который он подгрузил
                        if (professors.length > 0) {
                                return professors[0].createTask({
                                        description: desc,
                                        path: filedata.path
                                });

                        }

                })
                        .then((r) => {

                                //Ищем его в базе
                                Professor.findAll({
                                        where: {
                                                id: user.id
                                        }
                                }).then((professors) => {

                                        if (professors && professors.length > 0) {
                                                professors[0].getDocument({
                                                        where: {
                                                                studentId: null
                                                        }
                                                }).then(document => {
                                                        return getProfessorView(user, res, r.id, req.session.isLoggedIn, req.session.role, true, document ? document.dataValues : null);



                                                }).catch();
                                        }
                                }).catch(err => console.log(err));

                        })
                        .then((r) => console.log(r))
                        .catch((err) => {
                                console.log(err);
                                return res.redirect('/');
                        }
                        );
        }

}

plagiarismCheck = (path, cb) => {
        fs.readFile(__dirname + '/../' + path, 'utf8', (err, contents) => {
                //вызов API антиплагиата text.ru через модуль plagiarism
                plagiarism(contents, {
                        "text.ru": {
                                "userkey": "44e601afdf34f71a8d2b9740cf614767"
                        }
                }).then(res => {
                        // в случае удачи, возвращаем значение в колбэк
                        cb(Number.parseFloat(res.main.percent) / 100);
                }).catch(err => {
                        // в случае какой то ошибки возвращается 0
                        cb(0.00);
                });
        });
}
plagiarismCheckMoss = (pathBase, path, language, cb) => {
        let client = new MossClient(language, '622907353');
        client.addBaseFile('./' + pathBase, 'base');
        client.addFile('./' + path, 'sub');
        return client.process().then((r) => cb(r)).catch((err) => {
                console.log(err);
                res.redirect('/professor');
        });

}

//внутренняя функция поиска студентов для профессора, идентифицированного по professorId
fetchAllStudents = (professorId, cb) => {
        Professor.findAll({
                where: {
                        id: professorId
                }
        })
                .then(professor => {
                        if (professor.length > 0) {
                                // если у профессора есть студенты, возврашаем их
                                professor[0].getStudents()
                                        .then((students) => {
                                                return cb(students);
                                        })
                                        .catch(err => {
                                                console.log(err);
                                                return cb(err);
                                        });
                        } else { }
                })
}
fetchProfessorDocs = (professorId, cb) => {
        if (professorId) {
                Document.findAll({
                        where: {
                                professorId: professorId
                        }
                }).then((documents) => {
                        return cb(null, documents[0]);

                }).catch((err) => {
                        return cb(err, null);
                });
        }
}
getProfessorById = (id, cb) => {
        Professor.findAll({
                where: {
                        id: id
                }
        }).then(professor => cb(professor)).catch(err => cb(err));
};