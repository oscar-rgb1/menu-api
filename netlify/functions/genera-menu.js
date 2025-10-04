// netlify/functions/genera-menu.js
export const handler = async (event, context) => {
  const fetch = (await import("node-fetch")).default;

  // Configuración básica
  const API_URL = "https://api.openai.com/v1/chat/completions";
  const API_KEY = process.env.OPENAI_API_KEY; // Tu clave debe estar en las variables de entorno de Netlify
  const MAX_RETRIES = 3;
  const TIMEOUT_MS = 7000; // 7 segundos

  // Parsear parámetros si vienen desde Figma Make
  const body = event.body ? JSON.parse(event.body) : {};
  const filtros = body.filtros || {};
  const tipo = filtros.tipo || "normal";

  // Prompt base
  const prompt = `
  Genera un menú semanal ${tipo === "vegano" ? "100% vegano" : tipo === "vegetariano" ? "vegetariano" : "equilibrado"}.
  Devuelve un JSON con esta estructura:
  {
    "semana": [
      {"dia": "Lunes", "plato": "Ejemplo", "tiempo_preparacion": "20 min", "dificultad": "fácil",
      "ingredientes": [{"nombre":"ingrediente","cantidad":"100 g"}]
      }
    ],
    "lista_compra": [{"nombre":"ingrediente","cantidad":"100 g"}]
  }
  `;

  // Función auxiliar con reintentos y timeout
  const fetchWithTimeout = async (url, options, retries = MAX_RETRIES) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      clearTimeout(timeout);
      if (retries > 0) {
        console.warn(`Reintentando... (${MAX_RETRIES - retries + 1})`);
        return fetchWithTimeout(url, options, retries - 1);
      } else {
        console.error("Error permanente:", error.message);
        return { error: "Fallo al generar el menú. Inténtalo de nuevo más tarde." };
      }
    }
  };

  // Llamada al modelo de OpenAI
  const response = await fetchWithTimeout(API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8
    })
  });

  // Validar la respuesta
  if (response.error) {
    return {
      statusCode: 500,
      body: JSON.stringify(response)
    };
  }

  const menu = response.choices?.[0]?.message?.content || "{}";

  try {
    JSON.parse(menu); // validar JSON
    return {
      statusCode: 200,
      body: menu
    };
  } catch {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Respuesta no válida de la IA" })
    };
  }
};
