import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';

import {provideRouter, TitleStrategy, withComponentInputBinding} from '@angular/router';
import {AppTitleStrategy} from './app.title-strategy';

import { MAT_ICON_DEFAULT_OPTIONS } from "@angular/material/icon";
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    provideClientHydration(withEventReplay()),
    {provide: TitleStrategy, useClass: AppTitleStrategy},
    {provide: MAT_ICON_DEFAULT_OPTIONS, useValue: {fontSet: 'material-symbols-outlined'}}, provideCharts(withDefaultRegisterables())
  ]
};
