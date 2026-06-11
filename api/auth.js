const { dbGet, dbSet, generateToken, verifyToken, sanitizeKey } = require("./db-helper");

function getRandomRank() {
  const ranks = [
    "VIP MEMBER", "BYPASS MASTER", "PRO CHEATER", 
    "PREMIUM ACCESS", "ELITE GAMER", "CHITER PLATINUM"
  ];
  return ranks[Math.floor(Math.random() * ranks.length)];
}

const DEFAULT_DEV_DAVID_USER = {
  username: "dev_david",
  email: "dev_david@guatexiter.pro",
  password: "GuateXiter",
  logoUrl: "https://file.vahalla.cc/66b93f29.png",
  rank: "DEVELOPER PRO",
  regDate: new Date().toLocaleDateString("es-GT"),
  downloads: 0,
  balance: 90000000.00,
  purchases: [],
  licenseKey: "VINCULA_TU_CUENTA_PARA_GENERAR",
  panelKey: "VINCULA_TU_CUENTA_PARA_GENERAR",
  isAdmin: true,
  balanceUpdatedAt: Date.now()
};

const DEFAULT_XDAVIDYT_USER = {
  username: "xDavidyt",
  email: "xdavidyt@guatexiter.pro",
  password: "GuateXiter",
  logoUrl: "https://file.vahalla.cc/66b93f29.png",
  rank: "DEVELOPER PRO",
  regDate: new Date().toLocaleDateString("es-GT"),
  downloads: 0,
  balance: 90000000.00,
  purchases: [],
  licenseKey: "VINCULA_TU_CUENTA_PARA_GENERAR",
  panelKey: "VINCULA_TU_CUENTA_PARA_GENERAR",
  isAdmin: true,
  balanceUpdatedAt: Date.now()
};

const HARDCODED_ADMIN_DEFAULTS = {
  xdavid: {
    username: "xDavid",
    email: "xdavid@guatexiter.pro",
    password: "GuateXiter",
    logoUrl: "https://file.vahalla.cc/66b93f29.png",
    rank: "DEVELOPER PRO",
    regDate: new Date().toLocaleDateString("es-GT"),
    downloads: 0,
    balance: 90000000.00,
    purchases: [],
    licenseKey: "VINCULA_TU_CUENTA_PARA_GENERAR",
    panelKey: "VINCULA_TU_CUENTA_PARA_GENERAR",
    isAdmin: true,
    balanceUpdatedAt: Date.now()
  },
  luisdavid: {
    username: "luisdavid",
    email: "luisdavid@guatexiter.pro",
    password: "GuateXiter",
    logoUrl: "https://file.vahalla.cc/66b93f29.png",
    rank: "DEVELOPER PRO",
    regDate: new Date().toLocaleDateString("es-GT"),
    downloads: 0,
    balance: 90000000.00,
    purchases: [],
    licenseKey: "VINCULA_TU_CUENTA_PARA_GENERAR",
    panelKey: "VINCULA_TU_CUENTA_PARA_GENERAR",
    isAdmin: true,
    balanceUpdatedAt: Date.now()
  },
  dev_david: DEFAULT_DEV_DAVID_USER,
  xdavidyt: DEFAULT_XDAVIDYT_USER,
  admin_example_com: {
    username: "admin@example.com",
    email: "admin@example.com",
    password: "changeme123",
    logoUrl: "https://file.vahalla.cc/66b93f29.png",
    rank: "DEVELOPER PRO",
    regDate: new Date().toLocaleDateString("es-GT"),
    downloads: 0,
    balance: 90000000.00,
    purchases: [],
    licenseKey: "VINCULA_TU_CUENTA_PARA_GENERAR",
    panelKey: "VINCULA_TU_CUENTA_PARA_GENERAR",
    isAdmin: true,
    balanceUpdatedAt: Date.now()
  }
};

