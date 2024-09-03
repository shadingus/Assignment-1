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

  constructor(private router: Router, private http: HttpClient) { }

  ngOnInit() {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
      console.log('User role:', this.user.role);  // Log user role for debugging
      this.user.groups = this.user.groups || [];
    } else {
      console.log('No user is logged in!');
      return; // Stop further execution if no user is logged in
    }
    this.loadUsersAndGroups();
  }

  selectGroup(groupName: string | null) {
    if (groupName) {
      const group = this.groups.find(g => g.name === groupName);
      if (group) {
        this.selectedGroup = groupName;
        console.log(`Group selected: ${groupName} (ID: ${group.id})`);
        // Use the group ID to load messages from the backend
        this.http.get<any[]>(`/groups/${group.id}/messages`).subscribe({
          next: (messages) => {
            // Transform the array of message objects into strings for display
            this.messages = messages.map(msg => `${msg.username}: ${msg.message}`);
          },
          error: (error) => {
            console.error('Error loading messages:', error);
          }
        });
      } else {
        console.error('Group not found!');
        this.messages = [];
      }
    } else {
      this.selectedGroup = null;
      this.messages = [];
    };
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
    // Load groups for all roles
    this.http.get<{ id: number; name: string }[]>('/groups').subscribe((groups) => {
      if (this.user.role === 'User') {
        this.groups = groups.filter(group => this.user.groups.includes(group.name));
      } else {
        this.groups = groups;
      }
    });

    // Load users only for Super Admin or Group Admin
    if (this.user.role === 'Super Admin' || this.user.role === 'Group Admin') {
      this.http.get<any[]>('/users').subscribe((users) => {
        this.allUsers = users;
      });
    }
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
    if (this.newMessage.trim() && this.selectedGroup) {
      const group = this.groups.find(g => g.name === this.selectedGroup);

      if (group) {
        const messageData = {
          username: this.user.username,
          message: this.newMessage
        };

        // Use the group ID to send the message to the backend
        this.http.post(`/groups/${group.id}/messages`, messageData).subscribe({
          next: (response: any) => {
            const messageString = `${response.newMessage.username}: ${response.newMessage.message}`;
            this.messages.push(messageString);
            this.newMessage = ''; // Clear the input field
          },
          error: (error) => {
            console.error('Error sending message:', error);
          }
        });
      } else {
        console.error('Group not found!');
      };
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