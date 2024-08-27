import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  username: string | null = '';

  constructor() {}

  ngOnInit() {
    const storedUser = sessionStorage.getItem('user');

    if (storedUser) {
      const user = JSON.parse(storedUser);
      this.username = user.username;
    } else {
      console.log('No user is logged in!');
    };
  };
};