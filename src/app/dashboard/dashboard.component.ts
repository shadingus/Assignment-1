import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  user: any = {};
  selectedGroup: string | null = null;
  newMessage: string = '';
  messages: string[] = [];
  newGroupName: string = '';

  groups: { id: number; name: string }[] = [];

  private modalInstance: any;

  constructor(private router: Router, private http: HttpClient) { }

  ngOnInit() {
    const storedUser = sessionStorage.getItem('user');

    if (storedUser) {
      this.user = JSON.parse(storedUser);
    } else {
      console.log('No user is logged in!');
    };

    this.http.get<{ id: number; name: string }[]>('/groups').subscribe((groups) => {
      this.groups = groups;
      sessionStorage.setItem('groups', JSON.stringify(groups));
    })
  };

  selectGroup(group: string | null) {
    this.selectedGroup = group;
    console.log(`Group selected: ${group}.`);
    this.messages = [];
  };

  showModal() {
    const modalElement = document.getElementById('newGroupModal');
    if (modalElement) {
      this.modalInstance = new bootstrap.Modal(modalElement);
      this.modalInstance.show();
    }
  }

  createGroup() {
    const trimmedGroupName = this.newGroupName.trim();

    if (trimmedGroupName) {
      this.http.post<{ id: number, name: string }>('/groups', { name: trimmedGroupName }).subscribe(newGroup => {
        this.groups.push(newGroup);
        sessionStorage.setItem('groups', JSON.stringify(this.groups));
        this.newGroupName = '';
      });

      if (this.modalInstance) {
        this.modalInstance.hide();
      };
    } else {
      alert('Please enter a group name.');
    };
  };

  cancel() {
    if (this.modalInstance) {
      this.modalInstance.hide();
    };
  };

  logout() {
    sessionStorage.removeItem('user');
    this.router.navigate(['/login'])
  };

  sendMessage() {
    if (this.newMessage.trim()) {
      this.messages.push(`${this.user.username}: ${this.newMessage}`);
      this.newMessage = '';
    };
  };
};