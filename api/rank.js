const { dbGet } = require("./db-helper");

const ADMIN_USERNAMES = ["xdavid", "luisdavid", "admin", "dev_david", "xdavidyt", "admin_example_com"];

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  try {
    const usersObj = await dbGet("users") || {};
    const usersList = Object.values(usersObj).filter(Boolean).map(user => {
      const purchases = Array.isArray(user.purchases) ? user.purchases : [];
      const totalSpent = purchases.reduce((sum, p) => sum + parseFloat(p.price || 0), 0);
      return {
        username: user.username || user.name || "Usuario",
        logoUrl: user.logoUrl || user.avatar || "https://file.vahalla.cc/66b93f29.png",
        totalSpent,
        rank: user.rank || "",
        purchases: purchases
      };
    });

    const sorted = usersList
      .filter(u => u.username && !ADMIN_USERNAMES.includes(u.username.toLowerCase()))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 20);

    res.status(200).json({ success: true, users: sorted });
  } catch (error) {
    console.error("Error en rank API:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};