import { CommonModule } from '@angular/common';
import { Component , signal} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api/api.service';
import { LocalStorageService } from '../../services/local-storage/local-storage.service';
import { environment } from '../../environments/environment';

interface ChatMessage {
  sender: 'bot' | 'user';
  message: string;
  isPending?: boolean;
}

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent {
  private readonly reportModule = {
    key: 'FG_REPORT',
    label: 'FG report',
    denialCode: 'MODULE_ACCESS_REQUIRED',
  } as const;
  private readonly n8nWebhookProxyUrl =
    `${environment.apiServiceUrl}/api/v1/n8n/webhook/bia-fg`;

  readonly isOpen = signal(false)
  readonly isSending = signal(false)
  inputText = '';
  chatHistory: ChatMessage[] = [];

  constructor(
    private apiService: ApiService,
    private localStorage: LocalStorageService,
  ) {}

  toggleChat(): void {
    this.isOpen.set(!this.isOpen());
    if (this.isOpen() && this.chatHistory.length === 0) {
      this.addWelcomeMessages();
    }
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.sendMessage();
  }

  sendMessage(message = this.inputText): void {
    const text = message.trim();
    if (!text || this.isSending()) {
      return;
    }

    this.chatHistory.push({ sender: 'user', message: text });
    this.inputText = '';

    if (this.isFgReportTodayCommand(text)) {
      this.requestFgReportToday();
      return;
    }

    if (/^(help|commands)$/i.test(text)) {
      this.addHelpMessage();
      return;
    }

    this.chatHistory.push({
      sender: 'bot',
      message:
        'I did not recognize that command. Type "HELP" to see what I can do.',
    });
  }

  private requestFgReportToday(): void {
    this.isSending.set(true);
    const pendingMessage: ChatMessage = {
      sender: 'bot',
      message: "Requesting today's FG report...",
      isPending: true,
    };
    this.chatHistory.push(pendingMessage);

    const queryParams = new URLSearchParams({
      reportType: 'FG',
      reportDate: this.getTodayDate(),
    });
    const requestedBy = this.getEmployeeId();
    if (!requestedBy) {
      pendingMessage.message =
        'I could not identify your employee ID. Please sign in again and retry.';
      pendingMessage.isPending = false;
      this.isSending.set(false);
      return;
    }
    queryParams.set('employeeCode', requestedBy);

    this.apiService
      .getDatas(`${this.n8nWebhookProxyUrl}?${queryParams.toString()}`)
      .subscribe({
        next: () => {
          pendingMessage.message =
            'Your FG report request was sent successfully. The report will be shared to your email shortly.';
          pendingMessage.isPending = false;
          this.isSending.set(false);
        },
        error: (error: unknown) => {
          this.isSending.set(false);
          if (!this.handleAccessDenied(error, pendingMessage)) {
            pendingMessage.message = `I could not submit the FG report request. ${this.getErrorMessage(error)} Please try again.`;
            pendingMessage.isPending = false;
          }
        },
      });
  }

  private addHelpMessage(): void {
    this.chatHistory.push({
      sender: 'bot',
      message:
        'Available commands:\n• FG REPORT TODAY — request today’s FG report\n• HELP or COMMANDS — show this list',
    });
  }

  private isFgReportTodayCommand(message: string): boolean {
    return /^(?:fg\s+report\s+today|today'?s\s+fg\s+report)$/i.test(
      message.trim().replace(/\s+/g, ' '),
    );
  }

  private getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good morning';
    }
    if (hour < 18) {
      return 'Good afternoon';
    }
    return 'Good evening';
  }

  private getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null) {
      if ('error' in error && typeof error.error === 'object' && error.error !== null) {
        const responseMessage = 'message' in error.error ? error.error.message : null;
        if (typeof responseMessage === 'string' && responseMessage.trim()) {
          return responseMessage;
        }
      }
      if ('message' in error) {
        const message = error.message;
        if (typeof message === 'string' && message.trim()) {
          return message;
        }
      }
    }
    return 'The request failed.';
  }

  private handleAccessDenied(
    error: unknown,
    pendingMessage: ChatMessage,
  ): boolean {
    if (
      typeof error !== 'object' ||
      error === null ||
      !('error' in error) ||
      typeof error.error !== 'object' ||
      error.error === null ||
      !('code' in error.error) ||
      error.error.code !== this.reportModule.denialCode ||
      !('moduleKey' in error.error) ||
      error.error.moduleKey !== this.reportModule.key
    ) {
      return false;
    }

    const responseMessage =
      'message' in error.error && typeof error.error.message === 'string'
        ? error.error.message
        : 'You do not have access to this module.';
    pendingMessage.message =
      `${responseMessage}\n\nAdministrator: Beno David\nInnovation and Automation Lead, Digital Transformation Department\nEmail: beno.david@classicfashion.com`;
    pendingMessage.isPending = false;
    return true;
  }

  private addWelcomeMessages(): void {
    if (this.chatHistory.length > 0) {
      return;
    }

    const username = this.localStorage.getItem<string>('username');
    const greeting = this.getGreeting();
    this.chatHistory = [
      {
        sender: 'bot',
        message: `${greeting}${username ? `, ${username}` : ''}! Welcome to Styx. How can I help?`,
      },
      {
        sender: 'bot',
        message: 'Try a command: "FG REPORT TODAY", "HELP", or "COMMANDS".',
      },
    ];
  }

  private getEmployeeId(): string | null {
    const currentEmployeeId =
      this.localStorage.getItem<string>('currentEmpId');
    const username = this.localStorage.getItem<string>('username');
    const employeeId = currentEmployeeId || username;

    return typeof employeeId === 'string' &&
      /^[A-Za-z0-9][A-Za-z0-9._-]{0,49}$/.test(employeeId.trim())
      ? employeeId.trim()
      : null;
  }

}
