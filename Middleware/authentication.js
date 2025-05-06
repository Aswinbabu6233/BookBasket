const isAuthenticated = (req, res, next) => {
  if (req.session.user && req.session.user.role === "user") {
    console.log("User is authenticated:", req.session.user._id);

    next();
  } else {
    console.log("User is not authenticated, redirecting to login page.");

    res.redirect("/Login");
  }
};
const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === "admin") {
    console.log("User is admin:", req.session.user.name);

    next();
  } else {
    console.log("User is not admin, redirecting to login page.");

    res.redirect("/admin/Login");
  }
};

module.exports = { isAuthenticated, isAdmin };
