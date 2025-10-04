const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders };
  }

  const {
    personas = 2,
    tipo_menu = 'omnivoro',
    dificultad = 'facil',
    tiempo = 'cualquiera',
    presupuesto = 'medio'
  } = JSON.parse(event.body || '{}');

  const filtroDieta = {
    vegano: '100% vegano (sin productos animales)',
    vegetariano: 'vegetariano (sin carne ni pescado)',
    sin_gluten: 'sin gluten (apto para celíacos)',
    omnivoro: 'sin restricciones específicas'
  }[tipo_menu] || 'sin restricciones específicas';

  const filtroTiempo = {
    rapido: '≤ 20 minutos',
    medio: 'entre 20 y 40 minutos',
    largo: '> 40 minutos',
    cualquiera: 'sin límite de tiempo'
  }[tiempo] || 'sin límite de tiempo';

  const filtroDificultad = {
    facil: 'fácil',
    media: 'media',
    avanzada: 'avanzada'
  }[dificultad] || 'fácil';

  const userPrompt = `
Genera un menú semanal de 7 platos en español para ${personas} personas.
Tipo de dieta: ${filtroDieta}.
Tiempo de preparación: ${filtroTiempo}.
Dificultad: ${filtroDificultad}.
Presupuesto: ${presupuesto}.

Devuelve ÚNICAMENTE JSON con esta estructura:
{
  "semana": [
    {
      "dia": "Lunes",
      "plato": "...",
      "tiempo_preparacion": "...",
      "dificultad": "...",
      "ingredientes": [
        {"nombre": "...", "cantidad": "..."}
      ]
    }
  ],
  "lista_compra": [
    {"nombre": "...", "cantidad": "..."}
  ]
}

Reglas:
- Deduplica los ingredientes en "lista_compra".
- Usa unidades claras (g, ml, ud).
- No añadas nada fuera del JSON.
- Cumple las restricciones del tipo de menú "${tipo_menu}".
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
        { role: 'user', content: userPrompt }
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
