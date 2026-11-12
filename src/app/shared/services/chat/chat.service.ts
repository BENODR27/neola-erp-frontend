import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { lastValueFrom } from 'rxjs';

export interface Message {
  text: string;
  sender: 'user' | 'bot' | 'system';
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private API_URL = 'https://api.styx.classicfashion.com/api/pms/chat';
  private memory: Message[] = [
    { text: 'You are Jarvis created , an AI assistant.', sender: 'system' },
  ];

  constructor(private apiService: ApiService) {}

  // Send user message and get AI response
  async sendMessage(userMessage: string, modelName: string): Promise<Message> {
    // Add user message to memory
    this.memory.push({ text: userMessage, sender: 'user' });

    // Build prompt from memory
    const prompt = this.memory.map((m) => `${m.sender}: ${m.text}`).join('\n');
    let promptData: string;

    try {
      if (typeof prompt !== 'string') {
        try {
          promptData = JSON.stringify(prompt);
        } catch (err) {
          console.error('Failed to stringify prompt:', err);
          promptData = String(prompt); // fallback
        }
      } else {
        promptData = prompt;
      }
      // Using ApiService to POST
      const response$ = this.apiService.addData(
        { model: modelName, prompt: prompt, stream: true },
        this.API_URL
      );

      const response = await lastValueFrom(response$);

      const botMessage: Message = {
        text: response?.response || 'No response',
        sender: 'bot',
      };

      // Add bot reply to memory
      this.memory.push(botMessage);

      return botMessage;
    } catch (err) {
      console.error(err);
      return { text: 'Error: Unable to get response', sender: 'bot' };
    }
  }

  getMemory(): Message[] {
    return this.memory.filter((m) => m.sender !== 'system');
  }
}
