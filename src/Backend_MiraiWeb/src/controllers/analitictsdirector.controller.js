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

// Obtener datos del dashboard de Director en PostHog
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

    // Dashboard específico para director
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

// Simulación de datos de base de datos para ejemplo
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

// Preparar datos según el tipo de gráfica (Director)
const prepareGraphDataDirector = async (graphType) => {
  // Las gráficas de base de datos:
  if (graphType === 'top-carreras-recomendadas' || graphType === 'bfi-dimension') {
    return await getDatabaseAnalytics(graphType);
  }

  // Las gráficas de PostHog:
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

// Endpoint para análisis con IA (Director)
export const analyzeGraphWithAIDirector = async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "API key de Gemini no configurada"
      });
    }

    const { graphType, level } = req.body;
    if (!graphType || !level) {
      return res.status(400).json({
        success: false,
        message: "Faltan parámetros requeridos (graphType, level)"
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

    const analysisType = level === 'general' ? 'ANÁLISIS GENERAL' : 'ANÁLISIS PROFUNDO';

    const prompt = `
Actúa como un analista de datos educativos experto especializado en gestión institucional para DIRECTORES en Guatemala.

FECHA ACTUAL: ${guatemalaDate.fullDate}
UBICACIÓN: Guatemala
TIPO DE ANÁLISIS: ${analysisType}
PLATAFORMA: Mirai - Vista de Director
AUDIENCIA: Directores y autoridades educativas

GRÁFICA PARA ANALIZAR:
${JSON.stringify(graphData, null, 2)}

${level === 'general' ? `
ANÁLISIS GENERAL (150-250 palabras):

1. ¿QUÉ MUESTRA ESTA GRÁFICA?
   - Explicación clara y ejecutiva
   - Relevancia institucional

2. HALLAZGOS PRINCIPALES
   - 2-3 observaciones clave
   - Números o porcentajes destacables
   - Tendencia principal

3. IMPLICACIONES PARA LA GESTIÓN
   - Qué revela sobre la institución
   - Impacto en la toma de decisiones
   - Oportunidades de mejora detectadas

4. RECOMENDACIÓN INSTITUCIONAL
   - Acción concreta para la dirección
   - Prioridad (alta/media/baja)
   - Beneficio esperado

El análisis debe ser profesional, usar datos específicos y enfocarse en la gestión institucional.
` : `
ANÁLISIS PROFUNDO (500-700 palabras):

1. DESCRIPCIÓN DETALLADA DE LA MÉTRICA
   - Qué representa en el contexto institucional
   - Importancia para la gestión educativa
   - Relación con el desarrollo institucional

2. ANÁLISIS PROFUNDO DE DATOS
   - Desglose detallado de los números
   - Patrones identificados
   - Comparación con expectativas institucionales
   - Tendencias emergentes

3. INTERPRETACIÓN INSTITUCIONAL
   - Factores que influyen en los resultados
   - Contexto del sistema educativo guatemalteco
   - Relación con el perfil institucional
   - Impacto del calendario académico
   - Consideraciones culturales y socioeconómicas

4. INSIGHTS PARA LA DIRECCIÓN
   - Oportunidades para mejorar la gestión
   - Áreas que requieren atención
   - Fortalezas institucionales
   - Gaps detectados
   - Necesidades específicas

5. RECOMENDACIONES PRIORIZADAS
   Proporciona 5-7 recomendaciones específicas para la dirección. Para cada una incluye:
   - Acción institucional
   - Impacto esperado
   - Recursos necesarios
   - Timeline sugerido
   - Métricas de éxito
   - Prioridad

6. PROYECCIONES Y ESCENARIOS
   - Proyección para el próximo periodo
   - Escenario optimista y realista
   - Factores a monitorear
   - Eventos institucionales relevantes

El análisis debe ser profesional, orientado a la gestión y enfocado en el beneficio institucional.
`}

RESPONDE ÚNICAMENTE en formato JSON válido con esta estructura:
{
  "tipoGrafica": "${graphData.tipo}",
  "resumenEjecutivo": "Resumen de 2-3 líneas para la dirección",
  "analisisCompleto": "Texto completo del análisis. Usa \\n\\n para separar párrafos.",
  "puntosClave": [
    "Punto clave 1 con datos",
    "Punto clave 2 con datos",
    "Punto clave 3 con datos"
  ],
  "hallazgosImportantes": [
    {
      "hallazgo": "Descripción del hallazgo",
      "impacto": "alto|medio|bajo",
      "dato": "Número o porcentaje específico",
      "explicacion": "Por qué es importante para la gestión institucional"
    }
  ],
  "recomendaciones": [
    {
      "accion": "Acción institucional recomendada",
      "prioridad": "alta|media|baja",
      "justificacion": "Por qué es importante con datos"
    }
  ]
}

REQUISITOS CRÍTICOS:
- Usa ÚNICAMENTE los datos proporcionados
- Enfoque institucional y de gestión educativa
- Español profesional de Guatemala
- Insights accionables para directores
- Basado en el contexto educativo guatemalteco
- Lenguaje apropiado para autoridades
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const analysis = JSON.parse(text);

      res.json({
        success: true,
        data: {
          graphType,
          level,
          graphInfo: {
            tipo: graphData.tipo,
            descripcion: graphData.descripcion,
            periodo: graphData.periodo,
            fuente: graphData.fuente
          },
          analysis,
          timestamp: new Date().toISOString(),
          fecha: guatemalaDate.fullDate
        }
      });
    } catch (parseError) {
      res.status(500).json({
        success: false,
        message: "Error al procesar el análisis con IA",
        error: parseError.message
      });
    }
  } catch (error) {
    if (error.message?.includes("API key not valid")) {
      return res.status(401).json({
        success: false,
        message: "API key de Gemini no válida"
      });
    }
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
};