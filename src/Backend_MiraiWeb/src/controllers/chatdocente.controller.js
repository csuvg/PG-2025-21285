import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from 'axios';

// Utilidad para la fecha de Guatemala
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

// Obtener datos del dashboard de Docente en PostHog
const getPostHogDashboardDataDocente = async () => {
  try {
    const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY;
    const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID;

    if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID) return null;

    const headers = {
      'Authorization': `Bearer ${POSTHOG_API_KEY}`,
      'Content-Type': 'application/json'
    };

    const dashboardResponse = await axios.get(
      `https://us.posthog.com/api/projects/${POSTHOG_PROJECT_ID}/dashboards`,
      { headers }
    );

    const docenteDashboard = dashboardResponse.data.results.find(
      dashboard => dashboard.name === 'AnaliticDocente' || dashboard.name === 'AnalíticDocente'
    );

    const dashboardToUse = docenteDashboard || dashboardResponse.data.results[0];
    if (!dashboardToUse) return null;

    const dashboardDetail = await axios.get(
      `https://us.posthog.com/api/projects/${POSTHOG_PROJECT_ID}/dashboards/${dashboardToUse.id}`,
      { headers }
    );

    return await processInsights(dashboardDetail.data.tiles, headers, POSTHOG_PROJECT_ID);
  } catch (error) {
    return null;
  }
};

const processInsights = async (tiles, headers, projectId) => {
  if (!tiles || tiles.length === 0) return [];
  const insights = await Promise.all(
    tiles.map(async (tile) => {
      try {
        const insightId = tile.insight?.id || tile.insight?.short_id || tile.insight;
        if (!insightId) return null;
        if (tile.insight && typeof tile.insight === 'object' && tile.insight.name) {
          return {
            id: tile.insight.id || tile.insight.short_id,
            name: tile.insight.name,
            description: tile.insight.description,
            filters: tile.insight.filters,
            result: tile.insight.result,
            last_refresh: tile.insight.last_refresh
          };
        }
        const insightResponse = await axios.get(
          `https://us.posthog.com/api/projects/${projectId}/insights/${insightId}`,
          { headers }
        );
        return {
          id: insightResponse.data.id || insightResponse.data.short_id,
          name: insightResponse.data.name,
          description: insightResponse.data.description,
          filters: insightResponse.data.filters,
          result: insightResponse.data.result,
          last_refresh: insightResponse.data.last_refresh
        };
      } catch (error) {
        return null;
      }
    })
  );
  return insights.filter(insight => insight !== null);
};

