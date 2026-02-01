/**
 * API Configuration
 * 
 * Defines the base URL for API requests.
 * Prioritizes the environment variable VITE_API_URL if available (for production).
 * Falls back to localhost:5000 for local development.
 */

// Use the environment variable if present, otherwise default to local server
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper for socket connection URL (removes /api)
export const SOCKET_URL = API_URL.replace('/api', '');
