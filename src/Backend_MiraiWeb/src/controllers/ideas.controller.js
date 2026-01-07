import { GoogleGenerativeAI } from "@google/generative-ai";

// Backend - generateIdeas function actualizada
export const generateIdeas = async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: "API key de Gemini no configurada"
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const { carrera, palabrasClave } = req.body;

    // Validar datos de entrada
    if (!carrera) {
      return res.status(400).json({
        ok: false,
        error: "La carrera es requerida"
      });
    }

    if (!palabrasClave || !Array.isArray(palabrasClave) || palabrasClave.length !== 3) {
      return res.status(400).json({
        ok: false,
        error: "Se requieren exactamente 3 palabras clave"
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
        Genera exactamente 3 ideas de foros para estudiantes de la carrera de ${carrera}.
        
        Las ideas deben estar relacionadas con estos conceptos clave: "${palabrasClave.join(', ')}"
        
        Cada foro debe incorporar de manera creativa y académica estos conceptos, relacionándolos específicamente con la carrera de ${carrera}.

        Para cada idea, proporciona:
        - Un título creativo y llamativo que incluya sutilmente los conceptos clave
        - Una descripción detallada del tema del foro que explique cómo se relacionan los conceptos con la carrera

        Formato de respuesta requerido (JSON):
        [
        {
            "titulo": "Título del foro 1",
            "descripcion": "Descripción detallada del foro 1 que incorpore los conceptos clave..."
        },
        {
            "titulo": "Título del foro 2", 
            "descripcion": "Descripción detallada del foro 2 que incorpore los conceptos clave..."
        },
        {
            "titulo": "Título del foro 3",
            "descripcion": "Descripción detallada del foro 3 que incorpore los conceptos clave..."
        }
        ]

        Responde ÚNICAMENTE con el JSON válido, sin texto adicional.
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const ideas = JSON.parse(text);
      
      res.json({
        ok: true,
        ideas: ideas,
        carrera: carrera,
        palabrasClave: palabrasClave
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
    console.error("❌ Error generando ideas:", error);
    
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