import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SettingsSnkPage } from './settings-snk';

@NgModule({
  declarations: [
    SettingsSnkPage,
  ],
  imports: [
    IonicPageModule.forChild(SettingsSnkPage),
  ],
})
export class SettingsSnkPageModule {}
