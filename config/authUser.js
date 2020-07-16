module.exports = {
  isAuth: function (req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/account/login");
  },
  isNotAuth: function (req, res, next) {
    if (!req.isAuthenticated()) {
      return next();
    }
    res.redirect("/");
  },
};
