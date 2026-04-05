import { registerLocaleData } from '@angular/common';
import {
  APP_INITIALIZER,
  createEnvironmentInjector,
  enableProdMode,
  EnvironmentInjector,
  ErrorHandler,
  importProvidersFrom,
  provideZonelessChangeDetection,
  SecurityContext,
} from '@angular/core';

import { IS_ELECTRON } from './app/app.constants';
import {
  DEFAULT_LANGUAGE,
  DEFAULT_LOCALE_DATA,
  LocaleImportFns,
} from './app/core/locale.constants';
import { androidInterface } from './app/features/android/android-interface';
import { IS_ANDROID_WEB_VIEW } from './app/util/is-android-web-view';
import { IS_NATIVE_PLATFORM } from './app/util/is-native-platform';
import { environment } from './environments/environment';
// Type definitions for window.ea are in ./app/core/window-ea.d.ts
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MatDateFormats,
  MATERIAL_ANIMATIONS,
  MatNativeDateModule,
} from '@angular/material/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatSidenavModule } from '@angular/material/sidenav';
import { bootstrapApplication, BrowserModule } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  PreloadAllModules,
  provideRouter,
  withHashLocation,
  withPreloading,
} from '@angular/router';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { MaterialCssVarsModule } from 'angular-material-css-vars';
import { MarkdownModule, MARKED_OPTIONS, SANITIZE } from 'ngx-markdown';
import { APP_ROUTES } from './app/app.routes';
import { DataInitService } from './app/core/data-init/data-init.service';
import { GlobalErrorHandler } from './app/core/error-handler/global-error-handler.class';
import { ReminderModule } from './app/features/reminder/reminder.module';
import { EncryptionPasswordDialogOpenerService } from './app/imex/sync/encryption-password-dialog-opener.service';
import { OperationCaptureService } from './app/op-log/capture/operation-capture.service';
import { FeatureStoresModule } from './app/root-store/feature-stores.module';
import { META_REDUCERS } from './app/root-store/meta/meta-reducer-registry';
import { setOperationCaptureService } from './app/root-store/meta/task-shared-meta-reducers';
import { FormlyConfigModule } from './app/ui/formly-config.module';
import { markedOptionsFactory } from './app/ui/marked-options-factory';
// StoreDevtoolsModule lazy-loaded only in dev mode below
import { CdkDropListGroup } from '@angular/cdk/drag-drop';
import { ReactiveFormsModule } from '@angular/forms';
import { ServiceWorkerModule } from '@angular/service-worker';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import {
  TRANSLATE_HTTP_LOADER_CONFIG,
  TranslateHttpLoader,
} from '@ngx-translate/http-loader';
import { AppComponent } from './app/app.component';
import { CustomDateAdapter } from './app/core/date-time-format/custom-date-adapter';
import { DateTimeFormatService } from './app/core/date-time-format/date-time-format.service';
import { Log } from './app/core/log';
import { GlobalConfigService } from './app/features/config/global-config.service';
import { initializeMatMenuTouchFix } from './app/features/tasks/task-context-menu/mat-menu-touch-monkey-patch';
import { PLUGIN_INITIALIZER_PROVIDER } from './app/plugins/plugin-initializer';
import { LocaleDatePipe } from './app/ui/pipes/locale-date.pipe';
import { ShortTimeHtmlPipe } from './app/ui/pipes/short-time-html.pipe';
import { ShortTimePipe } from './app/ui/pipes/short-time.pipe';

if (environment.production || environment.stage) {
  enableProdMode();
}

// Window.ea declaration is in src/app/core/window-ea.d.ts

