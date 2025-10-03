const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders };
  }

  const demo = {
    semana: [
      {
        dia: 'Lunes',
        plato: 'Ensalada de pollo y aguacate',
        ingredientes: [
          '200 g pechuga de pollo',
          '1 aguacate',
          '1 lechuga',
          '1 cda aceite de oliva'
        ]
      },
      {
        dia: 'Martes',
        plato: 'Espaguetis con tomate',
        ingredientes: [
          '200 g espaguetis',
          '150 g tomate triturado',
          '1 diente de ajo'
        ]
      }
    ],
    lista_compra: [
      '400 g pechuga de pollo',
      '2 aguacates',
      '2 lechugas',
      '200 g espaguetis',
      '150 g tomate triturado',
      '1 diente de ajo'
    ]
  };

  return {
    statusCode: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(demo),
  };
};
