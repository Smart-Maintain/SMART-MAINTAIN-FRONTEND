import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-chatbot-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot-widget.html',
  styleUrl: './chatbot-widget.scss'
})
export class ChatbotWidget {
  isOpen = false;
  message = '';
  isPending = false;
  messages: { from: 'bot' | 'user'; text: string }[] = [
    { from: 'bot', text: 'Ask about tasks, teams, rapports, or model guidance.' }
  ];

  constructor(private auth: AuthService, private dataService: DataService) {}

  toggle() {
    this.isOpen = !this.isOpen;
  }

  send() {
    const text = this.message.trim();
    if (!text || this.isPending) return;

    this.messages.push({ from: 'user', text });
    this.message = '';
    this.isPending = true;

    const role = this.auth.user()?.role || 'user';
    this.dataService.askChatbot(role, text).subscribe({
      next: (response) => {
        this.messages.push({ from: 'bot', text: response.answer });
        this.isPending = false;
      },
      error: () => {
        this.messages.push({ from: 'bot', text: 'I cannot reach the maintenance assistant right now.' });
        this.isPending = false;
      }
    });
  }
}