module.exports = async (req, res) => {
  // Configurar cabeceras CORS básicas
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  try {
    const { action } = req.body;

    if (action === "register") {
      const { username, email, password, logoUrl } = req.body;

      if (!username || !email || !password) {
        res.status(400).json({ error: "Faltan campos requeridos" });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
        return;
      }

      const safeKey = sanitizeKey(username);

      // Verificar si el usuario ya existe por su username (clave segura)
      const existingUser = await dbGet(`users/${safeKey}`);
      if (existingUser) {
        res.status(400).json({ error: "El nombre de usuario ya está registrado" });
        return;
      }

      // Cargar todos los usuarios para validar que el correo sea único
      const allUsers = await dbGet("users") || {};
      const emailExists = Object.values(allUsers).some(
        (u) => u && u.email && u.email.toLowerCase() === email.toLowerCase()
      );

      if (emailExists) {
        res.status(400).json({ error: "El correo electrónico ya está registrado" });
        return;
      }

      const finalLogo = logoUrl || "https://file.vahalla.cc/66b93f29.png";
      const adminKeys = ["xdavid", "luisdavid", "admin", "dev_david", "xdavidyt", "admin_example_com"];
      if (adminKeys.includes(safeKey)) {
        res.status(400).json({ error: "No puedes registrarte con ese nombre de usuario" });
        return;
      }

      const newUser = {
        username: username,
        email: email,
        password: password, // En una app de producción esto debería estar hasheado con bcrypt.
        logoUrl: finalLogo,
        rank: getRandomRank(),
        regDate: new Date().toLocaleDateString("es-GT"),
        downloads: 0,
        balance: 0,
        purchases: {},
        licenseKey: "VINCULA_TU_CUENTA_PARA_GENERAR",
        panelKey: "VINCULA_TU_CUENTA_PARA_GENERAR",
        isAdmin: false,
        balanceUpdatedAt: Date.now()
      };

      await dbSet(`users/${safeKey}`, newUser);

      res.status(200).json({ success: true, message: "Registro exitoso" });
      return;

    } else if (action === "login") {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ error: "Faltan campos requeridos" });
        return;
      }

      const safeKey = sanitizeKey(username);
      let user = await dbGet(`users/${safeKey}`);

      if (!user && HARDCODED_ADMIN_DEFAULTS[safeKey]) {
        user = { ...HARDCODED_ADMIN_DEFAULTS[safeKey] };
        await dbSet(`users/${safeKey}`, user);
      }

      if (!user || user.password !== password) {
        res.status(401).json({ error: "Usuario o contraseña incorrectos" });
        return;
      }

      // Asegurar el flag de admin para cuentas hardcodeadas si no lo tienen
      const adminKeys = ["xdavid", "luisdavid", "admin", "dev_david", "xdavidyt", "admin_example_com"];
      const isAdmin = user.isAdmin || adminKeys.includes(safeKey);
      if (isAdmin && !user.isAdmin) {
        user.isAdmin = true;
        await dbSet(`users/${safeKey}/isAdmin`, true);
      }

      // Generar token JWT firmado
      const token = generateToken({
        username: user.username,
        safeKey: safeKey,
        isAdmin: isAdmin,
        exp: Date.now() + 24 * 60 * 60 * 1000 // Expira en 24 horas
      });

      // Devolver los datos del usuario, omitiendo la contraseña
      const safeUserResponse = { ...user };
      delete safeUserResponse.password;

      res.status(200).json({
        success: true,
        token: token,
        user: safeUserResponse
      });
      return;
    } else if (action === "profile") {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "No autorizado: Token ausente" });
        return;
      }

      const token = authHeader.split(" ")[1];
      const payload = verifyToken(token);
      if (!payload) {
        res.status(401).json({ error: "No autorizado: Token inválido o expirado" });
        return;
      }

      const user = await dbGet(`users/${payload.safeKey}`);
      if (!user) {
        res.status(404).json({ error: "Usuario no encontrado" });
        return;
      }

      const safeUserResponse = { ...user };
      delete safeUserResponse.password;

      res.status(200).json({
        success: true,
        user: safeUserResponse
      });
      return;
    } else {
      res.status(400).json({ error: "Acción no válida" });
      return;
    }
  } catch (error) {
    console.error("Error en auth API:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
};
