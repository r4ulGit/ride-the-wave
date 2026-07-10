export const API_URL = import.meta.env.VITE_API_URL;

export const SPORT_CONFIG = {
  Run:     { icon: '🏃', color: '#62c0bb', label: 'Carrera' },
  Ride:    { icon: '🚴', color: '#3b82f6', label: 'Ciclismo' },
  Swim:    { icon: '🏊', color: '#06b6d4', label: 'Natación' },
  Hike:    { icon: '🥾', color: '#22c55e', label: 'Senderismo' },
  Walk:    { icon: '🚶', color: '#84cc16', label: 'Caminata' },
  Workout: { icon: '💪', color: '#a855f7', label: 'Entrenamiento' },
  Yoga:    { icon: '🧘', color: '#ec4899', label: 'Yoga' },
  Default: { icon: '⚡', color: '#62c0bb', label: 'Actividad' },
};

export function getSport(sportType) {
  return SPORT_CONFIG[sportType] || SPORT_CONFIG.Default;
}
