import { Alert, Platform } from "react-native";

/**
 * Cross-platform alert that works on both web and mobile.
 * On web, uses window.alert / window.confirm since Alert.alert does nothing.
 * On mobile, uses the native Alert.alert.
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: Array<{
    text: string;
    style?: "default" | "cancel" | "destructive";
    onPress?: () => void;
  }>
) {
  if (Platform.OS === "web") {
    const fullMessage = message ? `${title}\n\n${message}` : title;

    if (!buttons || buttons.length <= 1) {
      // Simple alert with OK
      if (typeof window !== "undefined") window.alert(fullMessage);
      const okBtn = buttons?.find(b => b.style !== "cancel");
      okBtn?.onPress?.();
      return;
    }

    // Has multiple buttons - find cancel and confirm buttons
    const cancelBtn = buttons.find(b => b.style === "cancel");
    const confirmBtn = buttons.find(b => b.style !== "cancel");

    if (typeof window !== "undefined") {
      const confirmed = window.confirm(fullMessage);
      if (confirmed) {
        confirmBtn?.onPress?.();
      } else {
        cancelBtn?.onPress?.();
      }
    }
  } else {
    Alert.alert(title, message, buttons);
  }
}
