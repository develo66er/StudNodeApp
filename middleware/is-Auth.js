module.exports = (req, res, next) => {
    // всегда, когда сессия пользователя не содержит в себе параметр [isLoggedIn], пользователб
    // перенаправляется на страницу входа в систему
    if (!req.session.isLoggedIn) {
        return res.render('login',{isAutenticated: false, role: 'u',message:''});
    }
    next();
}