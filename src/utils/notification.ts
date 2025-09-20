interface NotificationOptions {
  title: string;
  body: string;
}

export const sendNotification = async (options: NotificationOptions) => {
  if (document.visibilityState === "visible") {
    return;
  }
  if (Notification.permission === "granted") {
    new Notification(options.title, {
      body: options.body,
      silent: true, // No sound
      icon: "/logo.png"
    });
  } else if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      new Notification(options.title, {
        body: options.body,
        silent: true, // No sound
        icon: "/logo.png"
      });
    }
  }
};