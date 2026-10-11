/**
 * Cliente API de Nefetech con sesión persistente y manejo de JWT
 */

let cachedToken = null;

function getPersistentClientId() {
  let id = localStorage.getItem('nefetech_client_uuid');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
    localStorage.setItem('nefetech_client_uuid', id);
  }
  return id;
}

export async function getAuthToken() {
  if (cachedToken) {
    return cachedToken;
  }

  const stored = localStorage.getItem('nefetech_jwt_token');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.expiresAt && Date.now() < parsed.expiresAt - 60000) {
        cachedToken = parsed.token;
        return cachedToken;
      }
    } catch {
      localStorage.removeItem('nefetech_jwt_token');
    }
  }

  // Solicitar nuevo JWT al backend vinculado al UUID persistente del navegador
  const clientId = getPersistentClientId();
  const response = await fetch('/api/auth/token.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId }),
  });

  const data = await response.json();
  if (data.success && data.access_token) {
    cachedToken = data.access_token;
    localStorage.setItem(
      'nefetech_jwt_token',
      JSON.stringify({
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in || 7200) * 1000,
      })
    );
    return cachedToken;
  }

  throw new Error('No se pudo obtener el token JWT de autenticación');
}

export async function sendChatMessage(mensaje) {
  const token = await getAuthToken();

  const response = await fetch('/api/chat.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ mensaje }),
  });

  if (response.status === 401) {
    cachedToken = null;
    localStorage.removeItem('nefetech_jwt_token');
    const newToken = await getAuthToken();

    const retryResponse = await fetch('/api/chat.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${newToken}`,
      },
      body: JSON.stringify({ mensaje }),
    });
    return await retryResponse.json();
  }

  return await response.json();
}
