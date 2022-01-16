module.exports = (req, res, next) => {
    // в случае, если роль пользователя для всех студентских рутов не 's', 
    // то пользователь перенаправляется на главную страницу
    if (req.session.role!='s') {
        return res.redirect('/main');
    }
    next();
};