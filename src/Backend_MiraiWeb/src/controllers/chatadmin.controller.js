import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from 'axios';

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

// Reutilizar funciones de analytics.controller.js
const getPostHogDashboardData = async () => {
  try {
    const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY;
    const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID;

    if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID) {
      console.error("Faltan credenciales de PostHog en .env");
      return null;
    }

    const headers = {
      'Authorization': `Bearer ${POSTHOG_API_KEY}`,
      'Content-Type': 'application/json'
    };

    const dashboardResponse = await axios.get(
      `https://us.posthog.com/api/projects/${POSTHOG_PROJECT_ID}/dashboards`,
      { headers }
    );

    const adminDashboard = dashboardResponse.data.results.find(
      dashboard => dashboard.name === 'AnaliticasAdmin' || dashboard.name === 'AnalíticasAdmin'
    );

    if (!adminDashboard) {
      const fallbackDashboard = dashboardResponse.data.results[0];
      if (!fallbackDashboard) return null;
      
      const dashboardDetail = await axios.get(
        `https://us.posthog.com/api/projects/${POSTHOG_PROJECT_ID}/dashboards/${fallbackDashboard.id}`,
        { headers }
      );

      return await processInsights(dashboardDetail.data.tiles, headers, POSTHOG_PROJECT_ID);
    }

    const dashboardDetail = await axios.get(
      `https://us.posthog.com/api/projects/${POSTHOG_PROJECT_ID}/dashboards/${adminDashboard.id}`,
      { headers }
    );

    return await processInsights(dashboardDetail.data.tiles, headers, POSTHOG_PROJECT_ID);
  } catch (error) {
    console.error("Error obteniendo datos de PostHog:", error.message);
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

const prepareGraphData = async (graphType, dbAnalytics = null) => {
  const guatemalaDate = getGuatemalaDate();

  switch (graphType) {
    case 'estudiantes-registrados':
      if (!dbAnalytics) return null;
      
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                         'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      
      const registrosPorMes = Object.entries(dbAnalytics.studentsJoinedByMonth).map(([mes, cantidad]) => ({
        mes: monthNames[parseInt(mes) - 1],
        cantidad: cantidad
      }));

      const totalRegistros = Object.values(dbAnalytics.studentsJoinedByMonth).reduce((a, b) => a + b, 0);
      const promedioMensual = totalRegistros / Object.keys(dbAnalytics.studentsJoinedByMonth).length;

      return {
        tipo: 'Estudiantes Registrados por Mes',
        descripcion: 'Evolución mensual de nuevos estudiantes que se registran en la plataforma Mirai',
        periodo: `Año ${guatemalaDate.year}`,
        datos: {
          totalEstudiantes: dbAnalytics.totalStudents,
          registrosPorMes: registrosPorMes,
          totalRegistrosAnuales: totalRegistros,
          promedioMensual: Math.round(promedioMensual),
          mesActual: guatemalaDate.month
        },
        fuente: 'Base de Datos Mirai'
      };

    case 'tasa-finalizacion-quiz':
      const postHogData = await getPostHogDashboardData();
      if (!postHogData || postHogData.length === 0) return null;

      const funnelInsight = postHogData.find(insight => 
        insight.name?.toLowerCase().includes('tasa') || 
        insight.name?.toLowerCase().includes('quiz') ||
        insight.name?.toLowerCase().includes('funnel')
      );

      if (!funnelInsight) return null;

      return {
        tipo: 'Tasa de Finalización del Quiz Vocacional',
        descripcion: 'Embudo que muestra cuántos usuarios inician vs cuántos completan el quiz vocacional',
        periodo: 'Últimos 7 días',
        datos: funnelInsight.result || funnelInsight.filters,
        nombre: funnelInsight.name,
        fuente: 'PostHog Analytics'
      };

    case 'tiempo-promedio-chat':
      const postHogDataChat = await getPostHogDashboardData();
      if (!postHogDataChat || postHogDataChat.length === 0) return null;

      const chatInsight = postHogDataChat.find(insight => 
        insight.name?.toLowerCase().includes('tiempo') && 
        insight.name?.toLowerCase().includes('chat')
      );

      if (!chatInsight) return null;

      return {
        tipo: 'Tiempo Promedio en Pantalla de Chat',
        descripcion: 'Análisis del tiempo que los usuarios pasan en la pantalla del chat por visita',
        periodo: 'Últimos 30 días',
        datos: chatInsight.result || chatInsight.filters,
        nombre: chatInsight.name,
        fuente: 'PostHog Analytics'
      };

    case 'tiempo-promedio-pantallas':
      const postHogDataPantallas = await getPostHogDashboardData();
      if (!postHogDataPantallas || postHogDataPantallas.length === 0) return null;

      const pantallasInsight = postHogDataPantallas.find(insight => {
        const nombreLower = insight.name?.toLowerCase() || '';
        return (nombreLower.includes('tiempo') && nombreLower.includes('pantallas')) ||
               (nombreLower.includes('tiempo') && nombreLower.includes('pantalla'));
      });

      if (!pantallasInsight) return null;

      return {
        tipo: 'Tiempo Promedio en las Pantallas',
        descripcion: 'Análisis del tiempo promedio que los usuarios pasan en cada pantalla de la aplicación',
        periodo: 'Todo el tiempo',
        datos: pantallasInsight.result || pantallasInsight.filters,
        nombre: pantallasInsight.name,
        fuente: 'PostHog Analytics'
      };

     case 'tiempo-promedio-estudiantes-activos':
      const postHogDataActivos = await getPostHogDashboardData();
      if (!postHogDataActivos || postHogDataActivos.length === 0) return null;

      const activosInsight = postHogDataActivos.find(insight => {
        const nombreLower = insight.name?.toLowerCase() || '';
        return (nombreLower.includes('tiempo') && nombreLower.includes('activos')) ||
               (nombreLower.includes('tiempo') && nombreLower.includes('estudiantes')) ||
               (nombreLower.includes('active') && nombreLower.includes('time'));
      });

      if (!activosInsight) return null;

      return {
        tipo: 'Tiempo Promedio de Estudiantes Activos en la App',
        descripcion: 'Análisis del tiempo promedio que los estudiantes activos pasan en la aplicación móvil',
        periodo: 'Últimos 30 días',
        datos: activosInsight.result || activosInsight.filters,
        nombre: activosInsight.name,
        fuente: 'PostHog Analytics'
      };

    default:
      return null;
  }
};

// Endpoint para obtener la lista de gráficas disponibles
export const getAvailableGraphs = async (req, res) => {
  try {
    const graphs = [
      {
        id: 'estudiantes-registrados',
        titulo: 'Estudiantes Registrados por Mes',
        descripcion: 'Evolución mensual de nuevos estudiantes',
        icono: '📊',
        fuente: 'Base de Datos'
      },
      {
        id: 'tasa-finalizacion-quiz',
        titulo: 'Tasa de Finalización del Quiz',
        descripcion: 'Embudo de completación del quiz vocacional',
        icono: '🎯',
        fuente: 'PostHog'
      },
      {
        id: 'tiempo-promedio-chat',
        titulo: 'Tiempo en Pantalla de Chat',
        descripcion: 'Análisis de tiempo promedio en el chat',
        icono: '💬',
        fuente: 'PostHog'
      },
      {
        id: 'tiempo-promedio-pantallas',
        titulo: 'Tiempo en las Pantallas',
        descripcion: 'Tiempo promedio por pantalla de la app',
        icono: '📱',
        fuente: 'PostHog'
      },
      {
        id: 'tiempo-promedio-estudiantes-activos',
        titulo: 'Tiempo Promedio de Estudiantes Activos',
        descripcion: 'Tiempo promedio que pasan en la app los estudiantes activos',
        icono: '⏱️',
        fuente: 'PostHog'
      }
    ];

    res.json({
      success: true,
      data: graphs
    });
  } catch (error) {
    console.error("Error obteniendo gráficas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las gráficas disponibles"
    });
  }
};

