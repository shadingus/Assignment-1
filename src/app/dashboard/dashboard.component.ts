import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { LocalStorageService } from '../services/local-storage.service';
import { DashboardService } from '../services/dashboard.service';
import { LoginService } from '../services/login.service';
import { ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { Message, Channel, Group, User, ChatMessageData } from '../interfaces/interfaces';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})

export class DashboardComponent implements OnInit, OnDestroy {
  user: User = {} as User;
  messages: Message[] = [];
  chatInput: string = '';

  selectedGroup: Group | null = null;
  selectedGroupId: number | null = null;
  selectedChannel: Channel | null = null;
  userGroupNames: string[] = [];

  newGroupName: string = '';
  newChannelName: string = '';

  groups: Group[] = [];
  allUsers: any[] = [];
  banReports: any[] = [];

  selectedUser: User | null = null;
  selectedUserId: number | null = null;
  selectedRole: string | null = null;

  private modalInstance: any;
  private chatMessageSubscription: Subscription | undefined;
  private socket: Socket | undefined;

  constructor(
    private router: Router,
    private http: HttpClient,
    private localStorageService: LocalStorageService,
    private dashboard: DashboardService,
    private login: LoginService,
    private changeDetector: ChangeDetectorRef,

  ) {
    this.socket = this.login.getSocket();
  }

