import { useState, useEffect, useRef } from 'react';
import { 
  Container,
  Paper, 
  Text, 
  Group, 
  Stack,
  Button,
  Textarea,
  Card,
  Avatar,
  Badge,
  ActionIcon,
  Divider,
  Modal,
  Alert,
  Loader,
  ScrollArea,
  Breadcrumbs,
  Anchor,
  Flex
} from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  IconArrowLeft,
  IconMessageCircle,
  IconUsers,
  IconClock,
  IconEdit,
  IconTrash,
  IconSend,
  IconAlertTriangle,
  IconCheck,
  IconChevronRight
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useAuthenticatedFetch } from '../../hooks/useAuthenticatedFetch';
import { useCurrentUser } from '../../hooks/useCurrentUser';

// Interfaces actualizadas para coincidir con la API real
interface Creator {
  _id: string;
  role: string;
  first_name: string; 
  last_name: string;
  image_url?: string;
}

interface Career {
  _id: string;
  nombre_carrera: string;
  facultad: string;
}

interface Comment {
  _id: string;
  content: string;
  user: Creator;  
  created_at: string;
  updated_at?: string;
  answers?: Comment[]; 
  edited: boolean;
}

// Interface actualizada para coincidir con la respuesta real de la API
interface ForumDetail {
  _id: string;
  title: string;
  description: string;
  creator: Creator;
  career: Career;
  created_at: string;
  final_date: string;
  comments_count: number;
  participants_count: number;
  comments: Comment[];
  __v: number;
}

// Interface para la respuesta completa del API
interface ForumResponse {
  forum: ForumDetail;
}

interface CreateCommentRequest {
  content: string;
  userId?: string;
}

interface CreateAnswerRequest {
  content: string;
  userId?: string;
}

interface UpdateCommentRequest {
  content: string;
}

interface UpdateAnswerRequest {
  content: string;
}

