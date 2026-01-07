import { GoogleGenerativeAI } from "@google/generative-ai";

// Función para obtener la fecha actual en Guatemala
const getGuatemalaDate = () => {
  const now = new Date();
  const guatemalaTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Guatemala"}));
  return {
    date: guatemalaTime.toISOString().split('T')[0],
    month: guatemalaTime.toLocaleString('es-GT', { month: 'long' }),
    year: guatemalaTime.getFullYear(),
    fullDate: guatemalaTime.toLocaleDateString('es-GT', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  };
};

// Endpoint con streaming (Server-Sent Events)
export const getCompleteCareerInsightsStream = async (req, res) => {
  try {
    // Validar API key primero
    if (!process.env.GEMINI_API_KEY) {
      res.writeHead(500, {
        'Content-Type': 'application/json'
      });
      return res.end(JSON.stringify({
        success: false,
        message: "API key de Gemini no configurada"
      }));
    }

    const { carrera } = req.params;
    
    if (!carrera) {
      res.writeHead(400, {
        'Content-Type': 'application/json'
      });
      return res.end(JSON.stringify({
        success: false,
        message: "La carrera es requerida"
      }));
    }

    // Configurar SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    });

    // Función para enviar eventos SSE
    const sendEvent = (type, data) => {
      res.write(`event: ${type}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Enviar evento de inicio
    sendEvent('start', { 
      message: `Iniciando análisis del mercado laboral para ${carrera}...`, 
      carrera: carrera,
      timestamp: new Date().toISOString()
    });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const guatemalaDate = getGuatemalaDate();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Estados de progreso realistas
    const progressSteps = [
      { message: 'Conectando con fuentes de datos guatemaltecas...', delay: 800 },
      { message: 'Analizando tendencias de mercado actuales...', delay: 1000 },
      { message: 'Buscando oportunidades laborales en Guatemala...', delay: 1200 },
      { message: 'Evaluando competencias y habilidades demandadas...', delay: 1000 },
      { message: 'Recopilando información salarial actualizada...', delay: 900 },
      { message: 'Investigando modalidades de trabajo...', delay: 700 },
      { message: 'Revisando contexto educativo y profesional...', delay: 800 },
      { message: 'Procesando análisis con inteligencia artificial...', delay: 1500 }
    ];

    // Enviar progreso paso a paso
    for (let i = 0; i < progressSteps.length; i++) {
      sendEvent('progress', {
        step: i + 1,
        total: progressSteps.length,
        message: progressSteps[i].message,
        percentage: Math.round(((i + 1) / progressSteps.length) * 100)
      });
      
      // Pausa realista
      await new Promise(resolve => setTimeout(resolve, progressSteps[i].delay));
    }

    const prompt = `
    Actúa como un agente especializado en análisis completo de mercado laboral guatemalteco con acceso a información actualizada de Guatemala. 
    
    FECHA ACTUAL: ${guatemalaDate.fullDate} (${guatemalaDate.date})
    UBICACIÓN: Guatemala, Centroamérica
    
    Necesito un análisis COMPLETO y ACTUAL sobre la carrera de "${carrera}" en Guatemala para ${guatemalaDate.month} de ${guatemalaDate.year}.

    IMPORTANTE: Esta carrera es una de 33 carreras diferentes que manejamos, por lo que el análisis debe ser específico y adaptado a las características particulares de "${carrera}".

    PROPORCIONA INFORMACIÓN COMPLETA SOBRE:

    1. TENDENCIAS DE MERCADO ACTUALES (${guatemalaDate.month} ${guatemalaDate.year}):
    - Tendencias emergentes específicas para profesionales de ${carrera} en Guatemala AHORA
    - Cambios recientes en el mercado laboral guatemalteco para esta carrera (últimas 4-6 semanas)
    - Sectores o industrias que están demandando profesionales de ${carrera} en Guatemala actualmente
    
    2. OPORTUNIDADES LABORALES:
    - Nuevas oportunidades laborales para graduados de ${carrera} en empresas guatemaltecas recientemente
    - Organizaciones, empresas o instituciones guatemaltecas contratando profesionales de ${carrera} AHORA
    - Posiciones o roles más demandados para esta carrera actualmente en Guatemala
    
    3. COMPETENCIAS Y FORMACIÓN:
    - Competencias y habilidades específicas demandadas para ${carrera} en Guatemala ESTE mes
    - Certificaciones, cursos o especializaciones valoradas para profesionales de ${carrera} por empleadores guatemaltecos
    - Herramientas, metodologías o conocimientos trending para ${carrera} en Guatemala AHORA
    
    4. INFORMACIÓN ECONÓMICA ACTUALIZADA:
    - Rangos salariales actuales para profesionales de ${carrera} en Guatemala (GTQ y USD)
    - Factores afectando las remuneraciones de esta carrera AHORA en Guatemala
    - Tendencias económicas y de compensación recientes para ${carrera} (últimas semanas)
    
    5. MODALIDADES DE TRABAJO:
    - Tendencias de modalidades de trabajo (presencial, remoto, híbrido) para ${carrera} en Guatemala más recientes
    - Políticas y oportunidades de trabajo flexible en empresas guatemaltecas para esta carrera
    
    6. CONTEXTO EDUCATIVO Y PROFESIONAL:
    - Programas universitarios guatemaltecos relevantes para ${carrera} actualizados
    - Alianzas academia-industria recientes para profesionales de ${carrera}
    - Programas de formación continua, bootcamps o especializaciones relevantes para ${carrera} en Guatemala

    Para cada insight, incluye:
    - Enlaces específicos de fuentes guatemaltecas
    - Empresas, organizaciones o instituciones guatemaltecas específicas mencionadas
    - Información contextualizada al mercado guatemalteco para esta carrera
    - Datos económicos en GTQ y USD
    
    Fuentes guatemaltecas sugeridas:
    - TecoloCo.gt, CompuTrabajo Guatemala, Bumeran Guatemala
    - Universidades guatemaltecas relevantes para la carrera
    - Organizaciones profesionales guatemaltecas del sector
    - Empresas e instituciones guatemaltecas del área profesional
    - Medios económicos guatemaltecos (Prensa Libre, El Periódico, etc.)
    - Fundesa, Invest in Guatemala, cámaras empresariales relevantes

    RESPONDE ÚNICAMENTE en formato JSON válido con esta estructura:
    {
      "insights": [
        {
          "id": 1,
          "titulo": "Título específico del insight actual para ${carrera} en Guatemala",
          "descripcion": "Descripción completa y detallada con información reciente del mercado guatemalteco específica para ${carrera}",
          "categoria": "tendencias_mercado|oportunidades_laborales|competencias_formacion|informacion_economica|modalidades_trabajo|contexto_educativo",
          "relevancia": "alta|media|baja",
          "fecha": "${guatemalaDate.date}",
          "fuente": "Nombre específico de la fuente guatemalteca",
          "enlace": "URL específica de la fuente guatemalteca",
          "impacto": "Descripción del impacto para estudiantes y profesionales de ${carrera} en Guatemala",
          "actualidad": "Nivel de actualidad de la información",
          "empresasGuatemaltecas": ["Lista de empresas/organizaciones guatemaltecas mencionadas"],
          "contextoLocal": "Información específica del contexto guatemalteco para ${carrera}",
          "datosEspecificos": {
            "rangos_salariales": {
              "entrada": {"gtq": "rango inicial en GTQ", "usd": "rango inicial en USD"},
              "intermedio": {"gtq": "rango intermedio en GTQ", "usd": "rango intermedio en USD"},
              "experimentado": {"gtq": "rango experimentado en GTQ", "usd": "rango experimentado en USD"}
            },
            "competenciasDemandadas": ["competencia1 específica para la carrera", "competencia2", "competencia3"],
            "certificacionesValoradas": ["certificación1 relevante para la carrera", "certificación2", "certificación3"],
            "herramientasTrending": ["herramienta1 específica del campo", "herramienta2", "herramienta3"]
          },
          "recomendacionesEstudiantes": "Recomendaciones específicas para estudiantes de ${carrera} en Guatemala"
        }
      ],
      "resumenEjecutivo": {
        "tendenciaGeneral": "Descripción de la tendencia general del mercado para profesionales de ${carrera} en Guatemala",
        "oportunidadPrincipal": "Principal oportunidad actual para estudiantes y profesionales de ${carrera}",
        "desafiosPrincipales": ["desafío1 específico de la carrera", "desafío2"],
        "recomendacionGeneral": "Recomendación general para estudiantes de ${carrera} en Guatemala",
        "perspectiva2025": "Perspectiva del mercado para profesionales de ${carrera} en Guatemala para 2025"
      }
    }

    PROPORCIONA EXACTAMENTE 10 INSIGHTS COMPLETOS Y DIVERSOS que cubran todas las categorías mencionadas.
    NO uses información genérica. TODO debe ser específico de la carrera "${carrera}" en GUATEMALA y ACTUAL (${guatemalaDate.month} ${guatemalaDate.year}).
    Adapta el análisis según las características particulares de "${carrera}".
    `;

    sendEvent('generating', { 
      message: 'Generando insights personalizados...',
      status: 'processing' 
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Limpiar la respuesta
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const insights = JSON.parse(text);
      
      // Enviar insights uno por uno con efecto de escritura
      if (insights.insights && Array.isArray(insights.insights)) {
        sendEvent('insights_start', { 
          message: 'Comenzando a mostrar insights...',
          total: insights.insights.length 
        });

        for (let i = 0; i < insights.insights.length; i++) {
          sendEvent('insight', {
            insight: insights.insights[i],
            index: i + 1,
            total: insights.insights.length,
            categoria: insights.insights[i].categoria
          });
          
          // Pausa para efecto de escritura gradual
          await new Promise(resolve => setTimeout(resolve, 600));
        }
      }

      // Enviar resumen ejecutivo
      if (insights.resumenEjecutivo) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        sendEvent('summary', { 
          resumen: insights.resumenEjecutivo,
          message: 'Generando resumen ejecutivo...'
        });
      }

      // Enviar evento de finalización
      sendEvent('complete', {
        success: true,
        carrera: carrera,
        pais: "Guatemala",
        fechaConsulta: new Date().toISOString(),
        fechaGuatemala: guatemalaDate.fullDate,
        totalInsights: insights.insights?.length || 0,
        metadata: {
          fechaLocal: guatemalaDate.date,
          mes: guatemalaDate.month,
          año: guatemalaDate.year,
          timezone: "America/Guatemala",
          mercado: "Guatemala, Centroamérica",
          tipoAnalisis: "Análisis completo de mercado laboral específico por carrera"
        }
      });

    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      sendEvent('error', {
        success: false,
        message: "Error al procesar los insights",
        error: parseError.message,
        rawText: text
      });
    }

    res.end();

  } catch (error) {
    console.error("Error generando insights stream:", error);
    
    if (res.headersSent) {
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({
        success: false,
        message: "Error interno del servidor",
        error: error.message
      })}\n\n`);
    } else {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.write(JSON.stringify({
        success: false,
        message: "Error interno del servidor",
        error: error.message
      }));
    }
    
    res.end();
  }
};