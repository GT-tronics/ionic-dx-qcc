import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DeviceSnkPage } from './device-snk';

@NgModule({
  declarations: [
    DeviceSnkPage,
  ],
  imports: [
    IonicPageModule.forChild(DeviceSnkPage),
  ],
})
export class DeviceSnkPageModule {}
