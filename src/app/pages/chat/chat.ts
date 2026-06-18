import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="padding: 32px; height: 100%; display: flex; flex-direction: column;">
      <h1 style="font-size: 24px; font-weight: 400; color: #F0F0F0; margin-bottom: 24px; font-family: 'Space Grotesk', sans-serif;">
        AI Maintenance Assistant
      </h1>
      
      <div style="flex: 1; background-color: #0A0A0A; border: 1px solid rgba(240,240,240,0.06); display: flex; flex-direction: column; overflow: hidden;">
        <div style="flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 16px;">
          <div *ngFor="let msg of messages" 
               [style.align-self]="msg.from === 'user' ? 'flex-end' : 'flex-start'"
               [style.background-color]="msg.from === 'user' ? '#F28C28' : '#111114'"
               [style.color]="msg.from === 'user' ? '#0A0A0A' : '#F0F0F0'"
               [style.border]="msg.from === 'bot' ? '1px solid rgba(240,240,240,0.1)' : 'none'"
               style="padding: 16px 20px; border-radius: 4px; max-width: 75%; font-size: 14px; line-height: 1.5; font-family: 'Inter', sans-serif;">
            <strong *ngIf="msg.from === 'bot'" style="display: block; margin-bottom: 8px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #00A8E8; font-family: 'Space Grotesk', sans-serif;">
              AI Assistant
            </strong>
            {{ msg.text }}
          </div>
          
          <div *ngIf="isPending" style="align-self: flex-start; padding: 16px 20px; background-color: #111114; color: #8A8A93; border: 1px solid rgba(240,240,240,0.1); border-radius: 4px; font-size: 14px; font-family: 'Inter', sans-serif;">
            Thinking...
          </div>
        </div>
        
        <div style="padding: 24px; border-top: 1px solid rgba(240,240,240,0.06); background-color: #050505;">
          <div style="display: flex; gap: 12px;">
            <input [(ngModel)]="message" 
                   (keyup.enter)="send()"
                   placeholder="Ask about tasks, reports, or maintenance guidelines..." 
                   style="flex: 1; background-color: #111114; color: #F0F0F0; border: 1px solid rgba(240,240,240,0.12); padding: 16px; font-size: 14px; font-family: 'Inter', sans-serif; outline: none;" />
            <button (click)="send()" 
                    [disabled]="isPending || !message.trim()"
                    style="background-color: #F28C28; color: #0A0A0A; border: none; padding: 0 32px; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 700; cursor: pointer; transition: opacity 0.2s; font-family: 'Space Grotesk', sans-serif;"
                    [style.opacity]="isPending || !message.trim() ? '0.5' : '1'">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ChatPage {
  message = '';
  isPending = false;
  messages: { from: 'bot' | 'user'; text: string }[] = [
    { from: 'bot', text: 'Ask about tasks, teams, rapports, or model guidance.' }
  ];

  constructor(private auth: AuthService, private dataService: DataService, private cdr: ChangeDetectorRef) {}

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
        this.cdr.detectChanges();
      },
      error: () => {
        this.messages.push({ from: 'bot', text: 'I cannot reach the maintenance assistant right now.' });
        this.isPending = false;
        this.cdr.detectChanges();
      }
    });
  }
}
