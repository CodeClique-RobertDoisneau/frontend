import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

type Tab = 'profile' | 'security' | 'classes' | 'notifications' | 'data';

@Component({
  selector: 'app-settings',
  imports: [MatButtonModule, MatCardModule, MatIconModule, MatListModule],
  templateUrl: './settings.html',
})
export class Settings {
  activeTab = signal<Tab>('profile');
}
