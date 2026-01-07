import { useCurrentUser } from '../../hooks/useCurrentUser';
import { Loader, Alert, Text } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import AnaliticasAdmin from './analiticasadmin';
import AnaliticasDirector from './analiticasdirector';
import AnaliticasDocente from './analiticasdocente';

export default function AnaliticasIndex() {
  const { user, isLoading, error } = useCurrentUser();

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

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center p-6">
        <Alert 
          color="red" 
          title="Error al cargar analíticas"
          icon={<IconAlertTriangle size={16} />}
          style={{ maxWidth: 500 }}
        >
          <Text className="font-roboto">
            No se pudo cargar la información del usuario. Por favor, intenta de nuevo.
          </Text>
        </Alert>
      </div>
    );
  }

  // Renderizar componente según el rol
  switch (user.role.toLowerCase()) {
    case 'administrador':
    case 'admin':
      return <AnaliticasAdmin />;
    case 'director':
      return <AnaliticasDirector />;
    case 'teacher':
      return <AnaliticasDocente />;
    default:
      return (
        <div className="min-h-screen bg-gray-50/30 flex items-center justify-center p-6">
          <Alert 
            color="orange" 
            title="Acceso no permitido"
            icon={<IconAlertTriangle size={16} />}
            style={{ maxWidth: 500 }}
          >
            <Text className="font-roboto">
              Tu rol ({user.role}) no tiene acceso a las analíticas.
            </Text>
          </Alert>
        </div>
      );
  }
}