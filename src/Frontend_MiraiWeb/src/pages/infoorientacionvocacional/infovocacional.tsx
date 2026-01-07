import { 
  Container, 
  Paper, 
  Text, 
  Group, 
  Stack,
  Grid,
  Button,
  Badge,
  Avatar,
  Tabs,
  Alert,
  Loader,
  ActionIcon,
  Card,
  Breadcrumbs,
  Anchor,
  Modal,
  ScrollArea,
  Progress
} from '@mantine/core';
import { 
  IconArrowLeft,
  IconBook,
  IconSchool,
  IconAward,
  IconUsers,
  IconChevronRight,
  IconAlertTriangle,
  IconCurrencyDollar,
  IconTarget,
  IconBrain,
  IconSparkles,
  IconTrendingUp,
  IconBulb,
  IconRobot,
  IconAnalyze,
  IconCheck,
  IconAlertCircle,
  IconBookmark,
  IconDownload
} from '@tabler/icons-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useAuthenticatedFetch } from '../../hooks/useAuthenticatedFetch';
import { useState } from 'react';

import logo from '../../assets/images/logomirai.png';
import Business from '../../assets/imgcarreras/International_marketing_and_business.png'
import Alimentos from '../../assets/imgcarreras/ing_alimentos.png'
import Biomolecular from '../../assets/imgcarreras/bio_molecular.png'
import Farmaceuticos from '../../assets/imgcarreras/farmaceuticos.png'
import Mecatronica from '../../assets/imgcarreras/ing_mecatronica.png'
import Bioindustrial from '../../assets/imgcarreras/bio_industrial.png'
import Diseñoproducto from '../../assets/imgcarreras/diseño_producto.png'
import Ingadministracion from '../../assets/imgcarreras/ing_administracion.png'
import Adminempresa from '../../assets/imgcarreras/admin_empresas.png'
import Ingarquitectonica from '../../assets/imgcarreras/ing_arquitectonica.png'
import IngBiomedica from '../../assets/imgcarreras/ing_biomedica.png'
import IngMecanica from '../../assets/imgcarreras/ing_mecanica.png'
import Licarquitectura from '../../assets/imgcarreras/Lic_arquitectura.png'
import Licbioquimica from '../../assets/imgcarreras/lic_bioquimica.png'
import Licfisica from '../../assets/imgcarreras/lic_fisica.png'
import Ingelectronica from '../../assets/imgcarreras/ing_electronica.png'
import Liccomunicacion from '../../assets/imgcarreras/lic_comunicacion.png'
import Licinternacional from '../../assets/imgcarreras/lic_internacional.png'
import Liccomputacional from '../../assets/imgcarreras/lic_computacional.png'
import Ingquimica from '../../assets/imgcarreras/ing_quimica.png'
import Ingquimicaindustrial from '../../assets/imgcarreras/ing_quimicaindustrial.png'
import Licaqueologia from '../../assets/imgcarreras/lic_arqueologia.png'
import Licbiologia from '../../assets/imgcarreras/lic_biologia.png'
import Licatropologia from '../../assets/imgcarreras/lic_antropologia.png'
import Ingsistemas from '../../assets/imgcarreras/ing_sistemas.png'
import Licquimica from '../../assets/imgcarreras/lic_quimica.png'
import Ingindustrial from '../../assets/imgcarreras/ing_industrial.png'
import Licmusical from '../../assets/imgcarreras/lic_musical.png'
import Licmate from '../../assets/imgcarreras/lic_mate.png'
import Licnutricion from '../../assets/imgcarreras/lic_nutricion.png'
import Ingmecanica2 from '../../assets/imgcarreras/ing_mecanica2.png'
import Licpiscologia from '../../assets/imgcarreras/lic_psicologia.png'
import Ingcivil from '../../assets/imgcarreras/ing_civil.png'

// Interfaces para la carrera detallada
interface Subject {
  id: string;
  name: string;
}

interface Semester {
  primer_semestre: Subject[];
  segundo_semestre: Subject[];
}

interface StudyPlan {
  [key: string]: Semester; // año_1, año_2, etc.
}

interface Area {
  _id: string;
  area: string;
  descripcion: string;
}

interface Tag {
  _id: string;
  tag: string;
  name: string;
  score: number;
}

// Interfaces para Insights
interface Insight {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: 'tendencias_mercado' | 'oportunidades_laborales' | 'competencias_formacion' | 'informacion_economica' | 'modalidades_trabajo' | 'contexto_educativo';
  relevancia: 'alta' | 'media' | 'baja';
  fecha: string;
  fuente: string;
  enlace: string;
  impacto: string;
  actualidad: string;
  empresasGuatemaltecas: string[];
  contextoLocal: string;
  datosEspecificos: {
    rangos_salariales?: {
      entrada: { gtq: string; usd: string };
      intermedio: { gtq: string; usd: string };
      experimentado: { gtq: string; usd: string };
    };
    competenciasDemandadas: string[];
    certificacionesValoradas: string[];
    herramientasTrending: string[];
  };
  recomendacionesEstudiantes: string;
}

interface ResumenEjecutivo {
  tendenciaGeneral: string;
  oportunidadPrincipal: string;
  desafiosPrincipales: string[];
  recomendacionGeneral: string;
  perspectiva2025: string;
}

interface GeneratedInsights {
  insights: Insight[];
  resumenEjecutivo: ResumenEjecutivo;
}

interface ProgressStep {
  step: number;
  total: number;
  message: string;
  percentage: number;
}

interface CareerDetail {
  _id: string;
  nombre_carrera: string;
  facultad: string;
  descripcion: string;
  duracion: number;
  empleabilidad: string;
  plan_de_estudio: StudyPlan;
  areas_de_desarrollo_potencial: Area[];
  areas_de_formacion: Area[];
  perfil_del_egresado: string;
  competencias_desarrolladas: string[];
  salario_minimo: number;
  salario_maximo: number;
  moneda_salario: string;
  tags: Tag[];
  insights?: Insight[]; // Campo opcional para insights existentes
}

interface CareerDetailResponse {
  career: CareerDetail;
}

// Interfaces para IA
interface Recommendation {
  categoria: string;
  titulo: string;
  descripcion: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  impacto_esperado: string;
}

interface AIAnalysis {
  fortalezas: string[];
  areas_mejora: string[];
  recomendaciones: Recommendation[];
  tendencias_mercado: string[];
  oportunidades_crecimiento: string[];
}

interface AIAnalysisResponse {
  ok: boolean;
  analysis: AIAnalysis;
  carrera: string;
  fecha_analisis: string;
}

interface CurriculumSuggestion {
  nombre: string;
  semestre_sugerido: string;
  justificacion: string;
  competencias_desarrolladas: string[];
}

interface CurriculumUpdate {
  materia_actual: string;
  propuesta_cambio: string;
  razon: string;
}

interface Technology {
  tecnologia: string;
  aplicacion: string;
  materias_afectadas: string[];
}

interface SoftSkill {
  habilidad: string;
  forma_integracion: string;
  impacto_empleabilidad: string;
}

interface CurriculumImprovements {
  materias_sugeridas: CurriculumSuggestion[];
  materias_actualizar: CurriculumUpdate[];
  mejoras_secuencia: string[];
  tecnologias_emergentes: Technology[];
  habilidades_blandas: SoftSkill[];
}

interface CurriculumResponse {
  ok: boolean;
  suggestions: CurriculumImprovements;
  carrera: string;
  fecha_analisis: string;
}

// Mapeo de imágenes por ID de carrera
const careerImages: { [key: string]: string } = {
  '68e03f2bae67287b8834d111': Business,
  '68e03f2bae67287b8834d0ff': Alimentos,
  '68e03f2bae67287b8834d114': Biomolecular,
  '68e03f2bae67287b8834d116': Farmaceuticos,
  '68e03f2bae67287b8834d109': Mecatronica,
  '68e03f2bae67287b8834d100': Bioindustrial,
  '68e03f2bae67287b8834d11d': Diseñoproducto,
  '68e03f2bae67287b8834d102': Ingadministracion,
  '68e03f2bae67287b8834d10d': Adminempresa,
  '68e03f2bae67287b8834d101': Ingarquitectonica,
  '68e03f2bae67287b8834d0fe': IngBiomedica,
  '68e03f2bae67287b8834d10c': IngMecanica,
  '68e03f2bae67287b8834d10e': Licarquitectura,
  '68e03f2bae67287b8834d115': Licbioquimica,
  '68e03f2bae67287b8834d112': Licfisica,
  '68e03f2bae67287b8834d105': Ingelectronica,
  '68e03f2bae67287b8834d10b': Liccomunicacion,
  '68e03f2bae67287b8834d11e': Licinternacional,
  '68e03f2bae67287b8834d104': Liccomputacional,
  '68e03f2bae67287b8834d10f': Ingquimica,
  '68e03f2bae67287b8834d110': Ingquimicaindustrial,
  '68e03f2bae67287b8834d117': Licaqueologia,
  '68e03f2bae67287b8834d108': Licbiologia,
  '68e03f2bae67287b8834d118': Licatropologia,
  '68e03f2bae67287b8834d103': Ingsistemas,
  '68e03f2bae67287b8834d119': Licquimica,
  '68e03f2bae67287b8834d106': Ingindustrial,
  '68e03f2bae67287b8834d11c': Licmusical,
  '68e03f2bae67287b8834d11a': Licmate,
  '68e03f2bae67287b8834d11b': Licnutricion,
  '68e03f2bae67287b8834d10a': Ingmecanica2,
  '68e03f2bae67287b8834d113': Licpiscologia,
  '68e03f2bae67287b8834d107': Ingcivil,
};

const getCareerImage = (careerId: string): string => {
  return careerImages[careerId] || logo;
};

// Función para obtener el color de empleabilidad
const getEmployabilityColor = (empleabilidad: string): string => {
  switch (empleabilidad.toLowerCase()) {
    case 'muy alta': return 'green';
    case 'alta': return 'blue';
    case 'media': return 'orange';
    case 'baja': return 'red';
    default: return 'gray';
  }
};

