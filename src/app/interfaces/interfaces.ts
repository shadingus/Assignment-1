export interface Message {
  username: string;
  message: string;
}

export interface Channel {
  id: [string, number];
  name: string;
  messages: Message[];
}

export interface Group {
  id: string;
  name: string;
  channels: Channel[];
  members: number[];
  creatorId: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  role: string;
  groups: string[];
}

export interface ChatMessageData {
  message: Message;
  groupId: string; // Change to string (group name)
  channelId: number;
}