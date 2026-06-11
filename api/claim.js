const { dbGet, dbSet, verifyToken, sanitizeKey } = require("./db-helper");

function getProductDuration(productName) {
  const nameLower = productName.toLowerCase();
  if (nameLower.includes("15 día") || nameLower.includes("15 dia") || nameLower.includes("quincen")) return "biweekly";
  if (nameLower.includes("semanal") || nameLower.includes("semana")) return "weekly";
  if (nameLower.includes("mensual") || nameLower.includes("mes")) return "monthly";
  return "daily";
}

function getProductKeyType(productName) {
  const nameLower = productName.toLowerCase();
  if (nameLower.includes("bypass")) return "bypass";
  if (nameLower.includes("panel")) return "panel";
  return null;
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  try {
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

    const { action } = req.body;
    const safeKey = sanitizeKey(payload.username);

    // Obtener los datos frescos del usuario desde Firebase
    const user = await dbGet(`users/${safeKey}`);
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    if (action === "buy") {
      const { productName, price } = req.body;

      if (!productName || price === undefined) {
        res.status(400).json({ error: "Faltan datos del producto" });
        return;
      }

      const balance = parseFloat(user.balance || 0);
      const productPrice = parseFloat(price);

      if (balance < productPrice) {
        res.status(400).json({ error: `Saldo insuficiente. Tienes $${balance.toFixed(2)} y necesitas $${productPrice.toFixed(2)}` });
        return;
      }

      // Descontar saldo
      user.balance = parseFloat((balance - productPrice).toFixed(2));
      user.balanceUpdatedAt = Date.now();

      const keyType = getProductKeyType(productName);
      const duration = getProductDuration(productName);
      let deliveredKeys = [];

      if (keyType) {
        // Cargar el stock de keys actual de Firebase
        const keysPool = await dbGet("keys_pool") || {};

        if (keysPool[keyType] && keysPool[keyType][duration] && keysPool[keyType][duration].length > 0) {
          const key = keysPool[keyType][duration].shift();
          deliveredKeys.push({ type: keyType === "bypass" ? "Bypass" : "Panel", key: key });

          // Asignar al usuario
          if (keyType === "bypass") {
            if (user.licenseKey && user.licenseKey !== "VINCULA_TU_CUENTA_PARA_GENERAR") {
              if (!user.keyHistory) user.keyHistory = [];
              if (!user.keyHistory.includes(user.licenseKey)) user.keyHistory.push(user.licenseKey);
            }
            user.licenseKey = key;
          } else {
            if (user.panelKey && user.panelKey !== "VINCULA_TU_CUENTA_PARA_GENERAR") {
              if (!user.keyHistory) user.keyHistory = [];
              if (!user.keyHistory.includes(user.panelKey)) user.keyHistory.push(user.panelKey);
            }
            user.panelKey = key;
          }

          // Guardar el pool de keys actualizado
          await dbSet("keys_pool", keysPool);
        }
      }

      // Registrar compra en el historial
      if (!user.purchases) user.purchases = [];
      
      // Manejar estructura de compras: Firebase puede guardar arrays como objetos indexados,
      // para evitar problemas lo convertimos en array si es un objeto.
      let purchasesArray = [];
      if (typeof user.purchases === "object" && !Array.isArray(user.purchases)) {
        purchasesArray = Object.values(user.purchases);
      } else if (Array.isArray(user.purchases)) {
        purchasesArray = user.purchases;
      }

      purchasesArray.unshift({
        date: new Date().toLocaleString("es-GT"),
        product: productName,
        price: productPrice,
        method: "Saldo",
        keys: deliveredKeys
      });
      user.purchases = purchasesArray;

      // Guardar el usuario actualizado en la base de datos
      await dbSet(`users/${safeKey}`, user);

      // Devolver los datos del usuario actualizados (sin la contraseña)
      const safeUser = { ...user };
      delete safeUser.password;

      res.status(200).json({
        success: true,
        user: safeUser,
        deliveredKeys: deliveredKeys
      });
      return;

    } else if (action === "free_demo") {
      const { type } = req.body; // "bypass" o "panel"

      if (type !== "bypass" && type !== "panel") {
        res.status(400).json({ error: "Tipo de key demo no válido" });
        return;
      }

      if (type === "bypass" && user.licenseKey && user.licenseKey !== "VINCULA_TU_CUENTA_PARA_GENERAR") {
        res.status(400).json({ error: "Ya has generado tu clave de licencia de Bypass" });
        return;
      }

      if (user.panelKey && user.panelKey !== "VINCULA_TU_CUENTA_PARA_GENERAR") {
        res.status(400).json({ error: "Ya has obtenido una key de Panel. Solo puedes elegir una opción gratis en tu cuenta" });
        return;
      }

      if (type === "bypass" && user.panelKey && user.panelKey !== "VINCULA_TU_CUENTA_PARA_GENERAR") {
        res.status(400).json({ error: "Ya has obtenido una key de Panel. Solo puedes elegir una opción gratis" });
        return;
      }

      // Cargar el stock de keys de demo gratis de Firebase
      const keysPool = await dbGet("keys_pool") || {};
      
      if (!keysPool[type] || !keysPool[type]["free"] || keysPool[type]["free"].length === 0) {
        res.status(400).json({ error: `No hay keys gratis de ${type} disponibles en stock. Contacta al administrador.` });
        return;
      }

      const key = keysPool[type]["free"].shift();

      if (type === "bypass") {
        user.licenseKey = key;
      } else {
        user.panelKey = key;
      }

      // Guardar base de datos
      await dbSet("keys_pool", keysPool);
      await dbSet(`users/${safeKey}`, user);

      const safeUser = { ...user };
      delete safeUser.password;

      res.status(200).json({
        success: true,
        user: safeUser,
        key: key
      });
      return;
    } else {
      res.status(400).json({ error: "Acción no válida" });
      return;
    }

  } catch (error) {
    console.error("Error en claim API:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
