import { ChangeDetectionStrategy, Component, OnInit, effect, inject } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReminderService } from './services/reminder.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  private readonly maxTasks = 5;
  private readonly fb = inject(FormBuilder);
  private readonly reminderService = inject(ReminderService);

  public reminderForm!: FormGroup;

  // Signal exposed directly from ReminderService
  public readonly acceptNewTasks = this.reminderService.acceptNewTasks;

  constructor() {
    // Automatically reset and clear the form when all notifications finish running
    effect(() => {
      const isAccepting = this.acceptNewTasks();
      if (isAccepting && this.reminderForm) {
        this.resetForm();
      }
    });
  }

  ngOnInit(): void {
    this.reminderForm = this.fb.group({
      reminders: this.fb.array([])
    });

    this.resetForm();
  }

  // Getter for convenient access to the FormArray
  get reminders(): FormArray {
    return this.reminderForm.get('reminders') as FormArray;
  }

  // Creates a FormGroup instance for an individual reminder item
  private createReminder(): FormGroup {
    return this.fb.group({
      id: [crypto.randomUUID()], //  ID for tracking
      time: ['', Validators.required],
      message: ['Time to do task!', Validators.required]
    });
  }

  // Resets the form array to a single clean initial item
  public resetForm(): void {
    if (!this.reminderForm) return;
    this.reminders.clear();
    this.reminders.push(this.createReminder());
  }

  // Adds a new reminder item to the array if valid and within limits
  public addReminder(): void {
    if (this.reminders.length >= this.maxTasks) {
      alert(`${this.maxTasks} tasks allowed`);
      return;
    }

    const lastReminder = this.reminders.at(this.reminders.length - 1);

    if (this.reminders.length === 0 || lastReminder?.valid) {
      this.reminders.push(this.createReminder());
    } else {
      alert('Please fill out the previous reminder before adding a new one.');
    }
  }

  // Removes a reminder at the specified index and cancels its associated timer

  public removeReminder(index: number): void {
    this.reminderService.removeNotification(index);
    this.reminders.removeAt(index);
  }

  // Handles form submission and permission verification
  public setReminders(): void {
    if (this.reminderForm.invalid) {
      alert('Please fill all required fields.');
      return;
    }

    // Request notification permissions prior to scheduling if not already granted
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.processReminders();
        } else {
          alert('Notifications are blocked. Please enable them in your browser site settings.');
        }
      });
    } else {
      this.processReminders();
    }
  }

  // Schedules reminders through the service and locks the form
  private processReminders(): void {
    try {
      this.reminders.controls.forEach((control: AbstractControl, index: number) => {
        const { time, message } = control.value;
        this.reminderService.setReminder(time, message, index);
      });

      alert('Reminders set successfully!');
      this.reminderService.disallowAcceptNewTasks();
    } catch (error) {
      console.error('Error setting reminders:', error);
    }
  }

  // Determines whether the submit button should be disabled
  public checkSubmitDisabled(): boolean {
    return this.reminderForm.invalid || !this.acceptNewTasks();
  }

  // Determines whether the "Add" button should be disabled
  public checkAddReminderDisabled(): boolean {
    return this.reminders.length >= this.maxTasks || !this.acceptNewTasks();
  }

  public requestNotificationPermission(): void {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          alert('Notification permission granted!');
        } else {
          alert('Notification permission denied or blocked in browser settings.');
        }
      });
    } else {
      alert('This browser does not support system notifications.');
    }
  }
}