  ngOnInit(): void {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user && user.username) {
        //const socket = this.login.getSocket();
        if (this.socket) {
          // Handle user data reception from server
          this.socket.on('userData', (data: any) => {
            this.user = data.user;
            this.groups = data.groups;
            console.log("User Data Received:", data);
            this.userGroupNames = this.groups.map(group => group.name);
            this.loadUsersAndGroups();
            this.loadBanReports();
          });
          // Listen for the userJoined event
          this.socket.on('userJoined', (data: any) => {
            console.log(`User ${data.userId} joined channel ${data.channelId}`);
          });
        } else {
          console.error('Socket initialization failed');
        };
      } else {
        console.error('User data missing');
      };
    };
  };

  private onMessageReceived(messageData: ChatMessageData): void {
    if (this.selectedChannel && this.selectedChannel.id === messageData.channelId) {
      this.selectedChannel.messages.push(messageData.message); // Append the real-time message to the current channel
      this.changeDetector.detectChanges();  // Ensure UI reflects the change
    } else {
      console.warn('Received message for a different channel');
    };
  };

  private loadUsersAndGroups(): void {
    this.dashboard.loadUsersAndGroups().subscribe({
      next: (data) => {
        this.allUsers = data.users;
        this.groups = this.filterGroupsBasedOnUserRole(data.groups);
      },
      error: (error) => {
        console.error('Error loading users and groups:', error);
      },
    });
  };

  selectChannel(channel: Channel): void {
    if (!this.socket) {
      console.error('Socket not initialised yet.');
      return;
    };
    if (this.chatMessageSubscription) {
      this.chatMessageSubscription.unsubscribe();
    };
    // Leave the current channel room before joining the new one
    if (this.selectedChannel) {
      this.dashboard.leaveChannel(this.selectedChannel.id);
    };
    this.selectedChannel = channel;
    // Check if selectedGroupId is not null or undefined
    if (this.selectedGroupId !== null && this.selectedGroupId !== undefined) {
      // Join the new channel room
      this.dashboard.joinChannel(this.selectedChannel.id);
      // Load previous messages
      this.dashboard.loadMessages(this.selectedGroupId, channel.id).subscribe(messages => {
        this.messages = messages;
      });
      // Subscribe to new messages
      this.chatMessageSubscription = this.dashboard.getMessages().subscribe((messageData: ChatMessageData) => {
        if (this.selectedGroupId === messageData.groupId && this.selectedChannel?.id === messageData.channelId) {
          this.onMessageReceived(messageData);
        };
      });
    } else {
      console.error('selectedGroupId is null or undefined');
    };
  }

  sendMessageToChannel(): void {
    if (this.selectedChannel && this.user.username && this.chatInput.trim()) {
      const messageData: ChatMessageData = {
        groupId: this.selectedGroupId!,
        channelId: this.selectedChannel.id,
        message: {
          username: this.user.username,
          message: this.chatInput.trim(),
        },
      };
      this.dashboard.sendMessageToChannel(messageData);
      this.chatInput = '';
    } else {
      console.error('Selected channel or message input is not valid.');
    }
  }

  private filterGroupsBasedOnUserRole(groups: Group[]): Group[] {
    const userId = this.user.id;
    if (this.user.role === 'Super Admin') {
      return groups;
    } else if (this.user.role === 'Group Admin' && userId) {
      return groups.filter(group => group.creatorId === userId || group.members.includes(userId));
    } else if (userId) {
      return groups.filter(group => group.members.includes(userId));
    };
    return [];
  };

  selectGroup(groupName: string | null): void {
    if (!groupName) return this.clearSelections();
    const group = this.groups.find(g => g.name === groupName);
    if (group) {
      this.selectedGroup = group;
      this.selectedGroupId = group.id;
      this.selectedChannel = null;  // Ensure no channel is selected
      this.messages = [];  // Clear any previous messages
      this.dashboard.joinGroup(this.selectedGroupId);  // Join the group namespace
    } else {
      this.clearSelections();
    }
  }


  private clearSelections(): void {
    this.selectedGroup = this.selectedChannel = null;
    this.selectedGroupId = null;
  };

  addUserToGroup() {
    if (!this.selectedGroupId || !this.selectedUserId) {
      alert('Please select a user and a group.');
      return;
    };
    const data = {
      userId: Number(this.selectedUserId),
      groupId: Number(this.selectedGroupId),
      creatorId: Number(this.selectedGroup?.creatorId),
      currentUserRole: this.user.role
    };
    this.dashboard.addUserToGroup(data).subscribe({
      next: (response: any) => {
        console.log('User added to group:', response);
        this.loadUsersAndGroups(); // Refresh the list of users and groups
        this.hideModal();
      },
      error: (error) => this.handleHttpError(error),
    });
  };

  createGroup() {
    const trimmedGroupName = this.newGroupName.trim();
    const userId = this.user.id;
    if (trimmedGroupName && userId) {
      const newGroup: Partial<Group> = {
        name: trimmedGroupName,
        channels: [{ id: 1, name: 'general', messages: [] }],
        members: [userId],
        creatorId: userId,
      };
      this.dashboard.createGroup(newGroup).subscribe({
        next: (response: any) => {
          this.groups.push(response.group);
          this.user.groups.push(response.group.id);
          this.mapUserGroupsToNames();
          this.newGroupName = '';
          this.hideModal();
          this.loadUsersAndGroups();
        },
        error: (error) => console.error('Error creating group:', error),
      });
    } else {
      alert('Please enter a group name and ensure you are logged in.');
    };
  };

  deleteGroup(): void {
    if (confirm('Are you sure you want to delete this group?')) {
      this.dashboard.deleteGroup(this.selectedGroupId!, this.user.id!, this.user.role).subscribe({
        next: () => {
          console.log('Group deleted successfully');
          this.loadUsersAndGroups(); // Refresh groups after deletion
          this.clearSelections(); // Clear selection after deletion
        },
        error: (error) => {
          console.error('Error deleting group:', error);
        },
      });
    };
  };

  createChannel() {
    if (!this.selectedGroupId || !this.newChannelName.trim()) {
      alert('Please enter a channel name.');
      return;
    }
    const channelData = {
      name: this.newChannelName.trim(),
      userId: this.user.id,
      userRole: this.user.role,
      messages: []
    };

    this.dashboard.createChannel(this.selectedGroupId, channelData).subscribe({
      next: (response: any) => {
        console.log('Channel created:', response);
        this.selectedGroup?.channels.push(response.channel);
        this.newChannelName = '';
        this.hideModal();
      },
      error: (error) => console.error('Error creating channel:', error),
    });
  };

  deleteChannel(channelId: number): void {
    if (confirm('Are you sure you want to delete this channel?')) {
      this.dashboard.deleteChannel(this.selectedGroupId!, channelId, this.user.id!, this.user.role).subscribe({
        next: () => {
          console.log('Channel deleted successfully');
          this.loadUsersAndGroups(); // Refresh groups and channels after deletion
          this.selectGroup(this.selectedGroup?.name || null); // Reselect current group after deletion
        },
        error: (error) => {
          console.error('Error deleting channel:', error);
        },
      });
    };
  };

  showModal(modalId: string) {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      this.modalInstance = new bootstrap.Modal(modalElement);
      this.modalInstance.show();
    };
  };

  hideModal() {
    if (this.modalInstance) {
      this.modalInstance.hide();
    };
  };

  showAddUserToGroupModal() {
    this.loadUsersAndGroups();
    this.showModal('addUserToGroupModal');
  };

  openPromoteModal(user: any) {
    if (user) {
      this.selectedUser = user;
      this.selectedRole = user.role; // Default to the current role
      this.showModal('promoteUserModal');
    } else {
      alert("Error: No user selected for promotion.");
    };
  };

  promoteUser() {
    if (this.selectedUser && this.selectedRole) {
      this.http.post(`/api/users/${this.selectedUser.id}/role`, {
        newRole: this.selectedRole,
        currentUserRole: this.user.role,
      }).subscribe({
        next: (response: any) => {
          console.log('User role updated:', response);
          this.loadUsersAndGroups();
          this.hideModal();
        },
        error: (error) => {
          console.error('Error updating user role:', error);
        },
      });
    } else {
      alert("Error: No user or role selected for promotion.");
    };
  };

  showCreateChannelModal() {
    this.showModal('createChannelModal');
  };

  deleteUser(userId: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.dashboard.deleteUser(userId).subscribe({
        next: (response: any) => {
          console.log('User deleted:', response);
          this.loadUsersAndGroups();
        },
        error: (error) => console.error('Error deleting user:', error),
      });
    };
  };

  private mapUserGroupsToNames(): void {
    if (this.user.groups && this.user.groups.length > 0) {
      this.userGroupNames = this.user.groups.map((groupId: number) => this.getGroupById(groupId));
    };
  };

  private getGroupById(groupId: number): string {
    return this.groups.find(g => g.id === groupId)?.name || 'Unknown group';
  };

  private handleHttpError(error: any): void {
    console.error('HTTP Error:', error);
    alert(error.status === 403 ? 'You do not have access to this resource.' : 'An error occurred. Please try again later.');
  };

  banUser(userId: number, groupId: number, channelId?: number): void {
    if (groupId && this.user.id && this.user.role) {
      const banData = {
        userId: userId,
        groupId: groupId,
        channelId: channelId ?? undefined,
        currentUserId: this.user.id!,
        currentUserRole: this.user.role,
      };

      this.dashboard.banUser(banData).subscribe({
        next: () => {
          console.log('User banned successfully');
          this.loadUsersAndGroups();
        },
        error: (error) => console.error('Error banning user:', error),
      });
    };
  };

  loadBanReports() {
    if (this.user.role === 'Super Admin' && this.user.id) {
      const params = { adminId: this.user.id.toString() };
      this.http.get<any[]>('/api/ban/banReports', { params }).subscribe({
        next: (reports) => this.banReports = reports,
        error: (error) => console.error('Error fetching ban reports:', error)
      });
    }
  }

  getUsername(userId: number): string {
    const user = this.allUsers.find(u => u.id === userId);
    return user ? user.username : 'Unknown';
  };

  getGroupName(groupId: number): string {
    const group = this.groups.find(g => g.id === groupId);
    return group ? group.name : 'Unknown Group';
  };

  getChannelName(groupId: number, channelId: number): string {
    const group = this.groups.find(g => g.id === groupId);
    const channel = group?.channels.find(c => c.id === channelId);
    return channel ? channel.name : 'Unknown Channel';
  };

  logout(): void {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
      this.dashboard.logout(this.user.username);
      this.localStorageService.removeItem('user');
      this.router.navigate(['/login']);
    };
  };

  ngOnDestroy() {
    if (this.chatMessageSubscription) {
      this.chatMessageSubscription.unsubscribe();
    };
  };
};