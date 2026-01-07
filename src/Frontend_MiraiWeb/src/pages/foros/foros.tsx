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
  Divider,
  Avatar,
  Alert,
  Loader,
  Paper,
  ScrollArea,
  Chip
} from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DateInput } from '@mantine/dates';
import { 
  IconPlus,
  IconSearch,
  IconFilter,
  IconBulb,
  IconEdit,
  IconTrash,
  IconClock,
  IconMessageCircle,
  IconAlertTriangle,
  IconCopy,
  IconCheck,
  IconSparkles,
  IconUsers,
  IconArrowRight,
  IconTags
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useAuthenticatedFetch } from '../../hooks/useAuthenticatedFetch';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { canEditForum } from '../../utils/traffic.crypto';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';

// Interfaces actualizadas para la estructura real de la API
interface Creator {
  _id: string;
  role: string;
  first_name: string; 
  last_name: string;
  image_url: string | null;
}

interface Career {
  _id: string;
  nombre_carrera: string;
  facultad: string;
}

interface Forum {
  _id: string;
  title: string;
  description: string;
  creator: Creator | null;
  career: Career | null;
  created_at: string;
  final_date: string;
  comments_count: number;
  participants_count: number;
}

// Tipo para las ideas generadas
interface GeneratedIdea {
  titulo: string;
  descripcion: string;
}

interface IdeasResponse {
  ok: boolean;
  ideas: GeneratedIdea[];
  carrera: string;
  palabrasClave: string[];
}

// Tipo para las carreras de la API (mantenemos el original para el select)
interface CareerForSelect {
  _id: string;
  name: string;
  faculty: string;
  description: string;
  duration: number;
  employability: string;
}

interface CareersResponse {
  careers: CareerForSelect[];
}

// Tipo para crear un foro
interface CreateForumRequest {
  title: string;
  description: string;
  career_id: string;
  final_date: string;
}

// Tipo para editar un foro
interface UpdateForumRequest {
  title: string;
  description: string;
  final_date: string;
}