// Preparar datos según el tipo de gráfica (Docente)
const prepareGraphDataDocente = async (graphType) => {
  const guatemalaDate = getGuatemalaDate();
  const postHogData = await getPostHogDashboardDataDocente();

  switch (graphType) {
    case 'carreras-buscadas':
      if (!postHogData || postHogData.length === 0) return null;
      const carrerasInsight = postHogData.find(insight => {
        const nombreLower = insight.name?.toLowerCase() || '';
        return nombreLower.includes('carreras') && nombreLower.includes('buscado');
      });
      if (!carrerasInsight) return null;
      return {
        tipo: 'Carreras más Buscadas en el Buscador',
        descripcion: 'Análisis de qué carreras buscan más los estudiantes en la app móvil',
        periodo: 'Todo el tiempo',
        datos: carrerasInsight.result || carrerasInsight.filters,
        nombre: carrerasInsight.name,
        fuente: 'PostHog Analytics'
      };

    case 'tags-guardados':
      if (!postHogData || postHogData.length === 0) return null;
      const tagsInsight = postHogData.find(insight => {
        const nombreLower = insight.name?.toLowerCase() || '';
        return (nombreLower.includes('tags') || nombreLower.includes('etiquetas')) && 
               nombreLower.includes('guardad');
      });
      if (!tagsInsight) return null;
      return {
        tipo: 'Tags más Guardados en la App',
        descripcion: 'Análisis de las categorías o etiquetas más guardadas por los estudiantes',
        periodo: 'Últimos 30 días',
        datos: tagsInsight.result || tagsInsight.filters,
        nombre: tagsInsight.name,
        fuente: 'PostHog Analytics'
      };

    case 'carreras-guardadas':
      if (!postHogData || postHogData.length === 0) return null;
      const carrerasGuardadasInsight = postHogData.find(insight => {
        const nombreLower = insight.name?.toLowerCase() || '';
        return (nombreLower.includes('top') || nombreLower.includes('carreras')) && 
               nombreLower.includes('guardadas');
      });
      if (!carrerasGuardadasInsight) return null;
      return {
        tipo: 'Top 5 Carreras más Guardadas',
        descripcion: 'Las 5 carreras que más guardan los estudiantes en sus favoritos',
        periodo: 'Todo el tiempo',
        datos: carrerasGuardadasInsight.result || carrerasGuardadasInsight.filters,
        nombre: carrerasGuardadasInsight.name,
        fuente: 'PostHog Analytics'
      };

    case 'respuestas-quiz':
      if (!postHogData || postHogData.length === 0) return null;
      const respuestasInsight = postHogData.find(insight => {
        const nombreLower = insight.name?.toLowerCase() || '';
        return nombreLower.includes('respuestas') && nombreLower.includes('quiz');
      });
      if (!respuestasInsight) return null;
      return {
        tipo: 'Distribución de Respuestas por Sección del Quiz',
        descripcion: 'Análisis de cómo responden los estudiantes en cada sección del test vocacional',
        periodo: 'Todo el tiempo',
        datos: respuestasInsight.result || respuestasInsight.filters,
        nombre: respuestasInsight.name,
        fuente: 'PostHog Analytics'
      };

    case 'tiempo-seccion-quiz':
      if (!postHogData || postHogData.length === 0) return null;
      const tiempoSeccionInsight = postHogData.find(insight => {
        const nombreLower = insight.name?.toLowerCase() || '';
        return nombreLower.includes('tiempo') && 
               nombreLower.includes('sección') && 
               nombreLower.includes('quiz');
      });
      if (!tiempoSeccionInsight) return null;
      return {
        tipo: 'Tiempo Promedio por Sección del Quiz',
        descripcion: 'Análisis del tiempo que los estudiantes dedican a cada sección del test',
        periodo: 'Últimos 30 días',
        datos: tiempoSeccionInsight.result || tiempoSeccionInsight.filters,
        nombre: tiempoSeccionInsight.name,
        fuente: 'PostHog Analytics'
      };

    default:
      return null;
  }
};

// Endpoint para obtener la lista de gráficas disponibles
export const getAvailableGraphsDocente = async (req, res) => {
  try {
    const graphs = [
      {
        id: 'carreras-buscadas',
        titulo: 'Carreras más Buscadas',
        descripcion: 'Qué carreras buscan más los estudiantes en el buscador de la app',
        icono: '🔍',
        fuente: 'PostHog'
      },
      {
        id: 'tags-guardados',
        titulo: 'Tags más Guardados',
        descripcion: 'Categorías o etiquetas más guardadas por los estudiantes',
        icono: '🏷️',
        fuente: 'PostHog'
      },
      {
        id: 'carreras-guardadas',
        titulo: 'Top 5 Carreras Guardadas',
        descripcion: 'Las carreras que más guardan los estudiantes en favoritos',
        icono: '⭐',
        fuente: 'PostHog'
      },
      {
        id: 'respuestas-quiz',
        titulo: 'Distribución de Respuestas del Quiz',
        descripcion: 'Análisis de respuestas por sección del test vocacional',
        icono: '📝',
        fuente: 'PostHog'
      },
      {
        id: 'tiempo-seccion-quiz',
        titulo: 'Tiempo por Sección del Quiz',
        descripcion: 'Tiempo promedio que dedican a cada sección del test',
        icono: '⏱️',
        fuente: 'PostHog'
      }
    ];

    res.json({
      success: true,
      data: graphs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener las gráficas disponibles"
    });
  }
};

