import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LocalStorageService } from '../services/local-storage.service';
import { CommonModule } from '@angular/common';
import { LoginService } from '../services/login.service';

interface User {
  id?: number;
  username: string;
  email: string;
  password: string;
  role: string;
  groups: string[];
};

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  user: any = {};
  newUser: User = {
    id: 0,
    username: '',
    email: '',
    password: '',
    role: 'User', // Default role
    groups: []
  };

  allUsers: any[] = [];
  username: string = '';
  password: string = '';

  private modalInstance: any;
  isModalOpen: boolean = false;

  constructor(
    private router: Router,
    private localStorageService: LocalStorageService,
    private login: LoginService
  ) { };

  // On login, submit HTTP request and create socket connection.
  onLogin() {
    if (this.username && this.password) {
      // Make the HTTP login request
      this.login.loginHttp(this.username, this.password).subscribe({
        next: (response) => {
          // Store the user in sessionStorage
          sessionStorage.setItem('user', JSON.stringify(response.user));
          console.log('Login Successful:', response);
          // Initialize the socket connection after successful login
          this.login.loginSocket(this.username).then(() => {
            console.log('Socket initialised for user: ', this.username);
            // Redirect to the dashboard
            this.router.navigate(['/dashboard'], { queryParams: { username: this.username } });
          }).catch((err) => {
            console.error('Error initialising socket: ', err);
            alert('Login successful, but socket connection failed.');
          });
        },
        error: (error) => {
          if (error.status === 401) {
            alert('Invalid username or password.');
          } else {
            console.error('Error during login:', error);
          };
        },
      });
    } else {
      alert('Please enter both a username and a password.');
    };
  };

  register() {
    this.login.register(this.newUser).subscribe({
      next: (response: any) => {
        console.log('User registered on backend:', response);

        const users = this.localStorageService.getItem('users') || [];
        users.push(response.user);
        this.localStorageService.setItem('users', users);
        this.allUsers.push(response.user);

        this.newUser = { id: 0, username: '', email: '', password: '', role: 'User', groups: [] };
        this.modalInstance.hide();
      },
      error: (error) => {
        if (error.status === 400) {
          alert(error.error.message);
        } else {
          console.error('Error registering user on backend:', error);
        };
      },
    });
  };

  openRegisterModal() {
    const modalElement = document.getElementById('registerModal');
    if (modalElement) {
      this.modalInstance = new bootstrap.Modal(modalElement);
      this.modalInstance.show();
    };
  };

  cancel() {
    if (this.modalInstance) {
      this.modalInstance.hide();
    };
  };
};