
import { EmailMessage } from "../types";

const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send';

class GmailService {
  private accessToken: string | null = null;
  private tokenClient: any = null;
  private clientId: string | null = null;

  constructor() {
    this.clientId = localStorage.getItem('sentix_google_client_id');
    this.tryInit();
  }

  public setClientId(id: string) {
    this.clientId = id;
    localStorage.setItem('sentix_google_client_id', id);
    this.tokenClient = null; // Reset to force re-init
  }

  private async tryInit(): Promise<boolean> {
    if (!this.clientId || this.clientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
      return false;
    }

    if (this.tokenClient) return true;

    return new Promise((resolve) => {
      const checkGSI = () => {
        if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
          this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: this.clientId,
            scope: SCOPES,
            callback: (tokenResponse: any) => {
              if (tokenResponse.error !== undefined) {
                console.error("GSI Error:", tokenResponse);
                return;
              }
              this.accessToken = tokenResponse.access_token;
              window.dispatchEvent(new CustomEvent('gmail-auth-success', { detail: this.accessToken }));
            },
          });
          resolve(true);
        } else {
          setTimeout(checkGSI, 100);
        }
      };
      checkGSI();
    });
  }

  public async authenticate(): Promise<void> {
    const ready = await this.tryInit();
    if (!ready) {
      throw new Error("Invalid or missing Google Client ID. Please configure it in Settings.");
    }
    this.tokenClient.requestAccessToken({ prompt: 'consent' });
  }

  public setToken(token: string) {
    this.accessToken = token;
  }

  public async fetchEmails(): Promise<EmailMessage[]> {
    if (!this.accessToken) throw new Error("Not authenticated with Gmail");

    try {
      const response = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=label:INBOX',
        {
          headers: { Authorization: `Bearer ${this.accessToken}` },
        }
      );
      
      if (!response.ok) {
        if (response.status === 401) throw new Error("Unauthorized");
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();
      if (!data.messages) return [];

      const emailPromises = data.messages.map(async (msg: any) => {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
          {
            headers: { Authorization: `Bearer ${this.accessToken}` },
          }
        );
        const msgData = await msgRes.json();
        
        const headers = msgData.payload.headers;
        const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
        const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown Sender';
        const date = headers.find((h: any) => h.name === 'Date')?.value || '';
        
        let content = msgData.snippet || '';
        if (msgData.payload.parts) {
          const findTextPart = (parts: any[]): any => {
            for (const part of parts) {
              if (part.mimeType === 'text/plain') return part;
              if (part.parts) {
                const nested = findTextPart(part.parts);
                if (nested) return nested;
              }
            }
            return null;
          };
          
          const textPart = findTextPart(msgData.payload.parts);
          if (textPart && textPart.body && textPart.body.data) {
            try {
              content = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
            } catch (e) {
              content = msgData.snippet;
            }
          }
        }

        return {
          id: msgData.id,
          from,
          subject,
          content,
          date: new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: !msgData.labelIds.includes('UNREAD'),
        } as EmailMessage;
      });

      return Promise.all(emailPromises);
    } catch (err) {
      console.error("Gmail Fetch Error:", err);
      throw err;
    }
  }

  public async sendReply(to: string, subject: string, body: string, threadId: string): Promise<void> {
    if (!this.accessToken) throw new Error("Not authenticated with Gmail");

    const email = [
      `To: ${to}`,
      `Subject: Re: ${subject}`,
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      body,
    ].join('\n');

    const base64Email = btoa(unescape(encodeURIComponent(email)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: base64Email,
        threadId: threadId
      }),
    });

    if (!res.ok) throw new Error("Failed to send reply");
  }
}

export const gmailService = new GmailService();
