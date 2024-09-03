import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

interface Channel {
  id: number;
  name: string;
  messages: { username: string; message: string }[];
}

interface Group {
  id: number;
  name: string;
  channels: Channel[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})

export class DashboardComponent implements OnInit {
  user: any = {};
  selectedGroup: Group | null = null;
  selectedChannel: Channel | null = null;
  newMessage: string = '';
  messages: string[] = [];
  newGroupName: string = '';
  newChannelName: string = '';
  groups: Group[] = [];
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
      this.user.groups = this.user.groups || [];
    } else {
      console.log('No user is logged in!');
      return;
    };
    this.loadUsersAndGroups();
  };

  loadUsersAndGroups() {
    this.http.get<{ id: number; name: string, channels: any[] }[]>('/groups').subscribe((groups) => {
      if (this.user.role === 'User') {
        this.groups = groups.filter(group => this.user.groups.includes(group.name));
      } else {
        this.groups = groups;
      };
    });

    if (this.user.role === 'Super Admin' || this.user.role === 'Group Admin') {
      this.http.get<any[]>('/users').subscribe((users) => {
        this.allUsers = users;
      });
    };
  };

  selectGroup(groupName: string | null) {
    if (groupName) {
      const group = this.groups.find(g => g.name === groupName);
      if (group) {
        this.selectedGroup = group;
        this.selectChannel(group.channels[0]); // Select the first channel by default
      } else {
        this.selectedGroup = null;
        this.selectedChannel = null;
        this.messages = [];
      }
    } else {
      this.selectedGroup = null;
      this.selectedChannel = null;
      this.messages = [];
    };
  };

  selectChannel(channel: any) {
    if (channel) {
      this.selectedChannel = channel;
      this.loadMessages(channel);
    };
  };

  loadMessages(channel: any) {
    this.messages = channel.messages.map((msg: any) => `${msg.username}: ${msg.message}`);
  };

  addUserToGroup() {
    if (this.selectedGroup && this.selectedUserId) {
      const selectedGroupId = this.selectedGroup.id;
      this.http.post(`/groups/${selectedGroupId}/add-user`, { userId: this.selectedUserId }).subscribe({
        next: (response: any) => {
          alert(response.message);
          this.selectedUserId = null;
          if (this.modalInstance) {
            this.modalInstance.hide();
          }
        },
        error: (error) => {
          alert(error.error.error);
        }
      });
    } else {
      alert('Please select a group and a user.');
    };
  };

  createGroup() {
    const trimmedGroupName = this.newGroupName.trim();

    if (trimmedGroupName) {
      const newGroup: Group = {
        id: this.groups.length + 1,
        name: trimmedGroupName,
        channels: []  // Initialize an empty channels array
      };

      this.groups.push(newGroup); // Now, the newGroup object matches the Group interface
      this.newGroupName = '';
    } else {
      alert('Please enter a group name.');
    };
  };

  createChannel() {
    if (!this.selectedGroup || !this.newChannelName.trim()) {
      alert('Please enter a channel name.');
      return;
    }

    const groupId = this.selectedGroup.id;

    const channelData = { name: this.newChannelName.trim() };

    this.http.post(`/groups/${groupId}/channels`, channelData).subscribe({
      next: (response: any) => {
        // Assuming the response contains the newly created channel
        this.selectedGroup?.channels.push(response.newChannel);
        this.newChannelName = ''; // Clear the input field
        this.modalInstance.hide(); // Close the modal
      },
      error: (error) => {
        console.error('Error creating channel:', error);
        alert('There was an error creating the channel. Please try again.');
      }
    });
  }


  createUser() {
    this.http.post<any>('/users', this.newUser).subscribe({
      next: (newUser) => {
        this.allUsers.push(newUser);
        this.newUser = { username: '', email: '', password: '', role: 'User', groups: [] };
        this.modalInstance.hide();
      },
      error: (error) => {
        alert(error.error.error);
      }
    });
  };

  showModal() {
    const modalElement = document.getElementById('newGroupModal');
    if (modalElement) {
      this.modalInstance = new bootstrap.Modal(modalElement);
      this.modalInstance.show();
    };
  };

  showAddUserToGroupModal() {
    this.loadUsersAndGroups();
    const modalElement = document.getElementById('addUserToGroupModal');
    if (modalElement) {
      this.modalInstance = new bootstrap.Modal(modalElement);
      this.modalInstance.show();
    };
  };

  showCreateChannelModal() {
    const modalElement = document.getElementById('createChannelModal');
    if (modalElement) {
      this.modalInstance = new bootstrap.Modal(modalElement);
      this.modalInstance.show();
    };
  };

  showCreateUserModal() {
    const modalElement = document.getElementById('createUserModal');
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

  logout() {
    sessionStorage.removeItem('user');
    this.router.navigate(['/login']);
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