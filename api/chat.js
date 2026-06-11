const { dbGet, verifyToken } = require("./db-helper");

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
    const { action } = req.body;

    if (action === "chat") {
      // Proxy de chat con Gemini — la clave NUNCA sale al cliente
      const { message, history } = req.body;

      if (!message || typeof message !== "string") {
        res.status(400).json({ error: "Mensaje vacío" });
        return;
      }

      // Obtener la clave de Gemini desde Firebase (server-side)
      const geminiKey = await dbGet("site_config/gemini_api_key");

      if (!geminiKey || typeof geminiKey !== "string" || geminiKey.length < 10) {
        res.status(503).json({ error: "IA no disponible: Clave de Gemini no configurada" });
        return;
      }

      // Preparar el historial de mensajes para Gemini
      const contents = [];
      
      // Agregar historial previo si existe
      if (Array.isArray(history)) {
        history.forEach(msg => {
          if (msg.role && msg.text) {
            contents.push({
              role: msg.role === "user" ? "user" : "model",
              parts: [{ text: msg.text }]
            });
          }
        });
      }

      // Agregar el mensaje actual del usuario
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });

      // Llamar a la API de Gemini
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: contents,
            systemInstruction: {
              parts: [{
                text: "Eres GUATE XITER IA, un asistente virtual sarcástico, gracioso y chistoso de la comunidad de cheats/bypasses GUATE XITER. Responde siempre en español de Guatemala. Usa emojis, jerga gamer y expresiones guatemaltecas. Sé útil pero con humor negro y sarcasmo. Si preguntan algo fuera de tema, responde con humor. Si preguntan sobre cheats, bypasses, keys o productos, promueve GUATE XITER PRO. Máximo 200 palabras por respuesta."
              }]
            },
            generationConfig: {
              maxOutputTokens: 512,
              temperature: 0.9
            }
          })
        }
      );

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error("Gemini API error:", errorText);
        res.status(502).json({ error: "Error en la IA de Gemini" });
        return;
      }

      const geminiData = await geminiResponse.json();
      const reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo generar una respuesta.";

      res.status(200).json({
        success: true,
        reply: reply
      });
      return;

    } else if (action === "get_gemini_status") {
      // Solo devuelve si Gemini está configurado (true/false), NO la clave
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "No autorizado" });
        return;
      }

      const token = authHeader.split(" ")[1];
      const payload = verifyToken(token);
      if (!payload || !payload.isAdmin) {
        res.status(403).json({ error: "Solo administradores" });
        return;
      }

      const geminiKey = await dbGet("site_config/gemini_api_key");
      const isActive = geminiKey && typeof geminiKey === "string" && geminiKey.length > 10;

      res.status(200).json({
        success: true,
        isActive: isActive
      });
      return;

    } else {
      res.status(400).json({ error: "Acción no válida" });
      return;
    }

  } catch (error) {
    console.error("Error en chat API:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
