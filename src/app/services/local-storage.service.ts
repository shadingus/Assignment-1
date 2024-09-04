import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  constructor() { };

  setItem(key: string, value: any): void {
    localStorage.setItem(key, JSON.stringify(value));
  };

  getItem(key: string): any {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  };

  removeItem(key: string): void {
    localStorage.removeItem(key);
  };

  clear(): void {
    localStorage.clear();
  };
};