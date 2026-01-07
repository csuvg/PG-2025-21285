import { useState } from 'react';
import { 
  Container, 
  Paper, 
  Text, 
  Group, 
  Avatar, 
  Badge,
  Stack,
  Grid,
  Button,
  Modal,
  TextInput,
  ActionIcon,
  Card,
  Alert
} from '@mantine/core';
import { 
  IconMail,
  IconCalendar,
  IconPhone,
  IconBriefcase,
  IconEdit,
  IconKey,
  IconShield,
  IconCheck,
  IconX,
  IconEye,
  IconEyeOff,
  IconAlertCircle
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useUser } from '@clerk/clerk-react';
import { notifications } from '@mantine/notifications';
import { useCurrentUser } from '../../hooks/useCurrentUser';

// Interfaz para tipar la metadata del usuario
interface UserMetadata {
  phone?: string;
  carreraId?: string | null;
  cursoIds?: string[];
}

export default function Perfil() {
  const { user } = useUser();
  const { user: currentUser, isLoading: userLoading } = useCurrentUser();
  
  // Extraer metadata del usuario con tipado correcto
  const userMetadata = (user?.unsafeMetadata || user?.unsafeMetadata || {}) as UserMetadata;
  const userRole = currentUser?.role || 'usuario';
  const userPhone = userMetadata.phone || '';
  
  const [editModalOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [passwordModalOpened, { open: openPassword, close: closePassword }] = useDisclosure(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Función para obtener el texto del rol en español
  const getRoleDisplayName = (role: string) => {
    switch(role) {
      case 'admin':
        return 'Administrador';
      case 'teacher':
        return 'Docente';
      case 'director':
        return 'Director';
      default:
        return 'Usuario';
    }
  };

  // Función para obtener el color del badge según el rol
  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case 'admin':
        return 'red';
      case 'teacher':
        return 'blue';
      case 'director':
        return 'green';
      default:
        return 'gray';
    }
  };

  // Estados para el formulario de edición
  const [editData, setEditData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: userPhone || '',
    position: userRole === 'admin' ? 'Administrador del Sistema' : getRoleDisplayName(userRole),
  });

  // Estados para cambio de contraseña (mockeado)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Función para manejar la edición del perfil
  const handleEditProfile = () => {
    // Lógica mockeada para editar perfil
    console.log('Datos del perfil editados:', editData);
    
    notifications.show({
      title: '¡Perfil actualizado!',
      message: 'Los cambios se han guardado correctamente.',
      color: 'teal',
      icon: <IconCheck size={16} />,
      autoClose: 4000,
    });
    
    closeEdit();
  };

  // Función para cambiar contraseña
  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      notifications.show({
        title: 'Error',
        message: 'Las contraseñas no coinciden.',
        color: 'red',
        icon: <IconX size={16} />,
        autoClose: 4000,
      });
      return;
    }

    // Lógica mockeada para cambio de contraseña
    console.log('Cambio de contraseña solicitado');
    
    notifications.show({
      title: '¡Contraseña actualizada!',
      message: 'Tu contraseña ha sido cambiada exitosamente.',
      color: 'teal',
      icon: <IconCheck size={16} />,
      autoClose: 4000,
    });
    
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    
    closePassword();
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Header */}
      <div 
        className="bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm"
        style={{ backdropFilter: 'blur(10px)' }}
      >
        <Container size="xl" className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <Text className="font-bebas text-4xl text-[#1D1A05] tracking-wide mb-2">
                MI PERFIL
              </Text>
              <Text className="font-roboto text-gray-600 text-lg">
                Gestiona tu información personal y configuración de cuenta
              </Text>
            </div>
          </div>
        </Container>
      </div>

      {/* Contenido principal */}
      <Container size="xl" className="p-6">
        <Grid>
          {/* Columna izquierda - Información principal */}
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Stack gap="lg">
              {/* Card principal del perfil */}
              <Paper 
                p="xl" 
                shadow="sm" 
                radius="md"
                style={{
                  border: '1px solid rgba(75, 205, 246, 0.1)',
                  background: 'linear-gradient(135deg, rgba(75, 205, 246, 0.01), rgba(255, 54, 159, 0.005))'
                }}
              >
                <Group justify="space-between" mb="xl">
                  <Group>
                    <Avatar
                      size={80}
                      src={user?.imageUrl}
                      style={{
                        background: user?.imageUrl ? 'transparent' : 'linear-gradient(135deg, #4BCDF6, #FF369F)',
                        boxShadow: '0 8px 24px rgba(75, 205, 246, 0.3)'
                      }}
                    >
                      {!user?.imageUrl && (
                        <Text className="font-bebas text-2xl text-white">
                          {user?.firstName?.charAt(0) || 'U'}{user?.lastName?.charAt(0) || 'S'}
                        </Text>
                      )}
                    </Avatar>
                    
                    <div>
                      <Text className="font-bebas text-2xl text-[#1D1A05] tracking-wide">
                        {user?.firstName} {user?.lastName}
                      </Text>
                      <Text className="font-roboto text-lg text-gray-600 font-medium">
                        {editData.position}
                      </Text>
                      <Group gap="xs" mt="xs">
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
                          Activo
                        </Badge>
                        {userLoading ? (
                          <Badge variant="light" color="gray">
                            Cargando...
                          </Badge>
                        ) : (
                          <Badge
                            variant="light"
                            color={getRoleBadgeColor(userRole)}
                            styles={{
                              root: {
                                fontFamily: 'Roboto, sans-serif'
                              }
                            }}
                          >
                            {getRoleDisplayName(userRole)}
                          </Badge>
                        )}
                      </Group>
                    </div>
                  </Group>
                  
                  <Button
                    onClick={openEdit}
                    leftSection={<IconEdit size={16} />}
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
                  >
                    Editar Perfil
                  </Button>
                </Group>

                {/* Información personal */}
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="md">
                      <Group>
                        <IconMail size={20} color="#4BCDF6" />
                        <div>
                          <Text className="font-roboto text-xs text-gray-500 uppercase tracking-wide">
                            Correo Electrónico
                          </Text>
                          <Text className="font-roboto text-sm font-medium text-gray-700">
                            {user?.primaryEmailAddress?.emailAddress}
                          </Text>
                        </div>
                      </Group>
                      
                      <Group>
                        <IconPhone size={20} color="#FF369F" />
                        <div>
                          <Text className="font-roboto text-xs text-gray-500 uppercase tracking-wide">
                            Teléfono
                          </Text>
                          <Text className="font-roboto text-sm font-medium text-gray-700">
                            {userPhone || 'No registrado'}
                          </Text>
                        </div>
                      </Group>
                      
                    </Stack>
                  </Grid.Col>
                  
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="md">
                      <Group>
                        <IconCalendar size={20} color="#FFAF21" />
                        <div>
                          <Text className="font-roboto text-xs text-gray-500 uppercase tracking-wide">
                            Miembro desde
                          </Text>
                          <Text className="font-roboto text-sm font-medium text-gray-700">
                            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }) : 'No disponible'}
                          </Text>
                        </div>
                      </Group>

                      <Group>
                        <IconBriefcase size={20} color="#9F8BEA" />
                        <div>
                          <Text className="font-roboto text-xs text-gray-500 uppercase tracking-wide">
                            Rol
                          </Text>
                          <Text className="font-roboto text-sm font-medium text-gray-700">
                            {userLoading ? 'Cargando...' : getRoleDisplayName(userRole)}
                          </Text>
                        </div>
                      </Group>
                    </Stack>
                  </Grid.Col>
                </Grid>
              </Paper>

              {/* Información de la cuenta */}
              <Paper 
                p="xl" 
                shadow="sm" 
                radius="md"
                style={{ border: '1px solid rgba(159, 139, 234, 0.1)' }}
              >
                <Text className="font-bebas text-lg text-[#1D1A05] tracking-wide mb-4">
                  INFORMACIÓN DE LA CUENTA
                </Text>
                
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Group>
                      <IconShield size={20} color="#4BCDF6" />
                      <div>
                        <Text className="font-roboto text-xs text-gray-500 uppercase tracking-wide">
                          Rol del Sistema
                        </Text>
                        <Group gap="xs">
                           <Text className="font-roboto text-sm font-medium text-gray-700">
                            {userLoading ? 'Cargando...' : getRoleDisplayName(userRole)}
                          </Text>
                          {!userLoading && (
                            <Badge size="xs" color={getRoleBadgeColor(userRole)}>
                              {userRole.toUpperCase()}
                            </Badge>
                          )}
                        </Group>
                      </div>
                    </Group>
                  </Grid.Col>
                  
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Group>
                      <IconCalendar size={20} color="#FFAF21" />
                      <div>
                        <Text className="font-roboto text-xs text-gray-500 uppercase tracking-wide">
                          Última conexión
                        </Text>
                        <Text className="font-roboto text-sm font-medium text-gray-700">
                          {user?.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString('es-ES') : 'No disponible'}
                        </Text>
                      </div>
                    </Group>
                  </Grid.Col>
                </Grid>
              </Paper>
            </Stack>
          </Grid.Col>

          {/* Columna derecha - Acciones y configuración */}
          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Stack gap="lg">
              {/* Card de seguridad */}
              <Card
                shadow="sm"
                padding="lg"
                radius="md"
                style={{
                  border: '1px solid rgba(255, 54, 159, 0.1)',
                  background: 'rgba(255, 54, 159, 0.02)'
                }}
              >
                <Group justify="space-between" mb="md">
                  <Group>
                    <IconKey size={24} color="#FF369F" />
                    <div>
                      <Text className="font-bebas text-lg text-[#1D1A05] tracking-wide">
                        SEGURIDAD
                      </Text>
                      <Text className="font-roboto text-xs text-gray-600">
                        Gestiona tu contraseña
                      </Text>
                    </div>
                  </Group>
                </Group>
                
                <Button
                  fullWidth
                  onClick={openPassword}
                  leftSection={<IconKey size={16} />}
                  styles={{
                    root: {
                      background: 'linear-gradient(135deg, #FF369F, #9F8BEA)',
                      border: 'none',
                      color: 'white',
                      fontFamily: 'Roboto, sans-serif',
                      fontWeight: 600,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #9F8BEA, #FF369F)',
                      }
                    }
                  }}
                >
                  Cambiar Contraseña
                </Button>
              </Card>
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>

      {/* Modal para editar perfil */}
      <Modal
        opened={editModalOpened}
        onClose={closeEdit}
        title={
          <Text className="font-bebas text-xl text-[#1D1A05] tracking-wide">
            EDITAR PERFIL
          </Text>
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
        <Stack gap="md">
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Nombre"
                value={editData.firstName}
                onChange={(e) => setEditData({...editData, firstName: e.currentTarget.value})}
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
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Apellido"
                value={editData.lastName}
                onChange={(e) => setEditData({...editData, lastName: e.currentTarget.value})}
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
            </Grid.Col>
          </Grid>

          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Teléfono"
                value={editData.phone}
                onChange={(e) => setEditData({...editData, phone: e.currentTarget.value})}
                placeholder={userPhone || '+57 300 123 4567'}
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
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Cargo"
                value={editData.position}
                onChange={(e) => setEditData({...editData, position: e.currentTarget.value})}
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
            </Grid.Col>
          </Grid>

          <Group justify="flex-end" mt="xl">
            <Button
              variant="outline"
              onClick={closeEdit}
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
              onClick={handleEditProfile}
              styles={{
                root: {
                  background: 'linear-gradient(135deg, #4BCDF6, #FF369F)',
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

      {/* Modal para cambiar contraseña */}
      <Modal
        opened={passwordModalOpened}
        onClose={closePassword}
        title={
          <Group>
            <IconKey size={24} color="#FF369F" />
            <Text className="font-bebas text-xl text-[#1D1A05] tracking-wide">
              CAMBIAR CONTRASEÑA
            </Text>
          </Group>
        }
        size="md"
        styles={{
          header: {
            backgroundColor: '#fef2f2',
            borderBottom: '2px solid rgba(255, 54, 159, 0.1)'
          },
          body: {
            padding: '2rem'
          }
        }}
      >
        <Stack gap="md">
          <Alert 
            icon={<IconAlertCircle size="1rem" />} 
            color="blue"
            styles={{
              root: {
                backgroundColor: 'rgba(75, 205, 246, 0.05)',
                border: '1px solid rgba(75, 205, 246, 0.2)',
                fontFamily: 'Roboto, sans-serif'
              }
            }}
          >
            Por seguridad, necesitas ingresar tu contraseña actual para confirmar los cambios.
          </Alert>

          <TextInput
            label="Contraseña actual"
            type={showCurrentPassword ? 'text' : 'password'}
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.currentTarget.value})}
            rightSection={
              <ActionIcon
                variant="subtle"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
              </ActionIcon>
            }
            styles={{
              label: {
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 600,
                color: '#1D1A05'
              },
              input: {
                fontFamily: 'Roboto, sans-serif',
                border: '2px solid #f0f0f0',
                '&:focus': { borderColor: '#FF369F' }
              }
            }}
          />

          <TextInput
            label="Nueva contraseña"
            type={showNewPassword ? 'text' : 'password'}
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({...passwordData, newPassword: e.currentTarget.value})}
            rightSection={
              <ActionIcon
                variant="subtle"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
              </ActionIcon>
            }
            styles={{
              label: {
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 600,
                color: '#1D1A05'
              },
              input: {
                fontFamily: 'Roboto, sans-serif',
                border: '2px solid #f0f0f0',
                '&:focus': { borderColor: '#FF369F' }
              }
            }}
          />

          <TextInput
            label="Confirmar nueva contraseña"
            type={showConfirmPassword ? 'text' : 'password'}
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.currentTarget.value})}
            rightSection={
              <ActionIcon
                variant="subtle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
              </ActionIcon>
            }
            styles={{
              label: {
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 600,
                color: '#1D1A05'
              },
              input: {
                fontFamily: 'Roboto, sans-serif',
                border: '2px solid #f0f0f0',
                '&:focus': { borderColor: '#FF369F' }
              }
            }}
          />

          <Group justify="flex-end" mt="xl">
            <Button
              variant="outline"
              onClick={closePassword}
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
              onClick={handleChangePassword}
              styles={{
                root: {
                  background: 'linear-gradient(135deg, #FF369F, #9F8BEA)',
                  border: 'none',
                  color: 'white',
                  fontFamily: 'Roboto, sans-serif',
                  fontWeight: 600
                }
              }}
            >
              Cambiar Contraseña
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}