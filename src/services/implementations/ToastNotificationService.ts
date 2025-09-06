/**
 * Toast Notification Service Implementation
 * SOLID: Dependency Inversion - Implements INotificationService interface
 */

import type { 
  INotificationService, 
  NotificationOptions, 
  NotificationConfig, 
  NotificationGlobalConfig 
} from '../../interfaces/services.ts';

interface ToastNotificationServiceConfig {
  position?: NotificationOptions['position'];
  duration?: number;
  maxNotifications?: number;
}

export class ToastNotificationService implements INotificationService {
  private notifications = new Map<string, NotificationConfig>();
  private globalConfig: NotificationGlobalConfig;
  private nextId = 1;

  constructor(config: ToastNotificationServiceConfig = {}) {
    this.globalConfig = {
      position: config.position || 'top-right',
      duration: config.duration || 4000,
      maxNotifications: config.maxNotifications || 5,
      animations: true,
    };
  }

  success(message: string, options?: NotificationOptions): void {
    this.show({
      type: 'success',
      message,
      ...options,
    });
  }

  error(message: string, options?: NotificationOptions): void {
    this.show({
      type: 'error',
      message,
      persistent: true, // Errors should be persistent by default
      ...options,
    });
  }

  warning(message: string, options?: NotificationOptions): void {
    this.show({
      type: 'warning',
      message,
      ...options,
    });
  }

  info(message: string, options?: NotificationOptions): void {
    this.show({
      type: 'info',
      message,
      ...options,
    });
  }

  show(notification: NotificationConfig): string {
    const id = notification.id || this.generateId();
    const finalNotification: NotificationConfig = {
      ...notification,
      id,
      duration: notification.duration ?? this.globalConfig.duration,
      position: notification.position ?? this.globalConfig.position,
      persistent: notification.persistent ?? false,
    };

    this.notifications.set(id, finalNotification);
    this.enforceMaxNotifications();
    
    // Auto-dismiss if not persistent
    if (!finalNotification.persistent && finalNotification.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, finalNotification.duration);
    }

    // In a real implementation, this would trigger UI updates
    // For now, we'll just log to console
    console.log(`🔔 [${finalNotification.type.toUpperCase()}] ${finalNotification.message}`);
    
    return id;
  }

  update(id: string, updates: Partial<NotificationConfig>): void {
    const existing = this.notifications.get(id);
    if (existing) {
      const updated = { ...existing, ...updates };
      this.notifications.set(id, updated);
      
      // Log the update
      console.log(`🔔 [UPDATED] ${updated.message}`);
    }
  }

  dismiss(id: string): void {
    const notification = this.notifications.get(id);
    if (notification) {
      this.notifications.delete(id);
      console.log(`🔔 [DISMISSED] ${notification.message}`);
    }
  }

  dismissAll(): void {
    const count = this.notifications.size;
    this.notifications.clear();
    console.log(`🔔 [DISMISSED ALL] ${count} notifications`);
  }

  getActiveNotifications(): NotificationConfig[] {
    return Array.from(this.notifications.values());
  }

  setGlobalConfig(config: Partial<NotificationGlobalConfig>): void {
    this.globalConfig = { ...this.globalConfig, ...config };
  }

  private generateId(): string {
    return `notification_${this.nextId++}_${Date.now()}`;
  }

  private enforceMaxNotifications(): void {
    const notifications = Array.from(this.notifications.entries());
    
    if (notifications.length > this.globalConfig.maxNotifications) {
      // Remove oldest non-persistent notifications first
      const sortedByAge = notifications.sort((a, b) => {
        // Non-persistent notifications are preferred for removal
        if (a[1].persistent !== b[1].persistent) {
          return a[1].persistent ? 1 : -1;
        }
        // Then by creation order (assuming newer IDs have higher numbers)
        return parseInt(a[0].split('_')[1]) - parseInt(b[0].split('_')[1]);
      });
      
      const toRemove = notifications.length - this.globalConfig.maxNotifications;
      for (let i = 0; i < toRemove; i++) {
        this.notifications.delete(sortedByAge[i][0]);
      }
    }
  }

  // Utility methods for common notification patterns
  
  /**
   * Show a loading notification that can be updated
   */
  showLoading(message: string): string {
    return this.show({
      type: 'info',
      message,
      persistent: true,
      icon: '⏳',
    });
  }

  /**
   * Update a loading notification to success
   */
  updateLoadingToSuccess(id: string, message: string): void {
    this.update(id, {
      type: 'success',
      message,
      icon: '✅',
      persistent: false,
      duration: this.globalConfig.duration,
    });
    
    // Auto-dismiss after update
    setTimeout(() => this.dismiss(id), this.globalConfig.duration);
  }

  /**
   * Update a loading notification to error
   */
  updateLoadingToError(id: string, message: string): void {
    this.update(id, {
      type: 'error',
      message,
      icon: '❌',
      persistent: true, // Errors should stay visible
    });
  }

  /**
   * Show a confirmation notification with actions
   */
  showConfirmation(
    message: string, 
    onConfirm: () => void, 
    onCancel?: () => void
  ): string {
    return this.show({
      type: 'warning',
      message,
      persistent: true,
      actions: [
        { label: 'Confirm', action: onConfirm },
        { label: 'Cancel', action: onCancel || (() => {}) }
      ],
    });
  }
}