// Función para obtener el color de los tags
const getTagColor = (tagName: string): string => {
  switch (tagName.toLowerCase()) {
    case 'business': return 'blue';
    case 'enterprising': return 'orange';
    case 'social': return 'pink';
    case 'english': return 'violet';
    case 'creative': return 'teal';
    case 'technical': return 'indigo';
    default: return 'gray';
  }
};

// Función para obtener el color de prioridad
const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'Alta': return 'red';
    case 'Media': return 'orange';
    case 'Baja': return 'green';
    default: return 'gray';
  }
};

// Funciones para obtener colores de insights
const getCategoryColor = (categoria: string): string => {
  switch (categoria) {
    case 'tendencias_mercado': return 'blue';
    case 'oportunidades_laborales': return 'green';
    case 'competencias_formacion': return 'purple';
    case 'informacion_economica': return 'orange';
    case 'modalidades_trabajo': return 'teal';
    case 'contexto_educativo': return 'pink';
    default: return 'gray';
  }
};

const getRelevanceColor = (relevancia: string): string => {
  switch (relevancia) {
    case 'alta': return 'red';
    case 'media': return 'orange';
    case 'baja': return 'green';
    default: return 'gray';
  }
};

export default function Infovocacional() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { authenticatedFetch } = useAuthenticatedFetch();
  
  const carreraId = searchParams.get('id');
  const type = searchParams.get('type');

  // Estados para modales de IA existentes
  const [aiAnalysisOpened, { open: openAIAnalysis, close: closeAIAnalysis }] = useDisclosure(false);
  const [curriculumAnalysisOpened, { open: openCurriculumAnalysis, close: closeCurriculumAnalysis }] = useDisclosure(false);
  
  // Estados para insights
  const [insightsModalOpened, { open: openInsightsModal, close: closeInsightsModal }] = useDisclosure(false);
  const [generatedInsights, setGeneratedInsights] = useState<GeneratedInsights | null>(null);
  const [selectedInsights, setSelectedInsights] = useState<Set<number>>(new Set());
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<ProgressStep | null>(null);
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
  
  // Estado para datos de IA existentes
  const [aiAnalysisData, setAIAnalysisData] = useState<AIAnalysis | null>(null);
  const [curriculumSuggestions, setCurriculumSuggestions] = useState<CurriculumImprovements | null>(null);

  // Estados para descargas PDF
  const [isDownloadingCareerPDF, setIsDownloadingCareerPDF] = useState(false);
  const [isDownloadingCurriculumPDF, setIsDownloadingCurriculumPDF] = useState(false);

  // Query para obtener el detalle de la carrera
  const { data: careerData, isLoading, error } = useQuery({
    queryKey: ['career-detail', carreraId],
    queryFn: async (): Promise<CareerDetailResponse> => {
      if (!carreraId) throw new Error('No hay ID de carrera proporcionado');
      
      const response = await authenticatedFetch(`https://api.miraiedu.online/careers/${carreraId}`);
      
      if (!response.ok) {
        throw new Error('Error al obtener el detalle de la carrera');
      }
      
      return response.json();
    },
    enabled: !!carreraId && type === 'carrera',
  });

  // Mutation para análisis de carrera con IA
  const analyzeCareerMutation = useMutation({
    mutationFn: async (careerData: CareerDetail): Promise<AIAnalysisResponse> => {
      const response = await fetch('http://localhost:4000/api/infovocacional/analyze-career', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ careerData }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error analizando la carrera');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setAIAnalysisData(data.analysis);
      openAIAnalysis();
      
      notifications.show({
        title: '¡Análisis IA Completado!',
        message: 'Se ha generado el análisis inteligente de la carrera.',
        color: 'green',
        icon: <IconCheck size={16} />,
        position: 'top-right',
        autoClose: 4000,
      });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Error en el Análisis IA',
        message: error.message || 'No se pudo completar el análisis.',
        color: 'red',
        icon: <IconAlertTriangle size={16} />,
        position: 'top-right',
        autoClose: 4000,
      });
    },
  });

  // Función para descargar PDF del análisis de carrera
  const downloadCareerAnalysisPDF = async () => {
    if (!aiAnalysisData || !careerData?.career) return;

    setIsDownloadingCareerPDF(true);
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = await import('html2canvas').then(m => m.default);

      const element = document.createElement('div');
      element.style.padding = '20px';
      element.style.backgroundColor = '#ffffff';
      element.style.fontSize = '12px';
      element.style.fontFamily = 'Arial, sans-serif';
      element.style.lineHeight = '1.6';
      element.style.color = '#1D1A05';

      element.innerHTML = `
        <div style="border-bottom: 3px solid #4BCDF6; padding-bottom: 20px; margin-bottom: 20px;">
          <h1 style="color: #4BCDF6; margin: 0 0 10px 0; font-size: 28px;">
            ANÁLISIS INTELIGENTE DE CARRERA
          </h1>
          <h2 style="color: #1D1A05; margin: 0 0 15px 0; font-size: 20px;">
            ${careerData.career.nombre_carrera}
          </h2>
          <p style="margin: 5px 0; color: #666;">
            <strong>Facultad:</strong> ${careerData.career.facultad}
          </p>
          <p style="margin: 5px 0; color: #666;">
            <strong>Duración:</strong> ${careerData.career.duracion} años
          </p>
          <p style="margin: 5px 0; color: #666;">
            <strong>Empleabilidad:</strong> ${careerData.career.empleabilidad}
          </p>
          <p style="margin: 5px 0; color: #666;">
            <strong>Fecha de Análisis:</strong> ${new Date().toLocaleDateString('es-GT')}
          </p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #22C55E; font-size: 16px; margin-top: 0; border-bottom: 2px solid #22C55E; padding-bottom: 10px;">
            ✅ FORTALEZAS IDENTIFICADAS
          </h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            ${aiAnalysisData.fortalezas.map(fortaleza => `
              <li style="margin: 8px 0; padding-left: 10px;">
                ${fortaleza}
              </li>
            `).join('')}
          </ul>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #F56565; font-size: 16px; margin-top: 0; border-bottom: 2px solid #F56565; padding-bottom: 10px;">
            ⚠️ ÁREAS DE MEJORA
          </h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            ${aiAnalysisData.areas_mejora.map(area => `
              <li style="margin: 8px 0; padding-left: 10px;">
                ${area}
              </li>
            `).join('')}
          </ul>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #4BCDF6; font-size: 16px; margin-top: 0; border-bottom: 2px solid #4BCDF6; padding-bottom: 10px;">
            💡 RECOMENDACIONES ESTRATÉGICAS
          </h3>
          ${aiAnalysisData.recomendaciones.map(rec => `
            <div style="background-color: #f0f9ff; padding: 12px; margin: 10px 0; border-left: 4px solid #4BCDF6; border-radius: 4px;">
              <p style="margin: 0 0 8px 0; font-weight: bold; color: #4BCDF6;">
                ${rec.titulo}
              </p>
              <p style="margin: 0 0 5px 0; font-size: 11px; color: #666;">
                <strong>Categoría:</strong> ${rec.categoria}
              </p>
              <p style="margin: 0 0 5px 0; font-size: 11px; color: #666;">
                <strong>Prioridad:</strong> ${rec.prioridad}
              </p>
              <p style="margin: 0 0 5px 0; font-size: 11px; color: #333;">
                ${rec.descripcion}
              </p>
              <p style="margin: 0; font-size: 11px; color: #0066cc;">
                <strong>Impacto esperado:</strong> ${rec.impacto_esperado}
              </p>
            </div>
          `).join('')}
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #FFAF21; font-size: 16px; margin-top: 0; border-bottom: 2px solid #FFAF21; padding-bottom: 10px;">
            📊 TENDENCIAS DEL MERCADO
          </h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            ${aiAnalysisData.tendencias_mercado.map(tendencia => `
              <li style="margin: 8px 0; padding-left: 10px;">
                ${tendencia}
              </li>
            `).join('')}
          </ul>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #9F8BEA; font-size: 16px; margin-top: 0; border-bottom: 2px solid #9F8BEA; padding-bottom: 10px;">
            🚀 OPORTUNIDADES DE CRECIMIENTO
          </h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            ${aiAnalysisData.oportunidades_crecimiento.map(oportunidad => `
              <li style="margin: 8px 0; padding-left: 10px;">
                ${oportunidad}
              </li>
            `).join('')}
          </ul>
        </div>

        <div style="border-top: 2px solid #e9ecef; padding-top: 15px; margin-top: 30px; text-align: center; font-size: 10px; color: #999;">
          <p style="margin: 0;">
            Documento generado automáticamente por Mirai - Sistema de Orientación Vocacional
          </p>
          <p style="margin: 5px 0 0 0;">
            ${new Date().toLocaleString('es-GT')}
          </p>
        </div>
      `;

      document.body.appendChild(element);

      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const pageHeight = 297;
      let heightLeft = canvas.height * imgWidth / canvas.width;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgWidth * canvas.height / canvas.width);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - canvas.height * imgWidth / canvas.width;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgWidth * canvas.height / canvas.width);
        heightLeft -= pageHeight;
      }

      pdf.save(`Analisis_Carrera_${careerData.career.nombre_carrera.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
      document.body.removeChild(element);

      const { notifications } = await import('@mantine/notifications');
      notifications.show({
        title: '✅ PDF Descargado',
        message: 'El análisis de carrera se ha descargado correctamente',
        color: 'green',
        position: 'top-right',
        autoClose: 3000
      });
    } catch (error: any) {
      console.error('Error al descargar PDF:', error);
      const { notifications } = await import('@mantine/notifications');
      notifications.show({
        title: '❌ Error al descargar',
        message: error.message || 'No se pudo descargar el PDF',
        color: 'red',
        position: 'top-right',
        autoClose: 3000
      });
    } finally {
      setIsDownloadingCareerPDF(false);
    }
  };

  // Función para descargar PDF del análisis de plan de estudios
  const downloadCurriculumAnalysisPDF = async () => {
    if (!curriculumSuggestions || !careerData?.career) return;

    setIsDownloadingCurriculumPDF(true);
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = await import('html2canvas').then(m => m.default);

      const element = document.createElement('div');
      element.style.padding = '20px';
      element.style.backgroundColor = '#ffffff';
      element.style.fontSize = '12px';
      element.style.fontFamily = 'Arial, sans-serif';
      element.style.lineHeight = '1.6';
      element.style.color = '#1D1A05';

      element.innerHTML = `
        <div style="border-bottom: 3px solid #9F8BEA; padding-bottom: 20px; margin-bottom: 20px;">
          <h1 style="color: #9F8BEA; margin: 0 0 10px 0; font-size: 28px;">
            SUGERENCIAS IA PARA PLAN DE ESTUDIOS
          </h1>
          <h2 style="color: #1D1A05; margin: 0 0 15px 0; font-size: 20px;">
            ${careerData.career.nombre_carrera}
          </h2>
          <p style="margin: 5px 0; color: #666;">
            <strong>Facultad:</strong> ${careerData.career.facultad}
          </p>
          <p style="margin: 5px 0; color: #666;">
            <strong>Duración Actual:</strong> ${careerData.career.duracion} años (${careerData.career.duracion * 2} semestres)
          </p>
          <p style="margin: 5px 0; color: #666;">
            <strong>Fecha de Análisis:</strong> ${new Date().toLocaleDateString('es-GT')}
          </p>
        </div>

        ${curriculumSuggestions.materias_sugeridas.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h3 style="color: #22C55E; font-size: 16px; margin-top: 0; border-bottom: 2px solid #22C55E; padding-bottom: 10px;">
              ➕ MATERIAS SUGERIDAS (${curriculumSuggestions.materias_sugeridas.length})
            </h3>
            ${curriculumSuggestions.materias_sugeridas.map(materia => `
              <div style="background-color: #f0fdf4; padding: 12px; margin: 10px 0; border-left: 4px solid #22C55E; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; font-weight: bold; color: #22C55E;">
                  ${materia.nombre}
                </p>
                <p style="margin: 0 0 5px 0; font-size: 11px; color: #666;">
                  <strong>Semestre Sugerido:</strong> ${materia.semestre_sugerido}
                </p>
                <p style="margin: 0 0 5px 0; font-size: 11px; color: #333;">
                  <strong>Justificación:</strong> ${materia.justificacion}
                </p>
                <p style="margin: 0; font-size: 10px; color: #666;">
                  <strong>Competencias:</strong> ${materia.competencias_desarrolladas.join(', ')}
                </p>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${curriculumSuggestions.materias_actualizar.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h3 style="color: #F59E0B; font-size: 16px; margin-top: 0; border-bottom: 2px solid #F59E0B; padding-bottom: 10px;">
              🔄 MATERIAS A ACTUALIZAR (${curriculumSuggestions.materias_actualizar.length})
            </h3>
            ${curriculumSuggestions.materias_actualizar.map(update => `
              <div style="background-color: #fffbeb; padding: 12px; margin: 10px 0; border-left: 4px solid #F59E0B; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; font-weight: bold;">
                  <span style="color: #DC2626;">❌ ${update.materia_actual}</span> 
                  <span style="margin: 0 5px;">→</span>
                  <span style="color: #16A34A;">✅ ${update.propuesta_cambio}</span>
                </p>
                <p style="margin: 0; font-size: 11px; color: #333;">
                  <strong>Razón:</strong> ${update.razon}
                </p>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${curriculumSuggestions.tecnologias_emergentes.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h3 style="color: #9333EA; font-size: 16px; margin-top: 0; border-bottom: 2px solid #9333EA; padding-bottom: 10px;">
              💻 TECNOLOGÍAS EMERGENTES (${curriculumSuggestions.tecnologias_emergentes.length})
            </h3>
            ${curriculumSuggestions.tecnologias_emergentes.map(tech => `
              <div style="background-color: #f3e8ff; padding: 12px; margin: 10px 0; border-left: 4px solid #9333EA; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; font-weight: bold; color: #9333EA;">
                  ${tech.tecnologia}
                </p>
                <p style="margin: 0 0 5px 0; font-size: 11px; color: #333;">
                  <strong>Aplicación:</strong> ${tech.aplicacion}
                </p>
                <p style="margin: 0; font-size: 10px; color: #666;">
                  <strong>Afecta a:</strong> ${tech.materias_afectadas.join(', ')}
                </p>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${curriculumSuggestions.habilidades_blandas.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h3 style="color: #FF369F; font-size: 16px; margin-top: 0; border-bottom: 2px solid #FF369F; padding-bottom: 10px;">
              👥 HABILIDADES BLANDAS (${curriculumSuggestions.habilidades_blandas.length})
            </h3>
            ${curriculumSuggestions.habilidades_blandas.map(skill => `
              <div style="background-color: #fff5f7; padding: 12px; margin: 10px 0; border-left: 4px solid #FF369F; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; font-weight: bold; color: #FF369F;">
                  ${skill.habilidad}
                </p>
                <p style="margin: 0 0 5px 0; font-size: 11px; color: #333;">
                  <strong>Forma de Integración:</strong> ${skill.forma_integracion}
                </p>
                <p style="margin: 0; font-size: 11px; color: #0066cc;">
                  <strong>Impacto en Empleabilidad:</strong> ${skill.impacto_empleabilidad}
                </p>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${curriculumSuggestions.mejoras_secuencia.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h3 style="color: #4BCDF6; font-size: 16px; margin-top: 0; border-bottom: 2px solid #4BCDF6; padding-bottom: 10px;">
              📋 MEJORAS EN SECUENCIA ACADÉMICA
            </h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
              ${curriculumSuggestions.mejoras_secuencia.map(mejora => `
                <li style="margin: 8px 0; padding-left: 10px; font-size: 11px;">
                  ${mejora}
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}

        <div style="border-top: 2px solid #e9ecef; padding-top: 15px; margin-top: 30px; text-align: center; font-size: 10px; color: #999;">
          <p style="margin: 0;">
            Documento generado automáticamente por Mirai - Sistema de Orientación Vocacional
          </p>
          <p style="margin: 5px 0 0 0;">
            ${new Date().toLocaleString('es-GT')}
          </p>
        </div>
      `;

      document.body.appendChild(element);

      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const pageHeight = 297;
      let heightLeft = canvas.height * imgWidth / canvas.width;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgWidth * canvas.height / canvas.width);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - canvas.height * imgWidth / canvas.width;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgWidth * canvas.height / canvas.width);
        heightLeft -= pageHeight;
      }

      pdf.save(`Sugerencias_Plan_Estudios_${careerData.career.nombre_carrera.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
      document.body.removeChild(element);

      const { notifications } = await import('@mantine/notifications');
      notifications.show({
        title: '✅ PDF Descargado',
        message: 'Las sugerencias del plan de estudios se han descargado correctamente',
        color: 'green',
        position: 'top-right',
        autoClose: 3000
      });
    } catch (error: any) {
      console.error('Error al descargar PDF:', error);
      const { notifications } = await import('@mantine/notifications');
      notifications.show({
        title: '❌ Error al descargar',
        message: error.message || 'No se pudo descargar el PDF',
        color: 'red',
        position: 'top-right',
        autoClose: 3000
      });
    } finally {
      setIsDownloadingCurriculumPDF(false);
    }
  };

  // Mutation para mejoras curriculares con IA
  const improveCurriculumMutation = useMutation({
    mutationFn: async (data: { planEstudios: StudyPlan; nombreCarrera: string; empleabilidad: string }): Promise<CurriculumResponse> => {
      const response = await fetch('http://localhost:4000/api/infovocacional/improve-curriculum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error generando sugerencias curriculares');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setCurriculumSuggestions(data.suggestions);
      openCurriculumAnalysis();
      
      notifications.show({
        title: '¡Sugerencias IA Generadas!',
        message: 'Se han creado sugerencias para mejorar el plan de estudios.',
        color: 'green',
        icon: <IconCheck size={16} />,
        position: 'top-right',
        autoClose: 4000,
      });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Error en Sugerencias IA',
        message: error.message || 'No se pudieron generar las sugerencias.',
        color: 'red',
        icon: <IconAlertTriangle size={16} />,
        position: 'top-right',
        autoClose: 4000,
      });
    },
  });

  // Mutation para guardar insights seleccionados
  const saveInsightsMutation = useMutation({
    mutationFn: async (insights: Insight[]) => {
      const response = await authenticatedFetch(`https://api.miraiedu.online/careers/${carreraId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ insights }),
      });
      
      if (!response.ok) {
        throw new Error('Error al guardar los insights');
      }
      
      return response.json();
    },
    onSuccess: () => {
      notifications.show({
        title: '¡Insights Guardados!',
        message: 'Los insights seleccionados se han guardado correctamente.',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      closeInsightsModal();
      // Refrescar los datos de la carrera si es necesario
      // queryClient.invalidateQueries(['career-detail', carreraId]);
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Error al guardar',
        message: error.message || 'No se pudieron guardar los insights.',
        color: 'red',
        icon: <IconAlertTriangle size={16} />,
      });
    },
  });

  const handleBack = () => {
    navigate('/app/gestionvocacional');
  };

  const handleAnalyzeCareer = () => {
    if (careerData?.career) {
      analyzeCareerMutation.mutate(careerData.career);
    }
  };

  const handleImproveCurriculum = () => {
    if (careerData?.career) {
      improveCurriculumMutation.mutate({
        planEstudios: careerData.career.plan_de_estudio,
        nombreCarrera: careerData.career.nombre_carrera,
        empleabilidad: careerData.career.empleabilidad
      });
    }
  };

// Función para generar insights con el agente
const generateInsights = async () => {
  if (!careerData?.career?.nombre_carrera) return;

  setIsGeneratingInsights(true);
  setGenerationLogs([]);
  setGenerationProgress(null);
  setGeneratedInsights(null);
  openInsightsModal();

  try {
    const eventSource = new EventSource(
      `http://localhost:4000/api/insights/completo/${encodeURIComponent(careerData.career.nombre_carrera)}`
    );

    // Variable para almacenar todos los insights recibidos
    let allInsights: Insight[] = [];
    let resumenEjecutivo: ResumenEjecutivo = {
      tendenciaGeneral: '',
      oportunidadPrincipal: '',
      desafiosPrincipales: [],
      recomendacionGeneral: '',
      perspectiva2025: ''
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('SSE Event:', data);
      } catch (e) {
        console.error('Error parsing SSE data:', e);
      }
    };

    eventSource.addEventListener('start', (event) => {
      const messageEvent = event as MessageEvent;
      const data = JSON.parse(messageEvent.data);
      setGenerationLogs(prev => [...prev, `✨ ${data.message}`]);
    });

    eventSource.addEventListener('progress', (event) => {
      const messageEvent = event as MessageEvent;
      const data = JSON.parse(messageEvent.data);
      setGenerationProgress(data);
      setGenerationLogs(prev => [...prev, `📊 ${data.message}`]);
    });

    eventSource.addEventListener('generating', (event) => {
      const messageEvent = event as MessageEvent;
      const data = JSON.parse(messageEvent.data);
      setGenerationLogs(prev => [...prev, `🤖 ${data.message}`]);
    });

    eventSource.addEventListener('insights_start', (event) => {
      const messageEvent = event as MessageEvent;
      const data = JSON.parse(messageEvent.data);
      setGenerationLogs(prev => [...prev, `💡 ${data.message}`]);
    });

    eventSource.addEventListener('insight', (event) => {
      const messageEvent = event as MessageEvent;
      const data = JSON.parse(messageEvent.data);
      setGenerationLogs(prev => [...prev, `💡 Insight ${data.index}/${data.total}: ${data.insight.titulo}`]);
      
      // Agregar el insight a la lista acumulada
      if (data.insight) {
        allInsights.push(data.insight);
        
        // Actualizar el estado con los insights acumulados hasta ahora
        setGeneratedInsights({
          insights: [...allInsights],
          resumenEjecutivo: resumenEjecutivo
        });
      }
    });

    eventSource.addEventListener('summary', (event) => {
      const messageEvent = event as MessageEvent;
      const data = JSON.parse(messageEvent.data);
      setGenerationLogs(prev => [...prev, `📋 ${data.message}`]);
      
      // Si el resumen viene en este evento, actualizarlo
      if (data.resumen) {
        resumenEjecutivo = data.resumen;
        setGeneratedInsights({
          insights: [...allInsights],
          resumenEjecutivo: resumenEjecutivo
        });
      }
    });

    eventSource.addEventListener('complete', (event) => {
      const messageEvent = event as MessageEvent;
      const data = JSON.parse(messageEvent.data);
      setGenerationLogs(prev => [...prev, `✅ Análisis completado! ${data.totalInsights || allInsights.length} insights generados`]);
      
      // Actualizar con todos los datos finales
      const finalInsights: GeneratedInsights = {
        insights: allInsights,
        resumenEjecutivo: data.resumen || resumenEjecutivo || {
          tendenciaGeneral: 'Análisis completado exitosamente',
          oportunidadPrincipal: 'Revisar insights generados',
          desafiosPrincipales: ['Implementar sugerencias'],
          recomendacionGeneral: 'Seleccionar los insights más relevantes',
          perspectiva2025: 'Excelentes perspectivas de crecimiento'
        }
      };
      
      setGeneratedInsights(finalInsights);
      setIsGeneratingInsights(false);
      setGenerationProgress(null);
      eventSource.close();
      
      console.log('Insights finales generados:', finalInsights);
    });

    eventSource.addEventListener('error', (event) => {
      const messageEvent = event as MessageEvent;
      const data = JSON.parse(messageEvent.data);
      console.error('SSE Error:', data);
      setGenerationLogs(prev => [...prev, `❌ Error: ${data.message}`]);
      setIsGeneratingInsights(false);
      setGenerationProgress(null);
      eventSource.close();
      
      notifications.show({
        title: 'Error al generar insights',
        message: data.message || 'Error desconocido',
        color: 'red',
        icon: <IconAlertTriangle size={16} />,
      });
    });

    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      setGenerationLogs(prev => [...prev, '❌ Error de conexión']);
      setIsGeneratingInsights(false);
      setGenerationProgress(null);
      eventSource.close();
      
      notifications.show({
        title: 'Error de conexión',
        message: 'No se pudo conectar con el servidor de insights',
        color: 'red',
        icon: <IconAlertTriangle size={16} />,
      });
    };

  } catch (error) {
    console.error('Error generating insights:', error);
    setIsGeneratingInsights(false);
    setGenerationProgress(null);
    
    notifications.show({
      title: 'Error al generar insights',
      message: 'No se pudieron generar los insights',
      color: 'red',
      icon: <IconAlertTriangle size={16} />,
    });
  }
};

  const handleSaveSelectedInsights = () => {
    if (!generatedInsights || selectedInsights.size === 0) return;
    
    const insightsToSave = generatedInsights.insights.filter(insight => 
      selectedInsights.has(insight.id)
    );
    
    saveInsightsMutation.mutate(insightsToSave);
  };

  const toggleInsightSelection = (insightId: number) => {
    const newSelection = new Set(selectedInsights);
    if (newSelection.has(insightId)) {
      newSelection.delete(insightId);
    } else {
      if (newSelection.size < 10) { // Máximo 10 insights
        newSelection.add(insightId);
      } else {
        notifications.show({
          title: 'Límite alcanzado',
          message: 'Solo puedes seleccionar máximo 10 insights.',
          color: 'orange',
          icon: <IconAlertTriangle size={16} />,
        });
      }
    }
    setSelectedInsights(newSelection);
  };

  // Función para renderizar insights existentes
  const renderInsights = () => {
    // Si no hay insights en la carrera, mostrar estado vacío
    if (!careerData?.career?.insights || careerData.career.insights.length === 0) {
      return (
        <Paper p="xl" shadow="sm" radius="lg" style={{ border: '1px solid rgba(75, 205, 246, 0.1)' }}>
          <div className="text-center py-12">
            <IconBulb size={64} color="#4BCDF6" style={{ margin: '0 auto 1rem' }} />
            <Text className="font-bebas text-2xl text-[#1D1A05] tracking-wide mb-4">
              NO HAY INSIGHTS DISPONIBLES
            </Text>
            <Text className="font-roboto text-gray-600 mb-6">
              Genera insights personalizados sobre el mercado laboral para esta carrera
            </Text>
            <Button
              size="lg"
              leftSection={<IconSparkles size={20} />}
              onClick={generateInsights}
              styles={{
                root: {
                  background: 'linear-gradient(135deg, #4BCDF6, #9F8BEA)',
                  border: 'none',
                  color: 'white',
                  fontFamily: 'Roboto, sans-serif',
                  fontWeight: 600,
                  fontSize: '16px',
                  padding: '12px 24px',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #9F8BEA, #4BCDF6)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(75, 205, 246, 0.3)'
                  },
                  transition: 'all 0.3s ease'
                }
              }}
            >
              Generar Insights con IA
            </Button>
          </div>
        </Paper>
      );
    }

    // Mostrar insights existentes
    return (
      <Paper p="xl" shadow="sm" radius="lg" style={{ border: '1px solid rgba(75, 205, 246, 0.1)' }}>
        <Group justify="space-between" mb="xl">
          <div>
            <Text className="font-bebas text-2xl text-[#1D1A05] tracking-wide">
              INSIGHTS DEL MERCADO LABORAL
            </Text>
            <Text className="font-roboto text-gray-600">
              Análisis actualizado del mercado profesional
            </Text>
          </div>
          <Group gap="md">
            <Badge size="lg" variant="light" color="blue">
              {careerData.career.insights.length} insights
            </Badge>
            <Button
              leftSection={<IconSparkles size={16} />}
              onClick={generateInsights}
              variant="outline"
              styles={{
                root: {
                  borderColor: '#4BCDF6',
                  color: '#4BCDF6',
                  fontFamily: 'Roboto, sans-serif',
                  fontWeight: 600,
                  '&:hover': {
                    background: 'rgba(75, 205, 246, 0.1)',
                    borderColor: '#4BCDF6'
                  }
                }
              }}
            >
              Actualizar Insights
            </Button>
          </Group>
        </Group>

        <Stack gap="lg">
          {careerData.career.insights.map((insight, index) => (
            <Card key={insight.id || index} p="lg" shadow="sm" radius="md" 
              style={{ 
                border: '1px solid rgba(75, 205, 246, 0.1)',
                background: 'linear-gradient(135deg, rgba(75, 205, 246, 0.02), rgba(159, 139, 234, 0.02))'
              }}
            >
              <Group justify="space-between" mb="md">
                <Group gap="sm">
                  <Badge color={getCategoryColor(insight.categoria)} size="sm">
                    {insight.categoria.replace('_', ' ')}
                  </Badge>
                  <Badge color={getRelevanceColor(insight.relevancia)} size="sm" variant="light">
                    {insight.relevancia}
                  </Badge>
                </Group>
                <Text className="font-roboto text-xs text-gray-500">
                  {insight.fecha}
                </Text>
              </Group>

              <Text className="font-roboto font-bold text-[#1D1A05] text-lg mb-3">
                {insight.titulo}
              </Text>

              <Text className="font-roboto text-gray-700 mb-4 leading-relaxed">
                {insight.descripcion}
              </Text>

              <Group justify="space-between">
                <Group gap="xs">
                  <Text className="font-roboto text-sm font-semibold text-gray-600">
                    Fuente:
                  </Text>
                  <Text className="font-roboto text-sm text-gray-700">
                    {insight.fuente}
                  </Text>
                </Group>
                <Text className="font-roboto text-xs text-gray-500">
                  Actualidad: {insight.actualidad}
                </Text>
              </Group>

              {insight.empresasGuatemaltecas && insight.empresasGuatemaltecas.length > 0 && (
                <Group gap="xs" mt="md">
                  <Text className="font-roboto text-sm font-semibold">Empresas:</Text>
                  {insight.empresasGuatemaltecas.slice(0, 3).map((empresa, i) => (
                    <Badge key={i} size="xs" color="teal" variant="light">
                      {empresa}
                    </Badge>
                  ))}
                  {insight.empresasGuatemaltecas.length > 3 && (
                    <Badge size="xs" color="gray" variant="light">
                      +{insight.empresasGuatemaltecas.length - 3} más
                    </Badge>
                  )}
                </Group>
              )}
            </Card>
          ))}
        </Stack>
      </Paper>
    );
  };

  // Función para renderizar el plan de estudios con botón de IA
  const renderStudyPlan = () => {
    if (!careerData?.career?.plan_de_estudio) return null;

    const studyPlan = careerData.career.plan_de_estudio;
    const years = Object.keys(studyPlan).sort();

    return (
      <Paper p="xl" shadow="sm" radius="lg" style={{ border: '1px solid rgba(75, 205, 246, 0.1)' }}>
        <Group justify="space-between" mb="xl">
          <div>
            <Text className="font-bebas text-2xl text-[#1D1A05] tracking-wide">
              PLAN DE ESTUDIOS
            </Text>
            <Text className="font-roboto text-gray-600">
              Estructura académica completa de la carrera
            </Text>
          </div>
          <Group gap="md">
            <Badge size="lg" variant="light" color="blue">
              {years.length} años • {years.length * 2} semestres
            </Badge>
            <Button
              leftSection={<IconBrain size={16} />}
              onClick={handleImproveCurriculum}
              loading={improveCurriculumMutation.isPending}
              styles={{
                root: {
                  background: 'linear-gradient(135deg, #9F8BEA, #4BCDF6)',
                  border: 'none',
                  color: 'white',
                  fontFamily: 'Roboto, sans-serif',
                  fontWeight: 600,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4BCDF6, #9F8BEA)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(159, 139, 234, 0.3)'
                  },
                  transition: 'all 0.2s ease'
                }
              }}
            >
              Analizar pensum con IA
            </Button>
          </Group>
        </Group>

        <Tabs defaultValue={years[0]} variant="outline">
          <Tabs.List>
            {years.map((year, index) => (
              <Tabs.Tab 
                key={year} 
                value={year}
                styles={{
                  tab: {
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 600,
                    '&[data-active]': {
                      borderColor: '#4BCDF6',
                      color: '#4BCDF6'
                    }
                  }
                }}
              >
                Año {index + 1}
              </Tabs.Tab>
            ))}
          </Tabs.List>

          {years.map((year) => (
            <Tabs.Panel key={year} value={year} pt="xl">
              <Grid>
                {/* Primer Semestre */}
                <Grid.Col span={6}>
                  <Card p="lg" shadow="sm" radius="md" style={{ 
                    border: '1px solid rgba(159, 139, 234, 0.2)',
                    background: 'linear-gradient(135deg, rgba(159, 139, 234, 0.05), rgba(255, 175, 33, 0.02))'
                  }}>
                    <Group justify="space-between" mb="md">
                      <Text className="font-bebas text-lg text-[#1D1A05] tracking-wide">
                        PRIMER SEMESTRE
                      </Text>
                      <Badge size="sm" color="violet">
                        {studyPlan[year].primer_semestre.length} materias
                      </Badge>
                    </Group>
                    
                    <Stack gap="sm">
                      {studyPlan[year].primer_semestre.map((subject, index) => (
                        <Card key={subject.id} p="md" className="hover:shadow-sm transition-shadow" style={{ border: '1px solid rgba(159, 139, 234, 0.1)' }}>
                          <Group gap="md">
                            <Avatar
                              size="sm"
                              style={{
                                background: 'linear-gradient(135deg, #9F8BEA, #FFAF21)'
                              }}
                            >
                              <Text size="xs" c="white" fw={600}>
                                {index + 1}
                              </Text>
                            </Avatar>
                            <div style={{ flex: 1 }}>
                              <Text className="font-roboto font-semibold text-sm text-gray-800">
                                {subject.name}
                              </Text>
                            </div>
                          </Group>
                        </Card>
                      ))}
                    </Stack>
                  </Card>
                </Grid.Col>

                {/* Segundo Semestre */}
                <Grid.Col span={6}>
                  <Card p="lg" shadow="sm" radius="md" style={{ 
                    border: '1px solid rgba(255, 175, 33, 0.2)',
                    background: 'linear-gradient(135deg, rgba(255, 175, 33, 0.05), rgba(255, 54, 159, 0.02))'
                  }}>
                    <Group justify="space-between" mb="md">
                      <Text className="font-bebas text-lg text-[#1D1A05] tracking-wide">
                        SEGUNDO SEMESTRE
                      </Text>
                      <Badge size="sm" color="orange">
                        {studyPlan[year].segundo_semestre.length} materias
                      </Badge>
                    </Group>
                    
                    <Stack gap="sm">
                      {studyPlan[year].segundo_semestre.map((subject, index) => (
                        <Card key={subject.id} p="md" className="hover:shadow-sm transition-shadow" style={{ border: '1px solid rgba(255, 175, 33, 0.1)' }}>
                          <Group gap="md">
                            <Avatar
                              size="sm"
                              style={{
                                background: 'linear-gradient(135deg, #FFAF21, #FF369F)'
                              }}
                            >
                              <Text size="xs" c="white" fw={600}>
                                {index + 1}
                              </Text>
                            </Avatar>
                            <div style={{ flex: 1 }}>
                              <Text className="font-roboto font-semibold text-sm text-gray-800">
                                {subject.name}
                              </Text>
                            </div>
                          </Group>
                        </Card>
                      ))}
                    </Stack>
                  </Card>
                </Grid.Col>
              </Grid>
            </Tabs.Panel>
          ))}
        </Tabs>
      </Paper>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader size="xl" color="#4BCDF6" />
          <Text className="font-roboto text-gray-600 mt-4 text-lg">
            Cargando información de la carrera...
          </Text>
        </div>
      </div>
    );
  }

  if (error || !careerData) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center p-6">
        <Alert 
          color="red" 
          title="Error al cargar la información"
          icon={<IconAlertTriangle size={16} />}
          style={{ maxWidth: 500 }}
        >
          <Text className="font-roboto mb-4">
            No se pudo cargar la información de la carrera.
          </Text>
          <Button onClick={handleBack} variant="outline" color="red">
            Volver a Gestión Vocacional
          </Button>
        </Alert>
      </div>
    );
  }

  const career = careerData.career;

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <Container size="xl" className="p-6">
          <Group justify="space-between" mb="lg">
            <Group>
              <ActionIcon
                size="xl"
                variant="light"
                onClick={handleBack}
                styles={{
                  root: {
                    background: 'linear-gradient(135deg, rgba(75, 205, 246, 0.1), rgba(255, 54, 159, 0.1))',
                    color: '#4BCDF6',
                    '&:hover': { 
                      background: 'linear-gradient(135deg, rgba(75, 205, 246, 0.2), rgba(255, 54, 159, 0.2))',
                      transform: 'scale(1.05)'
                    },
                    transition: 'all 0.2s ease'
                  }
                }}
              >
                <IconArrowLeft size={24} />
              </ActionIcon>
              
              <div>
                <Breadcrumbs separator={<IconChevronRight size={16} color="#9ca3af" />}>
                  <Anchor 
                    onClick={handleBack} 
                    className="font-roboto text-blue-500 hover:text-blue-600 transition-colors"
                  >
                    Gestión Vocacional
                  </Anchor>
                  <Text className="font-roboto text-gray-600 font-medium">
                    {career.nombre_carrera}
                  </Text>
                </Breadcrumbs>
                
                <Text className="font-bebas text-4xl text-[#1D1A05] tracking-wide mt-2">
                  INFORMACIÓN DE CARRERA
                </Text>
                <Text className="font-roboto text-gray-600 text-lg">
                  Detalles completos del programa académico
                </Text>
              </div>
            </Group>

            <Group gap="md">
              {/* Botón de Análisis IA */}
              <Button
                leftSection={<IconRobot size={16} />}
                onClick={handleAnalyzeCareer}
                loading={analyzeCareerMutation.isPending}
                styles={{
                  root: {
                    background: 'linear-gradient(135deg, #FF369F, #9F8BEA)',
                    border: 'none',
                    color: 'white',
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 600,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #9F8BEA, #FF369F)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(255, 54, 159, 0.3)'
                    },
                    transition: 'all 0.2s ease'
                  }
                }}
              >
                Analizar carrera IA
              </Button>
            </Group>
          </Group>
        </Container>
      </div>

      <Container size="xl" className="p-6">
        <Stack gap="xl">
          {/* Información Principal de la Carrera */}
          <Paper
            p="xl"
            shadow="md"
            radius="lg"
            style={{
              border: '2px solid rgba(75, 205, 246, 0.1)',
              background: 'linear-gradient(135deg, rgba(75, 205, 246, 0.08), rgba(255, 54, 159, 0.04))',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div 
              style={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                background: 'linear-gradient(135deg, rgba(75, 205, 246, 0.1), rgba(255, 54, 159, 0.1))',
                borderRadius: '50%',
                zIndex: 0
              }}
            />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <Group justify="space-between" mb="lg">
                <Group>
                  <Avatar
                    src={getCareerImage(career._id)}
                    size="xl"
                    style={{
                      background: 'linear-gradient(135deg, #4BCDF6, #FF369F)'
                    }}
                  >
                    <IconSchool size={32} />
                  </Avatar>
                  <div>
                    <Badge
                      size="lg"
                      style={{
                        background: 'linear-gradient(135deg, #9F8BEA, #FFAF21)',
                        color: 'white'
                      }}
                    >
                      {career.facultad}
                    </Badge>
                  </div>
                </Group>
                
                <Group gap="md">
                  <Badge
                    size="lg"
                    variant="light"
                    color={getEmployabilityColor(career.empleabilidad)}
                  >
                    Empleabilidad {career.empleabilidad}
                  </Badge>
                  <Badge size="lg" variant="light" color="blue">
                    {career.duracion} años
                  </Badge>
                </Group>
              </Group>

              <Text className="font-bebas text-3xl text-[#1D1A05] tracking-wide mb-4">
                {career.nombre_carrera}
              </Text>
              
              <Text className="font-roboto text-gray-700 leading-relaxed text-lg mb-6">
                {career.descripcion}
              </Text>

              {/* Tags de habilidades */}
              <Group gap="sm" mb="lg">
                {career.tags.map((tag) => (
                  <Badge
                    key={tag._id}
                    size="md"
                    variant="light"
                    color={getTagColor(tag.name)}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {tag.name} ({Math.round(tag.score * 100)}%)
                  </Badge>
                ))}
              </Group>

              {/* Información salarial */}
              <Paper p="md" radius="md" style={{ border: '1px solid rgba(255, 175, 33, 0.2)', background: 'rgba(255, 175, 33, 0.05)' }}>
                <Group justify="space-between">
                  <Group gap="md">
                    <IconCurrencyDollar size={24} color="#FFAF21" />
                    <div>
                      <Text className="font-roboto font-semibold text-[#1D1A05]">
                        Rango Salarial
                      </Text>
                      <Text className="font-roboto text-gray-600 text-sm">
                        En {career.moneda_salario}
                      </Text>
                    </div>
                  </Group>
                  <div className="text-right">
                    <Text className="font-bebas text-2xl text-[#1D1A05]">
                      ${career.salario_minimo.toLocaleString()} - ${career.salario_maximo.toLocaleString()}
                    </Text>
                    <Text className="font-roboto text-gray-600 text-sm">
                      Salario mensual promedio
                    </Text>
                  </div>
                </Group>
              </Paper>
            </div>
          </Paper>

          {/* Sección de Tabs con información detallada */}
          <Tabs defaultValue="plan" variant="outline">
            <Tabs.List>
              <Tabs.Tab 
                value="plan" 
                leftSection={<IconBook size={16} />}
                styles={{
                  tab: {
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 600,
                    '&[data-active]': {
                      borderColor: '#4BCDF6',
                      color: '#4BCDF6'
                    }
                  }
                }}
              >
                Plan de Estudios
              </Tabs.Tab>
              <Tabs.Tab 
                value="areas" 
                leftSection={<IconTarget size={16} />}
                styles={{
                  tab: {
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 600,
                    '&[data-active]': {
                      borderColor: '#4BCDF6',
                      color: '#4BCDF6'
                    }
                  }
                }}
              >
                Áreas de Desarrollo
              </Tabs.Tab>
              <Tabs.Tab 
                value="perfil" 
                leftSection={<IconUsers size={16} />}
                styles={{
                  tab: {
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 600,
                    '&[data-active]': {
                      borderColor: '#4BCDF6',
                      color: '#4BCDF6'
                    }
                  }
                }}
              >
                Perfil del Egresado
              </Tabs.Tab>
              <Tabs.Tab 
                value="competencias" 
                leftSection={<IconBrain size={16} />}
                styles={{
                  tab: {
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 600,
                    '&[data-active]': {
                      borderColor: '#4BCDF6',
                      color: '#4BCDF6'
                    }
                  }
                }}
              >
                Competencias
              </Tabs.Tab>
              <Tabs.Tab 
                value="insights" 
                leftSection={<IconBulb size={16} />}
                styles={{
                  tab: {
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 600,
                    '&[data-active]': {
                      borderColor: '#4BCDF6',
                      color: '#4BCDF6'
                    }
                  }
                }}
              >
                Insights
              </Tabs.Tab>
            </Tabs.List>

            {/* Panel del Plan de Estudios */}
            <Tabs.Panel value="plan" pt="xl">
              {renderStudyPlan()}
            </Tabs.Panel>

            {/* Panel de Insights */}
            <Tabs.Panel value="insights" pt="xl">
              {renderInsights()}
            </Tabs.Panel>

            {/* Panel de Áreas de Desarrollo */}
            <Tabs.Panel value="areas" pt="xl">
              <Grid>
                {/* Áreas de Desarrollo Potencial */}
                <Grid.Col span={6}>
                  <Paper p="xl" shadow="sm" radius="lg" style={{ border: '1px solid rgba(159, 139, 234, 0.1)' }}>
                    <Group justify="space-between" mb="xl">
                      <div>
                        <Text className="font-bebas text-xl text-[#1D1A05] tracking-wide">
                          ÁREAS DE DESARROLLO POTENCIAL
                        </Text>
                        <Text className="font-roboto text-gray-600 text-sm">
                          Campos de especialización profesional
                        </Text>
                      </div>
                      <Badge size="sm" variant="light" color="violet">
                        {career.areas_de_desarrollo_potencial.length} áreas
                      </Badge>
                    </Group>
                    
                    <Stack gap="lg">
                      {career.areas_de_desarrollo_potencial.map((area, index) => (
                        <Card key={area._id} p="lg" shadow="sm" radius="md" style={{ border: '1px solid rgba(159, 139, 234, 0.1)' }}>
                          <Group align="start" gap="md">
                            <Avatar
                              size="md"
                              style={{
                                background: 'linear-gradient(135deg, #9F8BEA, #FFAF21)'
                              }}
                            >
                              <Text size="sm" c="white" fw={600}>
                                {index + 1}
                              </Text>
                            </Avatar>
                            <div style={{ flex: 1 }}>
                              <Text className="font-roboto font-bold text-[#1D1A05] mb-2">
                                {area.area}
                              </Text>
                              <Text className="font-roboto text-gray-700 text-sm leading-relaxed">
                                {area.descripcion}
                              </Text>
                            </div>
                          </Group>
                        </Card>
                      ))}
                    </Stack>
                  </Paper>
                </Grid.Col>

                {/* Áreas de Formación */}
                <Grid.Col span={6}>
                  <Paper p="xl" shadow="sm" radius="lg" style={{ border: '1px solid rgba(255, 175, 33, 0.1)' }}>
                    <Group justify="space-between" mb="xl">
                      <div>
                        <Text className="font-bebas text-xl text-[#1D1A05] tracking-wide">
                          ÁREAS DE FORMACIÓN
                        </Text>
                        <Text className="font-roboto text-gray-600 text-sm">
                          Enfoques académicos principales
                        </Text>
                      </div>
                      <Badge size="sm" variant="light" color="orange">
                        {career.areas_de_formacion.length} áreas
                      </Badge>
                    </Group>
                    
                    <Stack gap="lg">
                      {career.areas_de_formacion.map((area, index) => (
                        <Card key={area._id} p="lg" shadow="sm" radius="md" style={{ border: '1px solid rgba(255, 175, 33, 0.1)' }}>
                          <Group align="start" gap="md">
                            <Avatar
                              size="md"
                              style={{
                                background: 'linear-gradient(135deg, #FFAF21, #FF369F)'
                              }}
                            >
                              <Text size="sm" c="white" fw={600}>
                                {index + 1}
                              </Text>
                            </Avatar>
                            <div style={{ flex: 1 }}>
                              <Text className="font-roboto font-bold text-[#1D1A05] mb-2">
                                {area.area}
                              </Text>
                              <Text className="font-roboto text-gray-700 text-sm leading-relaxed">
                                {area.descripcion}
                              </Text>
                            </div>
                          </Group>
                        </Card>
                      ))}
                    </Stack>
                  </Paper>
                </Grid.Col>
              </Grid>
            </Tabs.Panel>

            {/* Panel del Perfil del Egresado */}
            <Tabs.Panel value="perfil" pt="xl">
              <Paper p="xl" shadow="sm" radius="lg" style={{ border: '1px solid rgba(75, 205, 246, 0.1)' }}>
                <Group justify="space-between" mb="xl">
                  <div>
                    <Text className="font-bebas text-2xl text-[#1D1A05] tracking-wide">
                      PERFIL DEL EGRESADO
                    </Text>
                    <Text className="font-roboto text-gray-600">
                      Características y oportunidades profesionales
                    </Text>
                  </div>
                  <IconUsers size={32} color="#4BCDF6" />
                </Group>
                
                <Paper p="xl" radius="md" style={{ 
                  border: '1px solid rgba(75, 205, 246, 0.2)', 
                  background: 'linear-gradient(135deg, rgba(75, 205, 246, 0.05), rgba(255, 54, 159, 0.02))' 
                }}>
                  <Text className="font-roboto text-gray-800 text-lg leading-relaxed">
                    {career.perfil_del_egresado}
                  </Text>
                </Paper>
              </Paper>
            </Tabs.Panel>

            {/* Panel de Competencias */}
            <Tabs.Panel value="competencias" pt="xl">
              <Paper p="xl" shadow="sm" radius="lg" style={{ border: '1px solid rgba(255, 54, 159, 0.1)' }}>
                <Group justify="space-between" mb="xl">
                  <div>
                    <Text className="font-bebas text-2xl text-[#1D1A05] tracking-wide">
                      COMPETENCIAS DESARROLLADAS
                    </Text>
                    <Text className="font-roboto text-gray-600">
                      Habilidades y conocimientos adquiridos
                    </Text>
                  </div>
                  <Badge size="lg" variant="light" color="pink">
                    {career.competencias_desarrolladas.length} competencias
                  </Badge>
                </Group>
                
                <Stack gap="md">
                  {career.competencias_desarrolladas.map((competencia, index) => (
                    <Card key={index} p="lg" shadow="sm" radius="md" style={{ border: '1px solid rgba(255, 54, 159, 0.1)' }}>
                      <Group align="start" gap="md">
                        <Avatar
                          size="md"
                          style={{
                            background: 'linear-gradient(135deg, #FF369F, #4BCDF6)'
                          }}
                        >
                          <IconAward size={20} />
                        </Avatar>
                        <div style={{ flex: 1 }}>
                          <Text className="font-roboto text-gray-800 leading-relaxed">
                            {competencia}
                          </Text>
                        </div>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              </Paper>
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Container>

      {/* Modal de Generación de Insights */}
      <Modal
        opened={insightsModalOpened}
        onClose={closeInsightsModal}
        title={
          <Group gap="sm">
            <IconSparkles size={24} color="#4BCDF6" />
            <Text className="font-bebas text-xl text-[#1D1A05] tracking-wide">
              GENERADOR DE INSIGHTS IA
            </Text>
          </Group>
        }
        size="xl"
        closeOnClickOutside={!isGeneratingInsights}
        closeOnEscape={!isGeneratingInsights}
        styles={{
          header: {
            backgroundColor: 'linear-gradient(135deg, rgba(75, 205, 246, 0.05), rgba(159, 139, 234, 0.05))',
            borderBottom: '2px solid rgba(75, 205, 246, 0.1)'
          },
          body: {
            padding: '2rem',
            maxHeight: '80vh',
            overflow: 'auto'
          }
        }}
      >
        <Stack gap="xl">
          {/* Progreso de Generación */}
          {isGeneratingInsights && (
            <Paper p="lg" radius="md" style={{ 
              border: '1px solid rgba(75, 205, 246, 0.2)', 
              background: 'rgba(75, 205, 246, 0.05)' 
            }}>
              <Group justify="space-between" mb="md">
                <Text className="font-bebas text-lg text-[#1D1A05]">
                  GENERANDO INSIGHTS...
                </Text>
                <Loader size="sm" color="#4BCDF6" />
              </Group>
              
              {generationProgress && (
                <div className="mb-4">
                  <Group justify="space-between" mb="xs">
                    <Text className="font-roboto text-sm">
                      Paso {generationProgress.step} de {generationProgress.total}
                    </Text>
                    <Text className="font-roboto text-sm">
                      {generationProgress.percentage}%
                    </Text>
                  </Group>
                  <Progress value={generationProgress.percentage} color="#4BCDF6" size="sm" />
                </div>
              )}
              
              <ScrollArea h={200}>
                <Stack gap="xs">
                  {generationLogs.map((log, index) => (
                    <Text key={index} className="font-roboto text-sm text-gray-700">
                      {log}
                    </Text>
                  ))}
                </Stack>
              </ScrollArea>
            </Paper>
          )}

          {/* Insights Generados */}
          {generatedInsights && !isGeneratingInsights && (
            <>
              <Paper p="lg" radius="md" style={{ 
                border: '1px solid rgba(34, 197, 94, 0.2)', 
                background: 'rgba(34, 197, 94, 0.05)' 
              }}>
                <Group justify="space-between" mb="md">
                  <Text className="font-bebas text-lg text-[#1D1A05]">
                    INSIGHTS GENERADOS
                  </Text>
                  <Badge color="green">
                    {selectedInsights.size}/10 seleccionados
                  </Badge>
                </Group>
                
                <Text className="font-roboto text-sm text-gray-600 mb-4">
                  Selecciona hasta 10 insights para agregar a la carrera:
                </Text>
                
                <ScrollArea h={400}>
                  <Stack gap="md">
                    {generatedInsights.insights.map((insight) => (
                      <Card key={insight.id} p="md" 
                        style={{ 
                          border: selectedInsights.has(insight.id) 
                            ? '2px solid #4BCDF6' 
                            : '1px solid rgba(75, 205, 246, 0.1)',
                          background: selectedInsights.has(insight.id)
                            ? 'rgba(75, 205, 246, 0.05)'
                            : 'white',
                          cursor: 'pointer'
                        }}
                        onClick={() => toggleInsightSelection(insight.id)}
                      >
                        <Group justify="space-between" mb="sm">
                          <Group gap="sm">
                            <input
                              type="checkbox"
                              checked={selectedInsights.has(insight.id)}
                              onChange={() => toggleInsightSelection(insight.id)}
                              style={{ 
                                width: '16px', 
                                height: '16px',
                                accentColor: '#4BCDF6'
                              }}
                            />
                            <Badge color={getCategoryColor(insight.categoria)} size="xs">
                              {insight.categoria.replace('_', ' ')}
                            </Badge>
                            <Badge color={getRelevanceColor(insight.relevancia)} size="xs" variant="light">
                              {insight.relevancia}
                            </Badge>
                          </Group>
                        </Group>
                        
                        <Text className="font-roboto font-semibold text-sm mb-2">
                          {insight.titulo}
                        </Text>
                        
                        <Text className="font-roboto text-xs text-gray-600 line-clamp-2">
                          {insight.descripcion}
                        </Text>
                      </Card>
                    ))}
                  </Stack>
                </ScrollArea>
              </Paper>

              {/* Botones de Acción */}
              <Group justify="space-between">
                <Button
                  variant="outline"
                  onClick={closeInsightsModal}
                  color="gray"
                >
                  Cancelar
                </Button>
                
                <Button
                  onClick={handleSaveSelectedInsights}
                  disabled={selectedInsights.size === 0}
                  loading={saveInsightsMutation.isPending}
                  styles={{
                    root: {
                      background: selectedInsights.size > 0 
                        ? 'linear-gradient(135deg, #4BCDF6, #9F8BEA)' 
                        : '#gray',
                      border: 'none',
                      color: 'white',
                      fontFamily: 'Roboto, sans-serif',
                      fontWeight: 600,
                      '&:hover': {
                        background: selectedInsights.size > 0 
                          ? 'linear-gradient(135deg, #9F8BEA, #4BCDF6)' 
                          : '#gray',
                      }
                    }
                  }}
                >
                  Guardar Insights Seleccionados ({selectedInsights.size})
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Modal>

      {/* Modal de Análisis IA */}
      <Modal
        opened={aiAnalysisOpened}
        onClose={closeAIAnalysis}
        title={
          <Group gap="sm">
            <IconRobot size={24} color="#FF369F" />
            <Text className="font-bebas text-xl text-[#1D1A05] tracking-wide">
              ANÁLISIS INTELIGENTE DE CARRERA
            </Text>
          </Group>
        }
        size="xl"
        styles={{
          header: {
            backgroundColor: 'linear-gradient(135deg, rgba(255, 54, 159, 0.05), rgba(159, 139, 234, 0.05))',
            borderBottom: '2px solid rgba(255, 54, 159, 0.1)'
          },
          body: {
            padding: '2rem',
            maxHeight: '70vh',
            overflow: 'auto'
          }
        }}
      >
        {aiAnalysisData && (
          <ScrollArea h={500}>
            <Stack gap="xl">
              {/* Fortalezas */}
              <Paper p="lg" radius="md" style={{ border: '1px solid rgba(34, 197, 94, 0.2)', background: 'rgba(34, 197, 94, 0.05)' }}>
                <Group mb="md">
                  <IconCheck size={20} color="#22C55E" />
                  <Text className="font-bebas text-lg text-[#1D1A05] tracking-wide">
                    FORTALEZAS IDENTIFICADAS
                  </Text>
                </Group>
                <Stack gap="sm">
                  {aiAnalysisData.fortalezas.map((fortaleza, index) => (
                    <Card key={index} p="md" style={{ border: '1px solid rgba(34, 197, 94, 0.1)' }}>
                      <Text className="font-roboto text-sm text-gray-700">
                        • {fortaleza}
                      </Text>
                    </Card>
                  ))}
                </Stack>
              </Paper>

              {/* Áreas de Mejora */}
              <Paper p="lg" radius="md" style={{ border: '1px solid rgba(245, 101, 101, 0.2)', background: 'rgba(245, 101, 101, 0.05)' }}>
                <Group mb="md">
                  <IconAlertCircle size={20} color="#F56565" />
                  <Text className="font-bebas text-lg text-[#1D1A05] tracking-wide">
                    ÁREAS DE MEJORA
                  </Text>
                </Group>
                <Stack gap="sm">
                  {aiAnalysisData.areas_mejora.map((area, index) => (
                    <Card key={index} p="md" style={{ border: '1px solid rgba(245, 101, 101, 0.1)' }}>
                      <Text className="font-roboto text-sm text-gray-700">
                        • {area}
                      </Text>
                    </Card>
                  ))}
                </Stack>
              </Paper>

              {/* Recomendaciones */}
              <Paper p="lg" radius="md" style={{ border: '1px solid rgba(75, 205, 246, 0.2)', background: 'rgba(75, 205, 246, 0.05)' }}>
                <Group mb="md">
                  <IconBrain size={20} color="#4BCDF6" />
                  <Text className="font-bebas text-lg text-[#1D1A05] tracking-wide">
                    RECOMENDACIONES ESTRATÉGICAS
                  </Text>
                </Group>
                <Stack gap="md">
                  {aiAnalysisData.recomendaciones.map((rec, index) => (
                    <Card key={index} p="md" style={{ border: '1px solid rgba(75, 205, 246, 0.1)' }}>
                      <Group justify="space-between" mb="sm">
                        <Text className="font-roboto font-semibold text-sm">
                          {rec.titulo}
                        </Text>
                        <Badge color={getPriorityColor(rec.prioridad)} size="xs">
                          {rec.prioridad}
                        </Badge>
                      </Group>
                      <Text className="font-roboto text-xs text-gray-600 mb-2">
                        Categoría: {rec.categoria}
                      </Text>
                      <Text className="font-roboto text-sm text-gray-700 mb-2">
                        {rec.descripcion}
                      </Text>
                      <Text className="font-roboto text-xs text-blue-600">
                        <strong>Impacto esperado:</strong> {rec.impacto_esperado}
                      </Text>
                    </Card>
                  ))}
                </Stack>
              </Paper>

              {/* Tendencias del Mercado */}
              <Paper p="lg" radius="md" style={{ border: '1px solid rgba(255, 175, 33, 0.2)', background: 'rgba(255, 175, 33, 0.05)' }}>
                <Group mb="md">
                  <IconTrendingUp size={20} color="#FFAF21" />
                  <Text className="font-bebas text-lg text-[#1D1A05] tracking-wide">
                    TENDENCIAS DEL MERCADO
                  </Text>
                </Group>
                <Stack gap="sm">
                  {aiAnalysisData.tendencias_mercado.map((tendencia, index) => (
                    <Card key={index} p="md" style={{ border: '1px solid rgba(255, 175, 33, 0.1)' }}>
                      <Text className="font-roboto text-sm text-gray-700">
                        • {tendencia}
                      </Text>
                    </Card>
                  ))}
                </Stack>
              </Paper>

              {/* Oportunidades de Crecimiento */}
              <Paper p="lg" radius="md" style={{ border: '1px solid rgba(159, 139, 234, 0.2)', background: 'rgba(159, 139, 234, 0.05)' }}>
                <Group mb="md">
                  <IconSparkles size={20} color="#9F8BEA" />
                  <Text className="font-bebas text-lg text-[#1D1A05] tracking-wide">
                    OPORTUNIDADES DE CRECIMIENTO
                  </Text>
                </Group>
                <Stack gap="sm">
                  {aiAnalysisData.oportunidades_crecimiento.map((oportunidad, index) => (
                    <Card key={index} p="md" style={{ border: '1px solid rgba(159, 139, 234, 0.1)' }}>
                      <Text className="font-roboto text-sm text-gray-700">
                        • {oportunidad}
                      </Text>
                    </Card>
                  ))}
                  {/* Botón de Descarga al final */}
                  <Group justify="flex-end" mt="xl" pt="xl" style={{ borderTop: '1px solid #e9ecef' }}>
                    <Button
                      variant="outline"
                      onClick={closeAIAnalysis}
                      color="gray"
                    >
                      Cerrar
                    </Button>
                    <Button
                      leftSection={<IconDownload size={16} />}
                      onClick={downloadCareerAnalysisPDF}
                      loading={isDownloadingCareerPDF}
                      disabled={isDownloadingCareerPDF}
                      styles={{
                        root: {
                          background: 'linear-gradient(135deg, #FF369F, #9F8BEA)',
                          border: 'none',
                          color: 'white',
                          fontFamily: 'Roboto, sans-serif',
                          fontWeight: 600,
                          '&:hover': {
                            background: 'linear-gradient(135deg, #9F8BEA, #FF369F)',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 12px rgba(255, 54, 159, 0.3)'
                          },
                          transition: 'all 0.2s ease'
                        }
                      }}
                    >
                      {isDownloadingCareerPDF ? 'Descargando PDF...' : 'Descargar Análisis PDF'}
                    </Button>
                  </Group>
                </Stack>
              </Paper>
            </Stack>
          </ScrollArea>
        )}
      </Modal>

      {/* Modal de Mejoras Curriculares */}
      <Modal
        opened={curriculumAnalysisOpened}
        onClose={closeCurriculumAnalysis}
        title={
          <Group gap="sm">
            <IconBrain size={24} color="#9F8BEA" />
            <Text className="font-bebas text-xl text-[#1D1A05] tracking-wide">
              SUGERENCIAS IA PARA PLAN DE ESTUDIOS
            </Text>
          </Group>
        }
        size="xl"
        styles={{
          header: {
            backgroundColor: 'linear-gradient(135deg, rgba(159, 139, 234, 0.05), rgba(75, 205, 246, 0.05))',
            borderBottom: '2px solid rgba(159, 139, 234, 0.1)'
          },
          body: {
            padding: '2rem',
            maxHeight: '70vh',
            overflow: 'auto'
          }
        }}
      >
        {curriculumSuggestions && (
          <ScrollArea h={500}>
            <Stack gap="xl">
              {/* Materias Sugeridas */}
              <Paper p="lg" radius="md" style={{ border: '1px solid rgba(34, 197, 94, 0.2)', background: 'rgba(34, 197, 94, 0.05)' }}>
                <Group mb="md">
                  <IconBookmark size={20} color="#22C55E" />
                  <Text className="font-bebas text-lg text-[#1D1A05] tracking-wide">
                    MATERIAS SUGERIDAS
                  </Text>
                  <Badge color="green" size="sm">
                    {curriculumSuggestions.materias_sugeridas.length} nuevas
                  </Badge>
                </Group>
                <Stack gap="md">
                  {curriculumSuggestions.materias_sugeridas.map((materia, index) => (
                    <Card key={index} p="md" style={{ border: '1px solid rgba(34, 197, 94, 0.1)' }}>
                      <Group justify="space-between" mb="sm">
                        <Text className="font-roboto font-semibold text-sm">
                          {materia.nombre}
                        </Text>
                        <Badge color="blue" size="xs">
                          {materia.semestre_sugerido}
                        </Badge>
                      </Group>
                      <Text className="font-roboto text-sm text-gray-700 mb-2">
                        {materia.justificacion}
                      </Text>
                      <Group gap="xs">
                        <Text className="font-roboto text-xs font-semibold">Competencias:</Text>
                        {materia.competencias_desarrolladas.map((comp, i) => (
                          <Badge key={i} color="violet" size="xs" variant="light">
                            {comp}
                          </Badge>
                        ))}
                      </Group>
                    </Card>
                  ))}
                </Stack>
              </Paper>

              {/* Materias a Actualizar */}
              <Paper p="lg" radius="md" style={{ border: '1px solid rgba(245, 158, 11, 0.2)', background: 'rgba(245, 158, 11, 0.05)' }}>
                <Group mb="md">
                  <IconAnalyze size={20} color="#F59E0B" />
                  <Text className="font-bebas text-lg text-[#1D1A05] tracking-wide">
                    MATERIAS A ACTUALIZAR
                  </Text>
                  <Badge color="orange" size="sm">
                    {curriculumSuggestions.materias_actualizar.length} cambios
                  </Badge>
                </Group>
                <Stack gap="md">
                  {curriculumSuggestions.materias_actualizar.map((update, index) => (
                    <Card key={index} p="md" style={{ border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                      <Group justify="space-between" mb="sm">
                        <Text className="font-roboto font-semibold text-sm text-red-600">
                          {update.materia_actual}
                        </Text>
                        <Text className="font-roboto text-xs">→</Text>
                        <Text className="font-roboto font-semibold text-sm text-green-600">
                          {update.propuesta_cambio}
                        </Text>
                      </Group>
                      <Text className="font-roboto text-sm text-gray-700">
                        {update.razon}
                      </Text>
                    </Card>
                  ))}
                </Stack>
              </Paper>

              {/* Tecnologías Emergentes */}
              <Paper p="lg" radius="md" style={{ border: '1px solid rgba(147, 51, 234, 0.2)', background: 'rgba(147, 51, 234, 0.05)' }}>
                <Group mb="md">
                  <IconBulb size={20} color="#9333EA" />
                  <Text className="font-bebas text-lg text-[#1D1A05] tracking-wide">
                    TECNOLOGÍAS EMERGENTES
                  </Text>
                </Group>
                <Stack gap="md">
                  {curriculumSuggestions.tecnologias_emergentes.map((tech, index) => (
                    <Card key={index} p="md" style={{ border: '1px solid rgba(147, 51, 234, 0.1)' }}>
                      <Text className="font-roboto font-semibold text-sm mb-2">
                        {tech.tecnologia}
                      </Text>
                      <Text className="font-roboto text-sm text-gray-700 mb-2">
                        {tech.aplicacion}
                      </Text>
                      <Group gap="xs">
                        <Text className="font-roboto text-xs font-semibold">Afecta a:</Text>
                        {tech.materias_afectadas.map((materia, i) => (
                          <Badge key={i} color="purple" size="xs" variant="light">
                            {materia}
                          </Badge>
                        ))}
                      </Group>
                    </Card>
                  ))}
                </Stack>
              </Paper>

              {/* Habilidades Blandas */}
              <Paper p="lg" radius="md" style={{ border: '1px solid rgba(255, 54, 159, 0.2)', background: 'rgba(255, 54, 159, 0.05)' }}>
                <Group mb="md">
                  <IconUsers size={20} color="#FF369F" />
                  <Text className="font-bebas text-lg text-[#1D1A05] tracking-wide">
                    HABILIDADES BLANDAS
                  </Text>
                </Group>
                <Stack gap="md">
                  {curriculumSuggestions.habilidades_blandas.map((skill, index) => (
                    <Card key={index} p="md" style={{ border: '1px solid rgba(255, 54, 159, 0.1)' }}>
                      <Text className="font-roboto font-semibold text-sm mb-2">
                        {skill.habilidad}
                      </Text>
                      <Text className="font-roboto text-sm text-gray-700 mb-2">
                        <strong>Integración:</strong> {skill.forma_integracion}
                      </Text>
                      <Text className="font-roboto text-sm text-blue-600">
                        <strong>Impacto en empleabilidad:</strong> {skill.impacto_empleabilidad}
                      </Text>
                    </Card>
                  ))}
                </Stack>
              </Paper>
              {/* Botón de Descarga al final */}
            <Group justify="flex-end" mt="xl" pt="xl" style={{ borderTop: '1px solid #e9ecef' }}>
              <Button
                variant="outline"
                onClick={closeCurriculumAnalysis}
                color="gray"
              >
                Cerrar
              </Button>
              <Button
                leftSection={<IconDownload size={16} />}
                onClick={downloadCurriculumAnalysisPDF}
                loading={isDownloadingCurriculumPDF}
                disabled={isDownloadingCurriculumPDF}
                styles={{
                  root: {
                    background: 'linear-gradient(135deg, #9F8BEA, #4BCDF6)',
                    border: 'none',
                    color: 'white',
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 600,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4BCDF6, #9F8BEA)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(159, 139, 234, 0.3)'
                    },
                    transition: 'all 0.2s ease'
                  }
                }}
              >
                {isDownloadingCurriculumPDF ? 'Descargando PDF...' : 'Descargar Sugerencias PDF'}
              </Button>
            </Group>
            </Stack>
          </ScrollArea>
        )}
      </Modal>
    </div>
  );
}