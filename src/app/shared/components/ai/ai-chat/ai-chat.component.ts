import { Component, ElementRef, ViewChild , signal} from '@angular/core';
import { ChatService } from '../../../services/chat/chat.service';
import { ChatMessageComponent } from '../chat-message/chat-message.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { marked } from 'marked';

interface Message {
  text: string;
  sender: any;
}
@Component({
  selector: 'app-ai-chat',
  imports: [
    ChatMessageComponent,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  templateUrl: './ai-chat.component.html',
  styleUrl: './ai-chat.component.css',
})
export class AiChatComponent {
  messages: Message[] = [];
  inputText: string = '';
  readonly loading = signal<boolean>(false)
  modelName: string = 'gpt-oss:20b';
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    // load memory
    this.messages = this.chatService.getMemory();
  }
  formatMarkdown(md: string) {
    return marked(md);
  }
  async sendMessage() {
    if (!this.inputText.trim()) return;

    this.messages.push({ text: this.inputText, sender: 'user' });
    const userMessage = this.inputText;
    this.inputText = '';
    this.scrollToBottom();

    this.loading.set(true);
    const botResponse = await this.chatService.sendMessage(
      userMessage,
      this.modelName
    );
    this.messages.push(botResponse);
    this.loading.set(false);

    this.scrollToBottom();
  }

  scrollToBottom(): void {
    setTimeout(() => {
      this.scrollContainer.nativeElement.scrollTop =
        this.scrollContainer.nativeElement.scrollHeight;
    }, 100);
  }
  copyMessage(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Message copied:', text);
    });
  }
}
