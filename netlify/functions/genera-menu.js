const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders };
  }

  // Recoge parámetros opcionales del body
  const { personas = 2, dieta = 'mediterránea', presupuesto = 'medio' } =
    JSON.parse(event.body || '{}');

  const prompt = `
Eres un planificador de menús semanal.
Genera 7 platos en español para ${personas} personas, con dieta ${dieta} y presupuesto ${presupuesto}.
Responde ÚNICAMENTE en JSON con esta estructura:
{
  "semana": [
    { "dia": "Lunes", "plato": "…", "ingredientes": ["…","…"] }
  ],
  "lista_compra": ["…","…"]
}
Reglas:
- Deduplica y suma cantidades en "lista_compra".
- Usa gramos (g), mililitros (ml) o unidades (ud).
- Sin texto fuera del JSON.
`;

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Eres un planificador de menús semanal.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    }),
  });

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content || '{}';

  let json;
  try { json = JSON.parse(content); }
  catch (e) { json = { error: 'Formato JSON inválido', raw: content }; }

  return {
    statusCode: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(json),
  };
};
