import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username: string = '';
  password: string = '';

  constructor(private router: Router, private http: HttpClient) {}

  onLogin() {
    if (this.username && this.password) {

      this.http.post('http://localhost:3000/login', {
        username: this.username,
        password: this.password
      }).subscribe({
        next: (response: any) => {
          console.log('Login response:', response);
          sessionStorage.setItem('user', JSON.stringify({
            username: this.username,
          }))
          this.router.navigate(['/dashboard'], { queryParams: { username: this.username } });
        },
        error: error => {
          if (error.status === 404) {
            alert('User does not exist. Please contact the super admin to create your login credentials.');
          } else if (error.status === 401) {
            alert('Incorrect password. Please try again.');
          } else {
            alert('Login failed. Please try again later.');
          };
        },
        complete: () => {
          console.log('Login request completed.');
        }
      });
    } else {
      alert('Please enter both a username and a password.');
    };
  };
};
