import { Injectable, signal, Signal } from '@angular/core';
import { CounterObject, NotificationObject } from '../types/notification';

@Injectable({
  providedIn: 'root'
})
export class ReminderService {
  private readonly icons: string[] = [
    'assets/icons/2_m.jpg',
    'assets/icons/4_m.jpg',
    'assets/icons/5_m.jpg',
    'assets/icons/6_m.jpg',
    'assets/icons/7_m.jpg',
    'assets/icons/8_m.jpg',
    'assets/icons/9_m.jpg',
    'assets/icons/10_m.jpg',
    'assets/icons/11_m.jpg',
    'assets/icons/12_m.jpg',
    'assets/icons/13_m.jpg',
    'assets/icons/15_m.jpg',
    'assets/icons/16_m.jpg',
    'assets/icons/18_m.jpg',
    'assets/icons/20_m.jpg',
    'assets/icons/22_m.jpg',
    'assets/icons/27_m.jpg',
    'assets/icons/30_m.jpg'
  ];

  // Map storing timer entries with their index, timeout ID, and completion status
  private readonly activeTimersMap = new Map<number, { id: ReturnType<typeof setTimeout>; completed: boolean }>();
  
  // Writable signal tracking whether new tasks can be added
  private readonly acceptNewTasksSignal = signal<boolean>(true);
  
  // Read-only signal exposed to components
  public readonly acceptNewTasks: Signal<boolean> = this.acceptNewTasksSignal.asReadonly();

  // Returns a random icon path for notifications
  private getRandomIcon(): string {
    const randomIndex = Math.floor(Math.random() * this.icons.length);
    return this.icons[randomIndex];
  }

  // Calculates delay in milliseconds, supporting both "HH:mm" and ISO/datetime string formats
  private calculateDelay(time: string): number {
    if (!time) return 0;

    const now = new Date();
    let targetDate: Date;

    if (/^\d{2}:\d{2}$/.test(time)) {
      const [hours, minutes] = time.split(':').map(Number);
      targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
      
      // If the target time has already passed today, schedule for tomorrow
      if (targetDate.getTime() <= now.getTime()) {
        targetDate.setDate(targetDate.getDate() + 1);
      }
    } else {
      targetDate = new Date(time);
    }

    return targetDate.getTime() - now.getTime();
  }

  // Registers a new reminder timer for the specified index
  public setReminder(time: string, message: string, index: number): void {
    const delay = this.calculateDelay(time);

    if (delay <= 0) {
      console.warn(`[ReminderService] Scheduled time for reminder #${index} is invalid or in the past.`);
      return;
    }

    const notificationObject: NotificationObject = {
      body: message,
      icon: this.getRandomIcon(),
      requireInteraction: true
    };

    const timerId = setTimeout(() => {
      console.log(`[ReminderService] Timer #${index} triggered.`);
      this.showNotification(notificationObject);

      const timerEntry = this.activeTimersMap.get(index);
      if (timerEntry) {
        timerEntry.completed = true;
        this.checkAllCompleted();
      }
    }, delay);

    this.activeTimersMap.set(index, { id: timerId, completed: false });
  }

  // Checks if all active timers have finished running
  private checkAllCompleted(): void {
    if (this.activeTimersMap.size === 0) {
      this.onAllTimersComplete();
      return;
    }

    const allCompleted = Array.from(this.activeTimersMap.values()).every(t => t.completed);
    if (allCompleted) {
      this.onAllTimersComplete();
    }
  }

  // Displays native browser notification or delegates to Service Worker when available
  private showNotification(object: NotificationObject): void {
    console.log('[ReminderService] Attempting to display notification:', object);

    if (!('Notification' in window)) {
      alert('System notifications are not supported by your browser.');
      return;
    }

    if (Notification.permission !== 'granted') {
      alert('Notification permissions are blocked. Please enable them in your browser settings.');
      return;
    }

    // Use Service Worker if available (for PWA support), fallback to standard Notification API
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready
        .then(reg => reg.showNotification('Exercise Reminder', object))
        .catch(() => new Notification('Exercise Reminder', object));
    } else {
      new Notification('Exercise Reminder', object);
    }
  }

  // Cancels and removes a specific notification timer by its index
  public removeNotification(index: number): void {
    const timerEntry = this.activeTimersMap.get(index);
    if (timerEntry) {
      clearTimeout(timerEntry.id);
      this.activeTimersMap.delete(index);
    }
    this.checkAllCompleted();
  }

  // Locks the service from accepting new tasks
  public disallowAcceptNewTasks(): void {
    this.acceptNewTasksSignal.set(false);
  }

  // Resets the state to allow new task creation
  public resetTaskAcceptance(): void {
    this.acceptNewTasksSignal.set(true);
  }

  // Resets internal timer collection when all timers complete
  private onAllTimersComplete(): void {
    console.log('[ReminderService] All timers completed. Unlocking form.');
    this.activeTimersMap.clear();
    this.acceptNewTasksSignal.set(true);
  }

  // Returns array representation of current active timers for testing or debugging
  public getNotificationTimerArray(): CounterObject[] {
    return Array.from(this.activeTimersMap.values()).map(entry => ({
      id: entry.id,
      completed: entry.completed
    }));
  }
}