// Clave de encriptación desde las variables de entorno
const ENCRYPTION_KEY = import.meta.env.VITE_TRAFFIC_ENCRYPTION_KEY;

/**
 * Convierte base64 a ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Convierte ArrayBuffer a string
 */
function arrayBufferToString(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    result += String.fromCharCode(bytes[i]);
  }
  return result;
}

/**
 * Desencripta un texto usando AES-256-GCM compatible con el backend
 * @param encryptedText - Texto encriptado en formato "nonce:authTag:encryptedData"
 * @returns Texto desencriptado
 */
export async function decryptText(encryptedText: string): Promise<string> {
  try {
    if (!encryptedText || typeof encryptedText !== 'string') {
      return '';
    }

    // Dividir el texto encriptado en sus componentes
    const parts = encryptedText.split(':');
    
    if (parts.length !== 3) {
      console.warn('Formato de texto encriptado inválido:', encryptedText);
      return encryptedText; // Retornar el texto original si no está encriptado
    }

    const [nonce, authTag, encryptedData] = parts;

    // Decodificar de base64
    const nonceBuffer = base64ToArrayBuffer(nonce);
    const authTagBuffer = base64ToArrayBuffer(authTag);
    const encryptedBuffer = base64ToArrayBuffer(encryptedData);
    const keyBuffer = base64ToArrayBuffer(ENCRYPTION_KEY);

    // Importar la clave
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // Combinar el ciphertext con el auth tag
    const combinedBuffer = new Uint8Array(encryptedBuffer.byteLength + authTagBuffer.byteLength);
    combinedBuffer.set(new Uint8Array(encryptedBuffer), 0);
    combinedBuffer.set(new Uint8Array(authTagBuffer), encryptedBuffer.byteLength);

    // Desencriptar
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: nonceBuffer,
        tagLength: 128 // 16 bytes = 128 bits
      },
      cryptoKey,
      combinedBuffer
    );

    return arrayBufferToString(decryptedBuffer);
  } catch (error) {
    console.error('Error al desencriptar texto:', error);
    return encryptedText; // Retornar el texto original en caso de error
  }
}

/**
 * Versión síncrona que maneja la promesa internamente
 */
export function decryptTextSync(encryptedText: string): string {
  if (!encryptedText || typeof encryptedText !== 'string') {
    return '';
  }

  // Para casos simples, intentar desencriptar de forma síncrona
  // Si falla, retornar el texto original
  try {
    // Como no podemos hacer esto síncrono, retornamos el texto original
    // y manejamos la desencriptación de forma asíncrona en el hook
    return encryptedText;
  } catch (error) {
    console.error('Error al desencriptar texto:', error);
    return encryptedText;
  }
}

/**
 * Desencripta un objeto de usuario completo
 * @param user - Objeto de usuario con datos encriptados
 * @returns Objeto de usuario con datos desencriptados
 */
export async function decryptUser(user: any) {
  if (!user) return null;

  try {
    const [decryptedId, decryptedFirstName, decryptedLastName, decryptedEmail, decryptedRole, decryptedImageUrl, decryptedUsername] = await Promise.all([
      decryptText(user._id),
      decryptText(user.first_name),
      decryptText(user.last_name),
      decryptText(user.email),
      decryptText(user.role),
      user.image_url ? decryptText(user.image_url) : Promise.resolve(null),
      user.username ? decryptText(user.username) : Promise.resolve(null)
    ]);

    return {
      ...user,
      _id: decryptedId,
      first_name: decryptedFirstName,
      last_name: decryptedLastName,
      email: decryptedEmail,
      role: decryptedRole,
      image_url: decryptedImageUrl,
      username: decryptedUsername
    };
  } catch (error) {
    console.error('Error al desencriptar usuario:', error);
    return user; // Retornar el usuario original en caso de error
  }
}

/**
 * Verifica si el usuario actual es admin
 * @param user - Objeto de usuario desencriptado
 * @returns true si es admin, false en caso contrario
 */
export function isAdmin(user: any): boolean {
  return user?.role === 'admin';
}

/**
 * Verifica si el usuario actual es el creador del foro
 * @param currentUserId - ID del usuario actual desencriptado
 * @param forumCreatorId - ID del creador del foro
 * @returns true si es el creador, false en caso contrario
 */
export function isForumCreator(currentUserId: string, forumCreatorId: string): boolean {
  return currentUserId === forumCreatorId;
}

/**
 * Verifica si el usuario puede editar/eliminar un foro
 * @param currentUser - Usuario actual desencriptado
 * @param forumCreatorId - ID del creador del foro
 * @returns true si puede editar/eliminar, false en caso contrario
 */
export function canEditForum(currentUser: any, forumCreatorId: string): boolean {
  if (!currentUser) return false;
  
  return isAdmin(currentUser) || isForumCreator(currentUser._id, forumCreatorId);
}
