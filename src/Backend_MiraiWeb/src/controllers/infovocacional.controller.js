import { GoogleGenerativeAI } from "@google/generative-ai";

// Analizar carrera y generar recomendaciones para gestores
export const analyzeCareer = async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: "API key de Gemini no configurada"
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const { careerData } = req.body;

    // Validar datos de entrada
    if (!careerData || !careerData.nombre_carrera) {
      return res.status(400).json({
        ok: false,
        error: "Datos de la carrera son requeridos"
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
        Como experto en educación superior y gestión académica, analiza la siguiente carrera universitaria y proporciona recomendaciones estratégicas para su mejora y optimización.

        INFORMACIÓN DE LA CARRERA:
        - Nombre: ${careerData.nombre_carrera}
        - Facultad: ${careerData.facultad}
        - Duración: ${careerData.duracion} años
        - Empleabilidad: ${careerData.empleabilidad}
        - Rango Salarial: $${careerData.salario_minimo} - $${careerData.salario_maximo} ${careerData.moneda_salario}
        - Descripción: ${careerData.descripcion}
        - Competencias: ${careerData.competencias_desarrolladas?.join(', ') || 'No especificadas'}
        - Tags de habilidades: ${careerData.tags?.map(tag => `${tag.name} (${Math.round(tag.score * 100)}%)`).join(', ') || 'No especificados'}

        Proporciona un análisis completo en las siguientes categorías:

        1. **FORTALEZAS IDENTIFICADAS**: Puntos fuertes de la carrera
        2. **ÁREAS DE MEJORA**: Aspectos que necesitan atención
        3. **RECOMENDACIONES ESTRATÉGICAS**: Acciones concretas para mejorar
        4. **TENDENCIAS DEL MERCADO**: Cómo alinear la carrera con demandas actuales
        5. **OPORTUNIDADES DE CRECIMIENTO**: Nuevas especialidades o enfoques

        Formato de respuesta requerido (JSON):
        {
            "fortalezas": [
                "Fortaleza 1 con explicación detallada",
                "Fortaleza 2 con explicación detallada"
            ],
            "areas_mejora": [
                "Área de mejora 1 con explicación",
                "Área de mejora 2 con explicación"
            ],
            "recomendaciones": [
                {
                    "categoria": "Categoría de la recomendación",
                    "titulo": "Título de la recomendación",
                    "descripcion": "Descripción detallada de la acción",
                    "prioridad": "Alta/Media/Baja",
                    "impacto_esperado": "Descripción del impacto"
                }
            ],
            "tendencias_mercado": [
                "Tendencia 1 relevante para la carrera",
                "Tendencia 2 relevante para la carrera"
            ],
            "oportunidades_crecimiento": [
                "Oportunidad 1 de expansión o mejora",
                "Oportunidad 2 de expansión o mejora"
            ]
        }

        Responde ÚNICAMENTE con el JSON válido, sin texto adicional.
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const analysis = JSON.parse(text);
      
      res.json({
        ok: true,
        analysis: analysis,
        carrera: careerData.nombre_carrera,
        fecha_analisis: new Date().toISOString()
      });
    } catch (parseError) {
      console.error("❌ Error parseando JSON:", parseError);
      res.status(500).json({
        ok: false,
        error: "Error procesando la respuesta de la IA",
        rawText: text
      });
    }

  } catch (error) {
    console.error("❌ Error analizando carrera:", error);
    
    if (error.message.includes("API key not valid")) {
      return res.status(401).json({
        ok: false,
        error: "API key de Gemini no válida. Verifica tu configuración."
      });
    }

    res.status(500).json({
      ok: false,
      error: "Error interno del servidor"
    });
  }
};

// Generar contenido académico para materias
export const generateAcademicContent = async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: "API key de Gemini no configurada"
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const { materia, carrera, semestre, tipo_contenido } = req.body;

    // Validar datos de entrada
    if (!materia || !carrera || !tipo_contenido) {
      return res.status(400).json({
        ok: false,
        error: "Materia, carrera y tipo de contenido son requeridos"
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
        Como experto en diseño curricular y pedagogía universitaria, genera contenido académico para la siguiente materia:

        INFORMACIÓN:
        - Materia: ${materia}
        - Carrera: ${carrera}
        - Semestre: ${semestre || 'No especificado'}
        - Tipo de contenido: ${tipo_contenido}

        Genera contenido según el tipo solicitado:

        ${tipo_contenido === 'syllabus' ? `
        Para SYLLABUS, incluye:
        - Descripción de la materia
        - Objetivos generales y específicos
        - Contenido temático (mínimo 8 temas)
        - Metodología de enseñanza
        - Sistema de evaluación
        - Bibliografía recomendada
        ` : ''}

        ${tipo_contenido === 'proyecto' ? `
        Para PROYECTO ACADÉMICO, incluye:
        - Título del proyecto
        - Objetivos del proyecto
        - Metodología a seguir
        - Entregables esperados
        - Cronograma de actividades
        - Criterios de evaluación
        ` : ''}

        ${tipo_contenido === 'competencias' ? `
        Para COMPETENCIAS, incluye:
        - Competencias generales a desarrollar
        - Competencias específicas de la materia
        - Habilidades transversales
        - Conocimientos técnicos esperados
        - Actitudes y valores a fomentar
        ` : ''}

        Formato de respuesta requerido (JSON):
        {
            "titulo": "Título del contenido generado",
            "materia": "${materia}",
            "tipo": "${tipo_contenido}",
            "contenido": {
                // Estructura específica según el tipo de contenido
            },
            "recomendaciones_implementacion": [
                "Recomendación 1 para implementar",
                "Recomendación 2 para implementar"
            ]
        }

        Responde ÚNICAMENTE con el JSON válido, sin texto adicional.
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const content = JSON.parse(text);
      
      res.json({
        ok: true,
        content: content,
        fecha_generacion: new Date().toISOString()
      });
    } catch (parseError) {
      console.error("❌ Error parseando JSON:", parseError);
      res.status(500).json({
        ok: false,
        error: "Error procesando la respuesta de la IA",
        rawText: text
      });
    }

  } catch (error) {
    console.error("❌ Error generando contenido académico:", error);
    
    if (error.message.includes("API key not valid")) {
      return res.status(401).json({
        ok: false,
        error: "API key de Gemini no válida. Verifica tu configuración."
      });
    }

    res.status(500).json({
      ok: false,
      error: "Error interno del servidor"
    });
  }
};

