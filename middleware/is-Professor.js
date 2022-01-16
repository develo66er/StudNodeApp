module.exports = (req, res, next) => {
    // в случае, если роль пользователя для всех профессорских рутов не 'p', 
    // то пользователь перенаправляется на главную страницу
    if (req.session.role!='p') {
        return res.redirect('/main');
    }
    next();
};