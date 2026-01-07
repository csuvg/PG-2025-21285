import { TextInput, PasswordInput, Button, Text, Card, Stack, Divider } from '@mantine/core';
import { useSignIn } from '@clerk/clerk-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logomirai.png';
import logo2 from '../../assets/images/logomirai2.png';

export default function Login() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setError('');

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        navigate('/app/analiticas');
      } else {
        console.log('Verificación adicional requerida:', result.status);
      }
    } catch (err: any) {
      console.error('Error de login:', err);
      setError(err.errors?.[0]?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterRedirect = () => {
    navigate('/register');
  };

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4BCDF6]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Parte izquierda: Logo e información */}
      <div className="flex-1 bg-[#1D1A05] text-white flex flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Elementos decorativos de fondo más sofisticados */}
        <div className="absolute top-0 left-0 w-full h-full">
          {/* Gradiente principal */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#4BCDF6]/20 via-[#9F8BEA]/15 to-[#FF369F]/10"></div>
          
          {/* Círculos decorativos flotantes */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-[#4BCDF6]/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-32 right-16 w-24 h-24 bg-[#FF369F]/10 rounded-full blur-xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-8 w-16 h-16 bg-[#FFAF21]/10 rounded-full blur-lg animate-pulse delay-500"></div>
          
          {/* Formas geométricas abstractas */}
          <div className="absolute top-16 right-24 w-4 h-4 bg-[#9F8BEA] rotate-45 animate-spin" style={{animationDuration: '8s'}}></div>
          <div className="absolute bottom-24 left-32 w-3 h-3 bg-[#4BCDF6] rounded-full animate-bounce delay-300"></div>
        </div>

        <div className="relative z-10 text-center max-w-lg">
          {/* Contenedor del logo */}
          <div className="relative mb-12">
            {/* Resplandor detrás del logo */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#4BCDF6]/30 to-[#FF369F]/30 rounded-3xl blur-2xl transform scale-110"></div>
            
            {/* Logo principal */}
            <div className="relative bg-black/30 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
              <img 
                src={logo} 
                alt="MiraiWeb Logo" 
                className="w-80 h-80 object-contain mx-auto drop-shadow-2xl" 
              />
            </div>
          </div>

          {/* Título principal */}
          <div className="space-y-6">
            <Text 
              className="text-5xl font-bebas text-white tracking-widest leading-tight"
              style={{
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                background: 'linear-gradient(135deg, #4BCDF6, #FF369F)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              BIENVENID@ A MIRAI
            </Text>

            {/* Línea decorativa */}
            <div className="flex items-center justify-center space-x-4">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#4BCDF6]"></div>
              <div className="w-2 h-2 bg-[#4BCDF6] rounded-full animate-pulse"></div>
              <div className="h-px w-32 bg-gradient-to-r from-[#4BCDF6] via-[#FF369F] to-[#9F8BEA]"></div>
              <div className="w-2 h-2 bg-[#FF369F] rounded-full animate-pulse delay-300"></div>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#9F8BEA]"></div>
            </div>

            
            <Text className="text-lg font-roboto text-white/90 max-w-md leading-relaxed font-light">
              Plataforma web inteligente para la{' '}
              <span className="text-[#4BCDF6] font-medium">gestión y optimización</span>
              <br />
              de la{' '}
              <span className="text-[#FF369F] font-medium">orientación vocacional</span>.
            </Text>

            {/* Indicadores animados */}
            <div className="flex justify-center items-center mt-12 space-x-3">
              <div className="w-3 h-3 bg-[#4BCDF6] rounded-full animate-pulse shadow-lg shadow-[#4BCDF6]/50"></div>
              <div className="w-3 h-3 bg-[#FF369F] rounded-full animate-pulse delay-200 shadow-lg shadow-[#FF369F]/50"></div>
              <div className="w-3 h-3 bg-[#FFAF21] rounded-full animate-pulse delay-400 shadow-lg shadow-[#FFAF21]/50"></div>
              <div className="w-3 h-3 bg-[#9F8BEA] rounded-full animate-pulse delay-600 shadow-lg shadow-[#9F8BEA]/50"></div>
            </div>

            {/* Estadísticas o badges opcionales */}
            <div className="flex justify-center space-x-6 mt-8">
              <div className="text-center">
                <div className="text-[#4BCDF6] text-2xl font-bebas tracking-wide">100%</div>
                <div className="text-white/60 text-xs font-roboto uppercase tracking-widest">Seguro</div>
              </div>
              <div className="w-px h-10 bg-white/20"></div>
              <div className="text-center">
                <div className="text-[#FF369F] text-2xl font-bebas tracking-wide">24/7</div>
                <div className="text-white/60 text-xs font-roboto uppercase tracking-widest">Disponible</div>
              </div>
              <div className="w-px h-10 bg-white/20"></div>
              <div className="text-center">
                <div className="text-[#FFAF21] text-2xl font-bebas tracking-wide">100%</div>
                <div className="text-white/60 text-xs font-roboto uppercase tracking-widest">Confiable</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Parte derecha: Formulario */}
      <div className="flex-1 bg-white flex justify-center items-center p-8">
        <Card
          shadow="xl"
          padding="xl"
          radius="xl"
          className="w-full max-w-md bg-white border border-gray-100"
          style={{ 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.05)' 
          }}
        >
          <Stack gap="lg">
            {/* Header del formulario */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#4BCDF6] to-[#FF369F] rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                <img 
                  src={logo2} 
                  alt="MiraiWeb Logo" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <Text className="text-3xl font-bebas text-[#1D1A05] mb-2 tracking-wide">
                INICIAR SESIÓN
              </Text>
              <Text className="text-sm font-roboto text-gray-600 font-light">
                Accede a tu cuenta para continuar
              </Text>
            </div>

            <Divider color="#f0f0f0" />

            {/* Formulario */}
            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                {error && (
                  <div className="p-3 bg-[#FF369F]/10 border border-[#FF369F]/20 rounded-lg">
                    <Text className="text-[#FF369F] text-sm text-center font-roboto font-medium">
                      {error}
                    </Text>
                  </div>
                )}

                <TextInput
                  label="Correo electrónico"
                  placeholder="tu@email.com"
                  size="md"
                  radius="md"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  styles={{
                    label: { 
                      color: '#1D1A05', 
                      fontWeight: 500,
                      fontFamily: 'Roboto, sans-serif',
                      marginBottom: 8 
                    },
                    input: { 
                      backgroundColor: 'white',
                      border: '2px solid #f0f0f0',
                      color: '#1D1A05',
                      fontFamily: 'Roboto, sans-serif',
                      '&:focus': {
                        borderColor: '#4BCDF6',
                        boxShadow: '0 0 0 3px rgba(75, 205, 246, 0.1)'
                      }
                    },
                  }}
                />
                
                <PasswordInput
                  label="Contraseña"
                  placeholder="Tu contraseña"
                  size="md"
                  radius="md"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  styles={{
                    label: { 
                      color: '#1D1A05', 
                      fontWeight: 500,
                      fontFamily: 'Roboto, sans-serif',
                      marginBottom: 8 
                    },
                    input: { 
                      backgroundColor: 'white',
                      border: '2px solid #f0f0f0',
                      color: '#1D1A05',
                      fontFamily: 'Roboto, sans-serif',
                      '&:focus': {
                        borderColor: '#4BCDF6',
                        boxShadow: '0 0 0 3px rgba(75, 205, 246, 0.1)'
                      }
                    },
                  }}
                />
                
                <Button
                  type="submit"
                  fullWidth
                  size="md"
                  radius="md"
                  loading={loading}
                  disabled={!email || !password}
                  className="bg-gradient-to-r from-[#4BCDF6] to-[#FF369F] hover:from-[#FF369F] hover:to-[#4BCDF6] text-white font-bebas text-lg tracking-wide transition-all duration-300 transform hover:scale-105 shadow-lg"
                  styles={{
                    root: {
                      border: 'none',
                      height: 48,
                      fontFamily: 'Bebas Neue, cursive',
                      letterSpacing: '1px',
                      '&:disabled': {
                        backgroundColor: '#d4d4d4',
                        backgroundImage: 'none'
                      }
                    }
                  }}
                >
                  {loading ? 'INICIANDO SESIÓN...' : 'INICIAR SESIÓN'}
                </Button>
              </Stack>
            </form>

            <Divider color="#f0f0f0" />

            {/* Footer */}
            <Text className="text-center text-sm font-roboto text-gray-600">
              ¿No tienes una cuenta?{' '}
              <button
                onClick={handleRegisterRedirect}
                className="text-[#4BCDF6] cursor-pointer hover:text-[#FF369F] transition-colors duration-200 font-medium border-none bg-transparent underline"
              >
                Registrarse
              </button>
            </Text>
          </Stack>
        </Card>
      </div>
    </div>
  );
}