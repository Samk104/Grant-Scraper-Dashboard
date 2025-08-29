import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';


import { routes } from './app.routes';
import { API_BASE_URL } from './api-tokens';
import { accessCodeInterceptor } from './interceptors/access-code.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
     provideHttpClient(withInterceptors([accessCodeInterceptor])),
    { provide: API_BASE_URL, useValue: 'http://localhost:8000' }
  ]
};
