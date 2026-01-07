import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import ideasRoutes from "./routes/ideas.routes.js";
import infovocacion from "./routes/infovocacional.routes.js"
import insightsRoutes from "./routes/insights.routes.js";
import analyticsRoutes from './routes/analitics.routes.js'; 
import chatAdminRoutes from './routes/chatadmin.routes.js';
import analyticsDirectorRoutes from './routes/analiticsdirector.router.js';
import chatDirectorRoutes from './routes/chatdirector.routes.js';
import analyticsDocenteRoutes from './routes/analiticsdocente.router.js';
import chatDocenteRoutes from './routes/chatdocente.routes.js';

dotenv.config();

// Verificar la API key después de cargar dotenv
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY no está configurada en el archivo .env");
  console.log("💡 Ve a https://aistudio.google.com/app/apikey para obtener una API key válida");
  process.exit(1);
}

console.log("✅ Variables de entorno cargadas correctamente");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Rutas
app.use("/api/ideas", ideasRoutes);
app.use("/api/infovocacional", infovocacion);
app.use("/api/insights", insightsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat-admin', chatAdminRoutes);
app.use('/api/analytics-director', analyticsDirectorRoutes);
app.use('/api/chat-director', chatDirectorRoutes);
app.use('/api/analytics-docente', analyticsDocenteRoutes);
app.use('/api/chat-docente', chatDocenteRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});