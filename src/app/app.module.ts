import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';

// import { AboutPage } from '../pages/about/about';
// import { ContactPage } from '../pages/contact/contact';
// import { HomePage } from '../pages/home/home';
// import { TabsPage } from '../pages/tabs/tabs';
import { DiscoverPage } from '../pages/discover/discover';
// import { DeviceSnkPage } from '../pages/device/device-snk';
// import { DeviceSrcPage } from '../pages/device/device-src';
// import { FirmUpg8266Page } from '../pages/firm-upg-8266/firm-upg-8266';
// import { Wifi8266Page } from '../pages/wifi-8266/wifi-8266';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { HTTP } from '@ionic-native/http';

import { DataExchangerService } from '../providers/data-exchanger/data-exchanger.service';
import { AtCmdDispatcherService } from '../providers/atcmd-dispatcher/atcmd-dispatcher.service';

@NgModule({
  declarations: [
    MyApp,
    DiscoverPage,
    // DeviceSnkPage,
    // DeviceSrcPage,
    // FirmUpg8266Page,
    // Wifi8266Page,
    // AboutPage,
    // ContactPage,
    // HomePage,
    // TabsPage
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    DiscoverPage,
    // DeviceSnkPage,
    // DeviceSrcPage,
    // FirmUpg8266Page,
    // Wifi8266Page,
    // AboutPage,
    // ContactPage,
    // HomePage,
    // TabsPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    DataExchangerService,
    AtCmdDispatcherService,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    HTTP
  ]
})
export class AppModule {}
