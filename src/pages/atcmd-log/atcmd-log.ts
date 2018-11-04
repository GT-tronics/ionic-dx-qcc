import { Component } from '@angular/core';
import { Platform, Events, IonicPage, NavController, NavParams } from 'ionic-angular';
import { ATCMDHDL } from '../../providers/atcmd-dispatcher/atcmd-handler';

/**
 * Generated class for the AtcmdLogPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-atcmd-log',
  templateUrl: 'atcmd-log.html',
})
export class AtCmdLogPage {

  protected atCmdHandler : ATCMDHDL.AtCmdHandler_TEXTBASE = null;
  private bindedFunctions : {};

  constructor
  (
    public platform: Platform,
    public navCtrl: NavController, 
    public navParams: NavParams,
    public events: Events
  ) 
  {
    this.atCmdHandler = <ATCMDHDL.AtCmdHandler_TEXTBASE>this.navParams.get('atCmdHandler');

    // Register for android's system back button
    let backAction =  platform.registerBackButtonAction(() => {
      console.log("[ATCMDLOG] user page close");
      this.navCtrl.pop({animate: true, animation:'ios-transition', duration:500, direction:'back'});
      backAction();
    },2)
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad AtcmdLogPage');
  }

  ionViewWillEnter()
  {
    var fn : any;

    this.bindedFunctions = {};

    fn = this.handleBleDevChanged.bind(this);
    this.events.subscribe('BT_DEV_CHANGED', fn);
    this.bindedFunctions['BT_DEV_CHANGED'] = fn;
  }

  ionViewDidLeave()
  {
    for( var key in this.bindedFunctions )
    {
      var fn = this.bindedFunctions[key];
      this.events.unsubscribe(key, fn);
    }

    this.bindedFunctions = null;
  }


  private handleBleDevChanged(params)
  {
    //console.log('[DEVICE-SRC]' + JSON.stringify(params));
    if( params.action == 'disconnect' )
    {
      console.log("[ATCMDLOG] disconnect page close");
      this.navCtrl.pop({animate: true, animation:'ios-transition', duration:500, direction:'back'});
    }
  }



}
