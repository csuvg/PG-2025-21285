import { useState } from 'react';
import { 
  Container, 
  Paper, 
  Text, 
  Group, 
  Stack,
  Grid,
  Card,
  Avatar,
  Badge,
  ActionIcon,
  Table,
  ScrollArea,
  Tooltip,
  TextInput,
  Select,
  Loader,
  Alert,
  Modal,
  Button
} from '@mantine/core';
import { 
  IconUser,
  IconEdit,
  IconSchool,
  IconBriefcase,
  IconSearch,
  IconAlertTriangle,
  IconCheck,
  IconSettings
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useUser } from '@clerk/clerk-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useDisclosure } from '@mantine/hooks';
import { useAuthenticatedFetch } from '../../hooks/useAuthenticatedFetch';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { decryptUser } from '../../utils/traffic.crypto';

// Interfaces para usuarios
interface EncryptedUser {
  _id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  role: string;
  image_url: string | null;
  username: string | null;
}

interface DecryptedUser {
  _id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  role: 'admin' | 'director' | 'teacher' | 'student';
  image_url: string | null;
  username: string | null;
}

interface UsersApiResponse {
  users: EncryptedUser[];
}


export default function Cuentas() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
  const [selectedUser, setSelectedUser] = useState<DecryptedUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');

  // Clerk hooks
  const { isLoaded } = useUser();
  const { user: currentUser, isLoading: userLoading } = useCurrentUser();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const queryClient = useQueryClient();

  // Verificar si el usuario actual es admin
  const isCurrentUserAdmin = currentUser?.role === 'admin';

  // Query para obtener usuarios de la API
  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<DecryptedUser[]> => {
      try {
        const response = await authenticatedFetch('https://api.miraiedu.online/users');
        
        if (!response.ok) {
          throw new Error('Error al obtener usuarios');
        }
        
        const apiData: UsersApiResponse = await response.json();
        
        // Desencriptar todos los usuarios
        const decryptedUsers = await Promise.all(
          apiData.users.map(async (encryptedUser) => {
            const decryptedUser = await decryptUser(encryptedUser);
            return decryptedUser as DecryptedUser;
          })
        );
        
        return decryptedUsers;
      } catch (error) {
        console.error('Error al obtener usuarios:', error);
        throw error;
      }
    },
    enabled: isCurrentUserAdmin && isLoaded,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para actualizar rol de usuario
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await authenticatedFetch(
        `https://api.miraiedu.online/users/${userId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al actualizar el rol del usuario');
      }

      return response.json();
    },
    onSuccess: () => {
      notifications.show({
        title: '¡Éxito!',
        message: `Rol actualizado correctamente para ${selectedUser?.first_name} ${selectedUser?.last_name || ''}.`,
        color: 'green',
        icon: <IconCheck size={16} />,
        position: 'top-right',
        autoClose: 4000,
      });

      // Refrescar la lista de usuarios
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      // Cerrar modal y limpiar estado
      closeEditModal();
      setSelectedUser(null);
      setSelectedRole('');
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'No se pudo actualizar el rol del usuario.',
        color: 'red',
        icon: <IconAlertTriangle size={16} />,
        position: 'top-right',
        autoClose: 4000,
      });
    },
  });

  const usuarios = usersData || [];

  const filterRoles = [
    { value: 'all', label: 'Todos los roles' },
    { value: 'admin', label: 'Administradores' },
    { value: 'director', label: 'Directores' },
    { value: 'teacher', label: 'Docentes' },
    { value: 'student', label: 'Estudiante' }
  ];

  const roleOptions = [
    { value: 'student', label: 'Estudiante' },
    { value: 'director', label: 'Director' },
    { value: 'teacher', label: 'Docente' }
  ];

  // Filtrar usuarios
  const filteredUsuarios = usuarios.filter(usuario => {
    const nombreCompleto = `${usuario.first_name || ''} ${usuario.last_name || ''}`.toLowerCase();
    const matchesSearch = 
      nombreCompleto.includes(searchQuery.toLowerCase()) ||
      (usuario.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === 'all' || usuario.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  // Cálculos para widgets
  const totalUsuarios = usuarios.length;
  const totalDirectores = usuarios.filter(u => u.role === 'director').length;
  const totalDocentes = usuarios.filter(u => u.role === 'teacher').length;
  const totalUsuariosComunes = usuarios.filter(u => u.role === 'student').length;

  const handleEditUser = (usuario: DecryptedUser) => {
    setSelectedUser(usuario);
    setSelectedRole(usuario.role);
    openEditModal();
  };

  const handleUpdateRole = async () => {
    if (!selectedUser || !selectedRole) {
      notifications.show({
        title: 'Error',
        message: 'Datos incompletos para actualizar el rol.',
        color: 'red',
        icon: <IconAlertTriangle size={16} />,
        position: 'top-right',
        autoClose: 4000,
      });
      return;
    }

    // Ejecutar la mutación
    updateRoleMutation.mutate({
      userId: selectedUser._id,
      role: selectedRole
    });
  };

  // Si el usuario no ha cargado aún
  if (!isLoaded || userLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50/30">
        <div className="text-center">
          <Loader size="xl" color="#4BCDF6" />
          <Text className="font-roboto text-gray-600 mt-4 text-lg">
            Verificando permisos...
          </Text>
        </div>
      </div>
    );
  }

  // Si el usuario no es admin, no mostrar la página
  if (!isCurrentUserAdmin) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <Card p="xl" shadow="lg" radius="md" style={{ maxWidth: 400 }}>
          <Stack align="center" gap="lg">
            <IconUser size={64} color="#FF369F" />
            <Text className="font-bebas text-xl text-[#1D1A05] text-center">
              ACCESO DENEGADO
            </Text>
            <Text className="font-roboto text-gray-600 text-center">
              No tienes permisos para acceder a esta sección. Solo los administradores pueden gestionar cuentas de usuario.
            </Text>
          </Stack>
        </Card>
      </div>
    );
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <IconSettings size={16} />;
      case 'director': return <IconBriefcase size={16} />;
      case 'teacher': return <IconSchool size={16} />;
      case 'student': return <IconUser size={16} />;
      default: return <IconUser size={16} />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'red';
      case 'director': return 'purple';
      case 'teacher': return 'blue';
      case 'student': return 'gray';
      default: return 'gray';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'director': return 'Director';
      case 'teacher': return 'Docente';
      case 'student': return 'Estudiante';
      default: return 'Usuario';
    }
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return `${first}${last}` || '?';
  };

  // Mostrar error si falla la carga de usuarios
  if (usersError) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center p-6">
        <Alert 
          color="red" 
          title="Error al cargar usuarios"
          icon={<IconAlertTriangle size={16} />}
          style={{ maxWidth: 500 }}
        >
          <Text className="font-roboto mb-4">
            No se pudieron cargar los usuarios del sistema.
          </Text>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <Container size="xl" className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <Text className="font-bebas text-4xl text-[#1D1A05] tracking-wide mb-2">
                GESTIÓN DE CUENTAS
              </Text>
              <Text className="font-roboto text-gray-600 text-lg">
                Administra las cuentas de usuarios del sistema
              </Text>
              {currentUser && (
                <Group gap="xs" mt="xs">
                  <Badge
                    size="sm"
                    variant="light"
                    styles={{
                      root: {
                        background: 'linear-gradient(135deg, rgba(255, 54, 159, 0.1), rgba(159, 139, 234, 0.1))',
                        color: '#FF369F',
                        fontFamily: 'Roboto, sans-serif',
                        fontWeight: 600
                      }
                    }}
                  >
                    Administrador
                  </Badge>
                  <Text className="font-roboto text-xs text-gray-500">
                    {currentUser.first_name} {currentUser.last_name}
                  </Text>
                </Group>
              )}
            </div>
            
            <div className="bg-gradient-to-r from-[#4BCDF6]/10 to-[#FF369F]/10 rounded-lg p-4 border border-[#4BCDF6]/20">
              <Text className="font-roboto text-sm text-gray-600">
                Los nuevos usuarios pueden registrarse mediante el{' '}
                <Text component="span" className="font-semibold text-[#4BCDF6]">
                  sistema de registro
                </Text>
              </Text>
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card p="lg" shadow="sm" radius="md" style={{ border: '1px solid rgba(75, 205, 246, 0.1)' }}>
                <Group justify="space-between">
                  <div>
                    <Text className="font-roboto text-sm text-gray-500">Total Usuarios</Text>
                    <Text className="font-bebas text-2xl text-[#1D1A05]">
                      {usersLoading ? (
                        <Loader size="sm" color="#4BCDF6" />
                      ) : (
                        totalUsuarios
                      )}
                    </Text>
                  </div>
                  <Avatar size="lg" style={{ background: 'linear-gradient(135deg, #4BCDF6, #FF369F)' }}>
                    <IconUser size={24} />
                  </Avatar>
                </Group>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card p="lg" shadow="sm" radius="md" style={{ border: '1px solid rgba(75, 205, 246, 0.1)' }}>
                <Group justify="space-between">
                  <div>
                    <Text className="font-roboto text-sm text-gray-500">Directores</Text>
                    <Text className="font-bebas text-2xl text-purple-600">
                      {usersLoading ? (
                        <Loader size="sm" color="#a855f7" />
                      ) : (
                        totalDirectores
                      )}
                    </Text>
                  </div>
                  <Avatar size="lg" color="purple" variant="light">
                    <IconBriefcase size={24} />
                  </Avatar>
                </Group>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card p="lg" shadow="sm" radius="md" style={{ border: '1px solid rgba(75, 205, 246, 0.1)' }}>
                <Group justify="space-between">
                  <div>
                    <Text className="font-roboto text-sm text-gray-500">Docentes</Text>
                    <Text className="font-bebas text-2xl text-blue-600">
                      {usersLoading ? (
                        <Loader size="sm" color="#3b82f6" />
                      ) : (
                        totalDocentes
                      )}
                    </Text>
                  </div>
                  <Avatar size="lg" color="blue" variant="light">
                    <IconSchool size={24} />
                  </Avatar>
                </Group>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card p="lg" shadow="sm" radius="md" style={{ border: '1px solid rgba(75, 205, 246, 0.1)' }}>
                <Group justify="space-between">
                  <div>
                    <Text className="font-roboto text-sm text-gray-500">Estudiantes</Text>
                    <Text className="font-bebas text-2xl text-gray-600">
                      {usersLoading ? (
                        <Loader size="sm" color="#6b7280" />
                      ) : (
                        totalUsuariosComunes
                      )}
                    </Text>
                  </div>
                  <Avatar size="lg" color="gray" variant="light">
                    <IconUser size={24} />
                  </Avatar>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>
        </Container>
      </div>

      <Container size="xl" className="p-6">
        {/* Filtros y búsqueda */}
        <Paper p="lg" shadow="sm" radius="md" mb="xl" style={{ border: '1px solid rgba(75, 205, 246, 0.1)' }}>
          <Group justify="space-between" mb="md">
            <Text className="font-bebas text-lg text-[#1D1A05] tracking-wide">
              FILTROS Y BÚSQUEDA
            </Text>
          </Group>
          
          <Grid>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <TextInput
                placeholder="Buscar por nombre o correo..."
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
                placeholder="Filtrar por rol"
                value={filterRole}
                onChange={(value) => setFilterRole(value || 'all')}
                data={filterRoles}
                styles={{
                  input: {
                    fontFamily: 'Roboto, sans-serif',
                    border: '2px solid #f0f0f0',
                    '&:focus': { borderColor: '#4BCDF6' }
                  }
                }}
              />
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Tabla de usuarios */}
        <Paper p="lg" shadow="sm" radius="md" style={{ border: '1px solid rgba(75, 205, 246, 0.1)' }}>
          <Group justify="space-between" mb="lg">
            <Text className="font-bebas text-xl text-[#1D1A05] tracking-wide">
              USUARIOS REGISTRADOS
            </Text>
            <Badge variant="light" color="blue" size="lg">
              {usersLoading ? (
                <Group gap="xs">
                  <Loader size="xs" />
                  <Text>Cargando...</Text>
                </Group>
              ) : (
                `${filteredUsuarios.length} usuarios`
              )}
            </Badge>
          </Group>
          
          {usersLoading ? (
            <div className="text-center py-12">
              <Loader size="xl" color="#4BCDF6" />
              <Text className="font-roboto text-gray-600 mt-4 text-lg">
                Cargando usuarios...
              </Text>
            </div>
          ) : (
            <ScrollArea>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>
                      <Text className="font-roboto font-semibold">Estudiante</Text>
                    </Table.Th>
                    <Table.Th>
                      <Text className="font-roboto font-semibold">Correo</Text>
                    </Table.Th>
                    <Table.Th>
                      <Text className="font-roboto font-semibold">Rol</Text>
                    </Table.Th>
                    <Table.Th>
                      <Text className="font-roboto font-semibold">ID</Text>
                    </Table.Th>
                    <Table.Th>
                      <Text className="font-roboto font-semibold">Acciones</Text>
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredUsuarios.map((usuario) => (
                    <Table.Tr key={usuario._id}>
                      <Table.Td>
                        <Group gap="sm">
                          <Avatar
                            size="md"
                            src={usuario.image_url}
                            style={{
                              background: usuario.image_url 
                                ? 'transparent' 
                                : `linear-gradient(135deg, ${getRoleColor(usuario.role) === 'red' ? '#ef4444, #fbbf24' : getRoleColor(usuario.role) === 'purple' ? '#a855f7, #3b82f6' : getRoleColor(usuario.role) === 'blue' ? '#3b82f6, #10b981' : '#6b7280, #9ca3af'})`
                            }}
                          >
                            {!usuario.image_url && getInitials(usuario.first_name, usuario.last_name)}
                          </Avatar>
                          <div>
                            <Text className="font-roboto font-semibold text-sm">
                              {usuario.first_name} {usuario.last_name || ''}
                            </Text>
                            <Text className="font-roboto text-xs text-gray-500">
                              {usuario.username || 'Sin username'}
                            </Text>
                          </div>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text className="font-roboto text-sm">{usuario.email}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          leftSection={getRoleIcon(usuario.role)}
                          color={getRoleColor(usuario.role)}
                          variant="light"
                        >
                          {getRoleLabel(usuario.role)}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text className="font-roboto text-xs text-gray-500 font-mono">
                          {usuario._id.substring(0, 12)}...
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Tooltip label="Editar rol">
                            <ActionIcon 
                              size="sm" 
                              variant="subtle" 
                              color="blue"
                              onClick={() => handleEditUser(usuario)}
                              disabled={usuario.role === 'admin'}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          )}

          {!usersLoading && filteredUsuarios.length === 0 && (
            <div className="text-center py-12">
              <IconUser size={64} color="#9ca3af" style={{ margin: '0 auto 1rem' }} />
              <Text className="font-bebas text-xl text-gray-500 mb-2">
                NO SE ENCONTRARON USUARIOS
              </Text>
              <Text className="font-roboto text-gray-400">
                {searchQuery || filterRole !== 'all' 
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Los usuarios aparecerán aquí cuando se registren'
                }
              </Text>
            </div>
          )}
        </Paper>
      </Container>

      {/* Modal para editar rol */}
      <Modal
        opened={editModalOpened}
        onClose={closeEditModal}
        title={
          <Group gap="sm">
            <IconEdit size={24} color="#4BCDF6" />
            <Text className="font-bebas text-xl text-[#1D1A05] tracking-wide">
              EDITAR ROL DE USUARIO
            </Text>
          </Group>
        }
        size="md"
        styles={{
          header: {
            backgroundColor: 'linear-gradient(135deg, rgba(75, 205, 246, 0.05), rgba(255, 54, 159, 0.05))',
            borderBottom: '2px solid rgba(75, 205, 246, 0.1)'
          },
          body: {
            padding: '2rem'
          }
        }}
      >
        {selectedUser && (
          <Stack gap="lg">
            <Paper p="md" radius="md" style={{ border: '1px solid rgba(75, 205, 246, 0.1)', background: 'rgba(75, 205, 246, 0.02)' }}>
              <Group gap="md">
                <Avatar
                  size="lg"
                  src={selectedUser.image_url}
                  style={{
                    background: selectedUser.image_url 
                      ? 'transparent' 
                      : 'linear-gradient(135deg, #4BCDF6, #FF369F)'
                  }}
                >
                  {!selectedUser.image_url && getInitials(selectedUser.first_name, selectedUser.last_name)}
                </Avatar>
                <div>
                  <Text className="font-roboto font-semibold text-lg text-[#1D1A05]">
                    {selectedUser.first_name} {selectedUser.last_name || ''}
                  </Text>
                  <Text className="font-roboto text-sm text-gray-600">
                    {selectedUser.email}
                  </Text>
                  <Badge
                    size="sm"
                    color={getRoleColor(selectedUser.role)}
                    variant="light"
                  >
                    Rol actual: {getRoleLabel(selectedUser.role)}
                  </Badge>
                </div>
              </Group>
            </Paper>

            <div>
              <Text className="font-roboto font-semibold text-sm mb-sm text-[#1D1A05]">
                Nuevo rol:
              </Text>
              <Select
                value={selectedRole}
                onChange={(value) => setSelectedRole(value || '')}
                data={roleOptions}
                placeholder="Selecciona un rol"
                styles={{
                  input: {
                    fontFamily: 'Roboto, sans-serif',
                    border: '2px solid #f0f0f0',
                    '&:focus': { borderColor: '#4BCDF6' }
                  }
                }}
              />
            </div>

            <Group justify="flex-end" gap="md">
              <Button
                variant="outline"
                onClick={closeEditModal}
                disabled={updateRoleMutation.isPending}
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
                onClick={handleUpdateRole}
                loading={updateRoleMutation.isPending}
                disabled={!selectedRole || selectedRole === selectedUser.role}
                styles={{
                  root: {
                    background: 'linear-gradient(135deg, #4BCDF6, #FF369F)',
                    border: 'none',
                    color: 'white',
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 600,
                    '&:disabled': {
                      background: '#e5e7eb',
                      color: '#9ca3af'
                    }
                  }
                }}
              >
                Actualizar Rol
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </div>
  );
}