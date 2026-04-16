const notificationsChangedEventName = "afm-notifications-changed";

export function emitNotificationsChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(notificationsChangedEventName));
}

export function subscribeToNotificationsChanged(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(notificationsChangedEventName, listener);

  return () => {
    window.removeEventListener(notificationsChangedEventName, listener);
  };
}
