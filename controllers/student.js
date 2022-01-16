
const fs = require('fs');
const Student = require('../models/student');
const Professor = require('../models/professor');
const Documents = require('../models/document');

// возвращение страницы студента
exports.getStudent = (req, res, next) => {
    console.log('inside getStudents-----------------------------------------------');

    const user = req.session.user;
    // выбираем все доки студента
    return fetchDocuments(user.id, (documents) => {
        // смотрим, был ли линкован профессор
        return fetchProfesor(user.id, (professor) => {
            // если нет, вместо профессора передаем пустую строку
            if (!professor) {
                return fetchAllProfesors((professors) => {
                    res.render('student', {
                        id: user.id,
                        message: '',
                        isAutenticated: req.session.isLoggedIn,
                        role: req.session.role,
                        docs: documents,
                        professor: '',
                        professors: professors,
                        tasks:[]
                    });
                });
                // иначе возвращаем профессора
            } else {
                professor.getTasks().then(tasks=>{
                    res.render('student', {
                        id: user.id,
                        message: '',
                        isAutenticated: req.session.isLoggedIn,
                        role: req.session.role,
                        docs: documents,
                        professor: professor,
                        professors: [],
                        tasks:tasks.map(task=>{
                            return task.dataValues;
                        })
                    });
                }).catch();
                
            }
        })


    });

};
//обработка загрузки файла студентом
exports.getUploadFile = (req, res, next) => {
    const professorId = req.body.professorId;
    const taskId = req.body.tasksSelect;
    let filedata = req.file;
    console.log(filedata);
    // если файл не был загружен
    if (!filedata)
        res.render('student', { message: 'файл не был загружен' });
    else {
        // иначе, берем юзера из сессии(залогиненый пользователь)
        const user = req.session.user;
        //Ищем его в базе
        Student.findAll({
            where: {
                id: user.id
            }
        }).then((student) => {
            // как находим, создаем у него документ, который он подгрузил
            return student[0].createDocument({
                name: filedata.originalname,
                path: filedata.path,
                taskId:taskId,
                professorId:professorId
            });
        })
            .then((r) => {
                //затем выбираем все доки
                return fetchDocuments(user.id, (documents) => {
                    // берем профессора если он есть
                    Professor.findAll({
                        where: {
                            id: professorId
                        }
                    })
                        .then(professor => {
                            //передаем данные темплэйту
                            if (professor.length > 0) {
                                professor[0].getTasks().then(tasks=>{
                                    return res.render('student', {
                                        id: user.id,
                                        message: 'файл был загружен успешно',
                                        isAutenticated: req.session.isLoggedIn,
                                        role: req.session.role,
                                        docs: documents,
                                        professor: professor[0],
                                        professors: [],
                                        tasks:tasks
                                    });
                                }).catch(err=>console.log(err));
                                
                            }
                            else {
                                return res.redirect('/student')
                            }
                        })
                        .catch(err => {
                            console.log(err);
                            res.redirect('/student');
                        });


                });

            })
            .then((r) => console.log(r))
            .catch((err) => {
                console.log(err);
                return res.redirect('/');
            }
            );
    }

};
// линковка профессора 
exports.linkProfessor = (req, res, next) => {
    const userId = req.params.userId;
    const professorId = req.params.professorId;
    // ищем студента по userId
    Student.findAll({
        where: {
            id: userId
        }
    }).then((student) => {
        if (student.length > 0) {
            // ищем профессра по professorId
            Professor.findAll({
                where: {
                    id: professorId
                }
            })
                .then(professor => {
                    // назначаем модели студента професора
                    if (professor.length > 0) {
                        return student[0].setProfessor(professor[0]);
                    }
                    else {
                        res.redirect('/')
                    }
                })
                .catch(err => res.redirect('/'));
        } else res.redirect('/');
    }).then((r) => console.log(r))
        .catch((err) => console.log(err));
    res.redirect('/student');
}
// разлинковка профессора 
exports.unLinkProfessor = (req, res, next) => {
    const userId = req.params.userId;
    const professorId = req.params.professorId;
    // ищем студента по userId
    Student.findAll({
        where: {
            id: userId
        }
    }).then((students) => {
        console.log('students---------------------' + JSON.stringify(students));

        if (students.length > 0) {
            // ищем профессра по professorId
            Professor.findAll({
                where: {
                    id: professorId
                }
            })
                .then(professors => {
                    console.log('professors---------------------' + JSON.stringify(professors));

                    // назначаем модели студента професора
                    if (professors.length > 0) {
                        return professors[0].removeStudent(students[0]);
                    }
                    else {
                        res.redirect('/')
                    }
                })
                .catch(err => res.redirect('/'));
        } else res.redirect('/');
    }).then((r) => console.log(r))
        .catch((err) => console.log(err));
    res.redirect('/student');
}
exports.deleteDocument = (req,res,next)=>{
    const docId = req.body.docId;
    const studentId = req.session.user.id;
   // console.log('inside delete documents!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!11');
    Documents.findAll({where:{id:docId}}).then(documents=>{
        if(documents && documents.length>0){
            Student.findAll({
                where:{
                    id:studentId
                }
            }).then(students=>{

                if(students && students.length >0){

                    //return documents[0].removeStudent(students[0]);
                    return students[0].removeDocument(documents[0]).then(res=>{
                        fs.unlink(documents[0].path,(err)=>{
                            console.log(err);
                        })
                    }).catch(err=>console.log(err));
                    
                   
                }else{
                    res.redirect('/student');
                }
            }).catch(err=>console.log(err));
        }
    }).catch(err=>console.log(err));
    res.redirect('/student');
}
// внутренняя функция для выборки документов для студента
fetchDocuments = (id, cb) => {
    Student.findAll({
        where: {
            id: id
        }
    }).then((students) => {
        if (students.length > 0) {
            students[0].getDocuments().then((documents) => {
                return cb(documents);
            }).catch(err => console.log(err));
        }
    }).catch((err) => console.log(err));
};

// внутренняя функция для выборки профессора для студента
fetchProfesor = (id, cb) => {
    console.log('inside fetch professors-----------------------------------------------');
    Student.findAll({
        where: {
            id: id
        }
    }).then((student) => {
        if (student.length > 0) {
            student[0].getProfessor()
                .then(professor => {
                    return cb(professor);
                }).catch((err) => console.log(err));
        } else {
            return cb();
        }

    })
        .then((r) => console.log(r))
        .catch((err) => console.log(err));
}
// внутренняя функция для выборки всех профессоров
fetchAllProfesors = (cb) => {
    Professor.findAll().then((professors) => {

        return cb(professors);

    })
        .then((r) => console.log(r))
        .catch((err) => console.log(err));
}
// загрузка файла задиния для студента 
exports.downloadFile = (req, res, next) => {

    const file = __dirname + '/../uploads/' + req.params.name;
    res.download(file);
};