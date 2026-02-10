import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import {provideRouter, TitleStrategy} from '@angular/router';
import {AppTitleStrategy} from './app.title-strategy';

import { MAT_ICON_DEFAULT_OPTIONS } from "@angular/material/icon";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    {provide: TitleStrategy, useClass: AppTitleStrategy},
    {provide: MAT_ICON_DEFAULT_OPTIONS, useValue: {fontSet: 'material-symbols-outlined'}}
  ]
};
