import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from 'axios';

// Utilidad para la fecha de Guatemala
const getGuatemalaDate = () => {
  const now = new Date();
  const guatemalaTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Guatemala" }));
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

// --- POSTHOG ---
const getPostHogDashboardDataDirector = async () => {
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

    const directorDashboard = dashboardResponse.data.results.find(
      dashboard => dashboard.name === 'AnalíticasDirector'
    );

    const dashboardToUse = directorDashboard || dashboardResponse.data.results[0];
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

// --- BASE DE DATOS (SIMULADO) ---
const getDatabaseAnalytics = async (graphType) => {
  if (graphType === 'top-carreras-recomendadas') {
    return {
      tipo: 'Top 5 Carreras más recomendadas',
      descripcion: 'Carreras con mayor demanda entre estudiantes',
      periodo: 'Todo el tiempo',
      datos: [
        { carrera: "Licenciatura en Antropología", cantidad: 10 },
        { carrera: "Administracion de Empresas", cantidad: 7 },
        { carrera: "Bioquimica y Microbiologia", cantidad: 5 },
        { carrera: "Licenciatura en Psicologia", cantidad: 3 },
        { carrera: "Ingeniería Química Industrial", cantidad: 1 }
      ],
      fuente: 'Base de Datos'
    };
  }
  if (graphType === 'bfi-dimension') {
    return {
      tipo: 'Promedio por dimensión BFI',
      descripcion: 'Promedio de cada dimensión en el test BFI',
      periodo: 'Todo el tiempo',
      datos: [
        { dimension: 'O', valor: 2.3 },
        { dimension: 'C', valor: 2.3 },
        { dimension: 'E', valor: 4.3 },
        { dimension: 'A', valor: 4.3 },
        { dimension: 'N', valor: 5.3 }
      ],
      fuente: 'Base de Datos'
    };
  }
  return null;
};

// --- PREPARAR DATOS SEGÚN GRÁFICA ---
const prepareGraphDataDirector = async (graphType) => {
  if (graphType === 'top-carreras-recomendadas' || graphType === 'bfi-dimension') {
    return await getDatabaseAnalytics(graphType);
  }

  const postHogData = await getPostHogDashboardDataDirector();

  switch (graphType) {
    case 'carreras-mas-visitadas':
      if (!postHogData || postHogData.length === 0) return null;
      const visitadasInsight = postHogData.find(insight => {
        const nombreLower = insight.name?.toLowerCase() || '';
        return nombreLower.includes('carreras') && nombreLower.includes('visitadas');
      });
      if (!visitadasInsight) return null;
      return {
        tipo: 'Carreras más visitadas en la app Mobile',
        descripcion: 'Carreras con mayor cantidad de visitas en la app',
        periodo: 'Todo el tiempo',
        datos: visitadasInsight.result || visitadasInsight.filters,
        nombre: visitadasInsight.name,
        fuente: 'PostHog Analytics'
      };

    case 'top-carreras-tiempo-lectura':
      if (!postHogData || postHogData.length === 0) return null;
      const tiempoInsight = postHogData.find(insight => {
        const nombreLower = insight.name?.toLowerCase() || '';
        return nombreLower.includes('tiempo') && nombreLower.includes('lectura');
      });
      if (!tiempoInsight) return null;
      return {
        tipo: 'Top 5 Carreras con Mayor Tiempo Promedio de Lectura',
        descripcion: 'Carreras con mayor tiempo promedio de lectura en la app',
        periodo: 'Todo el tiempo',
        datos: tiempoInsight.result || tiempoInsight.filters,
        nombre: tiempoInsight.name,
        fuente: 'PostHog Analytics'
      };

    case 'temas-interes-chat':
      if (!postHogData || postHogData.length === 0) return null;
      const temasInsight = postHogData.find(insight => {
        const nombreLower = insight.name?.toLowerCase() || '';
        return nombreLower.includes('temas') && nombreLower.includes('chat');
      });
      if (!temasInsight) return null;
      return {
        tipo: 'Temas de interés en el chat de la app',
        descripcion: 'Principales temas consultados por los estudiantes en el chat',
        periodo: 'Todo el tiempo',
        datos: temasInsight.result || temasInsight.filters,
        nombre: temasInsight.name,
        fuente: 'PostHog Analytics'
      };

    default:
      return null;
  }
};

// --- ENDPOINT: INICIAR CHAT CON CONTEXTO DE GRÁFICA ---
export const startGraphChatDirector = async (req, res) => {
  try {
    const { graphType } = req.body;

    if (!graphType) {
      return res.status(400).json({
        success: false,
        message: "Se requiere el tipo de gráfica"
      });
    }

    const guatemalaDate = getGuatemalaDate();
    const graphData = await prepareGraphDataDirector(graphType);

    if (!graphData) {
      return res.status(404).json({
        success: false,
        message: "No se pudieron obtener los datos de la gráfica"
      });
    }

    // Mensaje inicial del asistente con contexto
    const initialMessage = {
      role: 'assistant',
      content: `¡Hola! 👋 Soy tu asistente de análisis de datos para MiraiEdu Director.

Estamos conversando sobre: **${graphData.tipo}**

📊 ${graphData.descripcion}
📅 Periodo: ${graphData.periodo}
🔍 Fuente: ${graphData.fuente}

Puedo ayudarte a:
• Explicar los datos de esta gráfica
• Identificar tendencias y patrones
• Responder preguntas específicas sobre las métricas
• Dar recomendaciones de gestión institucional
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
        conversationId: `chatdirector_${graphType}_${Date.now()}`,
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

// --- ENDPOINT: CHAT CON IA ---
export const chatWithGraphDirector = async (req, res) => {
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
    const graphData = await prepareGraphDataDirector(graphType);

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
        `${msg.role === 'user' ? 'Director' : 'Asistente'}: ${msg.content}`
      ).join('\n\n');
    }

    const prompt = `
Eres un asistente experto en análisis de datos institucionales para Mirai, plataforma de orientación vocacional en Guatemala.

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

PREGUNTA DEL DIRECTOR:
${message}

INSTRUCCIONES:
1. Responde ÚNICAMENTE en español de Guatemala de forma natural y ejecutiva
2. Basa tu respuesta EXCLUSIVAMENTE en los datos proporcionados arriba
3. Si la pregunta no se puede responder con los datos disponibles, dilo claramente
4. Usa números y datos específicos cuando sea relevante
5. Sé conciso pero completo (máximo 200 palabras)
6. Si detectas tendencias o patrones interesantes, menciónalo
7. Puedes hacer sugerencias o recomendaciones de gestión institucional
8. Mantén un tono profesional y directivo
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
        conversationId: req.body.conversationId || `chatdirector_${graphType}_${Date.now()}`
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