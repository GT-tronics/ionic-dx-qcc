import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ScanAndConnectPage } from './scan-and-connect';

@NgModule({
  declarations: [
    ScanAndConnectPage,
  ],
  imports: [
    IonicPageModule.forChild(ScanAndConnectPage),
  ],
})
export class ScanAndConnectPageModule {}
