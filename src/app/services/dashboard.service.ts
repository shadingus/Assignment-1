import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginService } from './login.service';
import { io, Socket } from 'socket.io-client';
import { Message, Channel, Group, User, ChatMessageData } from '../interfaces/interfaces';

@Injectable({
  providedIn: 'root'
})

export class DashboardService {

  private socket: Socket | undefined;
  private currentNameSpace: string | undefined;

  constructor(
    private http: HttpClient,
    private login: LoginService,
  ) {
    this.socket = this.login.getSocket();
  };

  // Leave the current group (namespace)
  leaveGroup(): void {
    if (this.socket) {
      this.socket.disconnect();  // Disconnect from the current namespace
      console.log(`Left namespace ${this.currentNameSpace}`);
      this.socket = undefined;  // Clear the socket reference
      this.currentNameSpace = undefined; // Clear the namespace reference
    } else {
      console.error('No socket connection to disconnect.');
    }
  }


  joinGroup(groupId: number): void {
    const namespaceSocket = io(`/group-${groupId}`);  // Create a new Socket.IO connection to the namespace

    if (!this.socket || this.currentNameSpace !== `/group-${groupId}`) {
      // Leave the previous group (namespace) if any
      this.leaveGroup();

      // Connect to the new namespace
      this.socket = namespaceSocket;
      this.currentNameSpace = `/group-${groupId}`;
      console.log(`Connected to namespace /group-${groupId}`);
    } else {
      console.log(`Already connected to the namespace /group-${groupId}`);
    }
  }

  leaveChannel(channelId: number): void {
    if (this.socket) {
      this.socket.emit('leaveChannel', channelId);
      console.log(`A user left channel ${channelId}.`);
    } else {
      console.error('Socket is not connected.');
    };
  };

  joinChannel(channelId: number): void {
    if (this.socket) {
      this.socket.emit('joinRoom', channelId);
      console.log(`User joined channel ${channelId}, socket ID: ${this.socket.id}`);

    };
  };

  // Send a message to the current channel (room)
  sendMessageToChannel(messageData: ChatMessageData): void {
    console.log(this.socket);
    if (this.socket) {
      console.log('Sending chatMessage with data:', messageData); // Log the messageData to ensure groupId is correct
      this.socket.emit('chatMessage', messageData);
    } else {
      console.error('Socket connection not found.');
    };
  };

  getMessages(): Observable<ChatMessageData> {
    return new Observable(observer => {
      if (this.socket) {
        console.log('Listening for messages on socket:', this.socket);
        this.socket.on('chatMessage', (data: ChatMessageData) => {
          console.log(`Received message: ${data.message.message}`);
          observer.next(data);  // Emit the received message to subscribers
        });
      } else {
        console.error('Socket not initialized');
      }
    });
  }  

  // Disconnect from the current namespace (optional)
  disconnectNamespace(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = undefined;
      this.currentNameSpace = undefined;
    }
  }

  loadUsersAndGroups(): Observable<{ users: User[], groups: Group[] }> {
    return this.http.get<{ users: User[], groups: Group[] }>('/api/dashboard/dashboard-data');
  }

  loadMessages(groupId: number, channelId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`/api/groups/${groupId}/channels/${channelId}/messages`);
  }


  createGroup(newGroup: Partial<Group>): Observable<any> {
    return this.http.post('/api/groups/', newGroup);
  }

  deleteGroup(groupId: number, currentUserId: number, currentUserRole: string): Observable<any> {
    return this.http.delete(`/api/groups/${groupId}`, {
      body: {
        currentUserId: currentUserId,
        currentUserRole: currentUserRole
      },
    });
  }

  addUserToGroup(data: { userId: number, groupId: number, creatorId: number | undefined, currentUserRole: string }): Observable<any> {
    return this.http.post('/api/groups/addUserToGroup', data);
  }

  createChannel(groupId: number, channelData: { name: string }): Observable<any> {
    return this.http.post(`/api/groups/${groupId}/channels`, channelData);
  }

  deleteChannel(groupId: number, channelId: number, currentUserId: number, currentUserRole: string): Observable<any> {
    return this.http.delete(`/api/groups/${groupId}/channels/${channelId}`, {
      body: { currentUserId: currentUserId, currentUserRole: currentUserRole },
    });
  }

  promoteUser(userId: number, newRole: string, currentUserRole: string): Observable<any> {
    return this.http.post(`/api/users/${userId}/role`, { newRole, currentUserRole });
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`/api/users/${userId}`);
  }

  banUser(banData: { userId: number, groupId: number, channelId?: number | null, currentUserId: number, currentUserRole: string }): Observable<any> {
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
