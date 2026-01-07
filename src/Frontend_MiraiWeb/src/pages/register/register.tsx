import { TextInput, PasswordInput, Button, Text, Card, Stack, Divider, PinInput } from '@mantine/core';
import { useSignUp } from '@clerk/clerk-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { IconKey, IconUser, IconMail, IconPhone, IconLock, IconShieldCheck } from '@tabler/icons-react';
import logo from '../../assets/images/logomirai.png';
import logo2 from '../../assets/images/logomirai2.png';

export default function Register() {
  const { isLoaded, signUp } = useSignUp();
  const [step, setStep] = useState<'access' | 'register' | 'verify'>('access');
  const [accessKey, setAccessKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Estados del formulario de registro
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: ''
  });

  const [pin, setPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  const handleAccessKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const adminAccessKey = import.meta.env.VITE_ADMIN_ACCESS_KEY;
    
    if (accessKey === adminAccessKey) {
      setStep('register');
      setError('');
    } else {
      setError('Clave de acceso incorrecta');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setError('');

    try {
      // Validaciones
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.phone) {
        setError('Por favor completa todos los campos');
        setLoading(false);
        return;
      }

      if (formData.password.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres');
        setLoading(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Por favor ingresa un correo electrónico válido');
        setLoading(false);
        return;
      }

      console.log('Creando usuario con datos:', {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone
      });

      // Crear usuario con Clerk
      const result = await signUp.create({
        emailAddress: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        unsafeMetadata: {
          phone: formData.phone
        }
      });

      console.log('Usuario creado exitosamente:', result);

      // Preparar verificación por email
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      notifications.show({
        title: '¡Cuenta creada!',
        message: 'Se ha enviado un código de verificación a tu correo electrónico.',
        color: 'teal',
        autoClose: 3000
      });

      // Pasar a paso de verificación
      setStep('verify');
      setPin('');

    } catch (err: any) {
      console.error('Error completo de registro:', err);
      
      let errorMessage = 'Error al registrar usuario';
      
      if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        const firstError = err.errors[0];
        console.log('Primer error:', firstError);
        
        // Manejar diferentes tipos de errores de Clerk
        if (firstError.code === 'form_identifier_exists' || firstError.message?.includes('identifier_exists')) {
          notifications.show({
            title: 'Usuario ya existe',
            message: `Ya existe una cuenta con el email ${formData.email}. Puedes iniciar sesión directamente.`,
            color: 'yellow',
            autoClose: 5000
          });
          setTimeout(() => {
            navigate('/');
          }, 2000);
          return;
        } else if (firstError.message?.includes('password_pwned')) {
          errorMessage = 'Esta contraseña ha sido comprometida en filtraciones de datos. Elige una contraseña más segura.';
        } else if (firstError.message?.includes('password_not_strong_enough')) {
          errorMessage = 'La contraseña no es lo suficientemente fuerte. Debe incluir mayúsculas, minúsculas, números y símbolos.';
        } else if (firstError.message?.includes('security validations')) {
          errorMessage = 'Error de validación de seguridad. Intenta usar otro navegador o deshabilitar extensiones del navegador.';
        } else if (firstError.longMessage) {
          errorMessage = firstError.longMessage;
        } else if (firstError.message) {
          errorMessage = firstError.message;
        } else {
          errorMessage = firstError.code || 'Error desconocido durante el registro';
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePinVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || pin.length !== 6) return;

    setPinLoading(true);
    setError('');

    try {
      // Verificar el código de email
      const result = await signUp.attemptEmailAddressVerification({
        code: pin
      });

      console.log('Email verificado:', result);

      notifications.show({
        title: '¡Verificación completada!',
        message: `Usuario ${formData.firstName} ${formData.lastName} registrado correctamente. Redirigiendo al login...`,
        color: 'teal',
        autoClose: 3000
      });

      // Limpiar formulario
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: ''
      });
      setPin('');
      setStep('access');
      setAccessKey('');

      // Redirigir a la página principal después de un breve retraso
      setTimeout(() => {
        navigate('/app/analiticas');
      }, 2000);

    } catch (err: any) {
      console.error('Error en verificación de PIN:', err);
      
      let errorMessage = 'Error al verificar el código';
      
      if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        const firstError = err.errors[0];
        
        if (firstError.message?.includes('expired')) {
          errorMessage = 'El código de verificación ha expirado. Solicita uno nuevo.';
        } else if (firstError.message?.includes('incorrect')) {
          errorMessage = 'El código de verificación es incorrecto. Intenta nuevamente.';
        } else if (firstError.longMessage) {
          errorMessage = firstError.longMessage;
        } else if (firstError.message) {
          errorMessage = firstError.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setPinLoading(false);
    }
  };

  const handleBackToRegister = () => {
    setStep('register');
    setPin('');
    setError('');
  };

  const handleBackToLogin = () => {
    navigate('/');
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
        {/* Elementos decorativos de fondo */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-[#4BCDF6]/20 via-[#9F8BEA]/15 to-[#FF369F]/10"></div>
          <div className="absolute top-20 left-20 w-32 h-32 bg-[#4BCDF6]/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-32 right-16 w-24 h-24 bg-[#FF369F]/10 rounded-full blur-xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-8 w-16 h-16 bg-[#FFAF21]/10 rounded-full blur-lg animate-pulse delay-500"></div>
          <div className="absolute top-16 right-24 w-4 h-4 bg-[#9F8BEA] rotate-45 animate-spin" style={{animationDuration: '8s'}}></div>
          <div className="absolute bottom-24 left-32 w-3 h-3 bg-[#4BCDF6] rounded-full animate-bounce delay-300"></div>
        </div>

        <div className="relative z-10 text-center max-w-lg">
          <div className="relative mb-12">
            <div className="absolute inset-0 bg-gradient-to-br from-[#4BCDF6]/30 to-[#FF369F]/30 rounded-3xl blur-2xl transform scale-110"></div>
            <div className="relative bg-black/30 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
              <img 
                src={logo} 
                alt="MiraiWeb Logo" 
                className="w-80 h-80 object-contain mx-auto drop-shadow-2xl" 
              />
            </div>
          </div>

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
              {step === 'access' ? 'ACCESO ADMINISTRATIVO' : step === 'register' ? 'CREAR NUEVA CUENTA' : 'VERIFICAR EMAIL'}
            </Text>

            <div className="flex items-center justify-center space-x-4">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#4BCDF6]"></div>
              <div className="w-2 h-2 bg-[#4BCDF6] rounded-full animate-pulse"></div>
              <div className="h-px w-32 bg-gradient-to-r from-[#4BCDF6] via-[#FF369F] to-[#9F8BEA]"></div>
              <div className="w-2 h-2 bg-[#FF369F] rounded-full animate-pulse delay-300"></div>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#9F8BEA]"></div>
            </div>

            <Text className="text-lg font-roboto text-white/90 max-w-md leading-relaxed font-light">
              {step === 'access' 
                ? 'Ingresa la clave de acceso para registrar nuevos usuarios en el sistema'
                : step === 'register'
                ? 'Completa la información para crear tu cuenta de usuario'
                : 'Verifica tu correo electrónico con el código enviado'
              }
            </Text>

            <div className="flex justify-center items-center mt-12 space-x-3">
              <div className="w-3 h-3 bg-[#4BCDF6] rounded-full animate-pulse shadow-lg shadow-[#4BCDF6]/50"></div>
              <div className="w-3 h-3 bg-[#FF369F] rounded-full animate-pulse delay-200 shadow-lg shadow-[#FF369F]/50"></div>
              <div className="w-3 h-3 bg-[#FFAF21] rounded-full animate-pulse delay-400 shadow-lg shadow-[#FFAF21]/50"></div>
              <div className="w-3 h-3 bg-[#9F8BEA] rounded-full animate-pulse delay-600 shadow-lg shadow-[#9F8BEA]/50"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Parte derecha: Formularios */}
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
                {step === 'access' ? (
                  <IconKey size={32} color="white" />
                ) : step === 'register' ? (
                  <img 
                    src={logo2} 
                    alt="MiraiWeb Logo" 
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <IconShieldCheck size={32} color="white" />
                )}
              </div>
              <Text className="text-3xl font-bebas text-[#1D1A05] mb-2 tracking-wide">
                {step === 'access' ? 'CLAVE DE ACCESO' : step === 'register' ? 'REGISTRO' : 'VERIFICACIÓN'}
              </Text>
              <Text className="text-sm font-roboto text-gray-600 font-light">
                {step === 'access' 
                  ? 'Ingresa la clave administrativa'
                  : step === 'register'
                  ? 'Completa tus datos para registrarte'
                  : 'Ingresa el código de 6 dígitos enviado a tu email'
                }
              </Text>
            </div>

            <Divider color="#f0f0f0" />

            {/* Formulario de clave de acceso */}
            {step === 'access' && (
              <form onSubmit={handleAccessKeySubmit}>
                <Stack gap="md">
                  {error && (
                    <div className="p-3 bg-[#FF369F]/10 border border-[#FF369F]/20 rounded-lg">
                      <Text className="text-[#FF369F] text-sm text-center font-roboto font-medium">
                        {error}
                      </Text>
                    </div>
                  )}

                  <PasswordInput
                    label="Clave de acceso administrativa"
                    placeholder="Ingresa la clave de acceso"
                    size="md"
                    radius="md"
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    required
                    leftSection={<IconKey size={16} />}
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
                    disabled={!accessKey}
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
                    VERIFICAR ACCESO
                  </Button>
                </Stack>
              </form>
            )}

            {/* Formulario de registro */}
            {step === 'register' && (
              <form onSubmit={handleRegisterSubmit}>
                <Stack gap="md">
                  {error && (
                    <div className="p-3 bg-[#FF369F]/10 border border-[#FF369F]/20 rounded-lg">
                      <Text className="text-[#FF369F] text-sm text-center font-roboto font-medium">
                        {error}
                      </Text>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <TextInput
                      label="Nombre"
                      placeholder="Tu nombre"
                      size="md"
                      radius="md"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      required
                      leftSection={<IconUser size={16} />}
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

                    <TextInput
                      label="Apellido"
                      placeholder="Tu apellido"
                      size="md"
                      radius="md"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      required
                      leftSection={<IconUser size={16} />}
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
                  </div>

                  <TextInput
                    label="Correo electrónico"
                    placeholder="tu@email.com"
                    size="md"
                    radius="md"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    leftSection={<IconMail size={16} />}
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
                    placeholder="Mínimo 8 caracteres con mayúsculas, números y símbolos"
                    size="md"
                    radius="md"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    leftSection={<IconLock size={16} />}
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

                  <TextInput
                    label="Teléfono"
                    placeholder="+57300123456"
                    size="md"
                    radius="md"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                    leftSection={<IconPhone size={16} />}
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
                    disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.phone}
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
                    {loading ? 'CREANDO CUENTA...' : 'CREAR CUENTA'}
                  </Button>
                </Stack>
              </form>
            )}

            {/* Formulario de verificación PIN */}
            {step === 'verify' && (
              <form onSubmit={handlePinVerify}>
                <Stack gap="md">
                  {error && (
                    <div className="p-3 bg-[#FF369F]/10 border border-[#FF369F]/20 rounded-lg">
                      <Text className="text-[#FF369F] text-sm text-center font-roboto font-medium">
                        {error}
                      </Text>
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <Text className="text-sm font-roboto text-gray-600 mb-2">
                      Código enviado a: <span className="font-medium text-[#1D1A05]">{formData.email}</span>
                    </Text>
                  </div>

                  <div className="flex justify-center">
                    <PinInput
                      length={6}
                      size="lg"
                      type="number"
                      value={pin}
                      onChange={setPin}
                      styles={{
                        input: {
                          backgroundColor: 'white',
                          border: '2px solid #f0f0f0',
                          color: '#1D1A05',
                          fontFamily: 'Roboto, sans-serif',
                          fontWeight: 600,
                          '&:focus': {
                            borderColor: '#4BCDF6',
                            boxShadow: '0 0 0 3px rgba(75, 205, 246, 0.1)'
                          }
                        }
                      }}
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    fullWidth
                    size="md"
                    radius="md"
                    loading={pinLoading}
                    disabled={pin.length !== 6}
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
                    {pinLoading ? 'VERIFICANDO...' : 'VERIFICAR CÓDIGO'}
                  </Button>

                  <Button
                    variant="light"
                    color="gray"
                    fullWidth
                    size="md"
                    radius="md"
                    onClick={handleBackToRegister}
                    className="font-roboto"
                  >
                    VOLVER AL REGISTRO
                  </Button>
                </Stack>
              </form>
            )}

            <Divider color="#f0f0f0" />

            {/* Footer */}
            <Text className="text-center text-sm font-roboto text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <button
                onClick={handleBackToLogin}
                className="text-[#4BCDF6] cursor-pointer hover:text-[#FF369F] transition-colors duration-200 font-medium border-none bg-transparent underline"
              >
                Iniciar sesión
              </button>
            </Text>
          </Stack>
        </Card>
      </div>
    </div>
  );
}