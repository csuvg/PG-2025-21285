import { useState } from 'react';
import { 
  Card, 
  Grid, 
  Text, 
  Group, 
  Badge, 
  Stack,
  Select,
  ActionIcon,
  Button,
  Modal,
  TextInput,
  Textarea,
  Avatar,
  Container,
  Paper,
  Tooltip,
  ScrollArea,
  Loader,
  Alert,
  MultiSelect
} from '@mantine/core';
import { 
  IconPlus,
  IconSearch,
  IconFilter,
  IconEdit,
  IconTrash,
  IconUser,
  IconCalendar,
  IconAlertTriangle,
  IconQuote,
  IconEye,
  IconRefresh
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthenticatedFetch } from '../../hooks/useAuthenticatedFetch';
import { useUser } from '@clerk/clerk-react';

// Interfaces actualizadas para el API real
interface Tag {
  id: string;
  name: string;
}

interface Carrera {
  id: string;
  name: string;
}

// Interface para las carreras desde la API (como en foros)
interface CareerFromAPI {
  _id: string;
  name: string;
  faculty: string;
  description: string;
  duration: number;
  employability: string;
}

interface CareersResponse {
  careers: CareerFromAPI[];
}

interface DisplayData {
  carrera: Carrera;
  egresado: string;
  experiencia: string;
  tags: Tag[];
}

interface Testimonio {
  _id: string;
  type: string;
  title: string;
  content: string;
  display_data: DisplayData;
  created_at: string;
  updated_at: string;
  tags: string[];
}

interface TestimoniesResponse {
  message: string;
  testimonies: Testimonio[];
}

// Interface para el formulario actualizada
interface NewTestimonioForm {
  title: string;
  content: string;
  egresado: string;
  carrera: string;
  tags: string[];
}

// Interface para crear testimonio
interface CreateTestimonioRequest {
  type: string;
  title: string;
  content: string;
  display_data: {
    carrera: {
      id: string;
      name: string;
    };
    egresado: string;
    experiencia: string;
    tags: Tag[];
  };
}

// Interface para actualizar testimonio
interface UpdateTestimonioRequest {
  type: string;
  title: string;
  content: string;
  display_data: {
    carrera: {
      id: string;
      name: string;
    };
    egresado: string;
    experiencia: string;
    tags: Tag[];
  };
}

// Tags disponibles (mantenemos estos hardcodeados como especificaste)
const availableTags: Tag[] = [
  { id: "68e04b02ae67287b8834d198", name: "biology" },
  { id: "68e04b02ae67287b8834d196", name: "lab" },
  { id: "68e04b02ae67287b8834d194", name: "fieldwork" },
  { id: "68e04b02ae67287b8834d191", name: "stats" },
  { id: "68e04b02ae67287b8834d18c", name: "social" },
  { id: "68e04b02ae67287b8834d183", name: "problem solving" },
  { id: "68e04b02ae67287b8834d18a", name: "investigative" },
  { id: "68e04b02ae67287b8834d189", name: "realistic" },
  { id: "68e04b02ae67287b8834d185", name: "conscientiousness" }
];

