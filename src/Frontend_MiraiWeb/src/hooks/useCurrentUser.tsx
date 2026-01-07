import { useQuery } from '@tanstack/react-query';
import { useAuthenticatedFetch } from './useAuthenticatedFetch';
import { decryptUser } from '../utils/traffic.crypto';

// Interface para el usuario desencriptado
export interface DecryptedUser {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  image_url: string | null;
  username: string | null;
}

// Interface para la respuesta de la API
interface UserApiResponse {
  user: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    image_url: string | null;
    username: string | null;
  };
}

/**
 * Hook personalizado para obtener y desencriptar la información del usuario actual
 */
export function useCurrentUser() {
  const { authenticatedFetch } = useAuthenticatedFetch();

  const { data: userData, isLoading, error, refetch } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async (): Promise<DecryptedUser | null> => {
      try {
        const response = await authenticatedFetch('https://api.miraiedu.online/users/me');
        
        if (!response.ok) {
          throw new Error('Error al obtener información del usuario');
        }
        
        const apiData: UserApiResponse = await response.json();
        
        // Desencriptar los datos del usuario
        const decryptedUser = await decryptUser(apiData.user);
        
        return decryptedUser;
      } catch (error) {
        console.error('Error al obtener usuario actual:', error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  return {
    user: userData,
    isLoading,
    error,
    refetch,
    isAuthenticated: !!userData && !isLoading && !error
  };
}
