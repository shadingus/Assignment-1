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
  allUsers: any[] = [];
  selectedUserId: number | null = null;

  newUser = {
    username: '',
    email: '',
    password: '',
    role: 'User', // Default role
    groups: []
  };

  private modalInstance: any;

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit() {
    const storedUser = sessionStorage.getItem('user');

    if (storedUser) {
      this.user = JSON.parse(storedUser);
      this.user.groups = this.user.groups || [];
    } else {
      console.log('No user is logged in!');
    };

    this.http.get<{ id: number; name: string }[]>('/groups').subscribe((groups) => {
      this.groups = groups;
      sessionStorage.setItem('groups', JSON.stringify(groups));
    });

    if (this.user.role === 'Super Admin') {
      this.http.get<any[]>('/users').subscribe((users) => {
        this.allUsers = users;
      });
    };
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
    };
  };

  showAddUserToGroupModal() {
    // Load users and groups each time the modal is opened
    this.loadUsersAndGroups(); 
  
    const modalElement = document.getElementById('addUserToGroupModal');
    if (modalElement) {
      this.modalInstance = new bootstrap.Modal(modalElement);
      this.modalInstance.show();
    }
  }
  
  loadUsersAndGroups() {    
    this.http.get<any[]>('/users').subscribe((users) => {
      this.allUsers = users;
    });
  
    this.http.get<{ id: number; name: string }[]>('/groups').subscribe((groups) => {
      this.groups = groups;
    });
  }  

  addUserToGroup() {
    if (this.selectedGroup && this.selectedUserId) {
      console.log(`Adding user ${this.selectedUserId} to group ${this.selectedGroup}`);
      
      const selectedGroupId = this.groups.find(group => group.name === this.selectedGroup)?.id;
  
      if (selectedGroupId) {
        this.http.post(`/groups/${selectedGroupId}/add-user`, { userId: this.selectedUserId }).subscribe({
          next: (response: any) => {
            alert(response.message);
            this.selectedUserId = null;
            this.selectedGroup = null;
            if (this.modalInstance) {
              this.modalInstance.hide();
            };
          },
          error: (error) => {
            alert(error.error.error);
          }
        });
      } else {
        alert('Selected group ID not found.');
      }
    } else {
      alert('Please select a group and a user.');
    };
  };
  
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
      }
    } else {
      alert('Please enter a group name.');
    };
  };

  showCreateUserModal() {
    const modalElement = document.getElementById('createUserModal');
    if (modalElement) {
      this.modalInstance = new bootstrap.Modal(modalElement);
      this.modalInstance.show();
    };
  };

  createUser() {
    this.http.post<any>('/users', this.newUser).subscribe({
      next: (newUser) => {
        this.allUsers.push(newUser);
        this.newUser = { username: '', email: '', password: '', role: 'User', groups: [] };
        this.modalInstance.hide();
      },
      error: (error) => {
        alert(error.error.error);
      },
      complete: () => {
        console.log('User creation completed.');
      }
    });
  };
  

  cancel() {
    if (this.modalInstance) {
      this.modalInstance.hide();
    };
  };

  logout() {
    sessionStorage.removeItem('user');
    this.router.navigate(['/login']);
  };

  sendMessage() {
    if (this.newMessage.trim()) {
      this.messages.push(`${this.user.username}: ${this.newMessage}`);
      this.newMessage = '';
    };
  };



  deleteUser(userId: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.http.delete(`/users/${userId}`).subscribe(() => {
        this.allUsers = this.allUsers.filter(user => user.id !== userId);
      }, error => {
        alert(error.error.error);
      });
    };
  };
};