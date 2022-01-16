const express = require("express");
const router=express.Router();
const authController  =  require('../controllers/auth');
const isAuth=require('../middleware/is-Auth')

// рут на получение формы для входа (login) в систему
router.get('/login', authController.getLogin);
// рут, в котором заполненная форма для входа в систему передается через post запрос
router.post('/login',authController.postLogin);
// рут для выхода из системы(logout)
router.post('/logout',isAuth,authController.postLogout);
//рут на получение формы регистрации
router.get('/signup',authController.getSignup);
// рут передачи заполненной формы регистрации в post запросе
// для выполнения регистрации пользователя в системе
router.post('/signup',authController.postSignup);

module.exports = router;