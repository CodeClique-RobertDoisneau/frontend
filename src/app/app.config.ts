import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withXsrfConfiguration } from '@angular/common/http';

import { provideRouter, TitleStrategy, withComponentInputBinding } from '@angular/router';
import { AppTitleStrategy } from './app.title-strategy';

import { MAT_ICON_DEFAULT_OPTIONS } from "@angular/material/icon";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withXsrfConfiguration({ cookieName: 'csrftoken', headerName: 'X-CSRFToken' })),
    provideClientHydration(withEventReplay()),
    {provide: TitleStrategy, useClass: AppTitleStrategy},
    {provide: MAT_ICON_DEFAULT_OPTIONS, useValue: {fontSet: 'material-symbols-outlined'}}
  ]
};
