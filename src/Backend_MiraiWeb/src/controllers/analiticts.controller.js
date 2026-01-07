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

// Función para obtener datos del dashboard de PostHog
const getPostHogDashboardData = async () => {
  try {
    const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY;
    const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID;

    if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID) {
      console.error("Faltan credenciales de PostHog en .env");
      return null;
    }

    console.log("Intentando conectar con PostHog...");
    console.log("Project ID:", POSTHOG_PROJECT_ID);

    const headers = {
      'Authorization': `Bearer ${POSTHOG_API_KEY}`,
      'Content-Type': 'application/json'
    };

    // Primero, obtener todos los dashboards
    const dashboardResponse = await axios.get(
      `https://us.posthog.com/api/projects/${POSTHOG_PROJECT_ID}/dashboards`,
      { headers }
    );

    console.log("✅ Dashboards encontrados:", dashboardResponse.data.results.length);

    // Buscar el dashboard "AnaliticasAdmin" (sin tilde)
    const adminDashboard = dashboardResponse.data.results.find(
      dashboard => dashboard.name === 'AnaliticasAdmin' || dashboard.name === 'AnalíticasAdmin'
    );

    if (!adminDashboard) {
      console.log("📋 Dashboards disponibles:", dashboardResponse.data.results.map(d => d.name));
      console.error("❌ Dashboard 'AnaliticasAdmin' no encontrado");
      
      // Usar el primer dashboard disponible como fallback
      const fallbackDashboard = dashboardResponse.data.results[0];
      if (!fallbackDashboard) {
        console.error("❌ No hay dashboards disponibles");
        return null;
      }
      
      console.log("⚠️ Usando dashboard fallback:", fallbackDashboard.name);
      
      // Obtener los insights del dashboard fallback
      const dashboardDetail = await axios.get(
        `https://us.posthog.com/api/projects/${POSTHOG_PROJECT_ID}/dashboards/${fallbackDashboard.id}`,
        { headers }
      );

      console.log("📊 Tiles en dashboard fallback:", dashboardDetail.data.tiles?.length || 0);
      
      return await processInsights(dashboardDetail.data.tiles, headers, POSTHOG_PROJECT_ID);
    }

    console.log("✅ Dashboard encontrado:", adminDashboard.name);

    // Obtener detalles completos del dashboard
    const dashboardDetail = await axios.get(
      `https://us.posthog.com/api/projects/${POSTHOG_PROJECT_ID}/dashboards/${adminDashboard.id}`,
      { headers }
    );

    console.log("📊 Tiles en dashboard:", dashboardDetail.data.tiles?.length || 0);
    
    // Log de los primeros tiles para debugging
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
        // El insight puede venir como ID o como short_id
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

// Función para preparar datos según el tipo de gráfica
const prepareGraphData = async (graphType, dbAnalytics = null) => {
  const guatemalaDate = getGuatemalaDate();

  switch (graphType) {
    case 'estudiantes-registrados':
      if (!dbAnalytics) {
        console.log("No hay datos de analytics para estudiantes-registrados");
        return null;
      }
      
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                         'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      
      const registrosPorMes = Object.entries(dbAnalytics.studentsJoinedByMonth).map(([mes, cantidad]) => ({
        mes: monthNames[parseInt(mes) - 1],
        cantidad: cantidad
      }));

      const totalRegistros = Object.values(dbAnalytics.studentsJoinedByMonth).reduce((a, b) => a + b, 0);
      const promedioMensual = totalRegistros / Object.keys(dbAnalytics.studentsJoinedByMonth).length;
      
      const mesConMasRegistros = Object.entries(dbAnalytics.studentsJoinedByMonth)
        .reduce((max, [mes, cantidad]) => 
          cantidad > max.cantidad ? { mes: monthNames[parseInt(mes) - 1], cantidad } : max, 
          { mes: '', cantidad: 0 }
        );

      return {
        tipo: 'Estudiantes Registrados por Mes',
        descripcion: 'Evolución mensual de nuevos estudiantes que se registran en la plataforma Mirai',
        periodo: `Año ${guatemalaDate.year}`,
        datos: {
          totalEstudiantes: dbAnalytics.totalStudents,
          registrosPorMes: registrosPorMes,
          totalRegistrosAnuales: totalRegistros,
          promedioMensual: Math.round(promedioMensual),
          mesConMasRegistros: mesConMasRegistros,
          mesActual: guatemalaDate.month,
          tendencia: calcularTendencia(Object.values(dbAnalytics.studentsJoinedByMonth))
        },
        fuente: 'Base de Datos Mirai'
      };

    case 'tasa-finalizacion-quiz':
      console.log("Obteniendo datos de PostHog para tasa-finalizacion-quiz");
      const postHogData = await getPostHogDashboardData();
      
      if (!postHogData || postHogData.length === 0) {
        console.log("No hay datos de PostHog disponibles");
        return {
          tipo: 'Tasa de Finalización del Quiz Vocacional',
          descripcion: 'Embudo que muestra cuántos usuarios inician vs cuántos completan el quiz vocacional',
          periodo: 'Últimos 7 días',
          datos: {
            mensaje: 'Conectando con PostHog...',
            usuariosIniciaron: 1,
            usuariosCompletaron: 1,
            tasaFinalizacion: '100%',
            nota: 'Datos de ejemplo mientras se establece conexión con PostHog'
          },
          fuente: 'PostHog Analytics'
        };
      }

      // Buscar el insight del funnel
      const funnelInsight = postHogData.find(insight => 
        insight.name?.toLowerCase().includes('tasa') || 
        insight.name?.toLowerCase().includes('finalización') ||
        insight.name?.toLowerCase().includes('quiz') ||
        insight.name?.toLowerCase().includes('funnel')
      );

      if (!funnelInsight) {
        console.log("Insights disponibles:", postHogData.map(i => i.name));
        
        return {
          tipo: 'Tasa de Finalización del Quiz Vocacional',
          descripcion: 'Embudo que muestra cuántos usuarios inician vs cuántos completan el quiz vocacional',
          periodo: 'Últimos 7 días',
          datos: {
            insightsDisponibles: postHogData.map(i => i.name),
            mensaje: 'Dashboard encontrado pero sin el insight específico del funnel'
          },
          fuente: 'PostHog Analytics'
        };
      }

      return {
        tipo: 'Tasa de Finalización del Quiz Vocacional',
        descripcion: 'Embudo que muestra cuántos usuarios inician vs cuántos completan el quiz vocacional',
        periodo: 'Últimos 7 días',
        datos: funnelInsight.result || funnelInsight.filters,
        nombre: funnelInsight.name,
        fuente: 'PostHog Analytics'
      };

    case 'tiempo-promedio-chat':
      console.log("Obteniendo datos de PostHog para tiempo-promedio-chat");
      const postHogDataChat = await getPostHogDashboardData();
      
      if (!postHogDataChat || postHogDataChat.length === 0) {
        return {
          tipo: 'Tiempo Promedio en Pantalla de Chat',
          descripcion: 'Análisis del tiempo que los usuarios pasan en la pantalla del chat por visita',
          periodo: 'Últimos 30 días',
          datos: {
            mensaje: 'Conectando con PostHog...',
            tiempoPromedio: '37.44 segundos',
            nota: 'Datos de ejemplo mientras se establece conexión con PostHog'
          },
          fuente: 'PostHog Analytics'
        };
      }

      const chatInsight = postHogDataChat.find(insight => 
        insight.name?.toLowerCase().includes('tiempo') && 
        insight.name?.toLowerCase().includes('chat')
      );

      if (!chatInsight) {
        return {
          tipo: 'Tiempo Promedio en Pantalla de Chat',
          descripcion: 'Análisis del tiempo que los usuarios pasan en la pantalla del chat por visita',
          periodo: 'Últimos 30 días',
          datos: {
            insightsDisponibles: postHogDataChat.map(i => i.name),
            mensaje: 'Dashboard encontrado pero sin el insight específico del chat'
          },
          fuente: 'PostHog Analytics'
        };
      }

      return {
        tipo: 'Tiempo Promedio en Pantalla de Chat',
        descripcion: 'Análisis del tiempo que los usuarios pasan en la pantalla del chat por visita',
        periodo: 'Últimos 30 días',
        datos: chatInsight.result || chatInsight.filters,
        nombre: chatInsight.name,
        fuente: 'PostHog Analytics'
      };

    case 'tiempo-promedio-pantallas':
      console.log("Obteniendo datos de PostHog para tiempo-promedio-pantallas");
      const postHogDataPantallas = await getPostHogDashboardData();
      
      if (!postHogDataPantallas || postHogDataPantallas.length === 0) {
        return {
          tipo: 'Tiempo Promedio en las Pantallas',
          descripcion: 'Análisis del tiempo promedio que los usuarios pasan en cada pantalla de la aplicación',
          periodo: 'Todo el tiempo',
          datos: {
            mensaje: 'Conectando con PostHog...',
            nota: 'Datos de ejemplo mientras se establece conexión con PostHog'
          },
          fuente: 'PostHog Analytics'
        };
      }

      // Búsqueda más flexible y detallada
      console.log("Buscando insight de 'Tiempo promedio en las pantallas'...");
      console.log("Insights disponibles:", postHogDataPantallas.map(i => ({
        name: i.name,
        id: i.id
      })));

      const pantallasInsight = postHogDataPantallas.find(insight => {
        const nombreLower = insight.name?.toLowerCase() || '';
        
        // Buscar variaciones del nombre
        const esTiempoPantallas = 
          (nombreLower.includes('tiempo') && nombreLower.includes('pantallas')) ||
          (nombreLower.includes('tiempo') && nombreLower.includes('pantalla')) ||
          (nombreLower.includes('time') && nombreLower.includes('screen')) ||
          nombreLower.includes('tiempo promedio en las pantallas') ||
          nombreLower === 'tiempo promedio en las pantallas';
        
        if (esTiempoPantallas) {
          console.log(`✅ Insight encontrado: "${insight.name}"`);
        }
        
        return esTiempoPantallas;
      });

      if (!pantallasInsight) {
        console.log("❌ No se encontró el insight de 'Tiempo promedio en las pantallas'");
        console.log("Nombres exactos de los insights:");
        postHogDataPantallas.forEach(i => console.log(`  - "${i.name}"`));
        
        return {
          tipo: 'Tiempo Promedio en las Pantallas',
          descripcion: 'Análisis del tiempo promedio que los usuarios pasan en cada pantalla de la aplicación',
          periodo: 'Todo el tiempo',
          datos: {
            insightsDisponibles: postHogDataPantallas.map(i => i.name),
            mensaje: 'Dashboard encontrado pero sin el insight específico de pantallas',
            nota: 'Revisa que el insight en PostHog se llame exactamente "Tiempo promedio en las pantallas"'
          },
          fuente: 'PostHog Analytics'
        };
      }

      console.log("✅ Datos del insight encontrados:", {
        name: pantallasInsight.name,
        hasResult: !!pantallasInsight.result,
        hasFilters: !!pantallasInsight.filters
      });

      return {
        tipo: 'Tiempo Promedio en las Pantallas',
        descripcion: 'Análisis del tiempo promedio que los usuarios pasan en cada pantalla de la aplicación',
        periodo: 'Todo el tiempo',
        datos: pantallasInsight.result || pantallasInsight.filters,
        nombre: pantallasInsight.name,
        fuente: 'PostHog Analytics'
      };

    case 'tiempo-promedio-estudiantes-activos':
      console.log("Obteniendo datos de PostHog para tiempo-promedio-estudiantes-activos");
      const postHogDataActivos = await getPostHogDashboardData();
      
      if (!postHogDataActivos || postHogDataActivos.length === 0) {
        return {
          tipo: 'Tiempo Promedio de Estudiantes Activos en la App',
          descripcion: 'Análisis del tiempo promedio que los estudiantes activos pasan en la aplicación móvil',
          periodo: 'Últimos 30 días',
          datos: {
            mensaje: 'Conectando con PostHog...',
            nota: 'Datos de ejemplo mientras se establece conexión con PostHog'
          },
          fuente: 'PostHog Analytics'
        };
      }

      console.log("Buscando insight de 'Tiempo promedio de estudiantes activos'...");
      console.log("Insights disponibles:", postHogDataActivos.map(i => ({
        name: i.name,
        id: i.id
      })));

      const activosInsight = postHogDataActivos.find(insight => {
        const nombreLower = insight.name?.toLowerCase() || '';
        
        const esTiempoActivos = 
          (nombreLower.includes('tiempo') && nombreLower.includes('activos')) ||
          (nombreLower.includes('tiempo') && nombreLower.includes('estudiantes')) ||
          (nombreLower.includes('active') && nombreLower.includes('time')) ||
          (nombreLower.includes('tiempo') && nombreLower.includes('app')) ||
          nombreLower.includes('tiempo promedio de estudiantes activos');
        
        if (esTiempoActivos) {
          console.log(`✅ Insight encontrado: "${insight.name}"`);
        }
        
        return esTiempoActivos;
      });

      if (!activosInsight) {
        console.log("❌ No se encontró el insight de 'Tiempo promedio de estudiantes activos'");
        console.log("Nombres exactos de los insights:");
        postHogDataActivos.forEach(i => console.log(`  - "${i.name}"`));
        
        return {
          tipo: 'Tiempo Promedio de Estudiantes Activos en la App',
          descripcion: 'Análisis del tiempo promedio que los estudiantes activos pasan en la aplicación móvil',
          periodo: 'Últimos 30 días',
          datos: {
            insightsDisponibles: postHogDataActivos.map(i => i.name),
            mensaje: 'Dashboard encontrado pero sin el insight específico de estudiantes activos',
            nota: 'Revisa que el insight en PostHog se llame "Tiempo promedio de estudiantes activos"'
          },
          fuente: 'PostHog Analytics'
        };
      }

      console.log("✅ Datos del insight encontrados:", {
        name: activosInsight.name,
        hasResult: !!activosInsight.result,
        hasFilters: !!activosInsight.filters
      });

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

// Función auxiliar para calcular tendencia
const calcularTendencia = (valores) => {
  if (valores.length < 2) return 'Sin datos suficientes';
  
  const ultimosMeses = valores.slice(-3);
  const promedio = ultimosMeses.reduce((a, b) => a + b, 0) / ultimosMeses.length;
  const ultimoMes = valores[valores.length - 1];
  
  if (ultimoMes > promedio * 1.1) return 'al alza';
  if (ultimoMes < promedio * 0.9) return 'a la baja';
  return 'estable';
};

// Endpoint principal para análisis con IA
export const analyzeGraphWithAI = async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "API key de Gemini no configurada"
      });
    }

    const { graphType, level, analyticsData } = req.body;
    
    if (!graphType || !level) {
      return res.status(400).json({
        success: false,
        message: "Faltan parámetros requeridos (graphType, level)"
      });
    }

    console.log(`Analizando gráfica: ${graphType} - Nivel: ${level}`);

    const guatemalaDate = getGuatemalaDate();
    
    // Preparar datos de la gráfica
    const graphData = await prepareGraphData(graphType, analyticsData);
    
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
    Actúa como un analista de datos experto especializado en educación y tecnología educativa en Guatemala.
    
    FECHA ACTUAL: ${guatemalaDate.fullDate}
    UBICACIÓN: Guatemala
    TIPO DE ANÁLISIS: ${analysisType}
    PLATAFORMA: Mirai - Plataforma de Orientación Vocacional
    
    GRÁFICA PARA ANALIZAR:
    ${JSON.stringify(graphData, null, 2)}
    
    ${level === 'general' ? `
    ANÁLISIS GENERAL (150-250 palabras):
    
    Proporciona un análisis conciso y claro que incluya:
    
    1. ¿QUÉ MUESTRA ESTA GRÁFICA?
       - Explicación simple y directa de lo que representa
       - Cuál es el propósito de esta métrica en Mirai
    
    2. HALLAZGOS PRINCIPALES
       - 2-3 observaciones clave sobre los datos mostrados
       - Números o porcentajes destacables
       - Tendencia principal identificada
    
    3. SIGNIFICADO PARA LA PLATAFORMA
       - Por qué es importante esta información para Mirai
       - Qué nos dice sobre el comportamiento de los estudiantes
       - Impacto en la experiencia del usuario
    
    4. RECOMENDACIÓN RÁPIDA
       - Una acción concreta y específica que se puede tomar
       - Prioridad de implementación (alta/media/baja)
       - Beneficio esperado
    
    El análisis debe ser directo, profesional, usar números específicos y enfocarse en insights accionables.
    ` : `
    ANÁLISIS PROFUNDO (500-700 palabras):
    
    Proporciona un análisis exhaustivo y detallado que incluya:
    
    1. DESCRIPCIÓN DETALLADA DE LA MÉTRICA
       - Qué representa exactamente esta gráfica en el contexto de Mirai
       - Qué datos específicos está midiendo
       - Metodología de recolección (PostHog/Base de Datos)
       - Por qué esta métrica es crítica para una plataforma de orientación vocacional
       - Cómo se relaciona con el journey del estudiante
    
    2. ANÁLISIS PROFUNDO DE DATOS
       - Desglose detallado de todos los números presentados
       - Identificación de patrones, tendencias y correlaciones
       - Análisis comparativo entre períodos (si hay datos)
       - Identificación de anomalías, picos o caídas
       - Análisis de la distribución de los datos
       - Cálculo de métricas derivadas importantes
    
    3. INTERPRETACIÓN CONTEXTUAL
       - Factores que pueden estar influyendo en estos resultados
       - Contexto del calendario académico guatemalteco
       - Estacionalidad o patrones temporales detectados
       - Comportamiento típico de estudiantes guatemaltecos
       - Comparación con benchmarks del sector educativo
       - Impacto de eventos externos (inicio de clases, exámenes, etc.)
    
    4. INSIGHTS ESTRATÉGICOS PROFUNDOS
       - Oportunidades específicas de crecimiento identificadas
       - Áreas de riesgo o preocupación con análisis detallado
       - Fortalezas del sistema actual con evidencia
       - Debilidades críticas que requieren atención inmediata
       - Ventajas competitivas detectadas vs otras plataformas
       - Gaps en la experiencia del usuario
    
    5. ANÁLISIS DEL CONTEXTO GUATEMALTECO
       - Cómo estos datos reflejan el mercado educativo de Guatemala
       - Factores culturales, sociales o económicos que influyen
       - Comparación con estándares educativos en Guatemala
       - Oportunidades específicas del mercado guatemalteco
       - Desafíos particulares del contexto local
       - Adaptaciones necesarias para el mercado guatemalteco
    
    6. RECOMENDACIONES ACCIONABLES PRIORIZADAS
       Proporciona 5-7 recomendaciones específicas. Para CADA recomendación incluye:
       
       - Acción específica y detallada a tomar
       - Impacto esperado (alto/medio/bajo) con justificación
       - Dificultad de implementación (alta/media/baja)
       - Timeline sugerido (inmediato: <1 semana / corto plazo: 1-4 semanas / mediano plazo: 1-3 meses)
       - Recursos necesarios (técnicos, humanos, financieros)
       - KPIs específicos para medir el éxito de la implementación
       - Riesgos de no implementar
       - Orden de prioridad (1-7)
    
    7. PROYECCIONES Y ESCENARIOS FUTUROS
       - Proyección detallada para el próximo mes basada en datos históricos
       - Proyección para el próximo trimestre con rangos probabilísticos
       - Escenario optimista: qué pasaría si se implementan mejoras (con números proyectados)
       - Escenario realista: proyección más probable sin cambios mayores
       - Escenario pesimista: qué podría salir mal y su impacto
       - Factores críticos que podrían cambiar estas proyecciones
       - Eventos externos a monitorear (calendario académico, vacaciones, etc.)
    
    8. INDICADORES DE ÉXITO Y MONITOREO
       Para cada métrica clave define:
       - Nombre de la métrica específica
       - Valor actual con contexto
       - Valor objetivo realista a corto, mediano y largo plazo
       - Frecuencia de monitoreo recomendada
       - Alertas a configurar (umbrales críticos)
       - Dashboard sugerido para seguimiento
    
    9. CONCLUSIONES Y SIGUIENTES PASOS
       - Resumen ejecutivo de los hallazgos más importantes
       - Acción inmediata más crítica a tomar HOY
       - Roadmap sugerido para los próximos 3 meses
       - Recursos adicionales que se necesitan
    
    El análisis debe ser:
    - Profesional y basado en datos reales
    - Específico para Mirai y el mercado guatemalteco
    - Orientado a decisiones estratégicas accionables
    - Respaldado con números y porcentajes cuando sea posible
    - Claro en prioridades y timelines
    `}
    
    RESPONDE ÚNICAMENTE en formato JSON válido con esta estructura:
    {
      "tipoGrafica": "${graphData.tipo}",
      "resumenEjecutivo": "Resumen de 2-3 líneas sobre lo más importante de esta gráfica",
      "analisisCompleto": "Texto completo del análisis en español. Usa \\n\\n para separar párrafos. Incluye números específicos de los datos.",
      "puntosClave": [
        "Punto clave 1 con datos numéricos específicos",
        "Punto clave 2 con datos numéricos específicos",
        "Punto clave 3 con datos numéricos específicos"
        ${level === 'profundo' ? ',"Punto clave 4 con datos","Punto clave 5 con datos"' : ''}
      ],
      "hallazgosImportantes": [
        {
          "hallazgo": "Descripción específica del hallazgo con datos",
          "impacto": "alto|medio|bajo",
          "dato": "Número o porcentaje específico del hallazgo",
          "explicacion": "Por qué es importante este hallazgo"
        }
      ],
      "recomendaciones": [
        {
          "accion": "Descripción clara y específica de la acción recomendada",
          "prioridad": "alta|media|baja",
          ${level === 'profundo' ? `
          "orden": 1,
          "impactoEsperado": "alto|medio|bajo",
          "dificultad": "alta|media|baja",
          "timeline": "inmediato|corto plazo|mediano plazo",
          "recursos": "Descripción de recursos necesarios",
          "kpis": ["KPI 1 para medir éxito", "KPI 2"],
          ` : ''}
          "justificacion": "Por qué es importante esta acción con datos de soporte"
        }
      ],
      ${level === 'profundo' ? `
      "metricas": {
        "tendenciaGeneral": "al alza|estable|a la baja",
        "velocidadCambio": "rápida|moderada|lenta",
        "nivelImportancia": "crítico|alto|medio|bajo",
        "indicadorSalud": "excelente|bueno|regular|preocupante|crítico",
        "areasDeMejora": ["área específica 1 con detalle", "área 2", "área 3"],
        "fortalezas": ["fortaleza 1 con evidencia", "fortaleza 2"],
        "oportunidades": ["oportunidad 1 específica", "oportunidad 2"],
        "riesgos": ["riesgo 1 identificado", "riesgo 2"]
      },
      "proyecciones": {
        "proximoMes": "Proyección numérica detallada con rango (ej: 150-180 estudiantes)",
        "proximoTrimestre": "Proyección para trimestre con justificación",
        "escenarioOptimista": {
          "descripcion": "Mejor escenario posible",
          "proyeccion": "Números proyectados",
          "probabilidad": "alta|media|baja",
          "condiciones": "Qué debe pasar para este escenario"
        },
        "escenarioRealista": {
          "descripcion": "Escenario más probable",
          "proyeccion": "Números proyectados",
          "probabilidad": "alta|media|baja"
        },
        "escenarioPesimista": {
          "descripcion": "Peor escenario",
          "proyeccion": "Números proyectados",
          "probabilidad": "alta|media|baja",
          "mitigacion": "Cómo evitar este escenario"
        },
        "factoresACuidar": [
          "Factor crítico 1 a monitorear",
          "Factor 2 que puede cambiar proyecciones"
        ]
      },
      "indicadoresExito": [
        {
          "metrica": "Nombre específico de la métrica",
          "valorActual": "Valor actual con unidad",
          "valorObjetivoCorto": "Objetivo 1 mes",
          "valorObjetivoMedio": "Objetivo 3 meses",
          "valorObjetivoLargo": "Objetivo 6 meses",
          "frecuenciaMonitoreo": "diaria|semanal|quincenal|mensual",
          "umbralAlerta": "Valor que dispara alerta"
        }
      ],
      "siguientesPasos": {
        "accionInmediata": "Acción más crítica a tomar HOY",
        "semana1": "Qué hacer en la primera semana",
        "mes1": "Plan para el primer mes",
        "trimestre1": "Roadmap del primer trimestre"
      }
      ` : ''}
    }
    
    REQUISITOS CRÍTICOS:
    - NO inventes datos. Usa ÚNICAMENTE los datos proporcionados en graphData
    - Si faltan datos, indícalo explícitamente pero proporciona análisis con lo disponible
    - Todos los números deben venir de los datos reales proporcionados
    - El análisis debe ser en español profesional de Guatemala
    - Enfócate en Mirai como plataforma de orientación vocacional
    - Proporciona insights accionables y específicos
    - Usa el contexto del sistema educativo guatemalteco
    - Para análisis profundo, sé exhaustivo pero mantén claridad y estructura
    `;

    console.log("Generando análisis con IA...");

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Limpiar la respuesta
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const analysis = JSON.parse(text);
      
      console.log("Análisis generado exitosamente");
      
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
        error: parseError.message,
        hint: "El modelo de IA no devolvió un JSON válido. Revisa los logs del servidor."
      });
    }

  } catch (error) {
    console.error("Error generando análisis:", error);
    
    if (error.message?.includes("API key not valid")) {
      return res.status(401).json({
        success: false,
        message: "API key de Gemini no válida. Verifica tu configuración."
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
};