bootstrapApplication(AppComponent, {
  providers: [
    // Provide configuration for TranslateHttpLoader
    {
      provide: TRANSLATE_HTTP_LOADER_CONFIG,
      useValue: {
        prefix: './assets/i18n/',
        suffix: '.json',
      },
    },
    importProvidersFrom(
      FeatureStoresModule,
      MatNativeDateModule,
      FormlyConfigModule,
      MarkdownModule.forRoot({
        markedOptions: {
          provide: MARKED_OPTIONS,
          useFactory: markedOptionsFactory,
        },
        sanitize: { provide: SANITIZE, useValue: SecurityContext.HTML },
      }),
      MaterialCssVarsModule.forRoot(),
      MatSidenavModule,
      MatBottomSheetModule,
      ReminderModule,
      // External
      BrowserModule,
      // NOTE: both need to be present to use forFeature stores
      // Meta-reducers are defined in meta-reducer-registry.ts with detailed phase documentation
      StoreModule.forRoot(undefined, {
        metaReducers: META_REDUCERS,
        ...(environment.production
          ? {
              runtimeChecks: {
                strictStateImmutability: false,
                strictActionImmutability: false,
                strictStateSerializability: false,
                strictActionSerializability: false,
              },
            }
          : {
              runtimeChecks: {
                strictStateImmutability: true,
                strictActionImmutability: true,
                strictStateSerializability: true,
                strictActionSerializability: true,
                strictActionTypeUniqueness: true,
              },
            }),
      }),
      EffectsModule.forRoot([]),
      // StoreDevtoolsModule lazy-loaded in dev mode after bootstrap
      ReactiveFormsModule,
      ServiceWorkerModule.register('ngsw-worker.js', {
        enabled:
          !IS_ELECTRON &&
          !IS_NATIVE_PLATFORM &&
          (environment.production || environment.stage),
        // Register the ServiceWorker as soon as the application is stable
        // or after 30 seconds (whichever comes first).
        registrationStrategy: 'registerWhenStable:30000',
      }),
      TranslateModule.forRoot({
        fallbackLang: DEFAULT_LANGUAGE,
        loader: {
          provide: TranslateLoader,
          useClass: TranslateHttpLoader,
        },
      }),
      CdkDropListGroup,
    ),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideHttpClient(withInterceptorsFromDi()),
    LocaleDatePipe,
    ShortTimeHtmlPipe,
    ShortTimePipe,
    { provide: DateAdapter, useClass: CustomDateAdapter },
    {
      provide: MAT_DATE_FORMATS,
      useFactory: (dateTimeFormatService: DateTimeFormatService): MatDateFormats => {
        // Use getters so dateInput re-evaluates when the user changes locale
        return {
          parse: {
            get dateInput(): string {
              return dateTimeFormatService.dateFormat().raw;
            },
            timeInput: { hour: 'numeric', minute: 'numeric' },
          },
          display: {
            get dateInput(): string {
              return dateTimeFormatService.dateFormat().raw;
            },
            monthYearLabel: { year: 'numeric', month: 'short' },
            dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
            monthYearA11yLabel: { year: 'numeric', month: 'long' },
            timeInput: { hour: 'numeric', minute: 'numeric' },
            timeOptionLabel: { hour: 'numeric', minute: 'numeric' },
          },
        };
      },
      deps: [DateTimeFormatService],
    },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'fill', subscriptSizing: 'dynamic' },
    },
    provideAnimationsAsync(),
    {
      provide: MATERIAL_ANIMATIONS,
      deps: [GlobalConfigService],
      useFactory: (globalConfigService: GlobalConfigService) => ({
        get animationsDisabled(): boolean {
          return globalConfigService.misc()?.isDisableAnimations ?? false;
        },
      }),
    },
    provideRouter(APP_ROUTES, withHashLocation(), withPreloading(PreloadAllModules)),
    PLUGIN_INITIALIZER_PROVIDER,
    provideZonelessChangeDetection(),
    // Initialize operation capture service for synchronous state change capture
    // This must run before any persistent actions are dispatched
    {
      provide: APP_INITIALIZER,
      useFactory: (captureService: OperationCaptureService) => {
        return () => {
          setOperationCaptureService(captureService);
        };
      },
      deps: [OperationCaptureService],
      multi: true,
    },
    // Ensure DataInitService is instantiated at bootstrap.
    // Its constructor triggers reInit() → hydrateStore() → loadAllData into NgRx.
    {
      provide: APP_INITIALIZER,
      useFactory: (_dataInit: DataInitService) => {
        return () => {};
      },
      deps: [DataInitService],
      multi: true,
    },
    // Initialize encryption password dialog opener for static form config functions
    {
      provide: APP_INITIALIZER,
      useFactory: (_opener: EncryptionPasswordDialogOpenerService) => {
        // Service constructor self-registers the module-level reference
        return () => {};
      },
      deps: [EncryptionPasswordDialogOpenerService],
      multi: true,
    },
    // Note: ImmediateUploadService now initializes itself in constructor
    // after DataInitStateService.isAllDataLoadedInitially$ fires to avoid
    // race condition where upload attempts happen before sync config is loaded
  ],
}).then((appRef) => {
  // Initialize touch fix for Material menus
  initializeMatMenuTouchFix();

  // Register default locale immediately (statically imported, no network fetch)
  registerLocaleData(DEFAULT_LOCALE_DATA, DEFAULT_LANGUAGE);

  // Lazily load and register remaining locales during idle time
  const registerRemainingLocales = (): void => {
    Object.keys(LocaleImportFns).forEach((locale) => {
      if (locale !== DEFAULT_LANGUAGE) {
        LocaleImportFns[locale as keyof typeof LocaleImportFns]().then((m) => {
          registerLocaleData(m.default, locale);
        });
      }
    });
  };

  // Lazily load and register focus-mode effects during idle time.
  // Safe to defer: focus-mode requires explicit user activation (clicking the
  // focus button), which cannot happen before idle callback fires.
  const registerLazyEffects = async (): Promise<void> => {
    const { FocusModeEffects } =
      await import('./app/features/focus-mode/store/focus-mode.effects');
    const envInjector = appRef.injector.get(EnvironmentInjector);
    createEnvironmentInjector(
      [importProvidersFrom(EffectsModule.forFeature([FocusModeEffects]))],
      envInjector,
    );
  };

  // Lazily load store devtools only in dev mode
  const registerStoreDevtools = async (): Promise<void> => {
    if (environment.production || environment.stage) {
      return;
    }
    const { StoreDevtoolsModule } = await import('@ngrx/store-devtools');
    const envInjector = appRef.injector.get(EnvironmentInjector);
    createEnvironmentInjector(
      [
        importProvidersFrom(
          StoreDevtoolsModule.instrument({
            maxAge: 15,
            logOnly: false,
            actionsBlocklist: ['[TimeTracking] Add time spent'],
          }),
        ),
      ],
      envInjector,
    );
  };

  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(() => registerRemainingLocales());
    requestIdleCallback(() =>
      registerLazyEffects().catch((e) => Log.err('Failed to register lazy effects', e)),
    );
    requestIdleCallback(() =>
      registerStoreDevtools().catch((e) => Log.err('Failed to register devtools', e)),
    );
  } else {
    setTimeout(() => registerRemainingLocales(), 0);
    setTimeout(
      () =>
        registerLazyEffects().catch((e) => Log.err('Failed to register lazy effects', e)),
      0,
    );
    setTimeout(
      () =>
        registerStoreDevtools().catch((e) => Log.err('Failed to register devtools', e)),
      0,
    );
  }

  // TODO make asset caching work for electron

  if (
    'serviceWorker' in navigator &&
    (environment.production || environment.stage) &&
    !IS_ELECTRON &&
    !IS_NATIVE_PLATFORM
  ) {
    Log.log('Registering Service worker');
    return navigator.serviceWorker.register('ngsw-worker.js').catch((err: unknown) => {
      Log.log('Service Worker Registration Error');
      Log.err(err);
    });
  } else if ('serviceWorker' in navigator && (IS_ELECTRON || IS_NATIVE_PLATFORM)) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      })
      .catch((e) => {
        Log.err('ERROR when unregistering service worker');
        Log.err(e);
      });
  }
  return undefined;
});

// fix mobile scrolling while dragging
window.addEventListener('touchmove', () => {});

if (!(environment.production || environment.stage) && IS_ANDROID_WEB_VIEW) {
  setTimeout(() => {
    androidInterface.showToast('Android DEV works');
    Log.log(androidInterface);
  }, 1000);
}
