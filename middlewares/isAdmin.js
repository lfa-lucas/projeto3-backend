function isAdmin(req, res, next) {
  if (req.auth.role !== "admin") {
    return res.status(403).json({ msg: "Perfil não autorizado." });
  }

  next();
}

export default isAdmin;
