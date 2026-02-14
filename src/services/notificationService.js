export class NotificationService {
    static instance = null;
    
    constructor() {
        if (NotificationService.instance) return NotificationService.instance;
        this.permission = 'default';
        if ('Notification' in window) {
            this.permission = Notification.permission;
        }
        NotificationService.instance = this;
    }

    async requestPermission() {
        if (!('Notification' in window)) return 'unsupported';
        if (Notification.permission === 'granted') return 'granted';
        
        const permission = await Notification.requestPermission();
        this.permission = permission;
        return permission;
    }

    notify(title, options = {}) {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            console.warn('Notifications not supported or permission not granted');
            return;
        }

        // Only notify if window is not focused (optional, but usually desired for terminal)
        if (options.requireBlur && document.hasFocus()) {
            return;
        }

        const defaultOptions = {
            silent: false,
        };

        const n = new Notification(title, { ...defaultOptions, ...options });
        
        n.onclick = () => {
            window.focus();
            n.close();
        };

        // Auto close after 5 seconds
        setTimeout(() => n.close(), 5000);
    }
}

export const notificationService = new NotificationService();
