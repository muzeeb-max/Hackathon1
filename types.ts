
export enum UrgencyLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export enum Sentiment {
  VERY_ANGRY = 'Very Angry',
  ANGRY = 'Angry',
  NEUTRAL = 'Neutral',
  SLIGHTLY_DISSATISFIED = 'Slightly Dissatisfied',
  SATISFIED = 'Satisfied'
}

export interface EmailMessage {
  id: string;
  from: string;
  subject: string;
  content: string;
  date: string;
  isRead: boolean;
  isReplied?: boolean;
  aiReplySnippet?: string;
}

export interface ComplaintAnalysis {
  id: string;
  sourceEmailId?: string;
  originalText: string;
  summary: string;
  category: string;
  sentiment: Sentiment;
  urgency: UrgencyLevel;
  recommended_action: string;
  key_issues: string[];
  rootCause: string;
  automated_response: string;
  timestamp: number;
}

export interface AppState {
  history: ComplaintAnalysis[];
  currentAnalysis: ComplaintAnalysis | null;
  isLoading: boolean;
  error: string | null;
  isGmailConnected: boolean;
  gmailEmails: EmailMessage[];
  googleClientId: string | null;
}
