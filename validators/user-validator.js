
const isAdmin = (req, res, next) => {
    if (req.user.cargo !== "admin") {
    return res.status(403).json({ message: "Apenas administradores podem criar!"})
    }
    next();
};

module.exports = { isAdmin };