// Endpoint para iniciar conversación con contexto de gráfica
export const startGraphChat = async (req, res) => {
  try {
    const { graphType, analyticsData } = req.body;

    if (!graphType) {
      return res.status(400).json({
        success: false,
        message: "Se requiere el tipo de gráfica"
      });
    }

    console.log(`Iniciando chat para gráfica: ${graphType}`);

    const guatemalaDate = getGuatemalaDate();
    const graphData = await prepareGraphData(graphType, analyticsData);

    if (!graphData) {
      return res.status(404).json({
        success: false,
        message: "No se pudieron obtener los datos de la gráfica"
      });
    }

    // Mensaje inicial del asistente con contexto
    const initialMessage = {
      role: 'assistant',
      content: `¡Hola! 👋 Soy tu asistente de análisis de datos para MiraiEdu.

Estamos conversando sobre: **${graphData.tipo}**

📊 ${graphData.descripcion}
📅 Periodo: ${graphData.periodo}
🔍 Fuente: ${graphData.fuente}

Puedo ayudarte a:
• Explicar los datos de esta gráfica
• Identificar tendencias y patrones
• Responder preguntas específicas sobre las métricas
• Dar recomendaciones basadas en los datos
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
        conversationId: `chat_${graphType}_${Date.now()}`,
        initialMessage,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Error iniciando chat:", error);
    res.status(500).json({
      success: false,
      message: "Error al iniciar el chat",
      error: error.message
    });
  }
};

// Endpoint principal para chat con IA
export const chatWithGraph = async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "API key de Gemini no configurada"
      });
    }

    const { graphType, message, conversationHistory, analyticsData } = req.body;

    if (!graphType || !message) {
      return res.status(400).json({
        success: false,
        message: "Se requiere el tipo de gráfica y el mensaje"
      });
    }

    console.log(`Chat message para ${graphType}: ${message}`);

    const guatemalaDate = getGuatemalaDate();
    const graphData = await prepareGraphData(graphType, analyticsData);

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
        `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`
      ).join('\n\n');
    }

    const prompt = `
Eres un asistente experto en análisis de datos educativos para Mirai, una plataforma de orientación vocacional en Guatemala.

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

PREGUNTA DEL USUARIO:
${message}

INSTRUCCIONES:
1. Responde ÚNICAMENTE en español de Guatemala de forma natural y conversacional
2. Basa tu respuesta EXCLUSIVAMENTE en los datos proporcionados arriba
3. Si la pregunta no se puede responder con los datos disponibles, dilo claramente
4. Usa números y datos específicos cuando sea relevante
5. Sé conciso pero completo (máximo 200 palabras)
6. Si detectas tendencias o patrones interesantes, menciónalo
7. Puedes hacer sugerencias o recomendaciones basadas en los datos
8. Mantén un tono profesional pero amigable
9. NO inventes datos que no estén en el contexto

RESPONDE DIRECTAMENTE (sin formato JSON, solo texto):`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("Respuesta generada para chat");

    res.json({
      success: true,
      data: {
        message: text.trim(),
        timestamp: new Date().toISOString(),
        graphType,
        conversationId: req.body.conversationId || `chat_${graphType}_${Date.now()}`
      }
    });

  } catch (error) {
    console.error("Error en chat:", error);

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