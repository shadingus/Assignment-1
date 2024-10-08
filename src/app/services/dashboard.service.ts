import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginService } from './login.service';
import { io, Socket } from 'socket.io-client';
import {
  Message,
  Channel,
  Group,
  User,
  ChatMessageData,
} from '../interfaces/interfaces';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private socket: Socket | undefined;
  private currentNameSpace: string | undefined;

  constructor(private http: HttpClient, private login: LoginService) {
    this.socket = this.login.getSocket();
  }

  // Leave the current group (namespace)
  leaveGroup(): void {
    if (this.socket) {
      // Gracefully leave the current namespace (disconnect the socket)
      this.socket.disconnect(); // Disconnect from the current namespace
      console.log(`Left namespace ${this.currentNameSpace}`);
      this.socket = undefined; // Clear the socket reference
      this.currentNameSpace = undefined; // Clear the namespace reference
    } else if (this.socket === undefined) {
      console.warn('Socket is already disconnected.');
    } else {
      console.warn('No active socket connection to disconnect.');
    }
  }

  joinGroup(groupId: string): void {
    // Check if already connected to the correct namespace
    if (this.socket && this.currentNameSpace === `/${groupId}`) {
      console.log(`Already connected to the namespace /${groupId}`);
      return;
    }
    // If there's an active connection, leave the current namespace
    if (this.socket) {
      this.leaveGroup();
    }
    // Connect to the new namespace
    this.socket = io(`/${groupId}`);
    // Set the current namespace reference
    this.currentNameSpace = `/${groupId}`;
    // Handle socket connection success
    this.socket.on('connect', () => {
      console.log(`Connected to namespace /${groupId}`);
    });
    // Handle socket connection errors
    this.socket.on('connect_error', (err) => {
      console.error(`Error connecting to namespace /${groupId}:`, err);
    });
  }

  leaveChannel(channelId: number): void {
    if (this.socket) {
      this.socket.emit('leaveChannel', channelId);
      console.log(`A user left channel ${channelId}.`);
    } else {
      console.error('Socket is not connected.');
    }
  }

  joinChannel(channelId: number): void {
    if (this.socket) {
      this.socket.emit('joinRoom', channelId);
      console.log(
        `User joined channel ${channelId}, socket ID: ${this.socket.id}`
      );
    }
  }

  // Send a message to the current channel (room) using WebSocket
  sendMessageToChannel(messageData: ChatMessageData): void {
    console.log(this.socket);
    // Send the message via WebSocket for real-time updates and storage in the backend
    if (this.socket) {
      console.log('Sending chatMessage with data:', messageData); // Log the messageData to ensure groupId is correct
      this.socket.emit('chatMessage', messageData);
    } else {
      console.error('Socket connection not found.');
    }
  }

  // Disconnect from the current namespace (optional)
  disconnectNamespace(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = undefined;
      this.currentNameSpace = undefined;
    }
  }

  loadUsersAndGroups(): Observable<{ users: User[]; groups: Group[] }> {
    return this.http.get<{ users: User[]; groups: Group[] }>(
      '/api/dashboard/dashboard-data'
    );
  }

  initialiseChannel(channelData: Channel): Observable<ChatMessageData> {
    return new Observable((observer) => {
      this.http
        .get<Message[]>(
          `/api/groups/${channelData.id[0]}/${channelData.id[1]}/messages`
        )
        .subscribe({
          next: (messages: Message[]) => {
            messages.forEach((message) => {
              const chatMessageData: ChatMessageData = {
                message,
                groupId: channelData.id[0],
                channelId: channelData.id[1],
              };
              observer.next(chatMessageData);
            });
            if (this.socket) {
              this.socket.on('chatMessage', (data: ChatMessageData) => {
                observer.next(data); // Emit the received message to subscribers
              });
            } else {
              console.error('Socket not initialized');
            }
          },
          error: (error) => {
            console.error('Error loading messages:', error);
          },
        });
    });
  }

  createGroup(newGroup: Partial<Group>): Observable<any> {
    return this.http.post('/api/groups/create', newGroup);
  }

  deleteGroup(
    groupId: string,
    currentUserId: number,
    currentUserRole: string
  ): Observable<any> {
    return this.http.delete(
      `/api/groups/delete/${groupId}/${currentUserId}/${currentUserRole}`
    );
  }

  addUserToGroup(groupId: string, userId: number, role: string): Observable<any> {
    return this.http.post(`/api/groups/${groupId}/add-user/${userId}`, {
      userId,
      role
    });
  }  

  createChannel(
    channelData: Channel,
    userData: { userId: number; userRole: string }
  ): Observable<any> {
    const requestBody = {
      channelData,
      userData,
    };
    console.log(requestBody);
    return this.http.post(
      `/api/groups/${channelData.id[0]}/create/channel`,
      requestBody
    );
  }

  deleteChannel(
    channelData: Channel,
    userData: { userId: number; userRole: string }
  ): Observable<any> {
    const requestBody = {
      channelData,
      userData,
    };
    return this.http.post(
      `/api/groups/${channelData.id[0]}/delete/channel`,
      requestBody
    );
  }

  promoteUser(
    userId: number,
    newRole: string,
    currentUserRole: string
  ): Observable<any> {
    return this.http.post(`/api/users/${userId}/role`, {
      newRole,
      currentUserRole,
    });
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`/api/users/${userId}`);
  }

  banUser(banData: {
    userId: number;
    groupId: number;
    channelId?: number | null;
    currentUserId: number;
    currentUserRole: string;
  }): Observable<any> {
    return this.http.post('/api/ban/banUser', banData);
  }

  loadBanReports(adminId: number): Observable<any[]> {
    const params = { adminId: adminId.toString() };
    return this.http.get<any[]>('/api/ban/banReports', { params });
  }

  // Log out and disconnect the socket
  logout(username: string): void {
    if (this.socket) {
      this.socket.emit('userDisconnected', username);
      this.socket.on('disconnect', () => {
        console.log(`Socket for ${username} fully disconnected.`);
        this.socket?.removeAllListeners();
      });
      this.socket.disconnect();
      this.socket = undefined;
      console.log(`User ${username} disconnected`);
    } else {
      console.error('No socket connection to disconnect.');
    }
  }
}
