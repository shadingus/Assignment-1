export interface Message {
    username: string;
    message: string;
}

export interface Channel {
    id: number;
    name: string;
    messages: Message[];
}

export interface Group {
    id: number;
    name: string;
    channels: Channel[];
    members: number[];
    creatorId: number;
}

export interface User {
    id?: number;
    username: string;
    email: string;
    password: string;
    role: string;
    groups: number[];
}

export interface ChatMessageData {
    message: Message;
    groupId: number;
    channelId: number;
}  