export default function Testimoniosegresdos() {
  const { authenticatedFetch } = useAuthenticatedFetch();
  const queryClient = useQueryClient();
  const { user: clerkUser } = useUser();
  const [opened, { open, close }] = useDisclosure(false);
  const [viewModalOpened, { open: openView, close: closeView }] = useDisclosure(false);
  const [testimonioTextModalOpened, { open: openTestimonioText, close: closeTestimonioText }] = useDisclosure(false);
  const [selectedCareer, setSelectedCareer] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTestimonioId, setEditingTestimonioId] = useState<string | null>(null);
  const [selectedTestimonio, setSelectedTestimonio] = useState<Testimonio | null>(null);
  const [selectedTestimonioText, setSelectedTestimonioText] = useState<string>('');
  const [selectedTestimonioAuthor, setSelectedTestimonioAuthor] = useState<string>('');

  // Estados del formulario actualizados
  const [newTestimonio, setNewTestimonio] = useState<NewTestimonioForm>({
    title: '',
    content: '',
    egresado: '',
    carrera: '',
    tags: []
  });

  // Obtener el careersId del usuario (funciona para director y docente)
  const userCareerIds = (clerkUser?.unsafeMetadata?.careersId as string[]) || [];
  const hasAssignedCareers = userCareerIds.length > 0;

  // Query para obtener las carreras desde la API (con filtrado)
  const { data: careersData, isLoading: careersLoading, error: careersError } = useQuery({
    queryKey: ['careers', userCareerIds],
    queryFn: async (): Promise<CareersResponse> => {
      const response = await authenticatedFetch('https://api.miraiedu.online/careers');
      
      if (!response.ok) {
        throw new Error('Error al obtener las carreras');
      }
      
      const data = await response.json();
      
      // Si tiene carreras asignadas (director o docente), filtrar solo esas
      if (hasAssignedCareers && data.careers) {
        const filteredCareers = data.careers.filter((career: CareerFromAPI) => 
          userCareerIds.includes(career._id)
        );
        return { careers: filteredCareers };
      }
      
      // Si no tiene carreras asignadas (admin), devolver todas
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Query para obtener testimonios (con filtrado)
  const { 
    data: testimoniosData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['testimonios', userCareerIds],
    queryFn: async (): Promise<TestimoniesResponse> => {
      const response = await authenticatedFetch(
        'https://api.miraiedu.online/testimonies'
      );
      
      if (!response.ok) {
        throw new Error('Error al obtener los testimonios');
      }
      
      const data = await response.json();
      
      // Si tiene carreras asignadas (director o docente), filtrar solo testimonios de esas carreras
      if (hasAssignedCareers && data.testimonies) {
        const filteredTestimonies = data.testimonies.filter((testimony: Testimonio) => 
          testimony.display_data?.carrera?.id && userCareerIds.includes(testimony.display_data.carrera.id)
        );
        return { ...data, testimonies: filteredTestimonies };
      }
      
      // Si no tiene carreras asignadas (admin), devolver todos
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Mutation para crear testimonio
  const createTestimonioMutation = useMutation({
    mutationFn: async (data: CreateTestimonioRequest) => {
      const response = await authenticatedFetch(
        'https://api.miraiedu.online/explore/cards',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al crear el testimonio');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonios'] });
      notifications.show({
        title: '¡Éxito!',
        message: 'El testimonio ha sido creado exitosamente.',
        color: 'teal',
        icon: <IconUser size={16} />,
        autoClose: 4000,
      });
      close();
      resetForm();
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'No se pudo crear el testimonio. Intenta nuevamente.',
        color: 'red',
        icon: <IconAlertTriangle size={16} />,
        autoClose: 4000,
      });
    },
  });

  // Mutation para actualizar testimonio
  const updateTestimonioMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTestimonioRequest }) => {
      const response = await authenticatedFetch(
        `https://api.miraiedu.online/explore/cards/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al actualizar el testimonio');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonios'] });
      notifications.show({
        title: '¡Actualizado!',
        message: 'El testimonio ha sido actualizado exitosamente.',
        color: 'blue',
        icon: <IconEdit size={16} />,
        autoClose: 4000,
      });
      close();
      resetForm();
      setIsEditing(false);
      setEditingTestimonioId(null);
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Error al actualizar',
        message: error.message || 'No se pudo actualizar el testimonio. Intenta nuevamente.',
        color: 'red',
        icon: <IconAlertTriangle size={16} />,
        autoClose: 4000,
      });
    },
  });

  // Mutation para eliminar testimonio
  const deleteTestimonioMutation = useMutation({
    mutationFn: async (testimonioId: string) => {
      const response = await authenticatedFetch(
        `https://api.miraiedu.online/explore/cards/${testimonioId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al eliminar el testimonio');
      }

      return response.json();
    },
    onSuccess: (_) => {
      queryClient.invalidateQueries({ queryKey: ['testimonios'] });
      notifications.show({
        title: '¡Eliminado!',
        message: 'El testimonio ha sido eliminado exitosamente.',
        color: 'red',
        icon: <IconTrash size={16} />,
        autoClose: 4000,
      });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Error al eliminar',
        message: error.message || 'No se pudo eliminar el testimonio. Intenta nuevamente.',
        color: 'red',
        icon: <IconAlertTriangle size={16} />,
        autoClose: 4000,
      });
    },
  });

  // Extraer datos de testimonios
  const testimonios = testimoniosData?.testimonies || [];

  // Preparar carreras para el select del modal (desde la API)
  const availableCareers = (careersData?.careers && Array.isArray(careersData.careers)) 
    ? careersData.careers.map(career => ({
        id: career._id,
        name: career.name
      })) 
    : [];

  // Obtener carreras únicas para el filtro (desde los testimonios existentes)
  const uniqueCareers = Array.from(
  new Set(
    testimonios
      .filter(t => t.display_data?.carrera?.name)
      .map(t => t.display_data.carrera.name)
  )
).map(careerName => ({
  value: careerName,
  label: careerName
}));
  const careers = [
    { value: 'all', label: 'Todas las Carreras' },
    ...uniqueCareers
  ];

  // Obtener tags únicos para el filtro
  const allTags = testimonios
  .filter(t => t?.display_data?.tags && Array.isArray(t.display_data.tags))
  .flatMap(t => t.display_data.tags);
  
const uniqueTags = Array.from(
  new Map(allTags.map(tag => [tag.id, tag])).values()
).map(tag => ({
  value: tag.id,
  label: tag.name
}));

  // Filtrar testimonios
