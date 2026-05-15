export const API_URL = "https://4gep4vk4j4tdbl2uhx2pdu5gt40hkcvy.lambda-url.eu-west-1.on.aws/";

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
