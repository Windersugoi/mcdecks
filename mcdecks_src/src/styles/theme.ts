export const Colors = {
  bg: '#0f0f0d', surface: '#181816', surface2: '#1f1f1c',
  border: '#2a2a26', borderStrong: '#3a3a36',
  text: '#f1f1ec', textMuted: '#8a8a82', textSub: '#c9c9c2',
  danger: '#E24B4A', dangerBg: 'rgba(226,75,74,0.08)',
  success: '#5DCAA5', successBg: 'rgba(93,202,165,0.08)',
  warning: '#EF9F27', warningBg: 'rgba(239,159,39,0.08)',
  info: '#378ADD',
  aspects: {
    Aggression: '#E24B4A', Protection: '#5DCAA5',
    Leadership: '#378ADD', Justice: '#EF9F27',
    Basic: '#9b9b96', Hero: '#c9c9c2', Pool: '#CC6699',
  } as Record<string, string>,
};
export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const Radius = { sm: 6, md: 8, lg: 12, pill: 999 };