export default function Comentarios() {
  const { foroId } = useParams<{ foroId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const { user: currentUser, isLoading: userLoading } = useCurrentUser();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const queryClient = useQueryClient();
  
  // Estados para comentarios
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);

  // Estados para respuestas
  const [editingAnswer, setEditingAnswer] = useState<string | null>(null);
  const [editAnswerContent, setEditAnswerContent] = useState('');
  const [editAnswerModalOpened, { open: openEditAnswerModal, close: closeEditAnswerModal }] = useDisclosure(false);

  // Estados para el formulario flotante
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [showFloatingForm, setShowFloatingForm] = useState(true);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false); // Nuevo estado para modales de eliminación
  const formRef = useRef<HTMLDivElement>(null);

  // Query para obtener el detalle del foro
  const { data: forumData, isLoading, error } = useQuery({
    queryKey: ['forum', foroId],
    queryFn: async (): Promise<ForumDetail> => {
      if (!foroId) throw new Error('ID del foro no proporcionado');
      
      const response = await authenticatedFetch(
        `https://api.miraiedu.online/forums/${foroId}`
      );
      
      if (!response.ok) {
        throw new Error('Error al obtener el foro');
      }
      
      const data: ForumResponse = await response.json();
      return data.forum;
    },
    enabled: !!foroId,
  });

  // Mutation para crear comentario - Actualizada con nueva posición de notificación
  const createCommentMutation = useMutation({
    mutationFn: async (commentData: CreateCommentRequest) => {
      console.log('=== CREANDO COMENTARIO ===');
      
      const commentPayload = {
        ...commentData,
      };
      
      console.log('Datos enviados:', commentPayload);
      
      const response = await authenticatedFetch(
        `https://api.miraiedu.online/forums/${foroId}/comments`,
        {
          method: 'POST',
          body: JSON.stringify(commentPayload),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear el comentario');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      notifications.show({
        title: '¡Éxito!',
        message: 'Comentario agregado correctamente.',
        color: 'green',
        icon: <IconCheck size={16} />,
        position: 'top-right',
        autoClose: 3000,
      });
      
      queryClient.invalidateQueries({ queryKey: ['forum', foroId] });
      setNewComment('');
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'No se pudo agregar el comentario.',
        color: 'red',
        icon: <IconAlertTriangle size={16} />,
        position: 'top-right',
        autoClose: 4000,
      });
    },
  });

  // Mutation para crear respuesta a comentario - Actualizada con nueva posición de notificación
  const createAnswerMutation = useMutation({
    mutationFn: async ({ commentId, answerData }: { commentId: string; answerData: CreateAnswerRequest }) => {
      console.log('=== CREANDO RESPUESTA ===');
      
      const answerPayload = {
        ...answerData,
      };
      
      console.log('Datos enviados:', answerPayload);
      
      const response = await authenticatedFetch(
        `https://api.miraiedu.online/forums/${foroId}/comments/${commentId}/answers`,
        {
          method: 'POST',
          body: JSON.stringify(answerPayload),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear la respuesta');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      notifications.show({
        title: '¡Éxito!',
        message: 'Respuesta agregada correctamente.',
        color: 'green',
        icon: <IconCheck size={16} />,
        position: 'top-right',
        autoClose: 3000,
      });
      
      queryClient.invalidateQueries({ queryKey: ['forum', foroId] });
      setReplyContent('');
      setReplyingTo(null);
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'No se pudo agregar la respuesta.',
        color: 'red',
        icon: <IconAlertTriangle size={16} />,
        position: 'top-right',
        autoClose: 4000,
      });
    },
  });

  // Mutation para actualizar comentario - Actualizada con nueva posición de notificación
  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, commentData }: { commentId: string; commentData: UpdateCommentRequest }) => {
      const response = await authenticatedFetch(
        `https://api.miraiedu.online/forums/${foroId}/comments/${commentId}`,
        {
          method: 'PUT',
          body: JSON.stringify(commentData),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar el comentario');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      notifications.show({
        title: '¡Éxito!',
        message: 'Comentario actualizado correctamente.',
        color: 'green',
        icon: <IconCheck size={16} />,
        position: 'top-right',
        autoClose: 3000,
      });
      
      queryClient.invalidateQueries({ queryKey: ['forum', foroId] });
      setEditingComment(null);
      setEditContent('');
      closeEditModal();
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'No se pudo actualizar el comentario.',
        color: 'red',
        icon: <IconAlertTriangle size={16} />,
        position: 'top-right',
        autoClose: 4000,
      });
    },
  });

  // Mutation para actualizar respuesta - Actualizada con nueva posición de notificación
  const updateAnswerMutation = useMutation({
    mutationFn: async ({ commentId, answerId, answerData }: { commentId: string; answerId: string; answerData: UpdateAnswerRequest }) => {
      console.log('=== ACTUALIZANDO RESPUESTA ===');
      
      const response = await authenticatedFetch(
        `https://api.miraiedu.online/forums/${foroId}/comments/${commentId}/answers/${answerId}`,
        {
          method: 'PUT',
          body: JSON.stringify(answerData),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar la respuesta');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      notifications.show({
        title: '¡Éxito!',
        message: 'Respuesta actualizada correctamente.',
        color: 'green',
        icon: <IconCheck size={16} />,
        position: 'top-right',
        autoClose: 3000,
      });
      
      queryClient.invalidateQueries({ queryKey: ['forum', foroId] });
      setEditingAnswer(null);
      setEditAnswerContent('');
      closeEditAnswerModal();
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'No se pudo actualizar la respuesta.',
        color: 'red',
        icon: <IconAlertTriangle size={16} />,
        position: 'top-right',
        autoClose: 4000,
      });
    },
  });

  // Mutation para eliminar comentario - Actualizada con nueva posición de notificación
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await authenticatedFetch(
        `https://api.miraiedu.online/forums/${foroId}/comments/${commentId}`,
        {
          method: 'DELETE',
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar el comentario');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      notifications.show({
        title: '¡Éxito!',
        message: 'Comentario eliminado correctamente.',
        color: 'red',
        icon: <IconCheck size={16} />,
        position: 'top-right',
        autoClose: 3000,
      });
      
      queryClient.invalidateQueries({ queryKey: ['forum', foroId] });
      setDeleteModalOpened(false); // Restablecer estado de modal de eliminación
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'No se pudo eliminar el comentario.',
        color: 'red',
        icon: <IconAlertTriangle size={16} />,
        position: 'top-right',
        autoClose: 4000,
      });
      setDeleteModalOpened(false); // Restablecer estado de modal de eliminación
    },
  });

  // Mutation para eliminar respuesta - Actualizada con nueva posición de notificación
  const deleteAnswerMutation = useMutation({
    mutationFn: async ({ commentId, answerId }: { commentId: string; answerId: string }) => {
      console.log('=== ELIMINANDO RESPUESTA ===');
      
      const response = await authenticatedFetch(
        `https://api.miraiedu.online/forums/${foroId}/comments/${commentId}/answers/${answerId}`,
        {
          method: 'DELETE',
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar la respuesta');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      notifications.show({
        title: '¡Éxito!',
        message: 'Respuesta eliminada correctamente.',
        color: 'red',
        icon: <IconCheck size={16} />,
        position: 'top-right',
        autoClose: 3000,
      });
      
      queryClient.invalidateQueries({ queryKey: ['forum', foroId] });
      setDeleteModalOpened(false); // Restablecer estado de modal de eliminación
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'No se pudo eliminar la respuesta.',
        color: 'red',
        icon: <IconAlertTriangle size={16} />,
        position: 'top-right',
        autoClose: 4000,
      });
      setDeleteModalOpened(false); // Restablecer estado de modal de eliminación
    },
  });

  // Funciones auxiliares
  const getCreatorInitials = (creator: Creator | null | undefined) => {
    if (!creator?.first_name || !creator?.last_name) return "?";
    return `${creator.first_name.charAt(0)}${creator.last_name.charAt(0)}`.toUpperCase();
  };

  const getCreatorName = (creator: Creator | null | undefined) => {
    if (!creator?.first_name || !creator?.last_name) {
      return "Usuario no disponible";
    }
    return `${creator.first_name} ${creator.last_name}`;
  };

  // Función para verificar permisos de comentarios
  const canEditComment = (comment: Comment) => {
    if (!currentUser || userLoading) return false;
    
    // Admin puede editar/eliminar todos los comentarios
    if (currentUser.role === 'admin') return true;
    
    // Director y docente solo pueden editar/eliminar sus propios comentarios
    if (currentUser.role === 'director' || currentUser.role === 'docente') {
      return comment.user?._id === currentUser._id;
    }
    
    return false;
  };

  // Función para verificar permisos de respuestas
  const canEditAnswer = (answer: Comment) => {
    if (!currentUser || userLoading) return false;
    
    // Admin puede editar/eliminar todas las respuestas
    if (currentUser.role === 'admin') return true;
    
    // Director y docente solo pueden editar/eliminar sus propias respuestas
    if (currentUser.role === 'director' || currentUser.role === 'docente') {
      return answer.user?._id === currentUser._id;
    }
    return false;
  };

  // Handlers actualizados con notificaciones en posición superior derecha
  const handleCreateComment = () => {
    if (!newComment.trim()) {
      notifications.show({
        title: 'Campo requerido',
        message: 'El comentario no puede estar vacío.',
        color: 'orange',
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    if (!user?.id) {
      notifications.show({
        title: 'Error de autenticación',
        message: 'Debes estar autenticado para comentar.',
        color: 'red',
        icon: <IconAlertTriangle size={16} />,
        position: 'top-right',
        autoClose: 4000,
      });
      return;
    }

    createCommentMutation.mutate({ 
      content: newComment.trim()
    });
  };

  const handleReply = (commentId: string) => {
    if (!replyContent.trim()) {
      notifications.show({
        title: 'Campo requerido',
        message: 'La respuesta no puede estar vacía.',
        color: 'orange',
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    if (!user?.id) {
      notifications.show({
        title: 'Error de autenticación',
        message: 'Debes estar autenticado para responder.',
        color: 'red',
        icon: <IconAlertTriangle size={16} />,
        position: 'top-right',
        autoClose: 4000,
      });
      return;
    }

    createAnswerMutation.mutate({ 
      commentId,
      answerData: { content: replyContent.trim() }
    });
  };

  // Handlers actualizados para controlar la visibilidad del formulario flotante
  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment._id);
    setEditContent(comment.content);
    setShowFloatingForm(false);
    openEditModal();
  };

  const handleEditAnswer = (commentId: string, answer: Comment) => {
    setEditingAnswer(`${commentId}-${answer._id}`);
    setEditAnswerContent(answer.content);
    setShowFloatingForm(false);
    openEditAnswerModal();
  };

  // Handlers para cerrar modales y mostrar formulario flotante
  const handleCloseEditModal = () => {
    closeEditModal();
    setShowFloatingForm(true); // Mostrar formulario flotante
    setEditingComment(null);
    setEditContent('');
  };

  const handleCloseEditAnswerModal = () => {
    closeEditAnswerModal();
    setShowFloatingForm(true); // Mostrar formulario flotante
    setEditingAnswer(null);
    setEditAnswerContent('');
  };

  const handleUpdateComment = () => {
    if (!editContent.trim()) {
      notifications.show({
        title: 'Campo requerido',
        message: 'El comentario no puede estar vacío.',
        color: 'orange',
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    if (editingComment) {
      updateCommentMutation.mutate({
        commentId: editingComment,
        commentData: { content: editContent.trim() }
      });
    }
  };

  const handleUpdateAnswer = () => {
    if (!editAnswerContent.trim()) {
      notifications.show({
        title: 'Campo requerido',
        message: 'La respuesta no puede estar vacía.',
        color: 'orange',
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    if (editingAnswer) {
      const [commentId, answerId] = editingAnswer.split('-');
      updateAnswerMutation.mutate({
        commentId,
        answerId,
        answerData: { content: editAnswerContent.trim() }
      });
    }
  };

  // Handler actualizado para eliminar comentarios con control del formulario flotante
  const handleDeleteComment = (commentId: string, authorName: string) => {
    setDeleteModalOpened(true);
    
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
          ¿Estás seguro que deseas eliminar el comentario de{' '}
          <Text component="span" className="font-semibold text-[#1D1A05]">
            {authorName}
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
        loading: deleteCommentMutation.isPending
      },
      onConfirm: () => deleteCommentMutation.mutate(commentId),
      onCancel: () => setDeleteModalOpened(false), // Restablecer estado al cancelar
      centered: true,
    });
  };

  // Handler actualizado para eliminar respuestas con control del formulario flotante
  const handleDeleteAnswer = (commentId: string, answerId: string, authorName: string) => {
    setDeleteModalOpened(true); // Marcar que se abrió un modal de eliminación
    
    modals.openConfirmModal({
      title: (
        <Group gap="sm">
          <IconAlertTriangle size={24} color="#FF369F" />
          <Text className="font-bebas text-xl text-[#1D1A05] tracking-wide">
            CONFIRMAR ELIMINACIÓN DE RESPUESTA
          </Text>
        </Group>
      ),
      children: (
        <Text className="font-roboto text-gray-700 text-base py-4">
          ¿Estás seguro que deseas eliminar la respuesta de{' '}
          <Text component="span" className="font-semibold text-[#1D1A05]">
            {authorName}
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
        loading: deleteAnswerMutation.isPending
      },
      onConfirm: () => deleteAnswerMutation.mutate({ commentId, answerId }),
      onCancel: () => setDeleteModalOpened(false), // Restablecer estado al cancelar
      centered: true,
    });
  };

  const handleBack = () => {
    navigate('/app/foros');
  };

  // Efecto para manejar el scroll y el estado del formulario
  useEffect(() => {
    const handleScroll = () => {
      if (formRef.current) {
        const rect = formRef.current.getBoundingClientRect();
        const isNearBottom = window.innerHeight - rect.top < 200;
        setIsFormExpanded(isNearBottom);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Efecto actualizado para controlar la visibilidad del formulario flotante basado en todos los modales
  useEffect(() => {
    if (editModalOpened || editAnswerModalOpened || deleteModalOpened) {
      setShowFloatingForm(false);
    } else {
      setShowFloatingForm(true);
    }
  }, [editModalOpened, editAnswerModalOpened, deleteModalOpened]);

  // Mostrar loader mientras cargan los datos del usuario
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader size="xl" color="#4BCDF6" />
          <Text className="font-roboto text-gray-600 mt-4 text-lg">
            Verificando permisos...
          </Text>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader size="xl" color="#4BCDF6" />
          <Text className="font-roboto text-gray-600 mt-4 text-lg">
            Cargando foro...
          </Text>
        </div>
      </div>
    );
  }

  if (error || !forumData) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center p-6">
        <Alert 
          color="red" 
          title="Error al cargar el foro"
          icon={<IconAlertTriangle size={16} />}
          style={{ maxWidth: 500 }}
        >
          <Text className="font-roboto mb-4">
            No se pudo cargar la información del foro.
          </Text>
          <Button onClick={handleBack} variant="outline" color="red">
            Volver a Foros
          </Button>
        </Alert>
      </div>
    );
  }

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
                    Foros
                  </Anchor>
                  <Text className="font-roboto text-gray-600 font-medium">
                    {forumData?.title || 'Cargando...'}
                  </Text>
                </Breadcrumbs>
                
                <Text className="font-bebas text-4xl text-[#1D1A05] tracking-wide mt-2">
                  DETALLE DEL FORO
                </Text>
                <Text className="font-roboto text-gray-600 text-lg">
                  Participa en la discusión y comparte tus ideas
                </Text>
                {currentUser && (
                  <Group gap="xs" mt="xs">
                    <Badge
                      size="sm"
                      variant="light"
                      styles={{
                        root: {
                          background: currentUser.role === 'admin' 
                            ? 'linear-gradient(135deg, rgba(255, 54, 159, 0.1), rgba(159, 139, 234, 0.1))'
                            : currentUser.role === 'director'
                            ? 'linear-gradient(135deg, rgba(255, 175, 33, 0.1), rgba(75, 205, 246, 0.1))'
                            : currentUser.role === 'docente'
                            ? 'linear-gradient(135deg, rgba(75, 205, 246, 0.1), rgba(255, 175, 33, 0.1))'
                            : 'linear-gradient(135deg, rgba(107, 114, 128, 0.1), rgba(156, 163, 175, 0.1))',
                          color: currentUser.role === 'admin' 
                            ? '#FF369F' 
                            : currentUser.role === 'director'
                            ? '#FFAF21'
                            : currentUser.role === 'docente'
                            ? '#4BCDF6'
                            : '#6b7280',
                          fontFamily: 'Roboto, sans-serif',
                          fontWeight: 600
                        }
                      }}
                    >
                      {currentUser.role === 'admin' ? 'Administrador' : 
                       currentUser.role === 'director' ? 'Director' :
                       currentUser.role === 'docente' ? 'Docente' : 'Usuario'}
                    </Badge>
                    <Text className="font-roboto text-xs text-gray-500">
                      {currentUser.first_name} {currentUser.last_name}
                    </Text>
                  </Group>
                )}
              </div>
            </Group>
          </Group>
        </Container>
      </div>

      <Container size="xl" className="p-6">
        <Stack gap="xl">
          {/* Información del foro */}
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
                <Badge
                  size="lg"
                  style={{
                    background: 'linear-gradient(135deg, #4BCDF6, #FF369F)',
                    color: 'white'
                  }}
                >
                  {forumData?.career?.nombre_carrera || 'Carrera no disponible'}
                </Badge>
                
                <Badge
                  size="lg"
                  variant="light"
                  color={forumData?.final_date && new Date(forumData.final_date) > new Date() ? 'green' : 'red'}
                >
                  {forumData?.final_date && new Date(forumData.final_date) > new Date() ? 'Activo' : 'Finalizado'}
                </Badge>
              </Group>

              <Text className="font-bebas text-3xl text-[#1D1A05] tracking-wide mb-4">
                {forumData?.title || 'Título no disponible'}
              </Text>
              
              <Text className="font-roboto text-gray-700 leading-relaxed text-lg mb-6">
                {forumData?.description || 'Descripción no disponible'}
              </Text>

              <Group justify="space-between">
                <Group gap="md">
                  <Avatar
                    size="md"
                    src={forumData?.creator?.image_url}
                    style={{
                      background: forumData?.creator?.image_url ? 'transparent' : 'linear-gradient(135deg, #9F8BEA, #FFAF21)'
                    }}
                  >
                    {!forumData?.creator?.image_url && getCreatorInitials(forumData?.creator || null)}
                  </Avatar>
                  <div>
                    <Text className="font-roboto font-semibold text-[#1D1A05]">
                      {getCreatorName(forumData?.creator || null)}
                    </Text>
                    <Text className="font-roboto text-sm text-gray-500">
                      Creado: {forumData?.created_at ? new Date(forumData.created_at).toLocaleDateString() : 'Fecha no disponible'}
                    </Text>
                  </div>
                </Group>

                <Group gap="lg">
                  <Group gap="xs">
                    <IconMessageCircle size={20} color="#FF369F" />
                    <Text className="font-roboto font-semibold">
                      {forumData?.comments_count || 0} comentarios
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <IconUsers size={20} color="#9F8BEA" />
                    <Text className="font-roboto font-semibold">
                      {forumData?.participants_count || 0} participantes
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <IconClock size={20} color="#FFAF21" />
                    <Text className="font-roboto font-semibold">
                      Finaliza: {forumData?.final_date ? new Date(forumData.final_date).toLocaleDateString() : 'Fecha no disponible'}
                    </Text>
                  </Group>
                </Group>
              </Group>
            </div>
          </Paper>

          {/* Lista de comentarios */}
          <Paper p="xl" shadow="sm" radius="lg" style={{ border: '1px solid rgba(75, 205, 246, 0.1)' }}>
            <Group justify="space-between" mb="xl">
              <Text className="font-bebas text-xl text-[#1D1A05] tracking-wide">
                COMENTARIOS ({forumData?.comments_count || 0})
              </Text>
            </Group>

            {forumData?.comments && forumData.comments.length > 0 ? (
              <ScrollArea h={700}>
                <Stack gap="lg" pb="xl">
                  {forumData.comments.map((comment) => (
                    <Card
                      key={comment._id}
                      p="lg"
                      shadow="sm"
                      radius="md"
                      style={{ 
                        border: '1px solid rgba(159, 139, 234, 0.1)',
                        background: 'rgba(255, 255, 255, 0.9)'
                      }}
                    >
                      <Group justify="space-between" align="start" mb="md">
                        <Group>
                          <Avatar
                            size="md"
                            src={comment.user?.image_url}
                            style={{
                              background: comment.user?.image_url ? 'transparent' : 'linear-gradient(135deg, #9F8BEA, #FFAF21)'
                            }}
                          >
                            {!comment.user?.image_url && getCreatorInitials(comment.user)}
                          </Avatar>
                          <div>
                            <Text className="font-roboto font-semibold text-[#1D1A05]">
                              {getCreatorName(comment.user)}
                            </Text>
                            <Group gap="xs" align="center">
                              <Text className="font-roboto text-sm text-gray-500">
                                {comment.created_at ? new Date(comment.created_at).toLocaleString() : 'Fecha no disponible'}
                              </Text>
                              {comment.edited && (
                                <Badge
                                  size="xs"
                                  variant="light"
                                  color="blue"
                                  styles={{
                                    root: {
                                      background: 'rgba(75, 205, 246, 0.1)',
                                      color: '#4BCDF6',
                                      fontFamily: 'Roboto, sans-serif',
                                      fontSize: '10px',
                                      fontWeight: 500,
                                      textTransform: 'lowercase'
                                    }
                                  }}
                                >
                                  editado
                                </Badge>
                              )}
                            </Group>
                          </div>
                        </Group>

                        {canEditComment(comment) && (
                          <Group gap="xs">
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="blue"
                              onClick={() => handleEditComment(comment)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="red"
                              onClick={() => handleDeleteComment(comment._id, getCreatorName(comment.user))}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        )}
                      </Group>

                      <Text className="font-roboto text-gray-700 mb-4 leading-relaxed">
                        {comment.content || 'Contenido no disponible'}
                      </Text>

                      <Divider mb="md" />

                      <Group justify="space-between">
                        <Button
                          size="xs"
                          variant="subtle"
                          leftSection={<IconMessageCircle size={14} />}
                          onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                          styles={{
                            root: {
                              color: '#9F8BEA',
                              fontFamily: 'Roboto, sans-serif'
                            }
                          }}
                        >
                          Responder
                        </Button>
                      </Group>

                      {/* Formulario de respuesta */}
                      {replyingTo === comment._id && (
                        <Stack gap="md" mt="md" p="md" style={{ background: 'rgba(159, 139, 234, 0.05)', borderRadius: '8px' }}>
                          <Textarea
                            placeholder="Escribe tu respuesta..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.currentTarget.value)}
                            minRows={2}
                            styles={{
                              input: {
                                fontFamily: 'Roboto, sans-serif',
                                border: '2px solid #f0f0f0',
                                '&:focus': { borderColor: '#9F8BEA' }
                              }
                            }}
                          />
                          <Group justify="flex-end" gap="sm">
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyContent('');
                              }}
                            >
                              Cancelar
                            </Button>
                            <Button
                              size="xs"
                              onClick={() => handleReply(comment._id)}
                              loading={createAnswerMutation.isPending}
                              disabled={!replyContent.trim()}
                              styles={{
                                root: {
                                  background: 'linear-gradient(135deg, #9F8BEA, #FFAF21)',
                                  border: 'none',
                                  color: 'white',
                                  fontFamily: 'Roboto, sans-serif'
                                }
                              }}
                            >
                              Responder
                            </Button>
                          </Group>
                        </Stack>
                      )}

                      {/* Respuestas anidadas */}
                      {comment.answers && comment.answers.length > 0 && (
                        <Stack gap="md" mt="md" ml="xl" style={{ borderLeft: '2px solid rgba(159, 139, 234, 0.2)', paddingLeft: '1rem' }}>
                          {comment.answers.map((reply) => (
                            <Card
                              key={reply._id}
                              p="md"
                              shadow="xs"
                              radius="sm"
                              style={{ 
                                border: '1px solid rgba(159, 139, 234, 0.1)',
                                background: 'rgba(159, 139, 234, 0.02)'
                              }}
                            >
                              <Group justify="space-between" align="start" mb="sm">
                                <Group>
                                  <Avatar
                                    size="sm"
                                    src={reply.user?.image_url}
                                    style={{
                                      background: reply.user?.image_url ? 'transparent' : 'linear-gradient(135deg, #FFAF21, #4BCDF6)'
                                    }}
                                  >
                                    {!reply.user?.image_url && getCreatorInitials(reply.user)}
                                  </Avatar>
                                  <div>
                                    <Text className="font-roboto font-medium text-sm text-[#1D1A05]">
                                      {getCreatorName(reply.user)}
                                    </Text>
                                    <Group gap="xs" align="center">
                                      <Text className="font-roboto text-xs text-gray-500">
                                        {reply.created_at ? new Date(reply.created_at).toLocaleString() : 'Fecha no disponible'}
                                      </Text>
                                      {reply.edited && (
                                        <Badge
                                          size="xs"
                                          variant="light"
                                          color="blue"
                                          styles={{
                                            root: {
                                              background: 'rgba(75, 205, 246, 0.1)',
                                              color: '#4BCDF6',
                                              fontFamily: 'Roboto, sans-serif',
                                              fontSize: '9px',
                                              fontWeight: 500,
                                              textTransform: 'lowercase'
                                            }
                                          }}
                                        >
                                          editado
                                        </Badge>
                                      )}
                                    </Group>
                                  </div>
                                </Group>

                                {canEditAnswer(reply) && (
                                  <Group gap="xs">
                                    <ActionIcon
                                      size="xs"
                                      variant="subtle"
                                      color="blue"
                                      onClick={() => handleEditAnswer(comment._id, reply)}
                                    >
                                      <IconEdit size={14} />
                                    </ActionIcon>
                                    <ActionIcon
                                      size="xs"
                                      variant="subtle"
                                      color="red"
                                      onClick={() => handleDeleteAnswer(comment._id, reply._id, getCreatorName(reply.user))}
                                    >
                                      <IconTrash size={14} />
                                    </ActionIcon>
                                  </Group>
                                )}
                              </Group>

                              <Text className="font-roboto text-sm text-gray-700 leading-relaxed">
                                {reply.content || 'Contenido no disponible'}
                              </Text>
                            </Card>
                          ))}
                        </Stack>
                      )}
                    </Card>
                  ))}
                </Stack>
              </ScrollArea>
            ) : (
              <div className="text-center py-12">
                <IconMessageCircle size={64} color="#9ca3af" style={{ margin: '0 auto 1rem' }} />
                <Text className="font-bebas text-xl text-gray-500 mb-2">
                  NO HAY COMENTARIOS AÚN
                </Text>
                <Text className="font-roboto text-gray-400">
                  ¡Sé el primero en comentar en este foro!
                </Text>
              </div>
            )}
          </Paper>
        </Stack>
      </Container>

      {/* Formulario flotante - Actualizado con visibilidad condicional */}
      {showFloatingForm && (
        <div
          ref={formRef}
          className="floating-comment-form"
          style={{
            position: 'fixed',
            bottom: 0,
            left: '280px',
            right: 0,
            zIndex: 1000,
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(75, 205, 246, 0.2)',
            boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.1)',
            transform: isFormExpanded ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.3s ease-in-out'
          }}
        >
          <Container size="xl" p="md" style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
            <Paper
              p="md"
              shadow="sm"
              radius="lg"
              style={{
                border: '2px solid rgba(75, 205, 246, 0.2)',
                background: 'rgba(255, 255, 255, 0.95)'
              }}
            >
              <Stack gap="sm">
                <Flex justify="space-between" align="center">
                  <Text className="font-bebas text-lg text-[#1D1A05] tracking-wide">
                    AGREGAR COMENTARIO
                  </Text>
                  <Badge
                    size="xs"
                    variant="light"
                    styles={{
                      root: {
                        background: 'linear-gradient(135deg, rgba(75, 205, 246, 0.1), rgba(255, 54, 159, 0.1))',
                        color: '#4BCDF6',
                        fontFamily: 'Roboto, sans-serif',
                        fontWeight: 500,
                        fontSize: '10px'
                      }
                    }}
                  >
                    💬 Comentar
                  </Badge>
                </Flex>
                
                <Flex gap="sm" align="flex-end">
                  <Textarea
                    placeholder="Comparte tu opinión..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.currentTarget.value)}
                    minRows={1}
                    maxRows={4}
                    autosize
                    styles={{
                      input: {
                        fontFamily: 'Roboto, sans-serif',
                        border: '2px solid #f0f0f0',
                        borderRadius: '12px',
                        fontSize: '14px',
                        '&:focus': { 
                          borderColor: '#4BCDF6',
                          boxShadow: '0 0 0 3px rgba(75, 205, 246, 0.1)'
                        }
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  
                  <Button
                    onClick={handleCreateComment}
                    size="md"
                    loading={createCommentMutation.isPending}
                    disabled={!newComment.trim()}
                    styles={{
                      root: {
                        background: newComment.trim() 
                          ? 'linear-gradient(135deg, #4BCDF6, #FF369F)'
                          : 'linear-gradient(135deg, #e5e7eb, #9ca3af)',
                        border: 'none',
                        color: 'white',
                        fontFamily: 'Roboto, sans-serif',
                        fontWeight: 600,
                        minWidth: '60px',
                        height: '40px',
                        borderRadius: '12px',
                        '&:hover': {
                          background: newComment.trim()
                            ? 'linear-gradient(135deg, #FF369F, #4BCDF6)'
                            : 'linear-gradient(135deg, #e5e7eb, #9ca3af)',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(75, 205, 246, 0.3)'
                        },
                        transition: 'all 0.2s ease'
                      }
                    }}
                  >
                    <IconSend size={16} />
                  </Button>
                </Flex>
              </Stack>
            </Paper>
          </Container>
        </div>
      )}

      {/* Estilos CSS para el formulario flotante */}
      <style>{`
        @media (max-width: 768px) {
          .floating-comment-form {
            left: 0 !important;
          }
        }
        
        @media (min-width: 769px) {
          .floating-comment-form {
            left: 280px !important;
          }
        }
      `}</style>

      {/* Modal para editar comentario */}
      <Modal
        opened={editModalOpened}
        onClose={handleCloseEditModal}
        title={
          <Text className="font-bebas text-xl text-[#1D1A05] tracking-wide">
            EDITAR COMENTARIO
          </Text>
        }
        size="lg"
        styles={{
          header: {
            backgroundColor: '#f8f9fa',
            borderBottom: '2px solid rgba(159, 139, 234, 0.1)'
          },
          body: {
            padding: '2rem'
          }
        }}
      >
        <Stack gap="lg">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.currentTarget.value)}
            minRows={4}
            placeholder="Edita tu comentario..."
            styles={{
              input: {
                fontFamily: 'Roboto, sans-serif',
                border: '2px solid #f0f0f0',
                '&:focus': { borderColor: '#9F8BEA' }
              }
            }}
          />
          
          <Group justify="flex-end" gap="md">
            <Button
              variant="outline"
              onClick={handleCloseEditModal}
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
              onClick={handleUpdateComment}
              loading={updateCommentMutation.isPending}
              disabled={!editContent.trim()}
              styles={{
                root: {
                  background: 'linear-gradient(135deg, #9F8BEA, #FFAF21)',
                  border: 'none',
                  color: 'white',
                  fontFamily: 'Roboto, sans-serif',
                  fontWeight: 600
                }
              }}
            >
              Guardar Cambios
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal para editar respuesta */}
      <Modal
        opened={editAnswerModalOpened}
        onClose={handleCloseEditAnswerModal}
        title={
          <Text className="font-bebas text-xl text-[#1D1A05] tracking-wide">
            EDITAR RESPUESTA
          </Text>
        }
        size="lg"
        styles={{
          header: {
            backgroundColor: '#f8f9fa',
            borderBottom: '2px solid rgba(159, 139, 234, 0.1)'
          },
          body: {
            padding: '2rem'
          }
        }}
      >
        <Stack gap="lg">
          <Textarea
            value={editAnswerContent}
            onChange={(e) => setEditAnswerContent(e.currentTarget.value)}
            minRows={3}
            placeholder="Edita tu respuesta..."
            styles={{
              input: {
                fontFamily: 'Roboto, sans-serif',
                border: '2px solid #f0f0f0',
                '&:focus': { borderColor: '#9F8BEA' }
              }
            }}
          />
          
          <Group justify="flex-end" gap="md">
            <Button
              variant="outline"
              onClick={handleCloseEditAnswerModal}
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
              onClick={handleUpdateAnswer}
              loading={updateAnswerMutation.isPending}
              disabled={!editAnswerContent.trim()}
              styles={{
                root: {
                  background: 'linear-gradient(135deg, #9F8BEA, #FFAF21)',
                  border: 'none',
                  color: 'white',
                  fontFamily: 'Roboto, sans-serif',
                  fontWeight: 600
                }
              }}
            >
              Guardar Cambios
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}