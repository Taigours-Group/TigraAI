// Add module declaration for png files
// @ts-ignore
declare module '*.png';

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface UserContext {
  userAgent: string;
  language: string;
  platform: string;
  timezone: string;
}

export interface UserPreferences {
  country?: string;
  location?: string;
  maritalStatus?: string;
  occupation?: string;
  interests?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  age?: string;
  gender?: string;
  country?: string;
  phone?: string;
  isLoggedIn: boolean;
  joinedAt: number;
  preferences?: UserPreferences;
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  ERROR = 'ERROR'
}