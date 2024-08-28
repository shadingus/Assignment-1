import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  username: string | null = '';
  selectedGroup: string | null = null;

  groups = [
    {id: 1, name: 'Apple'},
    {id: 2, name: 'Banana'},
    {id: 3, name: 'Cucumber'},
  ];

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

  selectGroup(group: string | null) {
    this.selectedGroup = group;
    console.log(`Group selected: ${group}.`);
  };
};