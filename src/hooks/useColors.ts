// Hook que devuelve los colores correctos según el modo actual
// Importar este hook en cada pantalla en vez de Colors directo
import { useApp } from '@/context/AppContext';
import { DarkColors, LightColors } from '@/styles/theme';

export function useColors() {
  const { lightMode } = useApp();
  return lightMode ? LightColors : DarkColors;
}
