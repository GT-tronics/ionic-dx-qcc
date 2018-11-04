import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AtCmdLogPage } from './atcmd-log';

@NgModule({
  declarations: [
    AtCmdLogPage,
  ],
  imports: [
    IonicPageModule.forChild(AtCmdLogPage),
  ],
})
export class AtCmdLogPageModule {}
