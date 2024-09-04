import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LocalStorageService } from '../services/local-storage.service';


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

  constructor(private router: Router, private http: HttpClient, private localStorageService: LocalStorageService) {}

  onLogin() {
    if (this.username && this.password) {

      const users = this.localStorageService.getItem('users' || []);
      const user = users.find((u: any) => u.username === this.username && u.password === this.password);

      if (user) {
        sessionStorage.setItem('user', JSON.stringify(user));
        this.router.navigate(['/dashboard'], { queryParams: { username: this.username } });
      } else {
        alert('User does not exist or incorrect credentials.');
      };
    } else {
      alert('Please enter both a username and a password.');
    };
  };
};
