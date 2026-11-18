import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { MainContentComponent } from '../../components/main-content/main-content.component';
import { ChatComponent } from '../../components/chat/chat.component';
import { MmmsContextSelectorComponent } from '../../../mmms/components/mmms-context-selector/mmms-context-selector.component';

@Component({
  selector: 'app-main-layout',
  imports: [
    SidebarComponent,
    RouterModule,
    CommonModule,
    HeaderComponent,
    MainContentComponent,
    ChatComponent,
    MmmsContextSelectorComponent,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  readonly isSidebarExpanded = signal(false);
  readonly isSidebarHovered = signal(false);
  readonly isMobileSidebarOpen = signal(false);
  readonly isChatEnabled = signal(false);
  readonly isMmmsRoute = signal(false);
  private routeSubscription?: Subscription;

  get shouldExpandSidebar(): boolean {
    return this.isSidebarExpanded() || this.isSidebarHovered();
  }

  raindrops: { left: string; delay: string }[] = [];
  readonly thunderActive = signal(false);
  readonly showSun = signal(false);
  // Placeholder for future live weather state
  weather: 'rain' | 'sunny' | 'cloudy' = 'rain';
  readonly sunLeft = signal('50vw'); // Default center
  manVisible = false;
  manGesture: 'wave' | 'point' | 'idle' = 'idle';
  manLeft = 24;
  readonly jerryVisible = signal(false);
  readonly jerryGesture = signal<'wave' | 'point' | 'idle'>('idle');
  readonly jerryLeft = signal(24);

  constructor(private router: Router) {
    // Generate 60 random raindrops with random horizontal positions and animation delays
    // for (let i = 0; i < 60; i++) {
    //   this.raindrops.push({
    //     left: `${Math.random() * 100}vw`,
    //     delay: `${Math.random() * 1.2}s`,
    //   });
    // }
    // this.fetchWeather();
    // this.startJerryAssistant();
  }

  ngOnInit(): void {
    this.updateChatVisibility(this.router.url);
    this.updateMmmsVisibility(this.router.url);
    this.routeSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.updateChatVisibility(event.urlAfterRedirects));
    this.routeSubscription.add(
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe((event) => {
          this.updateMmmsVisibility(event.urlAfterRedirects);
          this.isMobileSidebarOpen.set(false);
        }),
    );
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  private updateChatVisibility(url: string): void {
    const path = url.split(/[?#]/, 1)[0].replace(/\/+$/, '');
    this.isChatEnabled.set(/^\/admin(?:v2)?\/(?:welcome|applications)$/.test(path));
  }

  private updateMmmsVisibility(url: string): void {
    this.isMmmsRoute.set(url.split(/[?#]/, 1)[0].startsWith('/mmms'));
  }

  toggleSidebar() {
    if (window.matchMedia('(max-width: 991.98px)').matches) {
      this.isMobileSidebarOpen.update((open) => !open);
      return;
    }
    this.isSidebarExpanded.update((expanded) => !expanded);
  }

  onSidebarMouseEnter(): void {
    if (window.matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine)').matches) {
      this.isSidebarHovered.set(true);
    }
  }

  onSidebarMouseLeave(): void {
    this.isSidebarHovered.set(false);
  }

  getRaindropStyle(i: number) {
    return {
      left: this.raindrops[i].left,
      animationDelay: this.raindrops[i].delay,
    };
  }

  startThunder() {
    setInterval(
      () => {
        // Randomly trigger thunder every 3-8 seconds
        if (Math.random() > 0.7) {
          this.triggerThunder();
        }
      },
      1200 + Math.random() * 4000,
    );
  }

  triggerThunder() {
    this.thunderActive.set(true);
    setTimeout(
      () => {
        this.thunderActive.set(false);
      },
      120 + Math.random() * 180,
    ); // Flash duration 120-300ms
  }

  async fetchWeather() {
    // Al Hassan, Jordan coordinates (approx): 32.5514° N, 35.8515° E
    const lat = 32.5514;
    const lon = 35.8515;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&timezone=auto`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      console.log('Weather API response:', data);

      // Open-Meteo weather codes: https://open-meteo.com/en/docs
      // 0: clear, 1/2/3: mainly clear/partly cloudy/overcast, 45/48: fog, 51-67: drizzle, 80-99: rain/snow/thunder
      const code = data.current.weather_code;
      const isDay = data.current.is_day;
      if (code === 0 && isDay) {
        this.weather = 'sunny';
        this.showSun.set(true);
      } else if ([1, 2, 3, 45, 48].includes(code)) {
        this.weather = 'cloudy';
        this.showSun.set(true);
      } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 99)) {
        this.weather = 'rain';
        this.showSun.set(false);
      } else {
        this.weather = 'cloudy';
        this.showSun.set(false);
      }

      // Sun position for day
      if (isDay && this.weather === 'sunny') {
        const hour = new Date().getHours();
        // Sunrise 6, sunset 18
        const percent = Math.min(Math.max((hour - 6) / 12, 0), 1);
        this.sunLeft.set(`${5 + percent * 90}vw`);
      }
    } catch (e) {
      // fallback to local time logic if fetch fails
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 18) {
        this.weather = 'sunny';
        this.showSun.set(true);
        const percent = (hour - 6) / 12;
        this.sunLeft.set(`${5 + percent * 90}vw`);
      }
    }
  }

  startJerryAssistant() {
    this.showJerry();
  }

  showJerry() {
    // Randomize gesture and horizontal position (within 24px to 120px from left)
    const gestures: ('wave' | 'point' | 'idle')[] = ['wave', 'point', 'idle'];
    this.jerryGesture.set(gestures[Math.floor(Math.random() * gestures.length)]);
    this.jerryLeft.set(24 + Math.floor(Math.random() * 96));
    this.jerryVisible.set(true);
    setTimeout(
      () => {
        this.jerryVisible.set(false);
        setTimeout(() => this.showJerry(), 10000 + Math.random() * 1000); // Show again after 10-20s
      },
      4000 + Math.random() * 2000,
    ); // Visible for 4-6s
  }
}
