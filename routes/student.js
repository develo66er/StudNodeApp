const express = require("express");
const studentsController=require('../controllers/student');
const isAuth = require('../middleware/is-Auth');

const router=express.Router();
const multer  = require("multer");
// использование модуля multer и конфигурирование его загружать все доки в папку /uploads на сервере
const upload = multer({dest:"uploads"});
const isStudent = require('../middleware/is-Student');
// сюда идет запрос для отображения страницы студента, в случае, если юзер авторизован
// как студент(middleware isStudent из папки /middleware проверяет права на то, чтоб переходить по этому руту)
router.get("/student", isStudent,studentsController.getStudent);
// сюда идет запрос, чтобы выбрать профессора, который будет проверять у данного студента работы
router.get("/linkProfessor/:userId/:professorId",isStudent,studentsController.linkProfessor);
// сюда идет запрос, чтобы удалить профессора, который будет проверять у данного студента работы
router.get("/unLinkProfessor/:userId/:professorId",isStudent,studentsController.unLinkProfessor);
// сюда идет post запрос, при загрузке документа со страницы студента
router.post("/student/upload",isStudent, upload.single('filedata'),studentsController.getUploadFile);
router.post("/student/delete",isStudent, studentsController.deleteDocument);
router.get("/download/uploads/:name",isAuth, isStudent, studentsController.downloadFile);

module.exports=router;