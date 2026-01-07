import { useAuth } from '@clerk/clerk-react';

export const useAuthenticatedFetch = () => {
  const { getToken } = useAuth();

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    // Generar un nuevo token fresco para cada request
    const token = await getToken({ 
      template: 'jwt-mirai',
      skipCache: true
    });

    // Imprimir el JWT en consola
    console.log('JWT Token:', token);

    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
  };

  return { authenticatedFetch };
};