const filteredTestimonios = testimonios.filter(testimonio => {
  // Validar que display_data existe
  if (!testimonio?.display_data) return false;
  
  const matchesCareer = selectedCareer === 'all' || testimonio.display_data.carrera?.name === selectedCareer;
  const matchesSearch = 
    testimonio.display_data.egresado?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    testimonio.display_data.experiencia?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    testimonio.display_data.carrera?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  
  const matchesTags = selectedTags.length === 0 || 
    selectedTags.some(tagId => 
      testimonio.display_data?.tags?.some(tag => tag.id === tagId)
    );
  
  return matchesCareer && matchesSearch && matchesTags;
});

  // Función para resetear formulario
  const resetForm = () => {
    setNewTestimonio({
      title: '',
      content: '',
      egresado: '',
      carrera: '',
      tags: []
    });
    setIsEditing(false);
    setEditingTestimonioId(null);
  };

  // Función para obtener iniciales del nombre
  const getInitials = (nombreCompleto: string) => {
    const nombres = nombreCompleto.trim().split(' ');
    if (nombres.length >= 2) {
      return `${nombres[0][0]}${nombres[nombres.length - 1][0]}`.toUpperCase();
    }
    return nombreCompleto.slice(0, 2).toUpperCase();
  };

  // Función para abrir modal de agregar
  const handleAddTestimonio = () => {
    setIsEditing(false);
    setEditingTestimonioId(null);
    resetForm();
    open();
  };

  // Función para abrir modal de editar
  const handleEditTestimonio = (testimonio: Testimonio) => {
    setIsEditing(true);
    setEditingTestimonioId(testimonio._id);
    
    // Cargar datos del testimonio en el formulario
    setNewTestimonio({
      title: testimonio.title,
      content: testimonio.content,
      egresado: testimonio.display_data.egresado,
      carrera: testimonio.display_data.carrera.id,
      tags: testimonio.display_data.tags.map(tag => tag.id)
    });
    
    open();
  };

  // Función para crear o actualizar testimonio
  const handleSubmitTestimonio = () => {
    // Validaciones
    if (!newTestimonio.title.trim()) {
      notifications.show({
        title: 'Error de validación',
        message: 'El título es obligatorio.',
        color: 'red',
        autoClose: 3000,
      });
      return;
    }

    if (!newTestimonio.content.trim()) {
      notifications.show({
        title: 'Error de validación',
        message: 'El contenido es obligatorio.',
        color: 'red',
        autoClose: 3000,
      });
      return;
    }

    if (!newTestimonio.egresado.trim()) {
      notifications.show({
        title: 'Error de validación',
        message: 'El nombre del egresado es obligatorio.',
        color: 'red',
        autoClose: 3000,
      });
      return;
    }

    if (!newTestimonio.carrera) {
      notifications.show({
        title: 'Error de validación',
        message: 'Debe seleccionar una carrera.',
        color: 'red',
        autoClose: 3000,
      });
      return;
    }

    // Encontrar la carrera seleccionada desde la API
    const selectedCareerData = availableCareers.find(career => career.id === newTestimonio.carrera);
    if (!selectedCareerData) {
      notifications.show({
        title: 'Error',
        message: 'Carrera no válida.',
        color: 'red',
        autoClose: 3000,
      });
      return;
    }

    // Obtener tags seleccionados
    const selectedTagsData = availableTags.filter(tag => newTestimonio.tags.includes(tag.id));

    // Preparar datos para la API
    const testimonioData = {
      type: "testimony",
      title: newTestimonio.title.trim(),
      content: newTestimonio.content.trim(),
      display_data: {
        carrera: {
          id: selectedCareerData.id,
          name: selectedCareerData.name
        },
        egresado: newTestimonio.egresado.trim(),
        experiencia: newTestimonio.content.trim(),
        tags: selectedTagsData
      }
    };

    // Ejecutar mutation según el modo (crear o editar)
    if (isEditing && editingTestimonioId) {
      updateTestimonioMutation.mutate({
        id: editingTestimonioId,
        data: testimonioData
      });
    } else {
      createTestimonioMutation.mutate(testimonioData);
    }
  };

  // Función para ver testimonio completo
  const handleViewTestimonio = (testimonio: Testimonio) => {
    setSelectedTestimonio(testimonio);
    openView();
  };

  // Función para abrir el modal de testimonio texto
  const handleViewTestimonioText = (testimonio: Testimonio) => {
    setSelectedTestimonioText(testimonio.display_data.experiencia);
    setSelectedTestimonioAuthor(testimonio.display_data.egresado);
    openTestimonioText();
  };

  // Función para eliminar testimonio actualizada
  const handleDeleteTestimonio = (testimonioId: string, testimonioNombre: string) => {
    modals.openConfirmModal({
      title: (
        <Group gap="sm">
          <IconAlertTriangle size={24} color="#FF369F" />
          <Text className="font-bebas text-xl text-[#1D1A05] tracking-wide">
            CONFIRMAR ELIMINACIÓN
          </Text>
        </Group>
      ),
      children: (
        <Text className="font-roboto text-gray-700 text-base py-4">
          ¿Está seguro que desea eliminar el testimonio de{' '}
          <Text component="span" className="font-semibold text-[#1D1A05]">
            "{testimonioNombre}"
          </Text>
          ? Esta acción no se puede deshacer.
        </Text>
      ),
      labels: { 
        confirm: 'Sí, Eliminar', 
        cancel: 'Cancelar' 
      },
      confirmProps: { 
        color: 'red',
        size: 'md',
        loading: deleteTestimonioMutation.isPending,
      },
      onConfirm: () => {
        deleteTestimonioMutation.mutate(testimonioId);
      },
      centered: true,
    });
  };

  // Función para limpiar filtros
  const clearFilters = () => {
    setSelectedCareer('all');
    setSearchQuery('');
    setSelectedTags([]);
  };

  // Función para refrescar datos
  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['careers'] });
    notifications.show({
      title: 'Actualizado',
      message: 'Los testimonios han sido actualizados.',
      color: 'blue',
      icon: <IconRefresh size={16} />,
      autoClose: 2000,
    });
  };

  if (error || careersError) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center p-6">
        <Alert 
          color="red" 
          title="Error al cargar datos"
          icon={<IconAlertTriangle size={16} />}
          style={{ maxWidth: 500 }}
        >
          <Text className="font-roboto mb-4">
            {error ? 'No se pudieron cargar los testimonios.' : 'No se pudieron cargar las carreras.'} Por favor, intenta nuevamente.
          </Text>
          <Button onClick={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ['careers'] });
          }} variant="outline" color="red">
            Reintentar
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Header fijo */}
      <div 
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm"
        style={{ 
          backdropFilter: 'blur(10px)'
        }}
      >
        <Container size="xl" className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <Text className="font-bebas text-4xl text-[#1D1A05] tracking-wide mb-2">
                TESTIMONIOS DE EGRESADOS
              </Text>
              <Text className="font-roboto text-gray-600 text-lg">
                Historias de éxito de nuestros graduados
              </Text>
            </div>
            
            <Group>
              <Button
                onClick={handleRefresh}
                variant="outline"
                leftSection={<IconRefresh size={16} />}
                loading={isLoading}
                styles={{
                  root: {
                    borderColor: '#4BCDF6',
                    color: '#4BCDF6',
                    fontFamily: 'Roboto, sans-serif',
                    '&:hover': {
                      backgroundColor: 'rgba(75, 205, 246, 0.1)',
                    }
                  }
                }}
              >
                Actualizar
              </Button>
              
              <Button
                onClick={handleAddTestimonio}
                size="lg"
                leftSection={<IconPlus size={20} />}
                styles={{
                  root: {
                    background: 'linear-gradient(135deg, #4BCDF6, #FF369F)',
                    border: 'none',
                    color: 'white',
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 600,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #FF369F, #4BCDF6)',
                      transform: 'translateY(-2px)',
                    }
                  }
                }}
                className="shadow-lg transition-all duration-300"
              >
                Agregar Testimonio
              </Button>
            </Group>
          </div>

          {/* Filtros */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <TextInput
                placeholder="Buscar por nombre, carrera o experiencia..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                leftSection={<IconSearch size={16} color="#4BCDF6" />}
                styles={{
                  input: {
                    fontFamily: 'Roboto, sans-serif',
                    border: '2px solid #f0f0f0',
                    '&:focus': { borderColor: '#4BCDF6' }
                  }
                }}
              />
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Select
                placeholder="Filtrar por carrera"
                data={careers}
                value={selectedCareer}
                onChange={(value) => setSelectedCareer(value || 'all')}
                leftSection={<IconFilter size={16} color="#9F8BEA" />}
                styles={{
                  input: {
                    fontFamily: 'Roboto, sans-serif',
                    border: '2px solid #f0f0f0',
                    '&:focus': { borderColor: '#9F8BEA' }
                  }
                }}
              />
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 3 }}>
              <MultiSelect
                placeholder="Filtrar por etiquetas"
                data={uniqueTags}
                value={selectedTags}
                onChange={setSelectedTags}
                leftSection={<IconFilter size={16} color="#FFAF21" />}
                styles={{
                  input: {
                    fontFamily: 'Roboto, sans-serif',
                    border: '2px solid #f0f0f0',
                    '&:focus': { borderColor: '#FFAF21' }
                  }
                }}
              />
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 2 }}>
              <Group justify="space-between" align="center" h="100%">
                <Text className="font-roboto text-sm text-gray-600">
                  {filteredTestimonios.length} testimonio{filteredTestimonios.length !== 1 ? 's' : ''}
                </Text>
                {(selectedCareer !== 'all' || searchQuery || selectedTags.length > 0) && (
                  <Button
                    size="xs"
                    variant="subtle"
                    onClick={clearFilters}
                  >
                    Limpiar
                  </Button>
                )}
              </Group>
            </Grid.Col>
          </Grid>
        </Container>
      </div>

      {/* Contenido de testimonios */}
      <Container size="xl" className="p-6">
        {isLoading ? (
          <div className="text-center py-12">
            <Loader size="xl" color="#4BCDF6" />
            <Text className="font-roboto text-gray-600 mt-4 text-lg">
              Cargando testimonios...
            </Text>
          </div>
        ) : (
          <Grid>
            {filteredTestimonios.map((testimonio) => (
              <Grid.Col key={testimonio._id} span={{ base: 12, lg: 6 }}>
                <Card 
                  shadow="sm" 
                  padding="xl" 
                  radius="md"
                  className="h-full hover:shadow-lg transition-all duration-300"
                  style={{
                    border: '1px solid rgba(75, 205, 246, 0.1)',
                    '&:hover': {
                      borderColor: 'rgba(75, 205, 246, 0.3)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  {/* Header del testimonio */}
                  <Group justify="space-between" mb="md">
                    <Group>
                      <Badge
                        variant="light"
                        styles={{
                          root: {
                            background: 'linear-gradient(135deg, rgba(75, 205, 246, 0.1), rgba(255, 54, 159, 0.1))',
                            color: '#4BCDF6',
                            fontFamily: 'Roboto, sans-serif',
                            fontWeight: 600
                          }
                        }}
                      >
                        {testimonio.display_data.carrera.name}
                      </Badge>
                    </Group>
                    
                    <Group gap="xs">
                      <Tooltip label="Ver testimonio completo">
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="green"
                          style={{ color: '#FFAF21' }}
                          onClick={() => handleViewTestimonio(testimonio)}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Editar testimonio">
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="blue"
                          style={{ color: '#4BCDF6' }}
                          onClick={() => handleEditTestimonio(testimonio)}
                          loading={updateTestimonioMutation.isPending && editingTestimonioId === testimonio._id}
                          disabled={updateTestimonioMutation.isPending}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Eliminar testimonio">
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="red"
                          style={{ color: '#FF369F' }}
                          onClick={() => handleDeleteTestimonio(testimonio._id, testimonio.display_data.egresado)}
                          loading={deleteTestimonioMutation.isPending}
                          disabled={deleteTestimonioMutation.isPending}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Group>

                  {/* Información del egresado */}
                  <Group mb="md">
                    <Avatar
                      size="lg"
                      style={{
                        background: 'linear-gradient(135deg, #9F8BEA, #FFAF21)'
                      }}
                    >
                      {getInitials(testimonio.display_data.egresado)}
                    </Avatar>
                    <div style={{ flex: 1 }}>
                      <Text className="font-bebas text-lg text-[#1D1A05] tracking-wide">
                        {testimonio.display_data.egresado}
                      </Text>
                      <Text className="font-roboto text-sm text-gray-500">
                        {testimonio.display_data.carrera.name}
                      </Text>
                    </div>
                  </Group>

                  {/* Tags */}
                  {testimonio.display_data.tags.length > 0 && (
                    <Group gap="xs" mb="md">
                      {testimonio.display_data.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag.id}
                          size="xs"
                          variant="outline"
                          styles={{
                            root: {
                              borderColor: '#9F8BEA',
                              color: '#9F8BEA',
                              fontFamily: 'Roboto, sans-serif'
                            }
                          }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                      {testimonio.display_data.tags.length > 3 && (
                        <Badge
                          size="xs"
                          variant="light"
                          color="gray"
                        >
                          +{testimonio.display_data.tags.length - 3}
                        </Badge>
                      )}
                    </Group>
                  )}

                  {/* Testimonio (preview) */}
                  <Paper
                    p="md"
                    mb="md"
                    onClick={() => handleViewTestimonioText(testimonio)}
                    style={{
                      background: 'rgba(75, 205, 246, 0.05)',
                      border: '1px solid rgba(75, 205, 246, 0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                    className="hover:bg-blue-50 hover:border-blue-200 hover:shadow-md"
                  >
                    <Group mb="xs">
                      <IconQuote size={16} color="#4BCDF6" />
                      <Text className="font-roboto text-xs font-medium text-gray-600">
                        EXPERIENCIA - Click para ver completo
                      </Text>
                    </Group>
                    <Text 
                      className="font-roboto text-sm text-gray-700 italic"
                      lineClamp={3}
                    >
                      "{testimonio.display_data.experiencia}"
                    </Text>
                    
                    <div className="flex justify-end mt-2">
                      <Text className="font-roboto text-xs text-blue-500 font-medium">
                        Ver experiencia completa →
                      </Text>
                    </div>
                  </Paper>

                  {/* Footer */}
                  <Group justify="space-between" align="center">
                    <Group gap="xs">
                      <IconCalendar size={14} color="#6b7280" />
                      <Text className="font-roboto text-xs text-gray-500">
                        Agregado: {new Date(testimonio.created_at).toLocaleDateString()}
                      </Text>
                    </Group>
                    
                    <Button
                      variant="light"
                      size="xs"
                      onClick={() => handleViewTestimonio(testimonio)}
                      styles={{
                        root: {
                          color: '#4BCDF6',
                          fontFamily: 'Roboto, sans-serif'
                        }
                      }}
                    >
                      Ver completo
                    </Button>
                  </Group>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        )}

        {/* Estado vacío */}
        {!isLoading && filteredTestimonios.length === 0 && (
          <div className="text-center py-12">
            <IconUser size={64} color="#9ca3af" style={{ margin: '0 auto 1rem' }} />
            <Text className="font-bebas text-xl text-gray-500 mb-2">
              NO SE ENCONTRARON TESTIMONIOS
            </Text>
            <Text className="font-roboto text-gray-400 mb-4">
              {testimonios.length === 0 
                ? 'Aún no hay testimonios registrados'
                : 'No se encontraron testimonios que coincidan con los filtros seleccionados'
              }
            </Text>
            {(selectedCareer !== 'all' || searchQuery || selectedTags.length > 0) && (
              <Button
                onClick={clearFilters}
                variant="outline"
                styles={{
                  root: {
                    borderColor: '#4BCDF6',
                    color: '#4BCDF6',
                    fontFamily: 'Roboto, sans-serif'
                  }
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        )}
      </Container>

      {/* Modal para agregar/editar testimonio */}
      <Modal
        opened={opened}
        onClose={() => {
          close();
          resetForm();
        }}
        title={
          <Group>
            {isEditing ? <IconEdit size={24} color="#4BCDF6" /> : <IconPlus size={24} color="#4BCDF6" />}
            <Text className="font-bebas text-xl text-[#1D1A05] tracking-wide">
              {isEditing ? 'EDITAR TESTIMONIO' : 'AGREGAR NUEVO TESTIMONIO'}
            </Text>
          </Group>
        }
        size="lg"
        styles={{
          header: {
            backgroundColor: '#f8f9fa',
            borderBottom: '2px solid rgba(75, 205, 246, 0.1)'
          },
          body: {
            padding: '2rem'
          }
        }}
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          handleSubmitTestimonio();
        }}>
          <Stack gap="md">
            {/* Título */}
            <TextInput
              label="Título del Testimonio"
              placeholder="Ej: Mi experiencia en la industria química"
              value={newTestimonio.title}
              onChange={(e) => {
                const { value } = e.target;
                setNewTestimonio(prev => ({ ...prev, title: value }));
              }}
              required
              styles={{
                label: {
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: '14px',
                  color: '#1D1A05',
                  letterSpacing: '0.5px'
                },
                input: {
                  fontFamily: 'Roboto, sans-serif',
                  border: '2px solid #f0f0f0',
                  '&:focus': { borderColor: '#4BCDF6' }
                }
              }}
            />

            {/* Nombre del egresado */}
            <TextInput
              label="Nombre del Egresado"
              placeholder="Ej: Luis Armando Jocol"
              value={newTestimonio.egresado}
              onChange={(e) => {
                const { value } = e.target;
                setNewTestimonio(prev => ({ ...prev, egresado: value }));
              }}
              required
              styles={{
                label: {
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: '14px',
                  color: '#1D1A05',
                  letterSpacing: '0.5px'
                },
                input: {
                  fontFamily: 'Roboto, sans-serif',
                  border: '2px solid #f0f0f0',
                  '&:focus': { borderColor: '#4BCDF6' }
                }
              }}
            />

            {/* Carrera */}
            <Select
              label="Carrera"
              placeholder={careersLoading ? "Cargando carreras..." : "Selecciona la carrera del egresado"}
              data={availableCareers.map(career => ({
                value: career.id,
                label: career.name
              }))}
              value={newTestimonio.carrera}
              onChange={(value) => {
                if (value !== null) {
                  setNewTestimonio(prev => ({ ...prev, carrera: value }));
                }
              }}
              required
              searchable
              clearable
              disabled={careersLoading}
              rightSection={careersLoading ? <Loader size={16} /> : undefined}
              styles={{
                label: {
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: '14px',
                  color: '#1D1A05',
                  letterSpacing: '0.5px'
                },
                input: {
                  fontFamily: 'Roboto, sans-serif',
                  border: '2px solid #f0f0f0',
                  '&:focus': { borderColor: '#9F8BEA' }
                }
              }}
            />

            {/* Mostrar error si hay problemas cargando carreras */}
            {careersError && (
              <Alert 
                color="orange" 
                title="Advertencia"
                icon={<IconAlertTriangle size={16} />}
                styles={{
                  root: {
                    background: 'rgba(255, 175, 33, 0.1)',
                    border: '1px solid rgba(255, 175, 33, 0.3)'
                  }
                }}
              >
                <Text className="font-roboto text-sm">
                  Error al cargar las carreras. Por favor, recarga la página e intenta nuevamente.
                </Text>
              </Alert>
            )}

            {/* Tags */}
            <MultiSelect
              label="Etiquetas"
              placeholder="Selecciona las etiquetas que mejor describan la experiencia"
              data={availableTags.map(tag => ({
                value: tag.id,
                label: tag.name
              }))}
              value={newTestimonio.tags}
              onChange={(value) => {
                if (value !== null) {
                  setNewTestimonio(prev => ({ ...prev, tags: value }));
                }
              }}
              searchable
              styles={{
                label: {
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: '14px',
                  color: '#1D1A05',
                  letterSpacing: '0.5px'
                },
                input: {
                  fontFamily: 'Roboto, sans-serif',
                  border: '2px solid #f0f0f0',
                  '&:focus': { borderColor: '#FFAF21' }
                }
              }}
            />

            {/* Contenido/Testimonio */}
            <Textarea
              label="Testimonio/Experiencia"
              placeholder="Comparte tu experiencia profesional, logros, aprendizajes y consejos para futuros egresados..."
              value={newTestimonio.content}
              onChange={(e) => {
                const { value } = e.target;
                setNewTestimonio(prev => ({ ...prev, content: value }));
              }}
              required
              minRows={4}
              maxRows={8}
              styles={{
                label: {
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: '14px',
                  color: '#1D1A05',
                  letterSpacing: '0.5px'
                },
                input: {
                  fontFamily: 'Roboto, sans-serif',
                  border: '2px solid #f0f0f0',
                  '&:focus': { borderColor: '#4BCDF6' }
                }
              }}
            />

            {/* Botones */}
            <Group justify="flex-end" gap="sm" mt="xl">
              <Button
                variant="outline"
                onClick={() => {
                  close();
                  resetForm();
                }}
                styles={{
                  root: {
                    borderColor: '#FF369F',
                    color: '#FF369F',
                    fontFamily: 'Roboto, sans-serif',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 54, 159, 0.1)',
                    }
                  }
                }}
              >
                Cancelar
              </Button>
              
              <Button
                type="submit"
                loading={createTestimonioMutation.isPending || updateTestimonioMutation.isPending}
                disabled={careersLoading || createTestimonioMutation.isPending || updateTestimonioMutation.isPending}
                styles={{
                  root: {
                    background: 'linear-gradient(135deg, #4BCDF6, #FF369F)',
                    border: 'none',
                    color: 'white',
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 600,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #FF369F, #4BCDF6)',
                    }
                  }
                }}
              >
                {isEditing ? 'Actualizar Testimonio' : 'Crear Testimonio'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal para ver testimonio completo */}
      <Modal
        opened={viewModalOpened}
        onClose={closeView}
        title={
          selectedTestimonio && (
            <Group>
              <IconUser size={24} color="#4BCDF6" />
              <Text className="font-bebas text-xl text-[#1D1A05] tracking-wide">
                TESTIMONIO COMPLETO
              </Text>
            </Group>
          )
        }
        size="lg"
        styles={{
          header: {
            backgroundColor: '#f8f9fa',
            borderBottom: '2px solid rgba(75, 205, 246, 0.1)'
          },
          body: {
            padding: '2rem'
          }
        }}
      >
        {selectedTestimonio && (
          <ScrollArea style={{ maxHeight: '70vh' }}>
            <Stack gap="lg">
              {/* Información del egresado */}
              <Paper p="xl" style={{ background: 'linear-gradient(135deg, rgba(75, 205, 246, 0.05), rgba(255, 54, 159, 0.05))' }}>
                <Group mb="lg">
                  <Avatar
                    size="xl"
                    style={{
                      background: 'linear-gradient(135deg, #9F8BEA, #FFAF21)'
                    }}
                  >
                    <Text size="xl" className="font-bebas tracking-wide">
                      {getInitials(selectedTestimonio.display_data.egresado)}
                    </Text>
                  </Avatar>
                  <div style={{ flex: 1 }}>
                    <Text className="font-bebas text-2xl text-[#1D1A05] tracking-wide mb-1">
                      {selectedTestimonio.display_data.egresado}
                    </Text>
                    <Text className="font-roboto text-lg font-semibold text-gray-700 mb-1">
                      Egresado de {selectedTestimonio.display_data.carrera.name}
                    </Text>
                  </div>
                </Group>

                {/* Tags completos */}
                {selectedTestimonio.display_data.tags.length > 0 && (
                  <div>
                    <Text className="font-bebas text-sm text-gray-600 mb-2">ETIQUETAS:</Text>
                    <Group gap="xs">
                      {selectedTestimonio.display_data.tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="light"
                          styles={{
                            root: {
                              background: 'rgba(159, 139, 234, 0.1)',
                              color: '#9F8BEA',
                              fontFamily: 'Roboto, sans-serif'
                            }
                          }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </Group>
                  </div>
                )}

                <Group justify="space-between" align="center" mt="md">
                  <Group gap="xs">
                    <Text className="font-roboto text-xs text-gray-500">
                      Agregado: {new Date(selectedTestimonio.created_at).toLocaleDateString()}
                    </Text>
                  </Group>
                </Group>
              </Paper>

              {/* Experiencia completa */}
              <Paper p="xl" style={{ border: '2px solid rgba(75, 205, 246, 0.1)' }}>
                <Group mb="lg">
                  <IconQuote size={24} color="#4BCDF6" />
                  <Text className="font-bebas text-lg text-[#1D1A05] tracking-wide">
                    EXPERIENCIA
                  </Text>
                </Group>
                
                <Text 
                  className="font-roboto text-base leading-relaxed text-gray-700 italic"
                  style={{ lineHeight: 1.8 }}
                >
                  "{selectedTestimonio.display_data.experiencia}"
                </Text>
              </Paper>
            </Stack>
          </ScrollArea>
        )}
      </Modal>

      {/* Modal para ver solo el testimonio completo */}
      <Modal
        opened={testimonioTextModalOpened}
        onClose={closeTestimonioText}
        title={
          <Group>
            <IconQuote size={24} color="#4BCDF6" />
            <div>
              <Text className="font-bebas text-xl text-[#1D1A05] tracking-wide">
                EXPERIENCIA COMPLETA
              </Text>
              <Text className="font-roboto text-sm text-gray-600 font-medium">
                {selectedTestimonioAuthor}
              </Text>
            </div>
          </Group>
        }
        size="lg"
        styles={{
          header: {
            backgroundColor: 'linear-gradient(135deg, rgba(75, 205, 246, 0.1), rgba(255, 54, 159, 0.05))',
            borderBottom: '2px solid rgba(75, 205, 246, 0.2)',
            padding: '1.5rem'
          },
          body: {
            padding: '0'
          },
          content: {
            maxHeight: '80vh'
          }
        }}
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <ScrollArea 
          style={{ 
            maxHeight: '60vh',
            minHeight: '200px'
          }}
          scrollbarSize={6}
          scrollHideDelay={1000}
        >
          <div style={{ padding: '2rem' }}>
            <Paper
              p="xl"
              style={{
                background: 'linear-gradient(135deg, rgba(75, 205, 246, 0.02), rgba(255, 54, 159, 0.02))',
                border: 'none',
                borderLeft: '4px solid #4BCDF6',
                position: 'relative'
              }}
            >
              <div 
                style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '20px',
                  fontSize: '4rem',
                  color: 'rgba(75, 205, 246, 0.2)',
                  fontFamily: 'serif',
                  lineHeight: 1,
                  userSelect: 'none'
                }}
              >
                "
              </div>
              
              <Text 
                className="font-roboto text-lg leading-relaxed text-gray-700"
                style={{ 
                  lineHeight: 1.8,
                  fontStyle: 'italic',
                  textAlign: 'justify',
                  marginTop: '1rem'
                }}
              >
                {selectedTestimonioText}
              </Text>
              
              <div 
                style={{
                  position: 'absolute',
                  bottom: '-20px',
                  right: '20px',
                  fontSize: '4rem',
                  color: 'rgba(75, 205, 246, 0.2)',
                  fontFamily: 'serif',
                  lineHeight: 1,
                  userSelect: 'none'
                }}
              >
                "
              </div>
            </Paper>
            
            <div className="text-right mt-6">
              <Text className="font-bebas text-lg text-[#1D1A05] tracking-wide">
                — {selectedTestimonioAuthor}
              </Text>
            </div>
          </div>
        </ScrollArea>
        
        <div 
          style={{
            padding: '1rem 2rem',
            borderTop: '1px solid rgba(75, 205, 246, 0.1)',
            background: 'rgba(248, 249, 250, 0.8)',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <Button
            onClick={closeTestimonioText}
            variant="light"
            styles={{
              root: {
                background: 'linear-gradient(135deg, #4BCDF6, #FF369F)',
                color: 'white',
                border: 'none',
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 600,
                '&:hover': {
                  background: 'linear-gradient(135deg, #FF369F, #4BCDF6)',
                }
              }
            }}
          >
            Cerrar
          </Button>
        </div>
      </Modal>
    </div>
  );
}