import React from 'react';
import { Group, Menu, Text, Loader } from '@mantine/core';
import { IconUser, IconLogout } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useUser, SignOutButton } from '@clerk/clerk-react';
import { useCurrentUser } from '../useCurrentUser';

const Topbar: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { user: currentUser, isLoading: userLoading } = useCurrentUser();

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

  return (
    <header 
      className="w-full h-16 flex items-center justify-between px-8 shadow-lg relative"
      style={{
        background: 'linear-gradient(135deg, #1D1A05 0%, #2A2416 100%)',
        borderBottom: '1px solid rgba(75, 205, 246, 0.1)',
      }}
    >
      {/* Efectos decorativos de fondo */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: 'linear-gradient(90deg, rgba(75, 205, 246, 0.02) 0%, rgba(255, 54, 159, 0.01) 50%, rgba(159, 139, 234, 0.02) 100%)',
        }}
      />

      {/* Lado izquierdo: Logo y título */}
      <Group className="relative z-10">
        <div className="flex items-center gap-4">
          
          {/* Título */}
          <div>
            <Text 
              className="font-roboto text-xs uppercase tracking-widest"
              style={{
                fontFamily: 'Bebas Neue, cursive',
                fontSize: 20,
                color: 'white',
                marginBottom: 4,
              }}
            >
              Panel de Control
            </Text>
          </div>
        </div>
      </Group>

      {/* Lado derecho: Notificaciones y perfil */}
      <Group className="relative z-10" gap="md">

        {/* Separador */}
        <div 
          className="w-px h-6"
          style={{ background: 'rgba(255, 255, 255, 0.1)' }}
        />

        {/* Menu del usuario */}
        <Menu shadow="xl" width={240} position="bottom-end">
          <Menu.Target>
            <div className="flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-all duration-200 hover:bg-white/5">
              {/* Avatar con gradiente */}
              <div 
                className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #4BCDF6, #FF369F)',
                  boxShadow: '0 4px 12px rgba(75, 205, 246, 0.3)',
                }}
              >
                {user?.imageUrl ? (
                  <img 
                    src={user.imageUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <Text className="font-bebas text-white text-sm">
                    {user?.firstName?.charAt(0) || 'U'}
                  </Text>
                )}
              </div>
              
              {/* Info del usuario */}
              <div className="hidden md:block">
                <Text 
                  className="font-roboto text-cyan-50 text-sm font-medium"
                  style={{ lineHeight: 1.2, color: 'white' }}
                >
                  {user?.firstName || currentUser?.first_name || 'Usuario'}
                </Text>
                <div className="flex items-center gap-1">
                  {userLoading ? (
                    <Loader size="xs" color="#4BCDF6" />
                  ) : (
                    <Text 
                      className="font-roboto text-xs"
                      style={{ 
                        color: 'rgba(255, 255, 255, 0.6)',
                        lineHeight: 1.2,
                      }}
                    >
                      {currentUser?.role ? getRoleDisplayName(currentUser.role) : 'Usuario'}
                    </Text>
                  )}
                </div>
              </div>
            </div>
          </Menu.Target>
          
          <Menu.Dropdown
            style={{
              background: '#1D1A05',
              border: '1px solid rgba(75, 205, 246, 0.2)',
              borderRadius: 12,
              padding: 8,
            }}
          >
            {/* Header del menu */}
            <Menu.Label 
              style={{
                fontFamily: 'Roboto, sans-serif',
                color: '#4BCDF6',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: 8,
              }}
            >
              ¡Bienvenido, {user?.firstName || 'Usuario'}!
            </Menu.Label>
            
            {/* Opciones del menu */}
            <Menu.Item 
              onClick={() => navigate('/app/perfil')}
              style={{
                borderRadius: 8,
                fontFamily: 'Roboto, sans-serif',
                color: 'white',
                fontSize: 14,
                padding: '10px 12px',
              }}
              className="hover:border-green-400/10 hover:bg-white/5"
            >
              <span className="flex items-center gap-3 text-[#4BCDF6]">
                <IconUser size={18} color="#4BCDF6" />
                Mi Perfil
              </span>
            </Menu.Item>
            
            <Menu.Divider 
              style={{ 
                borderColor: 'rgba(255, 255, 255, 0.1)',
                margin: '8px 0',
              }} 
            />
            
            {/* Botón de cerrar sesión */}
            <SignOutButton>
              <Menu.Item 
                style={{
                  borderRadius: 8,
                  fontFamily: 'Roboto, sans-serif',
                  fontSize: 14,
                  padding: '10px 12px',
                }}
                className="hover:bg-red-500/10"
              >
                <span className="flex items-center gap-3 text-[#FF369F]">
                  <IconLogout size={18} />
                  Cerrar sesión
                </span>
              </Menu.Item>
            </SignOutButton>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </header>
  );
};

export default Topbar;