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

// Función para obtener datos del dashboard de PostHog (Docente)
const getPostHogDashboardDataDocente = async () => {
  try {
    const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY;
    const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID;

    if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID) {
      console.error("Faltan credenciales de PostHog en .env");
      return null;
    }

    console.log("Intentando conectar con PostHog (Docente)...");
    console.log("Project ID:", POSTHOG_PROJECT_ID);

    const headers = {
      'Authorization': `Bearer ${POSTHOG_API_KEY}`,
      'Content-Type': 'application/json'
    };

    // Obtener todos los dashboards
    const dashboardResponse = await axios.get(
      `https://us.posthog.com/api/projects/${POSTHOG_PROJECT_ID}/dashboards`,
      { headers }
    );

    console.log("✅ Dashboards encontrados:", dashboardResponse.data.results.length);

    // Buscar el dashboard "AnaliticDocente"
    const docenteDashboard = dashboardResponse.data.results.find(
      dashboard => dashboard.name === 'AnaliticDocente' || dashboard.name === 'AnalíticDocente'
    );

    if (!docenteDashboard) {
      console.log("📋 Dashboards disponibles:", dashboardResponse.data.results.map(d => d.name));
      console.error("❌ Dashboard 'AnaliticDocente' no encontrado");
      
      // Usar el primer dashboard disponible como fallback
      const fallbackDashboard = dashboardResponse.data.results[0];
      if (!fallbackDashboard) {
        console.error("❌ No hay dashboards disponibles");
        return null;
      }
      
      console.log("⚠️ Usando dashboard fallback:", fallbackDashboard.name);
      
      const dashboardDetail = await axios.get(
        `https://us.posthog.com/api/projects/${POSTHOG_PROJECT_ID}/dashboards/${fallbackDashboard.id}`,
        { headers }
      );

      console.log("📊 Tiles en dashboard fallback:", dashboardDetail.data.tiles?.length || 0);
      
      return await processInsights(dashboardDetail.data.tiles, headers, POSTHOG_PROJECT_ID);
    }

    console.log("✅ Dashboard encontrado:", docenteDashboard.name);

    // Obtener detalles completos del dashboard
    const dashboardDetail = await axios.get(
      `https://us.posthog.com/api/projects/${POSTHOG_PROJECT_ID}/dashboards/${docenteDashboard.id}`,
      { headers }
    );

    console.log("📊 Tiles en dashboard:", dashboardDetail.data.tiles?.length || 0);
    
    if (dashboardDetail.data.tiles && dashboardDetail.data.tiles.length > 0) {
      console.log("Ejemplo de tile:", JSON.stringify(dashboardDetail.data.tiles[0], null, 2));
    }

    return await processInsights(dashboardDetail.data.tiles, headers, POSTHOG_PROJECT_ID);

  } catch (error) {
    console.error("❌ Error obteniendo datos de PostHog:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    return null;
  }
};

// Función auxiliar para procesar insights
const processInsights = async (tiles, headers, projectId) => {
  if (!tiles || tiles.length === 0) {
    console.log("No hay tiles en el dashboard");
    return [];
  }

  const insights = await Promise.all(
    tiles.map(async (tile) => {
      try {
        const insightId = tile.insight?.id || tile.insight?.short_id || tile.insight;
        
        if (!insightId) {
          console.log("Tile sin insight ID válido:", JSON.stringify(tile, null, 2));
          return null;
        }

        // Si el tile ya tiene los datos del insight embebidos, usarlos directamente
        if (tile.insight && typeof tile.insight === 'object' && tile.insight.name) {
          console.log("Usando insight embebido:", tile.insight.name);
          return {
            id: tile.insight.id || tile.insight.short_id,
            name: tile.insight.name,
            description: tile.insight.description,
            filters: tile.insight.filters,
            result: tile.insight.result,
            last_refresh: tile.insight.last_refresh
          };
        }

        console.log("Obteniendo insight por ID:", insightId);
        
        const insightResponse = await axios.get(
          `https://us.posthog.com/api/projects/${projectId}/insights/${insightId}`,
          { headers }
        );
        
        console.log("Insight obtenido:", insightResponse.data.name);
        
        return {
          id: insightResponse.data.id || insightResponse.data.short_id,
          name: insightResponse.data.name,
          description: insightResponse.data.description,
          filters: insightResponse.data.filters,
          result: insightResponse.data.result,
          last_refresh: insightResponse.data.last_refresh
        };
      } catch (error) {
        console.error(`Error obteniendo insight:`, error.message);
        if (error.response) {
          console.error("Response status:", error.response.status);
          console.error("Response data:", JSON.stringify(error.response.data, null, 2));
        }
        return null;
      }
    })
  );

  const validInsights = insights.filter(insight => insight !== null);
  console.log(`✅ ${validInsights.length} insights procesados exitosamente de ${tiles.length} tiles`);
  
  return validInsights;
};

