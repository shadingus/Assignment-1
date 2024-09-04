import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { LocalStorageService } from '../services/local-storage.service';

interface Channel {
  id: number;
  name: string;
  messages: { username: string; message: string }[];
};

interface Group {
  id: number;
  name: string;
  channels: Channel[];
};

interface User {
  id?: number;
  username: string;
  email: string;
  password: string;
  role: string;
  groups: string[];
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})

export class DashboardComponent implements OnInit {
  user: any = {};
  messages: string[] = [];
  selectedGroup: Group | null = null;
  selectedChannel: Channel | null = null;
  newGroupName: string = '';
  newChannelName: string = '';
  groups: Group[] = [];
  allUsers: any[] = [];
  selectedUserId: number | null = null;
  selectedUser: any = null;
  selectedRole: string | null = null;

  newUser: User = {
    id: 0,
    username: '',
    email: '',
    password: '',
    role: 'User', // Default role
    groups: []
  };

  private modalInstance: any;

  constructor(private router: Router, private http: HttpClient, private localStorageService: LocalStorageService) { }

  ngOnInit() {
    // Check if users and groups already exist in local storage
    if (!this.localStorageService.getItem('users') || !this.localStorageService.getItem('groups')) {
      this.initializeDefaultData();
    };
    // Load user from session storage
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
      this.user.groups = this.user.groups || [];
    } else {
      return;
    };
    this.loadUsersAndGroups();
  };

  initializeDefaultData() {
    const defaultUsers = [
      {
        id: 1,
        username: 'super',
        email: 'super@admin.com',
        password: '123',
        role: 'Super Admin',
        groups: ['Admin Chat']
      }
    ];

    const defaultGroups = [
      {
        id: 1,
        name: 'Admin Chat',
        channels: [
          {
            id: 1,
            name: 'General',
            messages: [
              { username: 'super', message: 'Welcome to Admin Chat!' }
            ]
          }
        ]
      }
    ];
    // Save the default users and groups into local storage
    this.localStorageService.setItem('users', defaultUsers);
    this.localStorageService.setItem('groups', defaultGroups);
  };

  loadUsersAndGroups() {
    const groups = this.localStorageService.getItem('groups') || [];
    if (this.user.role === 'User' || this.user.role === 'Group Admin') {
      this.groups = groups.filter((group: { name: any }) => this.user.groups.includes(group.name));
    }
    else if (this.user.role === 'Super Admin') {
      this.groups = groups;
    }
    if (this.user.role === 'Super Admin') {
      this.allUsers = this.localStorageService.getItem('users') || [];
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
      };
    } else {
      this.selectedGroup = null;
      this.selectedChannel = null;
    };
  };

  selectChannel(channel: Channel) {
    if (channel) {
      this.selectedChannel = channel;
      this.loadMessages(channel);
    };
  };

  loadMessages(channel: Channel) {
    this.messages = channel.messages.map((msg: any) => `${msg.username}: ${msg.message}`);
  };

  addUserToGroup() {
    if (this.selectedGroup && this.selectedUserId) {
      const selectedGroupId = this.selectedGroup.id;
      // Retrieve groups from local storage
      let groups = this.localStorageService.getItem('groups') || [];
      if (typeof groups === 'string') {
        groups = JSON.parse(groups);
      }
      // Find the selected group
      const group = groups.find((g: any) => g.id === selectedGroupId);
      if (group) {

        // Retrieve users from local storage
        let users = this.localStorageService.getItem('users') || [];
        if (typeof users === 'string') {
          users = JSON.parse(users);
        };
        // Find the user by ID
        const user = users.find((u: any) => u.id === Number(this.selectedUserId));
        if (user) {
          if (!user.groups.includes(group.name)) {
            user.groups.push(group.name);
            this.localStorageService.setItem('users', users);
            alert(`User ${user.username} added to group ${group.name}`);
            this.selectedUserId = null;
            if (this.modalInstance) {
              this.modalInstance.hide();
            }
          } else {
            alert('User is already in this group.');
          };
        } else {
          alert('User not found.');
        };
      } else {
        alert('Group not found.');
      };
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
        channels: [] // Initialize an empty channels array
      };
      this.groups.push(newGroup);
      this.localStorageService.setItem('groups', this.groups); // Save to localStorage
      this.newGroupName = '';
      this.modalInstance.hide();
    } else {
      alert('Please enter a group name.');
    };
  };

  createChannel() {
    if (!this.selectedGroup || !this.newChannelName.trim()) {
      alert('Please enter a channel name.');
      return;
    };
    const channelData = {
      id: this.selectedGroup.channels.length + 1,
      name: this.newChannelName.trim(),
      messages: []
    };
    this.selectedGroup.channels.push(channelData);
    const groups = this.localStorageService.getItem('groups') || [];
    const groupIndex = groups.findIndex((g: any) => g.id === this.selectedGroup?.id);
    if (groupIndex > -1) {
      groups[groupIndex] = this.selectedGroup;
      this.localStorageService.setItem('groups', groups);
    };
    this.newChannelName = '';
    this.modalInstance.hide();
  };

  createUser() {
    const users = this.localStorageService.getItem('users') || [];
    const newUser = { ...this.newUser, id: users.length + 1 };
    users.push(newUser);
    this.localStorageService.setItem('users', users);
    this.allUsers.push(newUser);

    this.http.post('/register', newUser).subscribe({
      next: response => {
        console.log('User registered on backend:', response);
      },
      error: error => {
        console.error('Error registering user on backend:', error)
      }
    })
    this.newUser = { id: 0, username: '', email: '', password: '', role: 'User', groups: [] };
    this.modalInstance.hide();
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

  openPromoteModal(user: any) {
    if (user) {
      this.selectedUser = user;
      this.selectedRole = user.role; // Default to the current role
  
      const modalElement = document.getElementById('promoteUserModal');
      if (modalElement) {
        this.modalInstance = new bootstrap.Modal(modalElement);
        this.modalInstance.show();
      };
    } else {
      alert("Error: No user selected for promotion.");
    };
  };

  promoteUser() {
    if (this.selectedUser && this.selectedRole) {
      this.selectedUser.role = this.selectedRole;
      // Here, update the user role in your local storage or backend
      const users = this.localStorageService.getItem('users') || [];
      const updatedUsers = users.map((usr: any) => usr.id === this.selectedUser.id ? this.selectedUser : usr);
      this.localStorageService.setItem('users', updatedUsers);
      
      // Optionally hide the modal
      const modalElement = document.getElementById('promoteUserModal');
      if (modalElement) {
        this.modalInstance.hide();
      }
    } else {
      alert("Error: No user or role selected for promotion.");
    }
  }
  

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
    this.localStorageService.removeItem('user');
    this.router.navigate(['/login']);
  };

  deleteUser(userId: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      let users = this.localStorageService.getItem('users') || [];
      users = users.filter((user: any) => user.id !== userId);
      this.localStorageService.setItem('users', users); // Save the updated users list
      this.allUsers = users; // Update local list of users
    };
  };
};