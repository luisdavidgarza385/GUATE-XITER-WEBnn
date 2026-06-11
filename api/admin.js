const { dbGet, dbSet, verifyToken, sanitizeKey } = require("./db-helper");

const ADMIN_SUPER_KEYS = ["xdavid", "luisdavid"];

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
      res.status(401).json({ error: "Acceso denegado: Token ausente" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);
    if (!payload || !payload.isAdmin) {
      res.status(403).json({ error: "Acceso denegado: Se requieren privilegios de administrador" });
      return;
    }

    const { action } = req.body;
    const adminSafeKey = sanitizeKey(payload.username);

    // Obtener datos del admin ejecutor
    const adminUser = await dbGet(`users/${adminSafeKey}`);
    if (!adminUser || !adminUser.isAdmin) {
      res.status(403).json({ error: "Acceso denegado: El usuario no es administrador" });
      return;
    }

    if (action === "load_users") {
      // Devolver todos los usuarios de forma segura
      const allUsers = await dbGet("users") || {};
      const usersList = Object.values(allUsers).filter(Boolean);
      
      // Sanitizar contraseñas antes de enviarlas al frontend si lo deseas, o enviarlas si el admin las necesita.
      // En este caso, el admin las puede necesitar para dar soporte, pero lo ideal es eliminar las contraseñas del reporte.
      // Omitiremos las contraseñas por seguridad extra.
      const safeUsersList = usersList.map(u => {
        const copy = { ...u };
        delete copy.password;
        return copy;
      });

      res.status(200).json({ success: true, users: safeUsersList });
      return;

    } else if (action === "change_balance") {
      const { targetUsername, amount, operation } = req.body; // operation: "add" o "subtract"
      
      if (!targetUsername || amount === undefined || !operation) {
        res.status(400).json({ error: "Faltan campos requeridos" });
        return;
      }

      const value = parseFloat(amount);
      if (isNaN(value) || value <= 0) {
        res.status(400).json({ error: "El monto debe ser un número positivo" });
        return;
      }

      const targetSafeKey = sanitizeKey(targetUsername);
      const targetUser = await dbGet(`users/${targetSafeKey}`);
      if (!targetUser) {
        res.status(404).json({ error: "Usuario destino no encontrado" });
        return;
      }

      const adminBalance = parseFloat(adminUser.balance || 0);
      const targetBalance = parseFloat(targetUser.balance || 0);

      if (operation === "add") {
        // Verificar que el admin tenga suficiente saldo para transferir
        if (adminBalance < value && !ADMIN_SUPER_KEYS.includes(adminSafeKey)) {
          // Nota: a los super admins xdavid/luisdavid les permitimos saldo ilimitado o no descontar si se excede.
          // Pero respetamos la lógica original de descontar del admin.
          res.status(400).json({ error: `Saldo insuficiente del admin. Tienes $${adminBalance.toFixed(2)}` });
          return;
        }

        adminUser.balance = parseFloat((adminBalance - value).toFixed(2));
        targetUser.balance = parseFloat((targetBalance + value).toFixed(2));
      } else if (operation === "subtract") {
        // Verificar que el usuario tenga suficiente saldo para retirar
        if (targetBalance < value) {
          res.status(400).json({ error: `El usuario destino solo tiene $${targetBalance.toFixed(2)}` });
          return;
        }

        targetUser.balance = parseFloat((targetBalance - value).toFixed(2));
        adminUser.balance = parseFloat((adminBalance + value).toFixed(2));
      } else {
        res.status(400).json({ error: "Operación no válida" });
        return;
      }

      adminUser.balanceUpdatedAt = Date.now();
      targetUser.balanceUpdatedAt = Date.now();

      // Guardar ambos usuarios en Firebase
      await dbSet(`users/${adminSafeKey}`, adminUser);
      await dbSet(`users/${targetSafeKey}`, targetUser);

      res.status(200).json({
        success: true,
        message: `Saldo modificado con éxito. Remitente: $${adminUser.balance.toFixed(2)}, Destinatario: $${targetUser.balance.toFixed(2)}`,
        adminBalance: adminUser.balance
      });
      return;

    } else if (action === "add_keys") {
      const { type, duration, keysList } = req.body; // keysList es un array de strings

      if (!type || !duration || !Array.isArray(keysList)) {
        res.status(400).json({ error: "Faltan parámetros de keys" });
        return;
      }

      const keysPool = await dbGet("keys_pool") || {};
      
      if (!keysPool[type]) keysPool[type] = {};
      if (!keysPool[type][duration]) keysPool[type][duration] = [];

      // Filtrar vacíos y añadir
      const cleanKeys = keysList.map(k => k.trim()).filter(Boolean);
      keysPool[type][duration] = [...keysPool[type][duration], ...cleanKeys];

      await dbSet("keys_pool", keysPool);

      res.status(200).json({
        success: true,
        message: `Se agregaron ${cleanKeys.length} keys con éxito`,
        poolSize: keysPool[type][duration].length
      });
      return;

    } else if (action === "delete_keys") {
      const { type, duration } = req.body;

      if (!type || !duration) {
        res.status(400).json({ error: "Faltan parámetros de keys" });
        return;
      }

      const keysPool = await dbGet("keys_pool") || {};
      if (!keysPool[type]) keysPool[type] = {};

      const originalLength = (keysPool[type][duration] || []).length;
      keysPool[type][duration] = [];

      await dbSet("keys_pool", keysPool);

      res.status(200).json({
        success: true,
        message: `Se eliminaron ${originalLength} keys con éxito`,
        removedCount: originalLength,
        poolSize: 0
      });
      return;

    } else if (action === "update_gemini") {
      const { newGeminiKey } = req.body;

      if (!newGeminiKey) {
        res.status(400).json({ error: "Clave de Gemini inválida" });
        return;
      }

      await dbSet("site_config/gemini_api_key", newGeminiKey.trim());

      res.status(200).json({ success: true, message: "API Key de Gemini actualizada con éxito" });
      return;

    } else if (action === "reset_db") {
      // Reinicio completo de la base de datos (según adminResetDatabase original)
      // Borrar keys, historial, recomendaciones y restablecer usuarios (menos admins)
      
      await dbSet("keys_pool", {
        bypass: { daily: [], weekly: [], biweekly: [], monthly: [], free: [] },
        panel: { daily: [], weekly: [], biweekly: [], monthly: [], free: [] }
      });
      
      await dbSet("historial", {});
      await dbSet("recommendations", {});
      await dbSet("stats", { total_visitors: 0, total_views: 0, online_users: 0 });
      await dbSet("background_url", "");
      await dbSet("music_config", { url: "", title: "", artist: "", type: "audio", videoId: null });

      // Restablecer saldos y licencias de usuarios que no sean admin
      const allUsers = await dbGet("users") || {};
      const updates = {};

      Object.keys(allUsers).forEach(key => {
        const u = allUsers[key];
        if (u) {
          const isUserAdmin = u.isAdmin || ADMIN_SUPER_KEYS.includes(key) || key === "admin" || key === "dev_david";
          if (!isUserAdmin) {
            u.balance = 0;
            u.licenseKey = "VINCULA_TU_CUENTA_PARA_GENERAR";
            u.panelKey = "VINCULA_TU_CUENTA_PARA_GENERAR";
            u.purchases = {};
            u.keyHistory = [];
          } else {
            // A los admins les respetamos el saldo y rango, pero vaciamos compras e historial
            u.purchases = {};
            u.keyHistory = [];
          }
          updates[key] = u;
        }
      });

      await dbSet("users", updates);

      res.status(200).json({ success: true, message: "Base de datos restablecida con éxito por el administrador" });
      return;

    } else if (action === "update_music") {
      const { url, title, artist, type, videoId } = req.body;

      if (!url) {
        res.status(400).json({ error: "URL de música requerida" });
        return;
      }

      await dbSet("music_config", {
        url: url,
        title: title || "Canción en Vivo",
        artist: artist || "GUATE XITER PRO",
        type: type || "audio",
        videoId: videoId || null,
        updatedAt: Date.now()
      });

      res.status(200).json({ success: true, message: "Música actualizada con éxito" });
      return;

    } else if (action === "update_background") {
      const { backgroundUrl } = req.body;

      if (backgroundUrl === "" || backgroundUrl === null || backgroundUrl === undefined) {
        // Eliminar fondo personalizado
        await dbSet("background_url", "");
        res.status(200).json({ success: true, message: "Fondo restablecido" });
        return;
      }

      await dbSet("background_url", backgroundUrl);
      res.status(200).json({ success: true, message: "Fondo actualizado con éxito" });
      return;

    } else if (action === "save_keys") {
      const { keysPool } = req.body;

      if (!keysPool || typeof keysPool !== "object") {
        res.status(400).json({ error: "Datos de keys pool inválidos" });
        return;
      }

      await dbSet("keys_pool", keysPool);
      res.status(200).json({ success: true, message: "Keys pool sincronizado con éxito" });
      return;

    } else if (action === "load_keys") {
      const keysPool = await dbGet("keys_pool") || {};
      res.status(200).json({ success: true, keysPool });
      return;

    } else if (action === "save_products") {
      const { products } = req.body;

      if (!products || !Array.isArray(products)) {
        res.status(400).json({ error: "Datos de productos inválidos" });
        return;
      }

      await dbSet("products", products);
      res.status(200).json({ success: true, message: "Productos sincronizados con éxito" });
      return;

    } else {
      res.status(400).json({ error: "Acción administrativa no válida" });
      return;
    }

  } catch (error) {
    console.error("Error en admin API:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