// Función para preparar datos según el tipo de gráfica (Docente)
const prepareGraphDataDocente = async (graphType) => {
  const guatemalaDate = getGuatemalaDate();
  const postHogData = await getPostHogDashboardDataDocente();

  switch (graphType) {
    case 'carreras-buscadas':
      console.log("Obteniendo datos de PostHog para carreras-buscadas");
      
      if (!postHogData || postHogData.length === 0) {
        return {
          tipo: 'Carreras más Buscadas en el Buscador',
          descripcion: 'Análisis de qué carreras buscan más los estudiantes en la app móvil',
          periodo: 'Todo el tiempo',
          datos: {
            mensaje: 'Conectando con PostHog...',
            nota: 'Datos de ejemplo mientras se establece conexión con PostHog'
          },
          fuente: 'PostHog Analytics'
        };
      }

      const carrerasInsight = postHogData.find(insight => {
        const nombreLower = insight.name?.toLowerCase() || '';
        return nombreLower.includes('carreras') && nombreLower.includes('buscado');
      });

      if (!carrerasInsight) {
        console.log("Insights disponibles:", postHogData.map(i => i.name));
        return {
          tipo: 'Carreras más Buscadas en el Buscador',
          descripcion: 'Análisis de qué carreras buscan más los estudiantes en la app móvil',
          periodo: 'Todo el tiempo',
          datos: {
            insightsDisponibles: postHogData.map(i => i.name),
            mensaje: 'Dashboard encontrado pero sin el insight específico'
          },
          fuente: 'PostHog Analytics'
        };
      }

      return {
        tipo: 'Carreras más Buscadas en el Buscador',
        descripcion: 'Análisis de qué carreras buscan más los estudiantes en la app móvil',
        periodo: 'Todo el tiempo',
        datos: carrerasInsight.result || carrerasInsight.filters,
        nombre: carrerasInsight.name,
        fuente: 'PostHog Analytics'
      };

    case 'tags-guardados':
      console.log("Obteniendo datos de PostHog para tags-guardados");
      
      if (!postHogData || postHogData.length === 0) {
        return {
          tipo: 'Tags más Guardados en la App',
          descripcion: 'Análisis de las categorías o etiquetas más guardadas por los estudiantes',
          periodo: 'Últimos 30 días',
          datos: {
            mensaje: 'Conectando con PostHog...',
            nota: 'Datos de ejemplo mientras se establece conexión con PostHog'
          },
          fuente: 'PostHog Analytics'
        };
      }

      const tagsInsight = postHogData.find(insight => {
        const nombreLower = insight.name?.toLowerCase() || '';
        return (nombreLower.includes('tags') || nombreLower.includes('etiquetas')) && 
               nombreLower.includes('guardad');
      });

      if (!tagsInsight) {
        return {
          tipo: 'Tags más Guardados en la App',
          descripcion: 'Análisis de las categorías o etiquetas más guardadas por los estudiantes',
          periodo: 'Últimos 30 días',
          datos: {
            insightsDisponibles: postHogData.map(i => i.name),
            mensaje: 'Dashboard encontrado pero sin el insight específico'
          },
          fuente: 'PostHog Analytics'
        };
      }

      return {
        tipo: 'Tags más Guardados en la App',
        descripcion: 'Análisis de las categorías o etiquetas más guardadas por los estudiantes',
        periodo: 'Últimos 30 días',
        datos: tagsInsight.result || tagsInsight.filters,
        nombre: tagsInsight.name,
        fuente: 'PostHog Analytics'
      };

    case 'carreras-guardadas':
      console.log("Obteniendo datos de PostHog para carreras-guardadas");
      
      if (!postHogData || postHogData.length === 0) {
        return {
          tipo: 'Top 5 Carreras más Guardadas',
          descripcion: 'Las 5 carreras que más guardan los estudiantes en sus favoritos',
          periodo: 'Todo el tiempo',
          datos: {
            mensaje: 'Conectando con PostHog...',
            nota: 'Datos de ejemplo mientras se establece conexión con PostHog'
          },
          fuente: 'PostHog Analytics'
        };
      }

      const carrerasGuardadasInsight = postHogData.find(insight => {
        const nombreLower = insight.name?.toLowerCase() || '';
        return (nombreLower.includes('top') || nombreLower.includes('carreras')) && 
               nombreLower.includes('guardadas');
      });

      if (!carrerasGuardadasInsight) {
        return {
          tipo: 'Top 5 Carreras más Guardadas',
          descripcion: 'Las 5 carreras que más guardan los estudiantes en sus favoritos',
          periodo: 'Todo el tiempo',
          datos: {
            insightsDisponibles: postHogData.map(i => i.name),
            mensaje: 'Dashboard encontrado pero sin el insight específico'
          },
          fuente: 'PostHog Analytics'
        };
      }

      return {
        tipo: 'Top 5 Carreras más Guardadas',
        descripcion: 'Las 5 carreras que más guardan los estudiantes en sus favoritos',
        periodo: 'Todo el tiempo',
        datos: carrerasGuardadasInsight.result || carrerasGuardadasInsight.filters,
        nombre: carrerasGuardadasInsight.name,
        fuente: 'PostHog Analytics'
      };

    case 'respuestas-quiz':
      console.log("Obteniendo datos de PostHog para respuestas-quiz");
      
      if (!postHogData || postHogData.length === 0) {
        return {
          tipo: 'Distribución de Respuestas por Sección del Quiz',
          descripcion: 'Análisis de cómo responden los estudiantes en cada sección del test vocacional',
          periodo: 'Todo el tiempo',
          datos: {
            mensaje: 'Conectando con PostHog...',
            nota: 'Datos de ejemplo mientras se establece conexión con PostHog'
          },
          fuente: 'PostHog Analytics'
        };
      }

      const respuestasInsight = postHogData.find(insight => {
        const nombreLower = insight.name?.toLowerCase() || '';
        return nombreLower.includes('respuestas') && nombreLower.includes('quiz');
      });

      if (!respuestasInsight) {
        return {
          tipo: 'Distribución de Respuestas por Sección del Quiz',
          descripcion: 'Análisis de cómo responden los estudiantes en cada sección del test vocacional',
          periodo: 'Todo el tiempo',
          datos: {
            insightsDisponibles: postHogData.map(i => i.name),
            mensaje: 'Dashboard encontrado pero sin el insight específico'
          },
          fuente: 'PostHog Analytics'
        };
      }

      return {
        tipo: 'Distribución de Respuestas por Sección del Quiz',
        descripcion: 'Análisis de cómo responden los estudiantes en cada sección del test vocacional',
        periodo: 'Todo el tiempo',
        datos: respuestasInsight.result || respuestasInsight.filters,
        nombre: respuestasInsight.name,
        fuente: 'PostHog Analytics'
      };

    case 'tiempo-seccion-quiz':
      console.log("Obteniendo datos de PostHog para tiempo-seccion-quiz");
      
      if (!postHogData || postHogData.length === 0) {
        return {
          tipo: 'Tiempo Promedio por Sección del Quiz',
          descripcion: 'Análisis del tiempo que los estudiantes dedican a cada sección del test',
          periodo: 'Últimos 30 días',
          datos: {
            mensaje: 'Conectando con PostHog...',
            nota: 'Datos de ejemplo mientras se establece conexión con PostHog'
          },
          fuente: 'PostHog Analytics'
        };
      }

      const tiempoSeccionInsight = postHogData.find(insight => {
        const nombreLower = insight.name?.toLowerCase() || '';
        return nombreLower.includes('tiempo') && 
               nombreLower.includes('sección') && 
               nombreLower.includes('quiz');
      });

      if (!tiempoSeccionInsight) {
        return {
          tipo: 'Tiempo Promedio por Sección del Quiz',
          descripcion: 'Análisis del tiempo que los estudiantes dedican a cada sección del test',
          periodo: 'Últimos 30 días',
          datos: {
            insightsDisponibles: postHogData.map(i => i.name),
            mensaje: 'Dashboard encontrado pero sin el insight específico'
          },
          fuente: 'PostHog Analytics'
        };
      }

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

// Endpoint para análisis profundo con IA (Docente)
export const analyzeGraphWithAIDocente = async (req, res) => {
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

    console.log(`Analizando gráfica (Docente): ${graphType} - Nivel: ${level}`);

    const guatemalaDate = getGuatemalaDate();
    const graphData = await prepareGraphDataDocente(graphType);
    
    if (!graphData) {
      return res.status(404).json({
        success: false,
        message: "No se pudieron obtener los datos de la gráfica"
      });
    }

    console.log("Datos de la gráfica preparados:", graphData.tipo);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const analysisType = level === 'general' ? 'ANÁLISIS GENERAL' : 'ANÁLISIS PROFUNDO';

    const prompt = `
    Actúa como un analista de datos educativos experto especializado en orientación vocacional para DOCENTES y ORIENTADORES en Guatemala.
    
    FECHA ACTUAL: ${guatemalaDate.fullDate}
    UBICACIÓN: Guatemala
    TIPO DE ANÁLISIS: ${analysisType}
    PLATAFORMA: Mirai - Vista de Docente/Orientador
    AUDIENCIA: Docentes, orientadores y profesionales de la educación
    
    GRÁFICA PARA ANALIZAR:
    ${JSON.stringify(graphData, null, 2)}
    
    ${level === 'general' ? `
    ANÁLISIS GENERAL (150-250 palabras):
    
    Proporciona un análisis conciso y claro desde la perspectiva de un docente/orientador, que incluya:
    
    1. ¿QUÉ MUESTRA ESTA GRÁFICA?
       - Explicación simple y directa de lo que representa
       - Por qué es relevante para la orientación vocacional
    
    2. HALLAZGOS PRINCIPALES
       - 2-3 observaciones clave sobre el comportamiento estudiantil
       - Números o porcentajes destacables
       - Tendencia principal identificada
    
    3. IMPLICACIONES EDUCATIVAS
       - Qué nos dice sobre los intereses de los estudiantes
       - Impacto en el acompañamiento estudiantil
       - Oportunidades pedagógicas detectadas
    
    4. RECOMENDACIÓN PEDAGÓGICA
       - Una acción concreta que puede tomar el docente/orientador
       - Prioridad de implementación (alta/media/baja)
       - Beneficio esperado para el acompañamiento estudiantil
    
    El análisis debe ser profesional, usar números específicos y enfocarse en acciones pedagógicas.
    ` : `
    ANÁLISIS PROFUNDO (500-700 palabras):
    
    Proporciona un análisis exhaustivo desde la perspectiva docente/orientador que incluya:
    
    1. DESCRIPCIÓN DETALLADA DE LA MÉTRICA
       - Qué representa esta gráfica en el contexto de orientación vocacional
       - Por qué es importante para el acompañamiento estudiantil
       - Cómo se relaciona con el desarrollo vocacional de los estudiantes
    
    2. ANÁLISIS PROFUNDO DE DATOS
       - Desglose detallado de todos los números presentados
       - Patrones de comportamiento estudiantil identificados
       - Comparación con expectativas pedagógicas
       - Identificación de tendencias emergentes
    
    3. INTERPRETACIÓN PEDAGÓGICA
       - Factores educativos que influyen en estos resultados
       - Contexto del sistema educativo guatemalteco
       - Relación con el perfil del estudiante promedio
       - Impacto del calendario académico
       - Consideraciones culturales y socioeconómicas
    
    4. INSIGHTS EDUCATIVOS
       - Oportunidades para mejorar el acompañamiento vocacional
       - Áreas que requieren atención del orientador
       - Fortalezas del proceso actual de orientación
       - Gaps en el acompañamiento a los estudiantes
       - Necesidades específicas detectadas
    
    5. RECOMENDACIONES PEDAGÓGICAS PRIORIZADAS
       Proporciona 5-7 recomendaciones específicas para docentes/orientadores. Para CADA una incluye:
       
       - Acción pedagógica específica a tomar
       - Impacto esperado en los estudiantes
       - Recursos educativos necesarios
       - Timeline sugerido
       - Métricas para medir el éxito
       - Orden de prioridad
    
    6. PROYECCIONES Y ESCENARIOS EDUCATIVOS
       - Proyección para el próximo mes/trimestre
       - Escenario optimista con mejoras implementadas
       - Escenario realista sin cambios
       - Factores educativos a monitorear
       - Eventos académicos relevantes (exámenes, ferias vocacionales, etc.)
    
    El análisis debe ser profesional, orientado a la práctica docente y enfocado en el beneficio estudiantil.
    `}
    
    RESPONDE ÚNICAMENTE en formato JSON válido con esta estructura:
    {
      "tipoGrafica": "${graphData.tipo}",
      "resumenEjecutivo": "Resumen de 2-3 líneas para el docente/orientador",
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
          "explicacion": "Por qué es importante para la orientación vocacional"
        }
      ],
      "recomendaciones": [
        {
          "accion": "Acción pedagógica específica recomendada",
          "prioridad": "alta|media|baja",
          "justificacion": "Por qué es importante con datos"
        }
      ]
    }
    
    REQUISITOS CRÍTICOS:
    - Usa ÚNICAMENTE los datos proporcionados
    - Enfoque pedagógico y de orientación vocacional
    - Español profesional de Guatemala
    - Insights accionables para docentes/orientadores
    - Basado en el contexto educativo guatemalteco
    - Lenguaje apropiado para educadores
    `;

    console.log("Generando análisis con IA (Docente)...");

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const analysis = JSON.parse(text);
      
      console.log("Análisis generado exitosamente (Docente)");
      
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
      console.error("Error parsing JSON:", parseError);
      console.error("Raw text:", text.substring(0, 500));
      res.status(500).json({
        success: false,
        message: "Error al procesar el análisis con IA",
        error: parseError.message
      });
    }

  } catch (error) {
    console.error("Error generando análisis:", error);
    
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