// Endpoint para iniciar conversación con contexto de gráfica
export const startGraphChatDocente = async (req, res) => {
  try {
    const { graphType } = req.body;

    if (!graphType) {
      return res.status(400).json({
        success: false,
        message: "Se requiere el tipo de gráfica"
      });
    }

    const guatemalaDate = getGuatemalaDate();
    const graphData = await prepareGraphDataDocente(graphType);

    if (!graphData) {
      return res.status(404).json({
        success: false,
        message: "No se pudieron obtener los datos de la gráfica"
      });
    }

    // Mensaje inicial del asistente con contexto
    const initialMessage = {
      role: 'assistant',
      content: `¡Hola! 👋 Soy tu asistente de análisis de datos para MiraiEdu Docente.

Estamos conversando sobre: **${graphData.tipo}**

📊 ${graphData.descripcion}
📅 Periodo: ${graphData.periodo}
🔍 Fuente: ${graphData.fuente}

Puedo ayudarte a:
• Explicar los datos de esta gráfica
• Identificar tendencias y patrones
• Responder preguntas específicas sobre las métricas
• Dar recomendaciones pedagógicas
• Comparar periodos o valores específicos

¿Qué te gustaría saber sobre esta gráfica?`
    };

    res.json({
      success: true,
      data: {
        graphType,
        graphInfo: {
          tipo: graphData.tipo,
          descripcion: graphData.descripcion,
          periodo: graphData.periodo,
          fuente: graphData.fuente
        },
        graphData: graphData.datos,
        conversationId: `chatdocente_${graphType}_${Date.now()}`,
        initialMessage,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al iniciar el chat",
      error: error.message
    });
  }
};

// Endpoint principal para chat con IA (Docente)
export const chatWithGraphDocente = async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "API key de Gemini no configurada"
      });
    }

    const { graphType, message, conversationHistory } = req.body;

    if (!graphType || !message) {
      return res.status(400).json({
        success: false,
        message: "Se requiere el tipo de gráfica y el mensaje"
      });
    }

    const guatemalaDate = getGuatemalaDate();
    const graphData = await prepareGraphDataDocente(graphType);

    if (!graphData) {
      return res.status(404).json({
        success: false,
        message: "No se pudieron obtener los datos de la gráfica"
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Construir el historial de conversación para contexto
    let conversationContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
      conversationContext = conversationHistory.map(msg => 
        `${msg.role === 'user' ? 'Docente' : 'Asistente'}: ${msg.content}`
      ).join('\n\n');
    }

    const prompt = `
Eres un asistente experto en análisis de datos educativos para Mirai, plataforma de orientación vocacional en Guatemala.

FECHA ACTUAL: ${guatemalaDate.fullDate}
UBICACIÓN: Guatemala

CONTEXTO DE LA GRÁFICA:
Tipo: ${graphData.tipo}
Descripción: ${graphData.descripcion}
Periodo: ${graphData.periodo}
Fuente: ${graphData.fuente}

DATOS DE LA GRÁFICA:
${JSON.stringify(graphData.datos, null, 2)}

${conversationContext ? `HISTORIAL DE CONVERSACIÓN:
${conversationContext}
` : ''}

PREGUNTA DEL DOCENTE:
${message}

INSTRUCCIONES:
1. Responde ÚNICAMENTE en español de Guatemala de forma natural y conversacional
2. Basa tu respuesta EXCLUSIVAMENTE en los datos proporcionados arriba
3. Si la pregunta no se puede responder con los datos disponibles, dilo claramente
4. Usa números y datos específicos cuando sea relevante
5. Sé conciso pero completo (máximo 200 palabras)
6. Si detectas tendencias o patrones interesantes, menciónalo
7. Puedes hacer sugerencias o recomendaciones pedagógicas
8. Mantén un tono profesional pero amigable
9. NO inventes datos que no estén en el contexto

RESPONDE DIRECTAMENTE (sin formato JSON, solo texto):`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      data: {
        message: text.trim(),
        timestamp: new Date().toISOString(),
        graphType,
        conversationId: req.body.conversationId || `chatdocente_${graphType}_${Date.now()}`
      }
    });

  } catch (error) {
    if (error.message?.includes("API key not valid")) {
      return res.status(401).json({
        success: false,
        message: "API key de Gemini no válida"
      });
    }
    res.status(500).json({
      success: false,
      message: "Error al procesar el mensaje",
      error: error.message
    });
  }
};