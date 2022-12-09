function isGestor(req, res, next) {
  if (req.auth.role !== "gestor" && req.auth.role !== "admin") {
    return res.status(403).json({ msg: "Perfil não autorizado." });
  }

  next();
}

export default isGestor;
