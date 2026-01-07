import { useState, useRef, useEffect } from 'react';
import { 
  Card, 
  Grid, 
  Text, 
  Group, 
  ActionIcon,
  Loader,
  Alert,
  Modal,
  Button,
  Stack,
  Divider,
  ThemeIcon,
  List,
  SimpleGrid,
  Badge,
  ScrollArea,
  Paper,
  Textarea
} from '@mantine/core';
import { 
  IconTrendingUp, 
  IconUsers, 
  IconSchool, 
  IconRefresh,
  IconTarget,
  IconAlertTriangle,
  IconSparkles,
  IconBulb,
  IconChartBar,
  IconChecklist,
  IconAlertCircle,
  IconSearch,
  IconBookmark,
  IconStar,
  IconClipboardList,
  IconClock,
  IconMessageCircle,
  IconSend,
  IconDownload,
  IconX
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthenticatedFetch } from '../../hooks/useAuthenticatedFetch';

// Interfaces
interface AnalyticsData {
  totalStudents: number;
  studentCompletedTests: number;
  studentsJoinedByMonth: {
    [key: string]: number;
  };
}

interface AIAnalysisDocente {
  tipoGrafica: string;
  resumenEjecutivo: string;
  analisisCompleto: string;
  puntosClave: string[];
  hallazgosImportantes: Array<{
    hallazgo: string;
    impacto: string;
    dato: string;
    explicacion: string;
  }>;
  recomendaciones: Array<{
    accion: string;
    prioridad: string;
    justificacion: string;
  }>;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface ChatSession {
  conversationId: string;
  graphType: string;
  graphInfo: {
    tipo: string;
    descripcion: string;
    periodo: string;
    fuente: string;
  };
  messages: ChatMessage[];
}

interface GraphConfigDocente {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  source: 'PostHog';
  gradient: string;
}

const availableGraphsDocente: GraphConfigDocente[] = [
  {
    id: 'carreras-buscadas',
    title: 'Carreras más Buscadas',
    description: 'Qué carreras buscan más los estudiantes en el buscador de la app',
    icon: IconSearch,
    color: '#4BCDF6',
    source: 'PostHog',
    gradient: 'linear-gradient(135deg, #4BCDF6, #FF369F)'
  },
  {
    id: 'tags-guardados',
    title: 'Tags más Guardados',
    description: 'Categorías o etiquetas más guardadas por los estudiantes',
    icon: IconBookmark,
    color: '#FF369F',
    source: 'PostHog',
    gradient: 'linear-gradient(135deg, #FF369F, #FFAF21)'
  },
  {
    id: 'carreras-guardadas',
    title: 'Top 5 Carreras Guardadas',
    description: 'Las carreras que más guardan los estudiantes en favoritos',
    icon: IconStar,
    color: '#FFAF21',
    source: 'PostHog',
    gradient: 'linear-gradient(135deg, #FFAF21, #9F8BEA)'
  },
  {
    id: 'respuestas-quiz',
    title: 'Distribución de Respuestas del Quiz',
    description: 'Análisis de respuestas por sección del test vocacional',
    icon: IconClipboardList,
    color: '#9F8BEA',
    source: 'PostHog',
    gradient: 'linear-gradient(135deg, #9F8BEA, #4BCDF6)'
  },
  {
    id: 'tiempo-seccion-quiz',
    title: 'Tiempo por Sección del Quiz',
    description: 'Tiempo promedio que dedican a cada sección del test',
    icon: IconClock,
    color: '#4BCDF6',
    source: 'PostHog',
    gradient: 'linear-gradient(135deg, #4BCDF6, #9F8BEA)'
  }
];

export default function AnaliticasDocente() {
  const { authenticatedFetch } = useAuthenticatedFetch();

  // Estados para análisis con IA
  const [showGraphSelectionModal, setShowGraphSelectionModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisDocente | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [selectedGraph, setSelectedGraph] = useState<GraphConfigDocente | null>(null);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  // Estados para el chat sidebar
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [chatInputError, setChatInputError] = useState<string | null>(null);
  const [showChatTooltip, setShowChatTooltip] = useState(true);
  const [showGraphSuggestions, setShowGraphSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Query para obtener las analíticas
  const { data: analyticsData, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics'],
    queryFn: async (): Promise<AnalyticsData> => {
      const response = await authenticatedFetch('https://api.miraiedu.online/analytics');
      
      if (!response.ok) {
        throw new Error('Error al obtener las analíticas');
      }
      
      return response.json();
    },
  });

  // Auto-scroll en los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatSession?.messages]);

  // Ocultar tooltip después de 5 segundos
  useEffect(() => {
    if (showChatTooltip) {
      const timer = setTimeout(() => {
        setShowChatTooltip(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showChatTooltip]);

  // Calcular carreras sugeridas
  const suggestedCareers = analyticsData ? analyticsData.studentCompletedTests * 5 : 0;
  const successRate = analyticsData && analyticsData.totalStudents > 0
    ? ((analyticsData.studentCompletedTests / analyticsData.totalStudents) * 100).toFixed(1)
    : '0.0';

  // Detectar menciones de gráficas con @
  const detectGraphMention = (text: string) => {
    const match = text.match(/@(\w+)/);
    if (match) {
      const searchTerm = match[1].toLowerCase();
      return availableGraphsDocente.filter(g => 
        g.title.toLowerCase().includes(searchTerm) || 
        g.id.toLowerCase().includes(searchTerm) ||
        g.description.toLowerCase().includes(searchTerm)
      );
    }
    return [];
  };

  const suggestions = detectGraphMention(currentMessage);

  // Seleccionar gráfica desde sugerencia
  const selectGraphFromSuggestion = async (graph: GraphConfigDocente) => {
    setShowGraphSuggestions(false);
    
    try {
      const response = await fetch('http://localhost:4000/api/chat-docente/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graphType: graph.id }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Respuesta no-JSON:', text.substring(0, 200));
        throw new Error(`Error ${response.status}: El servidor no devolvió JSON válido`);
      }

      const data = await response.json();
      if (data.success) {
        setChatSession({
          conversationId: data.data.conversationId,
          graphType: graph.id,
          graphInfo: {
            tipo: graph.title,
            descripcion: graph.description,
            periodo: '',
            fuente: 'Docente'
          },
          messages: [{
            role: 'assistant',
            content: data.data.initialMessage.content || data.data.initialMessage,
            timestamp: data.data.timestamp
          }]
        });
        setSelectedGraph(graph);
        setCurrentMessage('');
        setChatInputError(null);
      } else {
        throw new Error(data.message || 'No se pudo iniciar el chat');
      }
    } catch (err: any) {
      console.error('Error al iniciar chat:', err);
      setChatInputError(err.message || 'Error al conectar con el chat');
    }
  };

  // Analizar gráfica con IA
  const analyzeWithAI = async (graphType: string, level: 'general' | 'profundo' = 'general') => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setShowGraphSelectionModal(false);
    setShowAnalysisModal(true);

    try {
      const response = await fetch('http://localhost:4000/api/analytics-docente/analyze-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graphType, level }),
      });

      if (!response.ok) {
        throw new Error('Error al obtener el análisis');
      }

      const data = await response.json();
      
      if (data.success) {
        setAiAnalysis(data.data.analysis);
      } else {
        throw new Error(data.message || 'Error al procesar el análisis');
      }
    } catch (error: any) {
      console.error('Error al analizar con IA:', error);
      setAnalysisError(error.message || 'Error al conectar con el servidor de análisis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGraphSelection = (graph: GraphConfigDocente) => {
    setSelectedGraph(graph);
    analyzeWithAI(graph.id, 'general');
  };

  const handleDeepAnalysis = () => {
    if (selectedGraph) {
      analyzeWithAI(selectedGraph.id, 'profundo');
    }
  };

  // Generar PDF del análisis
  const generateAnalysisPDF = async () => {
    if (!aiAnalysis || !selectedGraph) return;

    setIsDownloadingPDF(true);
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
        <div style="border-bottom: 2px solid #4BCDF6; padding-bottom: 20px; margin-bottom: 20px;">
          <h1 style="color: #4BCDF6; margin: 0 0 10px 0; font-size: 24px;">
            ANÁLISIS PEDAGÓGICO - ${selectedGraph.title}
          </h1>
          <p style="margin: 5px 0; color: #666;">
            <strong>Tipo:</strong> ${aiAnalysis.tipoGrafica}
          </p>
          <p style="margin: 5px 0; color: #666;">
            <strong>Fuente:</strong> ${selectedGraph.source}
          </p>
          <p style="margin: 5px 0; color: #666;">
            <strong>Fecha:</strong> ${new Date().toLocaleDateString('es-GT')}
          </p>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="color: #4BCDF6; font-size: 16px; margin-top: 0;">📋 RESUMEN EJECUTIVO</h2>
          <p style="background-color: #f0f9ff; padding: 15px; border-left: 4px solid #4BCDF6; margin: 0;">
            ${aiAnalysis.resumenEjecutivo}
          </p>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="color: #4BCDF6; font-size: 16px; margin-top: 0;">💡 PUNTOS CLAVE PEDAGÓGICOS</h2>
          <ul style="margin: 10px 0; padding-left: 20px;">
            ${aiAnalysis.puntosClave.map(punto => `
              <li style="margin: 8px 0; padding-left: 10px;">
                ${punto}
              </li>
            `).join('')}
          </ul>
        </div>

        ${aiAnalysis.hallazgosImportantes.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h2 style="color: #FF369F; font-size: 16px; margin-top: 0;">🔍 HALLAZGOS EDUCATIVOS IMPORTANTES</h2>
            ${aiAnalysis.hallazgosImportantes.map(hallazgo => `
              <div style="background-color: #fff5f7; padding: 12px; margin: 10px 0; border-left: 4px solid #FF369F; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; font-weight: bold; color: #FF369F;">
                  ${hallazgo.hallazgo}
                </p>
                <p style="margin: 0 0 5px 0; font-size: 11px; color: #666;">
                  <strong>Impacto:</strong> ${hallazgo.impacto.toUpperCase()}
                </p>
                <p style="margin: 0 0 5px 0; font-size: 11px; color: #666;">
                  <strong>Dato:</strong> ${hallazgo.dato}
                </p>
                <p style="margin: 0; font-size: 11px; color: #666;">
                  ${hallazgo.explicacion}
                </p>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div style="margin-bottom: 20px;">
          <h2 style="color: #4BCDF6; font-size: 16px; margin-top: 0;">📊 ANÁLISIS PEDAGÓGICO DETALLADO</h2>
          <p style="background-color: #f0f9ff; padding: 15px; border-left: 4px solid #4BCDF6; white-space: pre-wrap; margin: 0;">
            ${aiAnalysis.analisisCompleto}
          </p>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="color: #9F8BEA; font-size: 16px; margin-top: 0;">✅ RECOMENDACIONES PEDAGÓGICAS</h2>
          ${aiAnalysis.recomendaciones.map(rec => `
            <div style="background-color: #f5f3ff; padding: 12px; margin: 10px 0; border-left: 4px solid #9F8BEA; border-radius: 4px;">
              <p style="margin: 0 0 8px 0; font-weight: bold; color: #9F8BEA;">
                ${rec.accion}
              </p>
              <p style="margin: 0 0 5px 0; font-size: 11px; color: #666;">
                <strong>Prioridad:</strong> ${rec.prioridad.toUpperCase()}
              </p>
              <p style="margin: 0; font-size: 11px; color: #666;">
                ${rec.justificacion}
              </p>
            </div>
          `).join('')}
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

      pdf.save(`Analisis_${selectedGraph.title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
      document.body.removeChild(element);

      const { notifications } = await import('@mantine/notifications');
      notifications.show({
        title: '✅ PDF Generado',
        message: 'El análisis se ha descargado exitosamente',
        color: 'green',
        position: 'top-right',
        autoClose: 3000
      });
    } catch (error: any) {
      console.error('Error al generar PDF:', error);
      const { notifications } = await import('@mantine/notifications');
      notifications.show({
        title: '❌ Error al generar PDF',
        message: error.message || 'No se pudo generar el documento',
        color: 'red',
        position: 'top-right',
        autoClose: 3000
      });
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  // Enviar mensaje en el chat
  const sendChatMessage = async () => {
    if (!currentMessage.trim() || !chatSession || isSendingMessage) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: currentMessage,
      timestamp: new Date().toISOString()
    };

    setChatSession(prev => prev ? {
      ...prev,
      messages: [...prev.messages, userMessage]
    } : null);

    setCurrentMessage('');
    setIsSendingMessage(true);

    try {
      const response = await fetch('http://localhost:4000/api/chat-docente/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graphType: chatSession.graphType,
          message: currentMessage,
          conversationHistory: chatSession.messages,
          conversationId: chatSession.conversationId,
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('El servidor no devolvió JSON válido');
      }

      const data = await response.json();
      if (data.success) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.data.message,
          timestamp: data.data.timestamp
        };

        setChatSession(prev => prev ? {
          ...prev,
          conversationId: data.data.conversationId,
          messages: [...prev.messages, assistantMessage]
        } : null);
      } else {
        throw new Error(data.message || 'Error al procesar el mensaje');
      }
    } catch (err: any) {
      console.error('Error al enviar mensaje:', err);
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Lo siento, hubo un error al procesar tu mensaje: ${err.message}. Por favor intenta de nuevo.`,
        timestamp: new Date().toISOString()
      };

      setChatSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, errorMessage]
      } : null);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendChatMessage();
    }
  };

  const openChatSession = () => {
    setShowChatTooltip(false);
    const newSession: ChatSession = {
      conversationId: '',
      graphType: '',
      graphInfo: {
        tipo: 'Seleccionar gráfica',
        descripcion: '',
        periodo: '',
        fuente: 'Docente'
      },
      messages: []
    };
    setChatSession(newSession);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'alta': return 'red';
      case 'media': return 'yellow';
      case 'baja': return 'blue';
      default: return 'gray';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'alto': return 'red';
      case 'medio': return 'orange';
      case 'bajo': return 'blue';
      default: return 'gray';
    }
  };

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader size="xl" color="#4BCDF6" />
          <Text className="font-roboto text-gray-600 mt-4 text-lg">
            Cargando analíticas...
          </Text>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center p-6">
        <Alert 
          color="red" 
          title="Error al cargar las analíticas"
          icon={<IconAlertTriangle size={16} />}
          style={{ maxWidth: 500 }}
        >
          <Text className="font-roboto mb-4">
            Hubo un problema al cargar las analíticas. Por favor, intenta recargar la página.
          </Text>
          <ActionIcon
            onClick={() => refetch()}
            size="lg"
            style={{
              background: 'linear-gradient(135deg, #4BCDF6, #FF369F)',
              color: 'white'
            }}
          >
            <IconRefresh size={18} />
          </ActionIcon>
        </Alert>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      {/* CONTENIDO PRINCIPAL */}
      <div style={{ 
        flex: 1, 
        padding: '24px', 
        overflowY: 'auto',
        width: '100%'
      }}>
        {/* Modal de Selección de Gráficas */}
        <Modal
          opened={showGraphSelectionModal}
          onClose={() => setShowGraphSelectionModal(false)}
          title={
            <Group gap="xs">
              <ThemeIcon 
                size="lg" 
                radius="xl" 
                style={{ background: 'linear-gradient(135deg, #4BCDF6, #FF369F)' }}
              >
                <IconSparkles size={20} />
              </ThemeIcon>
              <Text className="font-bebas text-xl tracking-wide">
                SELECCIONA UNA GRÁFICA PARA ANALIZAR
              </Text>
            </Group>
          }
          size="xl"
          styles={{
            title: { width: '100%' },
            header: { paddingBottom: 16 }
          }}
        >
          <Stack gap="md">
            <Text className="font-roboto text-gray-600">
              Selecciona cualquier gráfica del dashboard de docente para obtener un análisis pedagógico con IA. 
              Después podrás profundizar en los detalles.
            </Text>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              {availableGraphsDocente.map((graph) => {
                const IconComponent = graph.icon;
                return (
                  <Card
                    key={graph.id}
                    shadow="sm"
                    padding="lg"
                    radius="md"
                    withBorder
                    style={{ 
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      border: '2px solid transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = graph.color;
                      e.currentTarget.style.transform = 'translateY(-4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'transparent';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    onClick={() => handleGraphSelection(graph)}
                  >
                    <Group gap="md" align="flex-start">
                      <ThemeIcon
                        size={50}
                        radius="md"
                        style={{ background: graph.gradient }}
                      >
                        <IconComponent size={28} />
                      </ThemeIcon>
                      <div style={{ flex: 1 }}>
                        <Group justify="space-between" mb="xs">
                          <Text className="font-bebas text-lg tracking-wide">
                            {graph.title}
                          </Text>
                          <Badge
                            variant="light"
                            color="violet"
                            styles={{ root: { fontFamily: 'Roboto, sans-serif' } }}
                          >
                            {graph.source}
                          </Badge>
                        </Group>
                        <Text className="font-roboto text-sm text-gray-600">
                          {graph.description}
                        </Text>
                      </div>
                    </Group>
                  </Card>
                );
              })}
            </SimpleGrid>
          </Stack>
        </Modal>

        {/* Modal de Análisis con IA */}
        <Modal
          opened={showAnalysisModal}
          onClose={() => {
            setShowAnalysisModal(false);
            setSelectedGraph(null);
            setAiAnalysis(null);
          }}
          title={
            <Group gap="xs">
              <ThemeIcon 
                size="lg" 
                radius="xl" 
                style={{ background: selectedGraph?.gradient || 'linear-gradient(135deg, #4BCDF6, #FF369F)' }}
              >
                <IconSparkles size={20} />
              </ThemeIcon>
              <div>
                <Text className="font-bebas text-xl tracking-wide">
                  ANÁLISIS PEDAGÓGICO CON IA
                </Text>
                {selectedGraph && (
                  <Group gap="xs">
                    <Text className="font-roboto text-sm text-gray-600">
                      {selectedGraph.title}
                    </Text>
                    <Badge
                      size="sm"
                      variant="light"
                      color="violet"
                    >
                      {selectedGraph.source}
                    </Badge>
                  </Group>
                )}
              </div>
            </Group>
          }
          size="xl"
          styles={{
            title: { width: '100%' },
            header: { paddingBottom: 16 }
          }}
        >
          {isAnalyzing ? (
            <div className="text-center py-12">
              <Loader size="xl" color="#4BCDF6" />
              <Text className="font-roboto text-gray-600 mt-4">
                Analizando datos con Inteligencia Artificial...
              </Text>
              <Text className="font-roboto text-sm text-gray-500 mt-2">
                Generando insights pedagógicos para docentes
              </Text>
            </div>
          ) : analysisError ? (
            <Alert color="red" icon={<IconAlertCircle size={16} />}>
              <Text className="font-roboto font-semibold mb-2">Error al obtener el análisis</Text>
              <Text className="font-roboto text-sm">{analysisError}</Text>
              <Button
                mt="md"
                onClick={() => setShowGraphSelectionModal(true)}
                variant="light"
              >
                Volver a seleccionar gráfica
              </Button>
            </Alert>
          ) : aiAnalysis ? (
            <Stack gap="lg">
              <Group justify="space-between">
                <Text className="font-roboto text-sm text-gray-600">
                  Este es un análisis general pedagógico. Profundiza para obtener más detalles educativos.
                </Text>
                <Button
                  leftSection={<IconSparkles size={16} />}
                  onClick={handleDeepAnalysis}
                  style={{
                    background: 'linear-gradient(135deg, #FF369F, #FFAF21)',
                    border: 'none'
                  }}
                  className="font-roboto"
                >
                  Profundizar Análisis
                </Button>
              </Group>

              <Divider />

              <Card shadow="sm" padding="lg" radius="md" style={{ background: selectedGraph?.gradient || 'linear-gradient(135deg, #4BCDF6, #FF369F)', color: 'white' }}>
                <Text className="font-bebas text-lg tracking-wide mb-2">
                  RESUMEN EJECUTIVO
                </Text>
                <Text className="font-roboto">
                  {aiAnalysis.resumenEjecutivo}
                </Text>
              </Card>

              <Card shadow="sm" padding="lg" radius="md">
                <Group gap="xs" mb="md">
                  <IconBulb size={20} style={{ color: '#FFAF21' }} />
                  <Text className="font-bebas text-lg tracking-wide">
                    PUNTOS CLAVE PEDAGÓGICOS
                  </Text>
                </Group>
                <List
                  spacing="sm"
                  icon={
                    <ThemeIcon color="cyan" size={24} radius="xl">
                      <IconChartBar size={16} />
                    </ThemeIcon>
                  }
                >
                  {aiAnalysis.puntosClave.map((punto, index) => (
                    <List.Item key={index}>
                      <Text className="font-roboto">{punto}</Text>
                    </List.Item>
                  ))}
                </List>
              </Card>

              {aiAnalysis.hallazgosImportantes.length > 0 && (
                <Card shadow="sm" padding="lg" radius="md">
                  <Text className="font-bebas text-lg tracking-wide mb-md">
                    HALLAZGOS EDUCATIVOS IMPORTANTES
                  </Text>
                  <Stack gap="md">
                    {aiAnalysis.hallazgosImportantes.map((hallazgo, index) => (
                      <Card key={index} padding="md" radius="md" withBorder>
                        <Group justify="apart" mb="xs">
                          <Badge color={getImpactColor(hallazgo.impacto)} variant="light">
                            Impacto {hallazgo.impacto}
                          </Badge>
                          <Badge variant="outline">{hallazgo.dato}</Badge>
                        </Group>
                        <Text className="font-roboto font-semibold mb-xs">
                          {hallazgo.hallazgo}
                        </Text>
                        <Text className="font-roboto text-sm text-gray-600">
                          {hallazgo.explicacion}
                        </Text>
                      </Card>
                    ))}
                  </Stack>
                </Card>
              )}

              <Card shadow="sm" padding="lg" radius="md">
                <Text className="font-bebas text-lg tracking-wide mb-md">
                  ANÁLISIS PEDAGÓGICO DETALLADO
                </Text>
                <Text className="font-roboto" style={{ whiteSpace: 'pre-line' }}>
                  {aiAnalysis.analisisCompleto}
                </Text>
              </Card>

              <Card shadow="sm" padding="lg" radius="md">
                <Group gap="xs" mb="md">
                  <IconChecklist size={20} style={{ color: '#9F8BEA' }} />
                  <Text className="font-bebas text-lg tracking-wide">
                    RECOMENDACIONES PEDAGÓGICAS
                  </Text>
                </Group>
                <Stack gap="md">
                  {aiAnalysis.recomendaciones.map((rec, index) => (
                    <Card key={index} padding="md" radius="md" withBorder>
                      <Group justify="apart" mb="xs">
                        <Badge color={getPriorityColor(rec.prioridad)}>
                          Prioridad {rec.prioridad}
                        </Badge>
                      </Group>
                      <Text className="font-roboto font-semibold mb-xs">
                        {rec.accion}
                      </Text>
                      <Divider my="xs" />
                      <Text className="font-roboto text-sm text-gray-600">
                        {rec.justificacion}
                      </Text>
                    </Card>
                  ))}
                </Stack>
              </Card>

              {/* Botones de acción al final */}
              <Group justify="space-between">
                <Button
                  variant="light"
                  onClick={() => {
                    setShowAnalysisModal(false);
                    setShowGraphSelectionModal(true);
                  }}
                >
                  Analizar otra gráfica
                </Button>
                <Button
                  leftSection={<IconDownload size={16} />}
                  onClick={generateAnalysisPDF}
                  loading={isDownloadingPDF}
                  disabled={isDownloadingPDF}
                  style={{
                    background: 'linear-gradient(135deg, #4BCDF6, #9F8BEA)',
                    border: 'none',
                    color: 'white'
                  }}
                  className="font-roboto"
                >
                  {isDownloadingPDF ? 'Descargando PDF...' : 'Generar PDF'}
                </Button>
              </Group>
            </Stack>
          ) : null}
        </Modal>

        {/* Header del Dashboard */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <Text 
                className="font-bebas text-4xl text-[#1D1A05] tracking-wide mb-2"
              >
                ANALÍTICAS DE DOCENTE
              </Text>
              <Text 
                className="font-roboto text-gray-600 text-lg"
              >
                Panel de control para seguimiento de estudiantes
              </Text>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                leftSection={<IconSparkles size={18} />}
                onClick={() => setShowGraphSelectionModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #4BCDF6, #FF369F)',
                  color: 'white',
                  border: 'none'
                }}
                className="font-roboto"
              >
                Analizar Gráficos
              </Button>
              <ActionIcon
                size="lg"
                onClick={() => refetch()}
                style={{
                  background: 'linear-gradient(135deg, #FF369F, #FFAF21)',
                  color: 'white'
                }}
                title="Actualizar datos"
              >
                <IconRefresh size={18} />
              </ActionIcon>
            </div>
          </div>

          {/* Métricas principales */}
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card 
                shadow="sm" 
                padding="lg" 
                radius="md"
                style={{ 
                  background: 'linear-gradient(135deg, #4BCDF6, #FF369F)',
                  color: 'white'
                }}
              >
                <Group justify="space-between">
                  <div>
                    <Text className="font-roboto text-sm opacity-90">Total Estudiantes</Text>
                    <Text className="font-bebas text-3xl tracking-wide">
                      {analyticsData?.totalStudents.toLocaleString() || 0}
                    </Text>
                  </div>
                  <IconUsers size={40} style={{ opacity: 0.8 }} />
                </Group>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card 
                shadow="sm" 
                padding="lg" 
                radius="md"
                style={{ 
                  background: 'linear-gradient(135deg, #FFAF21, #9F8BEA)',
                  color: 'white'
                }}
              >
                <Group justify="space-between">
                  <div>
                    <Text className="font-roboto text-sm opacity-90">Tests Completados</Text>
                    <Text className="font-bebas text-3xl tracking-wide">
                      {analyticsData?.studentCompletedTests.toLocaleString() || 0}
                    </Text>
                  </div>
                  <IconTarget size={40} style={{ opacity: 0.8 }} />
                </Group>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card 
                shadow="sm" 
                padding="lg" 
                radius="md"
                style={{ 
                  background: 'linear-gradient(135deg, #9F8BEA, #4BCDF6)',
                  color: 'white'
                }}
              >
                <Group justify="space-between">
                  <div>
                    <Text className="font-roboto text-sm opacity-90">Carreras Sugeridas</Text>
                    <Text className="font-bebas text-3xl tracking-wide">
                      {suggestedCareers.toLocaleString()}
                    </Text>
                  </div>
                  <IconSchool size={40} style={{ opacity: 0.8 }} />
                </Group>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card 
                shadow="sm" 
                padding="lg" 
                radius="md"
                style={{ 
                  background: 'linear-gradient(135deg, #FF369F, #FFAF21)',
                  color: 'white'
                }}
              >
                <Group justify="space-between">
                  <div>
                    <Text className="font-roboto text-sm opacity-90">Tasa de Éxito</Text>
                    <Text className="font-bebas text-3xl tracking-wide">
                      {successRate}%
                    </Text>
                  </div>
                  <IconTrendingUp size={40} style={{ opacity: 0.8 }} />
                </Group>
              </Card>
            </Grid.Col>
          </Grid>
        </div>

        {/* Gráficas del Dashboard */}
        <Grid>
          {/* PostHog Analytics - Docente */}
          <Grid.Col span={12}>
            <Card shadow="sm" padding="lg" radius="md" className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <Text className="font-bebas text-xl text-[#1D1A05] tracking-wide mb-1">
                    ANALÍTICAS EN TIEMPO REAL - DOCENTE
                  </Text>
                  <Text className="font-roboto text-sm text-gray-600">
                    Dashboard personalizado para seguimiento docente
                  </Text>
                </div>
                <Badge variant="light" color="violet" size="lg">
                  PostHog Analytics
                </Badge>
              </div>
              <div style={{ width: '100%', height: '800px', borderRadius: '8px', overflow: 'hidden' }}>
                <iframe
                  width="100%"
                  height="800"
                  style={{ border: 'none' }}
                  allowFullScreen
                  src="https://us.posthog.com/embedded/uxYIfqV3JS8pCdINmbr0xtia9JoeVg"
                  title="PostHog Analytics Dashboard - Docente"
                />
              </div>
            </Card>
          </Grid.Col>
        </Grid>
      </div>

      {/* SIDEBAR DEL CHAT - SOBREPUESTO */}
      {chatSession && (
        <div style={{
          position: 'fixed',
          right: 0,
          top: 0,
          width: '380px',
          height: '100vh',
          background: 'white',
          borderLeft: '1px solid #e9ecef',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-2px 0 12px rgba(0,0,0,0.15)',
          zIndex: 1000
        }}>
          {/* Header del Chat */}
          <div style={{
            padding: '16px',
            background: selectedGraph?.gradient || 'linear-gradient(135deg, #9F8BEA, #4BCDF6)',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.2)'
          }}>
            <Group gap="xs">
              <IconMessageCircle size={20} />
              <Text className="font-bebas text-lg tracking-wide" style={{ margin: 0 }}>
                CHAT CON IA
              </Text>
            </Group>
            <ActionIcon
              color="white"
              variant="subtle"
              onClick={() => {
                setChatSession(null);
                setSelectedGraph(null);
                setCurrentMessage('');
              }}
            >
              <IconX size={20} />
            </ActionIcon>
          </div>

          {/* Área de mensajes */}
          <ScrollArea 
            style={{ flex: 1, padding: '16px' }}
            type="auto"
            offsetScrollbars
          >
            <Stack gap="md">
              {chatSession.messages.map((message, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <Paper
                    shadow="xs"
                    p="md"
                    radius="md"
                    style={{
                      maxWidth: '85%',
                      background: message.role === 'user' 
                        ? selectedGraph?.gradient || 'linear-gradient(135deg, #4BCDF6, #FF369F)'
                        : '#f0f0f0',
                      color: message.role === 'user' ? 'white' : '#1D1A05',
                      border: message.role === 'assistant' ? '1px solid #e9ecef' : 'none'
                    }}
                  >
                    {message.role === 'assistant' && (
                      <Group gap="xs" mb="xs">
                        <ThemeIcon
                          size="sm"
                          radius="xl"
                          style={{ background: selectedGraph?.gradient }}
                        >
                          <IconSparkles size={12} />
                        </ThemeIcon>
                        <Text className="font-roboto text-xs font-semibold" style={{ margin: 0 }}>
                          IA
                        </Text>
                      </Group>
                    )}
                    <Text 
                      className="font-roboto" 
                      style={{ 
                        whiteSpace: 'pre-line',
                        fontSize: '0.85rem',
                        margin: 0
                      }}
                    >
                      {message.content}
                    </Text>
                    {message.timestamp && (
                      <Text 
                        className="font-roboto" 
                        style={{ 
                          fontSize: '0.65rem',
                          opacity: 0.6,
                          marginTop: '0.5rem'
                        }}
                      >
                        {new Date(message.timestamp).toLocaleTimeString('es-GT', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    )}
                  </Paper>
                </div>
              ))}
              
              {isSendingMessage && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <Paper
                    shadow="xs"
                    p="md"
                    radius="md"
                    style={{
                      background: '#f0f0f0',
                      border: '1px solid #e9ecef'
                    }}
                  >
                    <Group gap="xs">
                      <Loader size="xs" color="#4BCDF6" />
                      <Text className="font-roboto text-xs text-gray-600" style={{ margin: 0 }}>
                        Escribiendo...
                      </Text>
                    </Group>
                  </Paper>
                </div>
              )}
              <div ref={messagesEndRef} />
            </Stack>
          </ScrollArea>

          {/* Input de mensaje */}
          <div style={{
            padding: '16px',
            borderTop: '1px solid #e9ecef',
            background: 'white'
          }}>
            {!selectedGraph ? (
              <div>
                <Text className="font-roboto text-xs text-gray-600 mb-2" style={{ margin: 0 }}>
                  Escribe <strong>@nombre</strong> para seleccionar una gráfica
                </Text>
                <div style={{ position: 'relative' }}>
                  <Textarea
                    placeholder="@buscadas, @tags, @guardadas, @quiz, @tiempo..."
                    value={currentMessage}
                    onChange={(e) => {
                      setCurrentMessage(e.currentTarget.value);
                      setShowGraphSuggestions(e.currentTarget.value.includes('@'));
                    }}
                    disabled={isSendingMessage}
                    autosize
                    minRows={2}
                    maxRows={3}
                    styles={{
                      input: {
                        fontFamily: 'Roboto, sans-serif',
                        fontSize: '0.85rem'
                      }
                    }}
                  />

                  {/* Sugerencias de gráficas */}
                  {showGraphSuggestions && suggestions.length > 0 && (
                    <Paper
                      shadow="md"
                      p="xs"
                      radius="md"
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '1px solid #e9ecef',
                        maxHeight: '150px',
                        overflowY: 'auto',
                        zIndex: 1000,
                        marginBottom: '8px'
                      }}
                    >
                      <Stack gap="xs">
                        {suggestions.map((graph) => (
                          <Paper
                            key={graph.id}
                            p="xs"
                            radius="md"
                            style={{
                              background: '#f8f9fa',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              border: `1px solid ${graph.color}`,
                              borderLeft: `3px solid ${graph.color}`
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f0f0f0';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#f8f9fa';
                            }}
                            onClick={() => selectGraphFromSuggestion(graph)}
                          >
                            <Group gap="sm" align="center">
                              <ThemeIcon
                                size="sm"
                                radius="md"
                                style={{ background: graph.gradient }}
                              >
                                {<graph.icon size={14} />}
                              </ThemeIcon>
                              <div style={{ flex: 1 }}>
                                <Text className="font-roboto text-xs font-semibold" style={{ margin: 0 }}>
                                  {graph.title}
                                </Text>
                              </div>
                            </Group>
                          </Paper>
                        ))}
                      </Stack>
                    </Paper>
                  )}

                  {chatInputError && (
                    <Text className="font-roboto text-xs text-red-600 mt-1" style={{ margin: 0 }}>
                      {chatInputError}
                    </Text>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Gráfica seleccionada - ARRIBA DEL INPUT */}
                <Paper
                  p="md"
                  radius="md"
                  mb="md"
                  style={{
                    background: 'linear-gradient(135deg, rgba(75, 205, 246, 0.1), rgba(255, 54, 159, 0.1))',
                    border: `2px solid ${selectedGraph.color}`,
                    borderLeft: `4px solid ${selectedGraph.color}`
                  }}
                >
                  <Group justify="space-between" align="flex-start">
                    <Group gap="md" align="flex-start" style={{ flex: 1 }}>
                      <ThemeIcon
                        size={48}
                        radius="md"
                        style={{ background: selectedGraph.gradient }}
                      >
                        <selectedGraph.icon size={24} />
                      </ThemeIcon>
                      <div style={{ flex: 1 }}>
                        <Group gap="xs" mb={4}>
                          <Badge
                            size="sm"
                            variant="light"
                            color="violet"
                          >
                            {selectedGraph.source}
                          </Badge>
                        </Group>
                        <Text 
                          className="font-bebas tracking-wide" 
                          style={{ 
                            margin: 0, 
                            fontSize: '14px',
                            color: '#1D1A05'
                          }}
                        >
                          @ {selectedGraph.title}
                        </Text>
                      </div>
                    </Group>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      onClick={() => setSelectedGraph(null)}
                      title="Cambiar gráfica"
                    >
                      <IconX size={18} />
                    </ActionIcon>
                  </Group>
                </Paper>

                {/* Input de mensaje */}
                <Group gap="xs" align="flex-end">
                  <Textarea
                    placeholder="Pregunta sobre esta gráfica..."
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.currentTarget.value)}
                    onKeyDown={handleKeyPress}
                    disabled={isSendingMessage}
                    autosize
                    minRows={2}
                    maxRows={3}
                    style={{ flex: 1 }}
                    styles={{
                      input: {
                        fontFamily: 'Roboto, sans-serif',
                        fontSize: '0.85rem'
                      }
                    }}
                  />
                  <ActionIcon
                    onClick={sendChatMessage}
                    disabled={!currentMessage.trim() || isSendingMessage}
                    style={{
                      background: selectedGraph?.gradient,
                      border: 'none'
                    }}
                    size="lg"
                  >
                    <IconSend size={16} style={{ color: 'white' }} />
                  </ActionIcon>
                </Group>
              </>
            )}
          </div>
        </div>
      )}

      {/* Botón flotante para abrir chat */}
      {!chatSession && (
        <div style={{ position: 'relative' }}>
          {showChatTooltip && (
            <Paper
              shadow="md"
              p="md"
              radius="md"
              style={{
                position: 'fixed',
                bottom: '100px',
                right: '24px',
                background: 'white',
                maxWidth: '200px',
                border: '1px solid #e9ecef',
                zIndex: 999,
                animation: 'fadeInUp 0.3s ease'
              }}
            >
              <Text className="font-bebas text-sm tracking-wide mb-2" style={{ margin: 0, color: '#4BCDF6' }}>
                👋 ¡Hola!
              </Text>
              <Text className="font-roboto text-xs text-gray-600" style={{ margin: 0, lineHeight: 1.4 }}>
                Soy <strong>MiraiEdu</strong>, tu asistente de análisis. 
              </Text>
              <Text className="font-roboto text-xs text-gray-600 mt-2" style={{ margin: 0, lineHeight: 1.4 }}>
                ¿En qué puedo ayudarte?
              </Text>
            </Paper>
          )}
          
          <ActionIcon
            size="xl"
            radius="xl"
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              background: 'linear-gradient(135deg, #9F8BEA, #4BCDF6)',
              zIndex: 1000,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onClick={openChatSession}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
          >
            <IconMessageCircle size={24} style={{ color: 'white' }} />
          </ActionIcon>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}