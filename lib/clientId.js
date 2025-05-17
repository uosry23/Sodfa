/**
 * Client-side identifier utility for anonymous users
 * This allows non-logged-in users to interact with content without Firebase authentication
 */

// Generate a random ID with specified length
const generateRandomId = (length = 20) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Get the client ID from localStorage or create a new one
export const getClientId = () => {
  // Only run on client side
  if (typeof window === 'undefined') return null;
  
  const storageKey = 'sodfa_client_id';
  let clientId = localStorage.getItem(storageKey);
  
  // If no client ID exists, create one and store it
  if (!clientId) {
    clientId = generateRandomId();
    localStorage.setItem(storageKey, clientId);
  }
  
  return clientId;
};

// Check if the client has a stored ID
export const hasClientId = () => {
  // Only run on client side
  if (typeof window === 'undefined') return false;
  
  return !!localStorage.getItem('sodfa_client_id');
};

// Clear the client ID (useful for testing)
export const clearClientId = () => {
  // Only run on client side
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('sodfa_client_id');
};
