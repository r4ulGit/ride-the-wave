export const API_URL = import.meta.env.VITE_API_URL;

export const SPORT_CONFIG = {
  Run:     { icon: '🏃', color: '#fc4c02', label: 'Run' },
  Ride:    { icon: '🚴', color: '#3b82f6', label: 'Ride' },
  Swim:    { icon: '🏊', color: '#06b6d4', label: 'Swim' },
  Hike:    { icon: '🥾', color: '#22c55e', label: 'Hike' },
  Walk:    { icon: '🚶', color: '#84cc16', label: 'Walk' },
  Workout: { icon: '💪', color: '#a855f7', label: 'Workout' },
  Yoga:    { icon: '🧘', color: '#ec4899', label: 'Yoga' },
  Default: { icon: '⚡', color: '#f59e0b', label: 'Activity' },
};

export function getSport(sportType) {
  return SPORT_CONFIG[sportType] || SPORT_CONFIG.Default;
}
