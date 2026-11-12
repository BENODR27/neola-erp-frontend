import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ApiService } from '../../services/api/api.service';
import { LocalStorageService } from '../../services/local-storage/local-storage.service';
import { ChatComponent } from './chat.component';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    apiService = jasmine.createSpyObj<ApiService>('ApiService', ['getDatas']);
    apiService.getDatas.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [ChatComponent],
      providers: [
        { provide: ApiService, useValue: apiService },
        {
          provide: LocalStorageService,
          useValue: {
            getItem: (key: string) =>
              key === 'username' ? 'Test User' : 'EMP-1',
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows a welcome message and command guidance when opened', () => {
    component.toggleChat();

    expect(apiService.getDatas).not.toHaveBeenCalled();
    expect(component.chatHistory[0].message).toContain('Welcome to Styx');
    expect(component.chatHistory[1].message).toContain('FG REPORT TODAY');
  });

  it('calls the FG report webhook for the FG report command', () => {
    component.toggleChat();
    component.sendMessage('FG REPORT TODAY');

    expect(apiService.getDatas).toHaveBeenCalledWith(
      jasmine.stringMatching(
        /^http:\/\/10\.50\.1\.225:3052\/api\/v1\/n8n\/webhook\/bia-fg\?reportType=FG&reportDate=\d{4}-\d{2}-\d{2}&employeeCode=EMP-1$/,
      ),
    );
    expect(component.chatHistory[component.chatHistory.length - 1].message).toContain(
      'report will be shared to your email shortly',
    );
  });

  it('sends the signed-in employee ID even when only the username is stored', () => {
    const localStorageService = TestBed.inject(LocalStorageService);
    spyOn(localStorageService, 'getItem').and.callFake(<T>(key: string) =>
      (key === 'username' ? '102301' : null) as T | null,
    );
    component.toggleChat();
    component.sendMessage('FG REPORT TODAY');

    expect(apiService.getDatas).toHaveBeenCalledWith(
      jasmine.stringMatching(/[?&]employeeCode=102301$/),
    );
  });

  it('shows an error instead of a success message when the API call fails', () => {
    apiService.getDatas.and.returnValue(
      throwError(() => new Error('Service unavailable')),
    );
    component.toggleChat();
    component.sendMessage('FG REPORT TODAY');

    const lastMessage = component.chatHistory[component.chatHistory.length - 1];
    expect(lastMessage.message).toContain('Service unavailable');
    expect(lastMessage.message).not.toContain('succeeded');
  });

  it('shows help for the HELP command', () => {
    component.toggleChat();
    component.sendMessage('HELP');

    expect(component.chatHistory[component.chatHistory.length - 1].message).toContain(
      'Available commands',
    );
  });

  it('prevents the chat form from navigating or refreshing the app', () => {
    component.toggleChat();
    component.inputText = 'HELP';
    const event = new Event('submit', { cancelable: true });

    component.onSubmit(event);

    expect(event.defaultPrevented).toBeTrue();
    expect(component.chatHistory[component.chatHistory.length - 1].message).toContain(
      'Available commands',
    );
  });

  it('shows the backend permission-denial message directly in chat without requesting access', () => {
    const denialMessage =
      'You do not have access to FG_REPORT. Please request access from an administrator.';
    apiService.getDatas.and.returnValue(
      throwError(() => ({
        status: 403,
        error: {
          code: 'MODULE_ACCESS_REQUIRED',
          moduleKey: 'FG_REPORT',
          employeeId: 'EMP-1',
          permissionStatus: 'NOT_REQUESTED',
          message: denialMessage,
        },
      })),
    );

    component.toggleChat();
    component.sendMessage('FG REPORT TODAY');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(denialMessage);
    expect(fixture.nativeElement.textContent).not.toContain('Request access');
    expect(fixture.nativeElement.textContent).not.toContain(
      'I could not submit the FG report request.',
    );
  });

  it('does not block local chat commands before backend access is checked', () => {
    component.toggleChat();
    component.sendMessage('HELP');

    expect(component.chatHistory[component.chatHistory.length - 1].message).toContain(
      'Available commands',
    );
  });
});
