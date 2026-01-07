import { useState } from 'react';
import {
  IconDeviceDesktopAnalytics,
  IconMessageCircle,
  IconUser,
  IconSchool,
  IconBriefcase,
  IconMenu2,
} from '@tabler/icons-react';
import { UnstyledButton, Stack, Box, Text, ActionIcon, Tooltip } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../useCurrentUser';
import logo2 from '../../assets/images/logomirai2.png';

const generalItems = [
  { icon: IconDeviceDesktopAnalytics, label: 'Analíticas', to: '/app/analiticas' },
  { icon: IconBriefcase, label: 'Gestión Vocacional', to: '/app/gestionvocacional' },
  { icon: IconMessageCircle, label: 'Foros', to: '/app/foros' },
  { icon: IconSchool, label: 'Testimonios de Egresados', to: '/app/testimoniosegresdos' },
];

const cuentasItem = { icon: IconUser, label: 'Cuentas', to: '/app/cuentas' };

interface SidebarProps {
  onCollapseChange?: (collapsed: boolean) => void;
}

export default function Sidebar({ onCollapseChange }: SidebarProps) {
  const [active, setActive] = useState(generalItems[0].label);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { user: currentUser } = useCurrentUser();

  // Extraer metadata del usuario con tipado correcto
  const userRole = currentUser?.role || 'usuario';

  // Verificar si el usuario es administrador
  const isAdmin = userRole === 'admin';

  const handleCollapseToggle = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    onCollapseChange?.(newCollapsed);
  };

  return (
    <Box
      style={{
        width: collapsed ? 80 : 280,
        background: '#1D1A05',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: collapsed ? 'center' : 'flex-start',
        paddingTop: 24,
        paddingBottom: 24,
        boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
        transition: 'width 0.3s ease-in-out',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 100,
        
        overflow: 'hidden',
      }}
    >
      {/* Efectos decorativos de fondo */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(180deg, rgba(75, 205, 246, 0.03) 0%, rgba(255, 54, 159, 0.02) 50%, rgba(159, 139, 234, 0.03) 100%)',
        zIndex: 0,
      }} />

      {/* Botón de colapso mejorado */}
      <ActionIcon
        variant="subtle"
        onClick={handleCollapseToggle}
        style={{
          marginLeft: collapsed ? 0 : 20,
          marginBottom: 24,
          alignSelf: collapsed ? 'center' : 'flex-start',
          backgroundColor: 'rgba(75, 205, 246, 0.1)',
          color: '#4BCDF6',
          border: '1px solid rgba(75, 205, 246, 0.2)',
          borderRadius: 8,
          width: 40,
          height: 40,
          zIndex: 1,
          transition: 'all 0.2s ease',
        }}
      >
        <IconMenu2 size={20} />
      </ActionIcon>

      {/* Logo mejorado */}
      <Box
        style={{
          background: 'linear-gradient(135deg, #4BCDF6, #FF369F)',
          borderRadius: collapsed ? 20 : 16,
          width: collapsed ? 40 : 60,
          height: collapsed ? 40 : 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: collapsed ? 24 : 32,
          marginLeft: collapsed ? 0 : 20,
          padding: collapsed ? 6 : 8,
          boxShadow: '0 8px 25px rgba(75, 205, 246, 0.3)',
          transition: 'all 0.3s ease',
          zIndex: 1,
        }}
      >
        <img 
          src={logo2} 
          alt="MiraiWeb Logo" 
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            borderRadius: collapsed ? 14 : 10,
          }}
        />
      </Box>

      {/* Título de la app (solo cuando no está colapsado) */}
      {!collapsed && (
        <Box style={{ marginLeft: 20, marginBottom: 32, zIndex: 1 }}>
          <Text 
            style={{
              fontFamily: 'Bebas Neue, cursive',
              fontSize: 20,
              color: 'white',
              letterSpacing: '2px',
              marginBottom: 4,
            }}
          >
            MIRAI
          </Text>
          <Text 
            style={{
              fontFamily: 'Roboto, sans-serif',
              fontSize: 11,
              color: 'rgba(255, 255, 255, 0.6)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontWeight: 300,
            }}
          >
            Panel de Control
          </Text>
        </Box>
      )}

      {/* General Section */}
      <Text
        style={{
          fontFamily: 'Roboto, sans-serif',
          color: '#4BCDF6',
          fontWeight: 600,
          fontSize: collapsed ? 0 : 11,
          marginLeft: collapsed ? 0 : 20,
          marginBottom: 16,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          opacity: collapsed ? 0 : 1,
          transition: 'all 0.3s ease',
          zIndex: 1,
        }}
      >
        General
      </Text>

      <Stack gap={8} style={{ width: '100%', zIndex: 1 }}>
        {generalItems.map((item) => {
          const isActive = active === item.label;
          const button = (
            <UnstyledButton
              key={item.label}
              onClick={() => {
                setActive(item.label);
                navigate(item.to);
              }}
              style={{
                width: collapsed ? 50 : 'calc(100% - 40px)',
                height: 48,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                paddingLeft: collapsed ? 0 : 20,
                marginLeft: collapsed ? 0 : 20,
                background: isActive 
                  ? 'linear-gradient(135deg, rgba(75, 205, 246, 0.15), rgba(255, 54, 159, 0.15))'
                  : 'transparent',
                border: isActive ? '1px solid rgba(75, 205, 246, 0.3)' : '1px solid transparent',
                color: isActive ? '#4BCDF6' : 'rgba(255, 255, 255, 0.7)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                }
              }}
            >
              <item.icon 
                size={20} 
                stroke={1.8} 
                style={{ 
                  marginRight: collapsed ? 0 : 16,
                  color: isActive ? '#4BCDF6' : 'inherit',
                }} 
              />
              {!collapsed && (
                <span style={{ 
                  fontFamily: 'Roboto, sans-serif',
                  fontSize: 14,
                  fontWeight: isActive ? 500 : 400,
                }}>
                  {item.label}
                </span>
              )}
              {/* Indicador activo */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  left: collapsed ? 0 : -20,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  background: 'linear-gradient(180deg, #4BCDF6, #FF369F)',
                  borderRadius: '0 2px 2px 0',
                }} />
              )}
            </UnstyledButton>
          );

          return collapsed ? (
            <Tooltip 
              label={item.label} 
              position="right" 
              withArrow 
              key={item.label}
              styles={{
                tooltip: {
                  backgroundColor: '#1D1A05',
                  color: 'white',
                  border: '1px solid rgba(75, 205, 246, 0.3)',
                  fontFamily: 'Roboto, sans-serif',
                },
              }}
            >
              {button}
            </Tooltip>
          ) : (
            button
          );
        })}
      </Stack>

      {/* Separador decorativo - Solo mostrar si no es la sección final */}
      {isAdmin && (
        <Box style={{
          width: collapsed ? 30 : 'calc(100% - 40px)',
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(75, 205, 246, 0.3), rgba(255, 54, 159, 0.3), transparent)',
          marginTop: 32,
          marginBottom: 24,
          marginLeft: collapsed ? 0 : 20,
          zIndex: 1,
        }} />
      )}

      {/* Gestionar cuentas Section - Solo para administradores */}
      {isAdmin && (
        <Box style={{ width: '100%', marginTop: 'auto', zIndex: 1 }}>
          <Text
            style={{
              fontFamily: 'Roboto, sans-serif',
              color: '#FF369F',
              fontWeight: 600,
              fontSize: collapsed ? 0 : 11,
              marginLeft: collapsed ? 0 : 20,
              marginBottom: 16,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              opacity: collapsed ? 0 : 1,
              transition: 'all 0.3s ease',
            }}
          >
            Gestionar Cuentas
          </Text>
          {(() => {
            const isActive = active === cuentasItem.label;
            const button = (
              <UnstyledButton
                key={cuentasItem.label}
                onClick={() => {
                  setActive(cuentasItem.label);
                  navigate(cuentasItem.to);
                }}
                style={{
                  width: collapsed ? 50 : 'calc(100% - 40px)',
                  height: 48,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  paddingLeft: collapsed ? 0 : 20,
                  marginLeft: collapsed ? 0 : 20,
                  background: isActive 
                    ? 'linear-gradient(135deg, rgba(255, 54, 159, 0.15), rgba(159, 139, 234, 0.15))'
                    : 'transparent',
                  border: isActive ? '1px solid rgba(255, 54, 159, 0.3)' : '1px solid transparent',
                  color: isActive ? '#FF369F' : 'rgba(255, 255, 255, 0.7)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                  }
                }}
              >
                <cuentasItem.icon 
                  size={20} 
                  stroke={1.8} 
                  style={{ 
                    marginRight: collapsed ? 0 : 16,
                    color: isActive ? '#FF369F' : 'inherit',
                  }} 
                />
                {!collapsed && (
                  <span style={{ 
                    fontFamily: 'Roboto, sans-serif',
                    fontSize: 14,
                    fontWeight: isActive ? 500 : 400,
                  }}>
                    {cuentasItem.label}
                  </span>
                )}
                {/* Indicador activo */}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    left: collapsed ? 0 : -20,
                    top: 0,
                    bottom: 0,
                    width: 3,
                    background: 'linear-gradient(180deg, #FF369F, #9F8BEA)',
                    borderRadius: '0 2px 2px 0',
                  }} />
                )}
              </UnstyledButton>
            );
            return collapsed ? (
              <Tooltip 
                label={cuentasItem.label} 
                position="right" 
                withArrow 
                key={cuentasItem.label}
                styles={{
                  tooltip: {
                    backgroundColor: '#1D1A05',
                    color: 'white',
                    border: '1px solid rgba(255, 54, 159, 0.3)',
                    fontFamily: 'Roboto, sans-serif',
                  },
                }}
              >
                {button}
              </Tooltip>
            ) : (
              button
            );
          })()}
        </Box>
      )}
    </Box>
  );
}