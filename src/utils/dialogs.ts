import { Alert, Platform } from 'react-native';

// `Alert` de React Native NO está implementado en react-native-web: la llamada
// no hace nada y el usuario ve que "el botón no responde" (p. ej. la papelera
// para borrar un mazo). En web usamos los diálogos nativos del navegador.

/** Pide confirmación antes de una acción destructiva. */
export function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
) {
  if (Platform.OS === 'web') {
    // window.confirm es síncrono y devuelve true/false
    const ok = typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`);
    if (ok) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

/** Muestra un aviso informativo (un solo botón). */
export function notify(title: string, message: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}
