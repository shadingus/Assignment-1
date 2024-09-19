import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

interface User {
  id?: number;
  username: string;
  email: string;
  password: string;
  role: string;
  groups: string[];
};

@Injectable({
  providedIn: 'root'
})

export class LoginService {

  private socket: Socket | undefined;

  constructor(private http: HttpClient) { }

  // Register function
  register(newUser: User): Observable<any> {
    return this.http.post('/api/users/register', newUser);
  };

  // 1. Login HTTP request
  loginHttp(username: string, password: string): Observable<any> {
    return this.http.post('api/users/login', { username, password });
  }

  // 2. Socket initialization after login
  loginSocket(username: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.socket.connected) {
        console.log('Socket already initialized with ID:', this.socket.id);
        resolve(); // Socket already connected, resolve immediately
        return;
      }
      // Create a new socket connection
      this.socket = io('http://localhost:3000');  // Connect to your backend
      this.socket.on('connect', () => {
        console.log('Socket initialized with ID:', this.socket?.id);
        this.socket?.emit('userConnected', username);
        resolve(); // Resolve once the socket is connected
      });

      this.socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        reject(err); // Reject if there’s an error during connection
      });
    });
  }

  // 3. Return the socket object for use elsewhere in the app
  getSocket(): Socket | undefined {
    if (this.socket && this.socket.connected) {
      return this.socket;
    } else {
      console.error('Socket not initialized or disconnected');
      return undefined;
    }
  }
};