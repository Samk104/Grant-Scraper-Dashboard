import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';


import { routes } from './app.routes';
import { API_BASE_URL } from './api-tokens';
import { accessCodeInterceptor } from './interceptors/access-code.interceptor';
import { firstValueFrom } from 'rxjs';

function initializeRuntimeConfig() {
  return provideAppInitializer(async () => {
    try {
      // you can use DI here; initializers run in an injection context
      const http = inject(HttpClient);
      const cfg = await firstValueFrom(http.get<{ apiBaseUrl?: string }>('/assets/config.json'));
      (window as any).__API_BASE_URL__ = cfg.apiBaseUrl ?? '';
    } catch {
      (window as any).__API_BASE_URL__ = '';
    }
  });
}


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([accessCodeInterceptor])),

    initializeRuntimeConfig(),

    { provide: API_BASE_URL, useFactory: () => (window as any).__API_BASE_URL__ ?? '' }
  ]
};
