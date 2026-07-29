import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { ReminderService } from './services/reminder.service';
import { ReactiveFormsModule } from '@angular/forms';
import { signal, WritableSignal } from '@angular/core';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let mockReminderService: jasmine.SpyObj<ReminderService>;
  let acceptNewTasksSignal: WritableSignal<boolean>;

  beforeEach(async () => {
    // Writable signal to mock the service state
    acceptNewTasksSignal = signal(true);

    // Spy object matching exact ReminderService interface
    mockReminderService = jasmine.createSpyObj<ReminderService>(
      'ReminderService',
      [
        'setReminder',
        'removeNotification',
        'disallowAcceptNewTasks',
        'resetTaskAcceptance'
      ],
      {
        acceptNewTasks: acceptNewTasksSignal.asReadonly()
      }
    );

    // Prevent native browser alert dialogs during test execution
    spyOn(window, 'alert');

    await TestBed.configureTestingModule({
      imports: [AppComponent, ReactiveFormsModule],
      providers: [
        { provide: ReminderService, useValue: mockReminderService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Triggers ngOnInit
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize form with 1 default reminder control', () => {
      expect(component.reminderForm).toBeDefined();
      expect(component.reminders.length).toBe(1);
    });
  });

  describe('requestNotificationPermission', () => {
    it('should trigger notification permission dialog if supported', () => {
      if ('Notification' in window) {
        spyOn(Notification, 'requestPermission').and.returnValue(Promise.resolve('granted'));
        component.requestNotificationPermission();
        expect(Notification.requestPermission).toHaveBeenCalled();
      } else {
        component.requestNotificationPermission();
        expect((window as Window).alert).toHaveBeenCalledWith('This browser does not support system notifications.');
      }
    });
  });

  describe('addReminder', () => {
    it('should not add a new reminder if the current one is invalid', () => {
      component.addReminder();

      expect(component.reminders.length).toBe(1);
      expect((window as Window).alert).toHaveBeenCalledWith(
        'Please fill out the previous reminder before adding a new one.'
      );
    });

    it('should add a new reminder control if the previous control is valid', () => {
      component.reminders.at(0).patchValue({
        time: '2026-07-30T12:00',
        message: 'Drink water'
      });

      component.addReminder();

      expect(component.reminders.length).toBe(2);
    });

    it('should enforce the maximum limit of 5 tasks', () => {
      for (let i = 0; i < 4; i++) {
        component.reminders.at(i).patchValue({ time: '2026-07-30T12:00', message: `Task ${i + 1}` });
        component.addReminder();
      }

      expect(component.reminders.length).toBe(5);

      component.reminders.at(4).patchValue({ time: '2026-07-30T12:00', message: 'Task 5' });
      component.addReminder();

      expect(component.reminders.length).toBe(5);
      expect((window as Window).alert).toHaveBeenCalledWith('5 tasks allowed');
    });
  });

  describe('removeReminder', () => {
    it('should remove control from FormArray and trigger service.removeNotification', () => {
      component.reminders.at(0).patchValue({ time: '2026-07-30T10:00', message: 'Task 1' });
      component.addReminder();

      expect(component.reminders.length).toBe(2);

      component.removeReminder(0);

      expect(component.reminders.length).toBe(1);
      expect(mockReminderService.removeNotification).toHaveBeenCalledWith(0);
    });
  });

  describe('setReminders', () => {
    it('should show alert and abort if form is invalid', () => {
      component.setReminders();

      expect((window as Window).alert).toHaveBeenCalledWith('Please fill all required fields.');
      expect(mockReminderService.setReminder).not.toHaveBeenCalled();
    });

    it('should submit valid reminders and set acceptNewTasks to false', () => {
      spyOnProperty(Notification, 'permission', 'get').and.returnValue('granted');

      component.reminders.at(0).patchValue({
        time: '2026-07-30T18:00',
        message: 'Workout time'
      });

      component.setReminders();

      expect(mockReminderService.setReminder).toHaveBeenCalledWith('2026-07-30T18:00', 'Workout time', 0);
      expect(mockReminderService.disallowAcceptNewTasks).toHaveBeenCalled();
      expect((window as Window).alert).toHaveBeenCalledWith('Reminders set successfully!');
    });

    it('should reset form automatically when all tasks complete', () => {
      component.reminders.at(0).patchValue({
        time: '2026-07-30T18:00',
        message: 'Workout time'
      });

      acceptNewTasksSignal.set(false);
      fixture.detectChanges();

      acceptNewTasksSignal.set(true);
      fixture.detectChanges();

      expect(component.reminders.length).toBe(1);
      expect(component.reminders.at(0).value.time).toBe('');
    });
  });

  describe('Disabled State Checks', () => {
    it('checkSubmitDisabled should return true if form is invalid', () => {
      expect(component.checkSubmitDisabled()).toBeTrue();
    });

    it('checkSubmitDisabled should return true if acceptNewTasks signal is false', () => {
      component.reminders.at(0).patchValue({ time: '2026-07-30T12:00', message: 'Task' });
      acceptNewTasksSignal.set(false);

      expect(component.checkSubmitDisabled()).toBeTrue();
    });

    it('checkSubmitDisabled should return false if form is valid and acceptNewTasks is true', () => {
      component.reminders.at(0).patchValue({ time: '2026-07-30T12:00', message: 'Task' });

      expect(component.checkSubmitDisabled()).toBeFalse();
    });

    it('checkAddReminderDisabled should return true when acceptNewTasks is false', () => {
      acceptNewTasksSignal.set(false);

      expect(component.checkAddReminderDisabled()).toBeTrue();
    });
  });
});