import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DeviceSrcPage } from './device-src';

@NgModule({
  declarations: [
    DeviceSrcPage,
  ],
  imports: [
    IonicPageModule.forChild(DeviceSrcPage),
  ],
})
export class DeviceSrcPageModule {}
