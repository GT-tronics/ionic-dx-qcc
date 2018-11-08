import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SettingsSrcPage } from './settings-src';

@NgModule({
  declarations: [
    SettingsSrcPage,
  ],
  imports: [
    IonicPageModule.forChild(SettingsSrcPage),
  ],
})
export class SettingsSrcPageModule {}