// Sugerir mejoras para el plan de estudios
export const suggestCurriculumImprovements = async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: "API key de Gemini no configurada"
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const { planEstudios, nombreCarrera, empleabilidad } = req.body;

    // Validar datos de entrada
    if (!planEstudios || !nombreCarrera) {
      return res.status(400).json({
        ok: false,
        error: "Plan de estudios y nombre de carrera son requeridos"
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Convertir plan de estudios a texto legible
    const planText = Object.entries(planEstudios).map(([año, semestres]) => {
      const primerSem = semestres.primer_semestre?.map(m => m.name).join(', ') || 'No especificado';
      const segundoSem = semestres.segundo_semestre?.map(m => m.name).join(', ') || 'No especificado';
      return `${año.replace('_', ' ').toUpperCase()}:\nPrimer semestre: ${primerSem}\nSegundo semestre: ${segundoSem}`;
    }).join('\n\n');

    const prompt = `
        Como experto en diseño curricular y educación superior, analiza el siguiente plan de estudios y proporciona sugerencias de mejora basadas en tendencias actuales del mercado laboral y mejores prácticas educativas.

        CARRERA: ${nombreCarrera}
        EMPLEABILIDAD ACTUAL: ${empleabilidad || 'No especificada'}

        PLAN DE ESTUDIOS ACTUAL:
        ${planText}

        Proporciona análisis y sugerencias en las siguientes categorías:

        1. **MATERIAS FALTANTES**: Materias modernas que deberían agregarse
        2. **MATERIAS OBSOLETAS**: Materias que podrían actualizarse o eliminarse
        3. **SECUENCIA CURRICULAR**: Mejoras en el orden de las materias
        4. **COMPETENCIAS DIGITALES**: Integración de tecnologías emergentes
        5. **HABILIDADES BLANDAS**: Materias para desarrollar soft skills

        Formato de respuesta requerido (JSON):
        {
            "materias_sugeridas": [
                {
                    "nombre": "Nombre de la materia",
                    "semestre_sugerido": "Año X, Semestre Y",
                    "justificacion": "Por qué es importante agregar esta materia",
                    "competencias_desarrolladas": ["Competencia 1", "Competencia 2"]
                }
            ],
            "materias_actualizar": [
                {
                    "materia_actual": "Nombre de materia existente",
                    "propuesta_cambio": "Nombre o enfoque actualizado",
                    "razon": "Por qué necesita actualización"
                }
            ],
            "mejoras_secuencia": [
                "Sugerencia 1 para mejorar la secuencia",
                "Sugerencia 2 para mejorar la secuencia"
            ],
            "tecnologias_emergentes": [
                {
                    "tecnologia": "Nombre de la tecnología",
                    "aplicacion": "Cómo integrarla en el curriculum",
                    "materias_afectadas": ["Materia 1", "Materia 2"]
                }
            ],
            "habilidades_blandas": [
                {
                    "habilidad": "Nombre de la habilidad",
                    "forma_integracion": "Cómo integrarla en el plan",
                    "impacto_empleabilidad": "Cómo mejora la empleabilidad"
                }
            ]
        }

        Responde ÚNICAMENTE con el JSON válido, sin texto adicional.
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const suggestions = JSON.parse(text);
      
      res.json({
        ok: true,
        suggestions: suggestions,
        carrera: nombreCarrera,
        fecha_analisis: new Date().toISOString()
      });
    } catch (parseError) {
      console.error("❌ Error parseando JSON:", parseError);
      res.status(500).json({
        ok: false,
        error: "Error procesando la respuesta de la IA",
        rawText: text
      });
    }

  } catch (error) {
    console.error("❌ Error sugiriendo mejoras curriculares:", error);
    
    if (error.message.includes("API key not valid")) {
      return res.status(401).json({
        ok: false,
        error: "API key de Gemini no válida. Verifica tu configuración."
      });
    }

    res.status(500).json({
      ok: false,
      error: "Error interno del servidor"
    });
  }
};