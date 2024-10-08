import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { LocalStorageService } from '../services/local-storage.service';
import { DashboardService } from '../services/dashboard.service';
import { LoginService } from '../services/login.service';
import { ChangeDetectorRef } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import {
  Message,
  Channel,
  Group,
  User,
  ChatMessageData,
} from '../interfaces/interfaces';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  user: User = {} as User;
  messages: Message[] = [];
  chatInput: string = '';

  selectedGroup: Group | null = null;
  selectedGroupId: string | null = null;
  selectedChannel: Channel | null = null;
  userGroupNames: string[] = [];

  newGroupName: string = '';
  newChannelName: string = '';

  groups: Group[] = [];
  allUsers: any[] = [];
  banReports: any[] = [];

  selectedUser: User | null = null;
  selectedUsername: string | null = null;
  selectedUserId: number | null = null;
  selectedRole: string | null = null;

  private modalInstance: any;
  private chatMessageSubscription: Subscription | undefined;
  private socket: Socket | undefined;
  private pollingInterval: any;

  constructor(
    private router: Router,
    private http: HttpClient,
    private localStorageService: LocalStorageService,
    private dashboard: DashboardService,
    private login: LoginService,
    private changeDetector: ChangeDetectorRef
  ) {
    this.socket = this.login.getSocket();
  }

  ngOnInit(): void {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user && user.username) {
        if (this.socket) {
          // Handle user data reception from server
          this.socket.on('userData', (data: any) => {
            this.user = data.user;
            this.groups = data.groups;
            this.userGroupNames = this.groups.map((group) => group.name);
            this.loadUsersAndGroups();
          });
          // Listen for the userJoined event
          this.socket.on('userJoined', (data: any) => {
            console.log(`User ${data.userId} joined channel ${data.channelId}`);
          });
          this.startPolling();
        } else {
          console.error('Socket initialization failed');
        }
      } else {
        console.error('User data missing');
      }
    }
  }

  private startPolling(): void {
    this.pollingInterval = setInterval(() => {
      console.log('Polling for new changes...');
      this.changeDetector.detectChanges();
    }, 5000);
  };

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private onMessageReceived(messageData: ChatMessageData): void {
    if (
      this.selectedChannel &&
      this.selectedChannel.id[1] === messageData.channelId
    ) {
      this.selectedChannel.messages.push(messageData.message); // Append the real-time message to the current channel
      this.changeDetector.detectChanges(); // Ensure UI reflects the change
    } else {
      console.warn('Received message for a different channel');
    }
  }

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
  }

  selectChannel(channel: Channel): void {
    if (!this.socket) {
      console.error('Socket not initialized yet.');
      return;
    }
    // Check if the selected channel is the same as the currently connected channel
    if (this.selectedChannel && this.selectedChannel.id[1] === channel.id[1]) {
      alert('You are already connected to this channel.');
      return; // Exit early since the user is already connected to the channel
    }
    // Unsubscribe from the previous chat message subscription if it exists
    if (this.chatMessageSubscription) {
      this.chatMessageSubscription.unsubscribe();
    } else {
      console.warn('No active chat message subscription found.');
    }
    // Leave the current channel room before joining the new one
    if (this.selectedChannel) {
      this.dashboard.leaveChannel(this.selectedChannel.id[1]); // Leave the previous channel
    }
    this.selectedChannel = channel;
    // Check if selectedGroupId is not null or undefined
    if (this.selectedGroupId !== null && this.selectedGroupId !== undefined) {
      // Join the new channel room
      this.dashboard.joinChannel(this.selectedChannel.id[1]); // Join the new channel
      // Initialize the channel, which will load previous messages and subscribe to new ones
      this.chatMessageSubscription = this.dashboard
        .initialiseChannel(this.selectedChannel) // Use initialiseChannel
        .subscribe({
          next: (messageData: ChatMessageData) => {
            this.onMessageReceived(messageData); // Handle the received message
            // Check if the message belongs to the selected group and channel
            if (
              this.selectedGroupId === messageData.groupId &&
              this.selectedChannel?.id[1] === messageData.channelId
            ) {
              const username = messageData.message.username; // Extract the username
              const message = messageData.message.message; // Extract the message content
              this.messages.push({ username, message }); // Add the message to the chat
            }
          },
          error: (error) => {
            console.error('Error during channel initialization:', error);
          },
        });
    } else {
      console.error('selectedGroupId is null or undefined');
    }
  }

  sendMessageToChannel(): void {
    if (this.selectedChannel && this.user.username && this.chatInput.trim()) {
      const messageData: ChatMessageData = {
        groupId: this.selectedGroupId!, // Assuming this is a string
        channelId: this.selectedChannel.id[1], // Use the number part of the tuple
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
      return groups.filter(
        (group) => group.creatorId === userId || group.members.includes(userId)
      );
    } else if (userId) {
      return groups.filter((group) => group.members.includes(userId));
    }
    return [];
  }

  selectGroup(groupId: string | null): void {
    if (!groupId) return this.clearSelections();
    // Check if the user is already connected to the selected group
    if (this.selectedGroup && this.selectedGroup.id === groupId) {
      alert('You are already connected to this group.');
      return; // Exit early if already connected to the selected group
    }
    const group = this.groups.find((g) => g.id === groupId);
    if (group) {
      this.selectedGroup = group;
      this.selectedGroupId = group.id;
      this.selectedChannel = null; // Ensure no channel is selected
      this.messages = []; // Clear any previous messages
      this.dashboard.joinGroup(this.selectedGroupId); // Join the group namespace
    } else {
      this.clearSelections();
    }
  }

  private clearSelections(): void {
    this.selectedGroup = this.selectedChannel = null;
    this.selectedGroupId = null;
  }

  addUserToGroup() {
    if (!this.selectedGroupId || !this.selectedUserId) {
      alert('Please select a user and a group.');
      return;
    }
    const role = this.user.role; // Get the role from the current user
    // Call the service to add the user to the group
    this.dashboard
      .addUserToGroup(this.selectedGroupId, this.selectedUserId, role)
      .subscribe({
        next: (response: any) => {
          console.log('User added to group:', response);
          this.loadUsersAndGroups(); // Refresh the list of users and groups
          this.hideModal();
        },
        error: (error) => this.handleHttpError(error),
      });
  }

  createGroup() {
    const trimmedGroupName = this.newGroupName.trim();
    const formattedGroupName = trimmedGroupName
      .toLowerCase()
      .replace(/\s/g, '-');
    const userId = this.user.id;
    if (formattedGroupName && userId) {
      const newGroup: Partial<Group> = {
        id: formattedGroupName,
        name: trimmedGroupName,
        channels: [],
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
    }
  }

  deleteGroup(): void {
    if (confirm('Are you sure you want to delete this group?')) {
      this.dashboard
        .deleteGroup(this.selectedGroupId!, this.user.id!, this.user.role)
        .subscribe({
          next: () => {
            console.log('Group deleted successfully');
            this.loadUsersAndGroups(); // Refresh groups after deletion
            this.clearSelections(); // Clear selection after deletion
          },
          error: (error) => {
            console.error('Error deleting group:', error);
          },
        });
    }
  }

  createChannel() {
    if (!this.selectedGroupId || !this.newChannelName.trim()) {
      alert('Please enter a channel name.');
      return;
    }
    if (this.user.id === undefined) {
      console.error('Error: User ID is undefined.');
      return; // Early exit if user ID is undefined
    }
    // Generate the channel ID tuple: [groupName, channelNumber]
    const existingChannelsCount = this.selectedGroup?.channels.length || 0;
    const channelId: [string, number] = [
      this.selectedGroupId,
      existingChannelsCount + 1,
    ]; // Create the tuple
    // Prepare the channel data
    const channelData = {
      id: channelId, // The generated tuple ID
      name: this.newChannelName.trim(),
      messages: [],
    };
    const userData = {
      userId: this.user.id,
      userRole: this.user.role,
    };
    // Call the service to create the channel
    this.dashboard.createChannel(channelData, userData).subscribe({
      next: (response: any) => {
        console.log('Channel created:', response);
        this.selectedGroup?.channels.push(response.channel);
        this.newChannelName = ''; // Reset the input
        this.hideModal(); // Hide the modal after creation
      },
      error: (error) => console.error('Error creating channel:', error),
    });
  }

  deleteChannel(channel: Channel): void {
    if (confirm('Are you sure you want to delete this channel?')) {
      // Ensure user ID exists before proceeding
      if (this.user.id === undefined) {
        console.error('Error: User ID is undefined.');
        return; // Early exit if user ID is undefined
      }
      const channelData = {
        id: channel.id, // [groupName, channelNumber] tuple
        name: channel.name, // Channel name
        messages: channel.messages, // Include messages
      };
      console.log('Channel data:', channelData);
      const userData = {
        userId: this.user.id, // Since we've checked, userId is guaranteed to be a number
        userRole: this.user.role, // Current user role
      };
      console.log('User data:', userData);
      // Call the service to delete the channel
      this.dashboard.deleteChannel(channelData, userData).subscribe({
        next: () => {
          console.log('Channel deleted successfully');
          this.loadUsersAndGroups(); // Refresh the groups and channels after deletion
          this.selectGroup(this.selectedGroup?.name || null); // Reselect the current group
        },
        error: (error) => {
          console.error('Error deleting channel:', error);
        },
      });
    }
  }

  showModal(modalId: string) {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      this.modalInstance = new bootstrap.Modal(modalElement);
      this.modalInstance.show();
    }
  }

  hideModal() {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
  }

  showAddUserToGroupModal() {
    this.loadUsersAndGroups();
    this.showModal('addUserToGroupModal');
  }

  openPromoteModal(user: any) {
    if (user) {
      this.selectedUser = user;
      this.selectedRole = user.role; // Default to the current role
      this.showModal('promoteUserModal');
    } else {
      alert('Error: No user selected for promotion.');
    }
  }

  promoteUser() {
    if (this.selectedUser && this.selectedRole) {
      this.http
        .post(`/api/users/${this.selectedUser.id}/role`, {
          newRole: this.selectedRole,
          currentUserRole: this.user.role,
        })
        .subscribe({
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
      alert('Error: No user or role selected for promotion.');
    }
  }

  showCreateChannelModal() {
    this.showModal('createChannelModal');
  }

  deleteUser(userId: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.dashboard.deleteUser(userId).subscribe({
        next: (response: any) => {
          console.log('User deleted:', response);
          this.loadUsersAndGroups();
        },
        error: (error) => console.error('Error deleting user:', error),
      });
    }
  }

  private mapUserGroupsToNames(): void {
    if (this.user.groups && this.user.groups.length > 0) {
      this.userGroupNames = this.user.groups.map((groupId: string) =>
        this.getGroupById(groupId)
      );
    }
  }

  private getGroupById(groupId: string): string {
    return this.groups.find((g) => g.id === groupId)?.name || 'Unknown group';
  }

  private handleHttpError(error: any): void {
    console.error('HTTP Error:', error);
    alert(
      error.status === 403
        ? 'You do not have access to this resource.'
        : 'An error occurred. Please try again later.'
    );
  }

  getUsername(userId: number): string {
    const user = this.allUsers.find((u) => u.id === userId);
    return user ? user.username : 'Unknown';
  }

  getGroupName(groupId: string): string {
    const group = this.groups.find((g) => g.id === groupId);
    return group ? group.name : 'Unknown Group';
  }

  getChannelName(groupId: string, channelId: number): string {
    const group = this.groups.find((g) => g.id === groupId);
    const channel = group?.channels.find((c) => c.id[1] === channelId); // Compare the number part of the tuple
    return channel ? channel.name : 'Unknown Channel';
  }

  logout(): void {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
      this.dashboard.logout(this.user.username);
      this.localStorageService.removeItem('user');
      this.router.navigate(['/login']);
    }
  }

  ngOnDestroy() {
    if (this.chatMessageSubscription) {
      this.chatMessageSubscription.unsubscribe();
    }
    this.stopPolling();
  }
}