export default function Foros() {
  const { authenticatedFetch } = useAuthenticatedFetch();
  const { user: currentUser, isLoading: userLoading } = useCurrentUser();
  const queryClient = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);
  const [ideasModalOpened, { open: openIdeasModal, close: closeIdeasModal }] = useDisclosure(false);
  // Nuevo modal para palabras clave
  const [keywordsModalOpened, { open: openKeywordsModal, close: closeKeywordsModal }] = useDisclosure(false);
  
  const [selectedCareer, setSelectedCareer] = useState<string | null>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editingForumId, setEditingForumId] = useState<string | null>(null);
  const { user: clerkUser } = useUser();

  // Nuevos estados para las palabras clave
  const [keywords, setKeywords] = useState<string[]>(['', '', '']);

  // Estados del modal
  const [newForum, setNewForum] = useState({
    title: '',
    description: '',
    career: '' as string | undefined,
    startDate: null as string | null,
    endDate: null as string | null
  });

  // Obtener el careersId del usuario
  const userCareerIds = (clerkUser?.unsafeMetadata?.careersId as string[]) || [];
  const isDirector = userCareerIds.length > 0;

  // Query para obtener las carreras (modificada para filtrar)
  const { data: careersData, isLoading: careersLoading, error: careersError } = useQuery({
    queryKey: ['careers', userCareerIds],
    queryFn: async (): Promise<CareersResponse> => {
      const response = await authenticatedFetch('https://api.miraiedu.online/careers');
      
      if (!response.ok) {
        throw new Error('Error al obtener las carreras');
      }
      
      const data = await response.json();
      
      // Si es director, filtrar solo sus carreras
      if (isDirector && data.careers) {
        const filteredCareers = data.careers.filter((career: CareerForSelect) => 
          userCareerIds.includes(career._id)
        );
        return { careers: filteredCareers };
      }
      
      return data;
    },
  });

  // Query para obtener los foros (modificada para filtrar)
  const { data: forumsData, isLoading: forumsLoading, error: forumsError } = useQuery({
    queryKey: ['forums', userCareerIds],
    queryFn: async (): Promise<Forum[]> => {
      const response = await authenticatedFetch('https://api.miraiedu.online/forums');
      
      if (!response.ok) {
        throw new Error('Error al obtener los foros');
      }
      
      const data = await response.json();
      
      let forums: Forum[] = [];
      if (Array.isArray(data)) {
        forums = data;
      } else if (data.forums && Array.isArray(data.forums)) {
        forums = data.forums;
      }
      
      // Si es director, filtrar solo foros de sus carreras
      if (isDirector) {
        return forums.filter((forum: Forum) => 
          forum.career && userCareerIds.includes(forum.career._id)
        );
      }
      
      return forums;
    },
  });
  // Mutation para crear foro
  const createForumMutation = useMutation({
    mutationFn: async (forumData: CreateForumRequest) => {
      console.log('Datos que se van a enviar:', forumData);
      
      const response = await authenticatedFetch('https://api.miraiedu.online/forums', {
        method: 'POST',
        body: JSON.stringify(forumData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error data from server:', errorData);
        throw new Error(errorData.message || 'Error al crear el foro');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Foro creado exitosamente:', data);
      notifications.show({
        title: '¡Éxito!',
        message: 'El foro ha sido creado correctamente.',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      
      // Invalidar query de foros para recargar la lista
      queryClient.invalidateQueries({ queryKey: ['forums'] });
      
      // Resetear formulario y cerrar modal
      setNewForum({
        title: '',
        description: '',
        career: '',
        startDate: null,
        endDate: null
      });
      close();
    },
    onError: (error: Error) => {
      console.error('Error al crear foro:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'No se pudo crear el foro. Intenta nuevamente.',
        color: 'red',
        icon: <IconAlertTriangle size={16} />,
      });
    },
  });

  // Actualizar la mutation para generar ideas
  const generateIdeasMutation = useMutation({
    mutationFn: async ({ carrera, palabrasClave }: { carrera: string, palabrasClave: string[] }) => {
      const response = await fetch('http://localhost:4000/api/ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ carrera, palabrasClave }),
      });
      
      if (!response.ok) {
        throw new Error('Error al generar ideas');
      }
      
      return response.json() as Promise<IdeasResponse>;
    },
    onSuccess: (data) => {
      console.log('Ideas generadas:', data);
      closeKeywordsModal();
      openIdeasModal();
    },
    onError: (error) => {
      console.error('Error:', error);
      notifications.show({
        title: 'Error',
        message: 'No se pudieron generar las ideas. Intenta nuevamente.',
        color: 'red',
      });
    },
  });

  // Preparar datos de carreras para el select del modal
  const careersForModal = (careersData?.careers && Array.isArray(careersData.careers)) 
    ? careersData.careers.map(career => ({
        value: career._id,
        label: career.name
      })) 
    : [];

  const careersForFilter = forumsData ? [
    { value: 'all', label: 'Todas las Carreras' },
    ...Array.from(new Set(forumsData
      .filter(forum => forum.career && forum.career._id)
      .map(forum => forum.career!._id)
    ))
      .map(careerId => {
        const forum = forumsData.find(f => f.career && f.career._id === careerId);
        return {
          value: careerId,
          label: forum?.career?.nombre_carrera || 'Carrera desconocida'
        };
      })
  ] : [{ value: 'all', label: 'Todas las Carreras' }];

  // Mutation para eliminar foro
  const deleteForumMutation = useMutation({
    mutationFn: async (forumId: string) => {
      console.log('Eliminando foro con ID:', forumId);
      
      const response = await authenticatedFetch(`https://api.miraiedu.online/forums/${forumId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error data from server:', errorData);
        throw new Error(errorData.message || 'Error al eliminar el foro');
      }
      
      return response.json();
    },
    onSuccess: () => {
      console.log('Foro eliminado exitosamente');
      notifications.show({
        title: '¡Éxito!',
        message: 'El foro ha sido eliminado correctamente.',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      
      // Invalidar query de foros para recargar la lista
      queryClient.invalidateQueries({ queryKey: ['forums'] });
    },
    onError: (error: Error) => {
      console.error('Error al eliminar foro:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'No se pudo eliminar el foro. Intenta nuevamente.',
        color: 'red',
        icon: <IconAlertTriangle size={16} />,
      });
    },
  });

  // Mutation para editar foro
  const updateForumMutation = useMutation({
    mutationFn: async ({ forumId, forumData }: { forumId: string; forumData: UpdateForumRequest }) => {
      const response = await authenticatedFetch(`https://api.miraiedu.online/forums/${forumId}`, {
        method: 'PUT',
        body: JSON.stringify(forumData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar el foro');
      }
      
      return response.json();
    },
    onSuccess: () => {
      notifications.show({
        title: '¡Éxito!',
        message: 'El foro ha sido actualizado correctamente.',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      
      // Invalidar query de foros para recargar la lista
      queryClient.invalidateQueries({ queryKey: ['forums'] });
      
      // Resetear formulario y cerrar modal
      setNewForum({
        title: '',
        description: '',
        career: '',
        startDate: null,
        endDate: null
      });
      setIsEditing(false);
      setEditingForumId(null);
      close();
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'No se pudo actualizar el foro. Intenta nuevamente.',
        color: 'red',
        icon: <IconAlertTriangle size={16} />,
      });
    },
  });

  // Obtener los foros reales de la API
  const forums = forumsData || [];

  // Función para obtener la imagen del creador
  const getCreatorImage = (creator: Creator | null) => {
    if (!creator || !creator.image_url) return null;
    return creator.image_url;
  };

  // Función para obtener las iniciales del creador
  const getCreatorInitials = (creator: Creator | null) => {
    if (!creator || !creator.first_name || !creator.last_name) return "?";
    
    // Usar las primeras letras de los nombres encriptados como iniciales
    const firstInitial = creator.first_name.charAt(0).toUpperCase();
    const lastInitial = creator.last_name.charAt(0).toUpperCase();
    
    return `${firstInitial}${lastInitial}`;
  };

  // Función para obtener el nombre del creador
  const getCreatorName = (creator: Creator | null) => {
    if (!creator || !creator.first_name || !creator.last_name) {
      return "Usuario no disponible";
    }
    
    // Mostrar los nombres encriptados tal como vienen del backend
    return `${creator.first_name} ${creator.last_name}`;
  };

  // Función para verificar si el usuario actual puede editar/eliminar un foro
  const canUserEditForum = (forum: Forum) => {
    if (!currentUser || userLoading) return false;
    return canEditForum(currentUser, forum.creator?._id || '');
  };

  // Filtrar foros con verificaciones de nulidad
  const filteredForums = forums.filter((forum: Forum) => {
    const matchesSearch = forum.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        forum.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        forum.career?.nombre_carrera?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCareer = selectedCareer === 'all' || 
                         (forum.career && forum.career._id === selectedCareer);
    
    return matchesSearch && matchesCareer;
  });

  // Función para abrir modal de agregar
  const handleAddForum = () => {
    setIsEditing(false);
    setEditingForumId(null);
    setNewForum({
      title: '',
      description: '',
      career: '',
      startDate: null,
      endDate: null
    });
    open();
  };

  // Función para navegar al detalle del foro
  const handleForumClick = (forumId: string) => {
    navigate(`/app/foros/${forumId}`);
  };

  // Función para validar y crear/editar el foro
  const handleCreateForum = () => {
    // Validaciones
    if (!newForum.title.trim()) {
      notifications.show({
        title: 'Campo requerido',
        message: 'El título del foro es obligatorio.',
        color: 'orange',
      });
      return;
    }

    if (!newForum.description.trim()) {
      notifications.show({
        title: 'Campo requerido',
        message: 'La descripción del foro es obligatoria.',
        color: 'orange',
      });
      return;
    }

    if (!newForum.endDate) {
      notifications.show({
        title: 'Campo requerido',
        message: 'La fecha de finalización es obligatoria.',
        color: 'orange',
      });
      return;
    }

    if (isEditing) {
      // Lógica para editar foro
      if (!editingForumId) {
        notifications.show({
          title: 'Error',
          message: 'No se pudo identificar el foro a editar.',
          color: 'red',
        });
        return;
      }

      const updateData: UpdateForumRequest = {
        title: newForum.title.trim(),
        description: newForum.description.trim(),
        final_date: newForum.endDate
      };

      updateForumMutation.mutate({ forumId: editingForumId, forumData: updateData });
    } else {
      // Lógica para crear foro
      if (!newForum.career) {
        notifications.show({
          title: 'Campo requerido',
          message: 'Debes seleccionar una carrera.',
          color: 'orange',
        });
        return;
      }

      const forumData: CreateForumRequest = {
        title: newForum.title.trim(),
        description: newForum.description.trim(),
        career_id: newForum.career,
        final_date: newForum.endDate
      };

      createForumMutation.mutate(forumData);
    }
  };

  // Función para abrir modal de edición
  const handleEditForum = (forum: Forum) => {
    setIsEditing(true);
    setEditingForumId(forum._id);
    setNewForum({
      title: forum.title,
      description: forum.description,
      career: forum.career?._id,
      startDate: forum.created_at,
      endDate: forum.final_date.split('T')[0] // Asegurar formato correcto
    });
    open();
  };

  const handleDeleteForum = (forumId: string, forumTitle: string) => {
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
          ¿Estás seguro que deseas eliminar el foro{' '}
          <Text component="span" className="font-semibold text-[#1D1A05]">
            "{forumTitle}"
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
        loading: deleteForumMutation.isPending,
        styles: {
          root: {
            background: 'linear-gradient(135deg, #FF369F, #ff1744)',
            border: 'none',
            color: 'white',
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 600,
            '&:hover': {
              background: 'linear-gradient(135deg, #ff1744, #FF369F)',
            }
          }
        }
      },
      cancelProps: { 
        variant: 'outline',
        size: 'md',
        disabled: deleteForumMutation.isPending,
        styles: {
          root: {
            borderColor: '#gray-400',
            color: '#6b7280',
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 500,
            '&:hover': {
              backgroundColor: 'rgba(107, 114, 128, 0.1)'
            }
          }
        }
      },
      onConfirm: () => {
        deleteForumMutation.mutate(forumId);
      },
      centered: true,
      styles: {
        header: {
          backgroundColor: '#fef2f2',
          borderBottom: '2px solid rgba(255, 54, 159, 0.1)',
          padding: '1.5rem'
        },
        body: {
          padding: '1.5rem'
        }
      }
    });
  };

  // Función para manejar las palabras clave
  const handleKeywordChange = (index: number, value: string) => {
    const newKeywords = [...keywords];
    newKeywords[index] = value;
    setKeywords(newKeywords);
  };

  // Función para generar ideas (actualizada)
  const generateIdeas = () => {
    if (!newForum.career) {
      notifications.show({
        title: 'Selecciona una carrera',
        message: 'Debes seleccionar una carrera antes de generar ideas.',
        color: 'orange',
      });
      return;
    }

    // Resetear palabras clave y abrir modal
    setKeywords(['', '', '']);
    openKeywordsModal();
  };

  // Función para procesar las palabras clave y generar ideas
  const handleGenerateWithKeywords = () => {
    // Validar que todas las palabras clave estén completas
    const filledKeywords = keywords.filter(keyword => keyword.trim() !== '');
    
    if (filledKeywords.length !== 3) {
      notifications.show({
        title: 'Completa las palabras clave',
        message: 'Debes escribir exactamente 3 palabras clave.',
        color: 'orange',
      });
      return;
    }

    // Buscar el nombre de la carrera seleccionada
    const selectedCareerData = careersData?.careers?.find(c => c._id === newForum.career);
    if (selectedCareerData) {
      generateIdeasMutation.mutate({ 
        carrera: selectedCareerData.name, 
        palabrasClave: filledKeywords 
      });
    }
  };

  const copyIdeaToForm = (idea: GeneratedIdea, index: number) => {
    setNewForum({
      ...newForum,
      title: idea.titulo,
      description: idea.descripcion
    });
    
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    
    notifications.show({
      title: '¡Copiado!',
      message: 'La idea ha sido copiada al formulario.',
      color: 'green',
      icon: <IconCheck size={16} />,
    });
    
    closeIdeasModal();
  };

  // Mostrar loader mientras cargan los datos
  if (forumsLoading || userLoading) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader size="xl" color="#4BCDF6" />
          <Text className="font-roboto text-gray-600 mt-4 text-lg">
            {forumsLoading ? 'Cargando foros...' : 'Verificando permisos...'}
          </Text>
        </div>
      </div>
    );
  }

  // Mostrar error si hay problemas cargando los foros
  if (forumsError) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center p-6">
        <Alert 
          color="red" 
          title="Error al cargar los foros"
          icon={<IconAlertTriangle size={16} />}
          style={{ maxWidth: 500 }}
        >
          <Text className="font-roboto mb-4">
            Hubo un problema al cargar los foros. Por favor, intenta recargar la página.
          </Text>
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['forums'] })}
            variant="outline"
            color="red"
          >
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
          backdropFilter: 'blur(10px)',
          top: 0,
          zIndex: 40 
        }}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <Text className="font-bebas text-4xl text-[#1D1A05] tracking-wide mb-2">
                FOROS DE DISCUSIÓN
              </Text>
              <Text className="font-roboto text-gray-600 text-lg">
                Participa en debates académicos por carrera profesional
              </Text>
              
            </div>
            
            <Button
              onClick={handleAddForum}
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
              Agregar Foro
            </Button>
          </div>

          {/* Filtros */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                placeholder="Buscar foros por título, descripción o carrera..."
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
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Select
                placeholder="Filtrar por carrera"
                data={careersForFilter}
                value={selectedCareer}
                onChange={setSelectedCareer}
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
            <Grid.Col span={{ base: 12, md: 2 }}>
              <Text className="font-roboto text-sm text-gray-600 pt-2">
                {filteredForums.length} foro{filteredForums.length !== 1 ? 's' : ''} encontrado{filteredForums.length !== 1 ? 's' : ''}
              </Text>
            </Grid.Col>
          </Grid>
        </div>
      </div>

      {/* Contenido scrolleable */}
      <div className="p-6">
        <Grid>
          {filteredForums.map((forum: Forum) => (
            <Grid.Col key={forum._id} span={{ base: 12, lg: 6 }}>
              <Card 
                shadow="sm" 
                padding="xl" 
                radius="md"
                className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer"
                style={{
                  border: '1px solid rgba(75, 205, 246, 0.1)',
                  '&:hover': {
                    borderColor: 'rgba(75, 205, 246, 0.3)',
                    transform: 'translateY(-2px)'
                  }
                }}
                onClick={() => handleForumClick(forum._id)}
              >
                {/* Header del foro */}
                <Group justify="space-between" mb="md">
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
                    {forum.career?.nombre_carrera}
                  </Badge>
                  {/* Mostrar botones de editar/eliminar solo si el usuario tiene permisos */}
                  {canUserEditForum(forum) && (
                    <Group gap="xs">
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="blue"
                        style={{ color: '#4BCDF6' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditForum(forum);
                        }}
                        disabled={updateForumMutation.isPending || createForumMutation.isPending}
                        title="Editar foro"
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="red"
                        style={{ color: '#FF369F' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteForum(forum._id, forum.title);
                        }}
                        disabled={deleteForumMutation.isPending}
                        title="Eliminar foro"
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  )}
                </Group>

                {/* Título y descripción */}
                <Text 
                  className="font-bebas text-xl text-[#1D1A05] tracking-wide mb-2"
                  lineClamp={1}
                >
                  {forum.title}
                </Text>
                <Text 
                  className="font-roboto text-gray-600 text-base mb-4"
                  lineClamp={3}
                >
                  {forum.description}
                </Text>

                {/* Información del creador */}
                <Group mb="md">
                  <Avatar
                    size="sm"
                    src={getCreatorImage(forum.creator)}
                    style={{
                        background: getCreatorImage(forum.creator) ? 'transparent' : 'linear-gradient(135deg, #9F8BEA, #FFAF21)'
                      }}
                    >
                    {!getCreatorImage(forum.creator) && getCreatorInitials(forum.creator)}
                  </Avatar>
                  <div>
                    <Text className="font-roboto text-xs font-medium text-[#1D1A05]">
                      {getCreatorName(forum.creator)}
                    </Text>
                    <Text className="font-roboto text-xs text-gray-500">
                      {forum.career?.facultad}
                    </Text>
                  </div>
                </Group>

                <Divider mb="md" />

                {/* Estadísticas */}
                <Group justify="space-between">
                  <Group gap="lg">
                    <Group gap="xs">
                      <IconMessageCircle size={16} color="#FF369F" />
                      <Text className="font-roboto text-sm text-gray-600">
                        {forum.comments_count}
                      </Text>
                    </Group>
                    <Group gap="xs">
                      <IconUsers size={16} color="#9F8BEA" />
                      <Text className="font-roboto text-sm text-gray-600">
                        {forum.participants_count}
                      </Text>
                    </Group>
                    <Group gap="xs">
                      <IconClock size={16} color="#FFAF21" />
                      <Text className="font-roboto text-sm text-gray-600">
                        {new Date(forum.final_date).toLocaleDateString()}
                      </Text>
                    </Group>
                  </Group>
                  
                  <Badge
                    size="sm"
                    variant="dot"
                    styles={{
                      root: {
                        background: new Date(forum.final_date) > new Date() ? 
                          'rgba(75, 205, 246, 0.1)' : 'rgba(255, 54, 159, 0.1)',
                        color: new Date(forum.final_date) > new Date() ? '#4BCDF6' : '#FF369F',
                        fontFamily: 'Roboto, sans-serif'
                      }
                    }}
                  >
                    {new Date(forum.final_date) > new Date() ? 'Activo' : 'Finalizado'}
                  </Badge>
                </Group>

                {/* Fecha de creación */}
                <Text className="font-roboto text-xs text-gray-400 mt-2">
                  Creado: {new Date(forum.created_at).toLocaleDateString()}
                </Text>
              </Card>
            </Grid.Col>
          ))}
        </Grid>

        {filteredForums.length === 0 && !forumsLoading && (
          <div className="text-center py-12">
            <Text className="font-roboto text-gray-500 text-lg mb-4">
              No se encontraron foros que coincidan con los filtros seleccionados
            </Text>
            <Button
              onClick={() => {
                setSelectedCareer('all');
                setSearchQuery('');
              }}
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
          </div>
        )}
      </div>

      {/* Modal para agregar/editar foro */}
      <Modal
        opened={opened}
        onClose={close}
        title={
          <Text className="font-bebas text-xl text-[#1D1A05] tracking-wide">
            {isEditing ? 'EDITAR FORO' : 'AGREGAR UN FORO NUEVO PARA LA CARRERA'}
          </Text>
        }
        size="lg"
        styles={{
          header: {
            backgroundColor: '#f8f9fa',
            borderBottom: `2px solid ${isEditing ? 'rgba(255, 54, 159, 0.1)' : 'rgba(75, 205, 246, 0.1)'}`
          },
          body: {
            padding: '2rem'
          }
        }}
      >
        <Stack gap="lg">
          <Grid>
            <Grid.Col span={isEditing ? 12 : 6}>
              <TextInput
                label="Título"
                placeholder="Título del foro..."
                value={newForum.title}
                onChange={(e) => setNewForum({...newForum, title: e.currentTarget.value})}
                required
                styles={{
                  label: {
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 600,
                    color: '#1D1A05'
                  },
                  input: {
                    fontFamily: 'Roboto, sans-serif',
                    border: '2px solid #f0f0f0',
                    '&:focus': { borderColor: isEditing ? '#FF369F' : '#4BCDF6' }
                  }
                }}
              />
            </Grid.Col>
            {!isEditing && (
              <Grid.Col span={6}>
                <Select
                  label="Carrera"
                  placeholder={careersLoading ? "Cargando carreras..." : "Selecciona una carrera..."}
                  data={careersForModal}
                  value={newForum.career}
                  onChange={(value: string | null) => setNewForum({...newForum, career: value || ''})}
                  searchable
                  clearable
                  disabled={careersLoading}
                  rightSection={careersLoading ? <Loader size={16} /> : undefined}
                  required
                  styles={{
                    label: {
                      fontFamily: 'Roboto, sans-serif',
                      fontWeight: 600,
                      color: '#1D1A05'
                    },
                    input: {
                      fontFamily: 'Roboto, sans-serif',
                      border: '2px solid #f0f0f0',
                      '&:focus': { borderColor: '#4BCDF6' }
                    }
                  }}
                />
                {careersError && (
                  <Text size="sm" c="red" mt={5}>
                    Error al cargar las carreras. Intenta recargar la página.
                  </Text>
                )}
              </Grid.Col>
            )}
          </Grid>

          {isEditing && (
            <Alert 
              color="blue" 
              title="Información de la carrera"
              icon={<IconCheck size={16} />}
              styles={{
                root: {
                  background: 'linear-gradient(135deg, rgba(75, 205, 246, 0.1), rgba(159, 139, 234, 0.1))',
                  border: '1px solid rgba(75, 205, 246, 0.3)'
                }
              }}
            >
              <Text className="font-roboto text-sm">
                <Text component="span" className="font-semibold">Carrera:</Text> {forumsData?.find(f => f._id === editingForumId)?.career?.nombre_carrera || 'No disponible'}
                <br />
                <Text component="span" className="font-semibold">Facultad:</Text> {forumsData?.find(f => f._id === editingForumId)?.career?.facultad || 'No disponible'}
              </Text>
            </Alert>
          )}
          
          <Grid>
            <Grid.Col span={12}>
              <DateInput
                label="Fecha de finalización"
                placeholder="Seleccionar fecha de finalización..."
                value={newForum.endDate ? new Date(newForum.endDate) : null}
                onChange={(value) => setNewForum({...newForum, endDate: value ? value.split('T')[0] : null})}
                minDate={new Date()}
                valueFormat="DD/MM/YYYY"
                clearable
                required
                styles={{
                  label: {
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 600,
                    color: '#1D1A05'
                  },
                  input: {
                    fontFamily: 'Roboto, sans-serif',
                    border: '2px solid #f0f0f0',
                    '&:focus': { borderColor: isEditing ? '#FF369F' : '#4BCDF6' }
                  }
                }}
              />
            </Grid.Col>
          </Grid>

          <Textarea
            label="Descripción"
            placeholder="Describe el tema del foro..."
            value={newForum.description}
            onChange={(e) => setNewForum({...newForum, description: e.currentTarget.value})}
            minRows={4}
            required
            styles={{
              label: {
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 600,
                color: '#1D1A05'
              },
              input: {
                fontFamily: 'Roboto, sans-serif',
                border: '2px solid #f0f0f0',
                '&:focus': { borderColor: isEditing ? '#FF369F' : '#4BCDF6' }
              }
            }}
          />

          <Group justify="center" gap="md">
            {!isEditing && (
              <Button
                onClick={generateIdeas}
                size="lg"
                variant="outline"
                leftSection={<IconBulb size={18} />}
                loading={generateIdeasMutation.isPending}
                disabled={careersLoading || !newForum.career}
                styles={{
                  root: {
                    borderColor: '#FFAF21',
                    color: '#FFAF21',
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 600,
                    minWidth: 150,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 175, 33, 0.1)'
                    }
                  }
                }}
              >
                Generar ideas
              </Button>
            )}

            <Button
              onClick={handleCreateForum}
              size="lg"
              loading={isEditing ? updateForumMutation.isPending : createForumMutation.isPending}
              disabled={isEditing ? updateForumMutation.isPending : createForumMutation.isPending}
              styles={{
                root: {
                  background: isEditing 
                    ? 'linear-gradient(135deg, #FF369F, #9F8BEA)' 
                    : 'linear-gradient(135deg, #4BCDF6, #FF369F)',
                  border: 'none',
                  color: 'white',
                  fontFamily: 'Roboto, sans-serif',
                  fontWeight: 600,
                  minWidth: 150,
                  '&:hover': {
                    background: isEditing 
                      ? 'linear-gradient(135deg, #9F8BEA, #FF369F)' 
                      : 'linear-gradient(135deg, #FF369F, #4BCDF6)',
                  }
                }
              }}
            >
              {isEditing ? 'Guardar Cambios' : 'Agregar Foro'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal para palabras clave */}
      <Modal
        opened={keywordsModalOpened}
        onClose={closeKeywordsModal}
        title={
          <Group gap="sm">
            <IconTags size={24} color="#FFAF21" />
            <Text className="font-bebas text-xl text-[#1D1A05] tracking-wide">
              DEFINE TU TEMA DE FORO
            </Text>
          </Group>
        }
        size="md"
        styles={{
            header: {
              background: 'linear-gradient(135deg, rgba(255, 175, 33, 0.1), rgba(75, 205, 246, 0.1))',
              borderBottom: '2px solid rgba(255, 175, 33, 0.2)',
              padding: '1.5rem',
              position: 'static', // Agregar esta línea para evitar que sea sticky
              zIndex: 'auto' // Resetear z-index
            },
            body: {
              padding: '2rem',
              maxHeight: '70vh', // Limitar altura del body
              overflowY: 'auto' // Permitir scroll solo en el contenido
            },
            content: {
              maxHeight: '80vh', // Limitar altura total del modal
              display: 'flex',
              flexDirection: 'column'
            },
            overlay: {
              backgroundColor: 'rgba(0, 0, 0, 0.55)'
            }
          }}
          scrollAreaComponent={ScrollArea} // Usar ScrollArea de Mantine
          withCloseButton={true}
          closeButtonProps={{
            size: 'md',
            'aria-label': 'Cerrar modal'
          }}
      >
        <Stack gap="lg">
          <Alert 
            color="blue" 
            title="Personaliza tus ideas"
            icon={<IconBulb size={16} />}
            styles={{
              root: {
                background: 'linear-gradient(135deg, rgba(75, 205, 246, 0.1), rgba(159, 139, 234, 0.1))',
                border: '1px solid rgba(75, 205, 246, 0.3)'
              }
            }}
          >
            <Text className="font-roboto text-sm">
              Escribe 3 palabras clave relacionadas con el tema que quieres tratar en tu foro. 
              La IA generará ideas específicas basadas en estas palabras y tu carrera seleccionada.
            </Text>
          </Alert>

          <div>
            <Text className="font-roboto text-sm font-semibold text-[#1D1A05] mb-3">
              Carrera seleccionada:
            </Text>
            <Badge
              size="lg"
              variant="light"
              styles={{
                root: {
                  background: 'linear-gradient(135deg, rgba(75, 205, 246, 0.1), rgba(255, 54, 159, 0.1))',
                  color: '#4BCDF6',
                  fontFamily: 'Roboto, sans-serif',
                  fontWeight: 600,
                  fontSize: '14px',
                  padding: '8px 16px'
                }
              }}
            >
              {careersData?.careers?.find(c => c._id === newForum.career)?.name || 'Carrera no encontrada'}
            </Badge>
          </div>

          <div>
            <Text className="font-roboto text-sm font-semibold text-[#1D1A05] mb-4">
              Palabras clave del tema (3 requeridas):
            </Text>
            
            <Stack gap="md">
              {keywords.map((keyword, index) => (
                <div key={index}>
                  <TextInput
                    label={`Palabra clave ${index + 1}`}
                    placeholder={`Ej: ${index === 0 ? 'innovación' : index === 1 ? 'tecnología' : 'futuro'}`}
                    value={keyword}
                    onChange={(e) => handleKeywordChange(index, e.currentTarget.value)}
                    maxLength={50}
                    styles={{
                      label: {
                        fontFamily: 'Roboto, sans-serif',
                        fontWeight: 600,
                        color: '#1D1A05',
                        fontSize: '13px'
                      },
                      input: {
                        fontFamily: 'Roboto, sans-serif',
                        border: '2px solid #f0f0f0',
                        '&:focus': { borderColor: '#FFAF21' },
                        backgroundColor: keyword.trim() !== '' ? 'rgba(75, 205, 246, 0.05)' : 'white'
                      }
                    }}
                  />
                  {keyword.trim() !== '' && (
                    <Group gap="xs" mt={4}>
                      <IconCheck size={14} color="#22c55e" />
                      <Text size="xs" c="green" className="font-roboto">
                        Palabra registrada
                      </Text>
                    </Group>
                  )}
                </div>
              ))}
            </Stack>
          </div>

          {/* Mostrar preview de palabras clave */}
          {keywords.some(k => k.trim() !== '') && (
            <div>
              <Text className="font-roboto text-sm font-semibold text-[#1D1A05] mb-2">
                Vista previa de tu tema:
              </Text>
              <Paper
                p="md"
                radius="md"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 175, 33, 0.1), rgba(75, 205, 246, 0.1))',
                  border: '1px solid rgba(255, 175, 33, 0.3)'
                }}
              >
                <Group gap="xs">
                  {keywords.filter(k => k.trim() !== '').map((keyword, index) => (
                    <Chip
                      key={index}
                      checked={false}
                      variant="filled"
                      size="sm"
                      styles={{
                        root: {
                          background: 'linear-gradient(135deg, #FFAF21, #4BCDF6)',
                          color: 'white',
                          fontFamily: 'Roboto, sans-serif',
                          fontWeight: 600
                        }
                      }}
                    >
                      {keyword}
                    </Chip>
                  ))}
                </Group>
              </Paper>
            </div>
          )}

          <Group justify="space-between" mt="xl">
            <Button
              variant="outline"
              onClick={closeKeywordsModal}
              styles={{
                root: {
                  borderColor: '#6b7280',
                  color: '#6b7280',
                  fontFamily: 'Roboto, sans-serif'
                }
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGenerateWithKeywords}
              size="md"
              loading={generateIdeasMutation.isPending}
              disabled={keywords.filter(k => k.trim() !== '').length !== 3}
              leftSection={<IconSparkles size={18} />}
              styles={{
                root: {
                  background: 'linear-gradient(135deg, #FFAF21, #4BCDF6)',
                  border: 'none',
                  color: 'white',
                  fontFamily: 'Roboto, sans-serif',
                  fontWeight: 600,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4BCDF6, #FFAF21)',
                  }
                }
              }}
            >
              Generar Ideas
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal para mostrar ideas generadas */}
      <Modal
        opened={ideasModalOpened}
        onClose={closeIdeasModal}
        title={
          <Group gap="sm">
            <IconSparkles size={24} color="#FFAF21" />
            <Text className="font-bebas text-xl text-[#1D1A05] tracking-wide">
              IDEAS GENERADAS POR IA
            </Text>
          </Group>
        }
        size="xl"
        styles={{
          header: {
            background: 'linear-gradient(135deg, rgba(255, 175, 33, 0.1), rgba(75, 205, 246, 0.1))',
            borderBottom: '2px solid rgba(255, 175, 33, 0.2)',
            padding: '1.5rem'
          },
          body: {
            padding: '2rem'
          }
        }}
      >
        {generateIdeasMutation.isPending && (
          <div className="text-center py-8">
            <Loader size="lg" color="#FFAF21" />
            <Text className="font-roboto text-gray-600 mt-4">
              Generando ideas creativas para tu carrera...
            </Text>
          </div>
        )}

        {generateIdeasMutation.isError && (
          <Alert 
            color="red" 
            title="Error al generar ideas"
            icon={<IconAlertTriangle size={16} />}
          >
            <Text className="font-roboto">
              Hubo un problema al generar las ideas. Por favor, intenta nuevamente.
            </Text>
          </Alert>
        )}

        {generateIdeasMutation.data && (
          <Stack gap="lg">
            <Alert 
              color="blue" 
              title={`Ideas para ${generateIdeasMutation.data.carrera}`}
              icon={<IconSparkles size={16} />}
              styles={{
                root: {
                  background: 'linear-gradient(135deg, rgba(75, 205, 246, 0.1), rgba(159, 139, 234, 0.1))',
                  border: '1px solid rgba(75, 205, 246, 0.3)'
                }
              }}
            >
              <Text className="font-roboto text-sm mb-2">
                Ideas generadas basadas en las palabras clave: 
              </Text>
              <Group gap="xs">
                {generateIdeasMutation.data.palabrasClave?.map((palabra, index) => (
                  <Chip
                    key={index}
                    checked={false}
                    variant="filled"
                    size="sm"
                    styles={{
                      root: {
                        background: 'linear-gradient(135deg, #4BCDF6, #9F8BEA)',
                        color: 'white',
                        fontFamily: 'Roboto, sans-serif',
                        fontWeight: 600
                      }
                    }}
                  >
                    {palabra}
                  </Chip>
                ))}
              </Group>
              <Text className="font-roboto text-sm mt-2">
                Haz clic en "Usar esta idea" para copiar automáticamente el título y descripción al formulario.
              </Text>
            </Alert>

            <ScrollArea h={400}>
              <Stack gap="md">
                {generateIdeasMutation.data.ideas.map((idea, index) => (
                  <Paper
                    key={index}
                    p="xl"
                    radius="md"
                    style={{
                      border: '2px solid rgba(75, 205, 246, 0.1)',
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 249, 250, 0.9))',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: 'rgba(75, 205, 246, 0.3)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
                      }
                    }}
                    className="hover:shadow-lg transition-all duration-300"
                  >
                    <Group justify="space-between" align="start" mb="md">
                      <Text 
                        className="font-bebas text-lg text-[#1D1A05] tracking-wide"
                        style={{ flex: 1 }}
                      >
                        {idea.titulo}
                      </Text>
                      <Button
                        size="sm"
                        variant="light"
                        leftSection={
                          copiedIndex === index ? 
                            <IconCheck size={16} color="#4BCDF6" /> : 
                            <IconCopy size={16} />
                        }
                        onClick={() => copyIdeaToForm(idea, index)}
                        styles={{
                          root: {
                            background: copiedIndex === index ? 
                              'rgba(75, 205, 246, 0.2)' : 
                              'linear-gradient(135deg, rgba(75, 205, 246, 0.1), rgba(255, 54, 159, 0.1))',
                            color: copiedIndex === index ? '#4BCDF6' : '#FF369F',
                            border: `1px solid ${copiedIndex === index ? '#4BCDF6' : '#FF369F'}`,
                            fontFamily: 'Roboto, sans-serif',
                            fontWeight: 600,
                            '&:hover': {
                              background: copiedIndex === index ? 
                                'rgba(75, 205, 246, 0.3)' : 
                                'rgba(255, 54, 159, 0.1)'
                            }
                          }
                        }}
                      >
                        {copiedIndex === index ? 'Copiado!' : 'Usar esta idea'}
                      </Button>
                    </Group>
                    
                    <Text 
                      className="font-roboto text-gray-700 text-sm leading-relaxed"
                      style={{ textAlign: 'justify' }}
                    >
                      {idea.descripcion}
                    </Text>
                  </Paper>
                ))}
              </Stack>
            </ScrollArea>

            <Group justify="center" mt="lg">
              <Button
                onClick={() => {
                  closeIdeasModal();
                  openKeywordsModal();
                }}
                variant="outline"
                leftSection={<IconArrowRight size={16} />}
                styles={{
                  root: {
                    borderColor: '#FFAF21',
                    color: '#FFAF21',
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 175, 33, 0.1)'
                    }
                  }
                }}
              >
                Generar nuevas ideas
              </Button>
              <Button
                onClick={closeIdeasModal}
                variant="outline"
                size="md"
                styles={{
                  root: {
                    borderColor: '#9F8BEA',
                    color: '#9F8BEA',
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: 'rgba(159, 139, 234, 0.1)'
                    }
                  }
                }}
              >
                Cerrar
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </div>
  );
}