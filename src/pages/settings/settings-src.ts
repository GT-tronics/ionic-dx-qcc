import { Component, NgZone } from '@angular/core';
import { Platform, Events, IonicPage, NavController, NavParams } from 'ionic-angular';
import { ATCMDHDLQCCSRC } from '../../providers/atcmd-dispatcher/atcmd-handler-qcc-src';

/**
 * Generated class for the SettingsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-settings',
  templateUrl: 'settings-src.html',
})
export class SettingsSrcPage {

  protected atCmdHandler : ATCMDHDLQCCSRC.AtCmdHandler_QCC_SRC = null;
  private bindedFunctions : {};

  public enableDualStream : boolean = true;
  public autoReconnect2ndDevice : boolean = true;

  public forceAvrcpVolMuteSync : boolean = true;
  public forceAvrcpVolMuteSyncDelay : number = 0;
  public enableRoleMismatchReconnectMedia : boolean = false;
  public enablePktSzMismatchReconnectMedia : boolean = false;
  public enableHfp : boolean = false;

  public codecFastStream : boolean = false;
  public codecAptX : boolean = false;
  public codecAptXLL : boolean = false;
  public codecAptXHD : boolean = false;

  constructor
  (
    public platform: Platform,
    public navCtrl: NavController, 
    public navParams: NavParams,
    private zone: NgZone,
    public events: Events
  ) 
  {
    console.log("[SETTINGS] page start ...");

    this.atCmdHandler = <ATCMDHDLQCCSRC.AtCmdHandler_QCC_SRC>this.navParams.get('atCmdHandler');

    // Register for android's system back button
    let backAction =  platform.registerBackButtonAction(() => {
      console.log("[SETTINGS] user page close");
      this.navCtrl.pop({animate: true, animation:'ios-transition', duration:500, direction:'back'});
      backAction();
    },2)
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SettingsPage');
  }

  ionViewWillEnter()
  {
    var fn : any;

    this.bindedFunctions = {};

    fn = this.handleBleDevChanged.bind(this);
    this.events.subscribe('BT_DEV_CHANGED', fn);
    this.bindedFunctions['BT_DEV_CHANGED'] = fn;

    // Get all the settings parameters
    //

    this.atCmdHandler.getEnableDualStream().then((ret) => {
      this.zone.run(() => {
        this.enableDualStream = ret;
      });
    });

    this.atCmdHandler.getAutoReconnect2ndDevice().then((ret) => {
      this.zone.run(() => {
        this.autoReconnect2ndDevice = ret;
      });
    });

    this.atCmdHandler.getForceAvrcpVolMuteSync().then((ret) => {
      this.zone.run(() => {
        this.forceAvrcpVolMuteSync = ret;
      });
    });

    this.atCmdHandler.getForceAvrcpVolMuteSyncDelay().then((ret) => {
      this.zone.run(() => {
        this.forceAvrcpVolMuteSyncDelay = ret;
      });
    });

    this.atCmdHandler.getEnableRoleMismatchReconnectMedia().then((ret) => {
      this.zone.run(() => {
        this.enableRoleMismatchReconnectMedia = ret;
      });
    });

    this.atCmdHandler.getEnablePktSzMismatchReconnectMedia().then((ret) => {
      this.zone.run(() => {
        this.enablePktSzMismatchReconnectMedia = ret;
      });
    });

    this.atCmdHandler.getEnableHfp().then((ret) => {
      this.zone.run(() => {
        this.enableHfp = ret;
      });
    });

    this.atCmdHandler.getCodecMask().then((mask) => {
      this.zone.run(() => {
        this.codecAptX = ( mask & 0x1 ) ?true :false;
        this.codecAptXLL = ( mask & 0x2 ) ?true :false;
        this.codecAptXHD = ( mask & 0x4 ) ?true :false;
        this.codecFastStream = ( mask & 0x8 ) ?true :false;
      });
    });
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
    if( params.action == 'disconnect' )
    {
      console.log("[SETTINGS] disconnect page close");
      this.navCtrl.pop({animate: true, animation:'ios-transition', duration:500, direction:'back'});
    }
  }

  updateEnableDualStream()
  {
    this.atCmdHandler.setEnableDualStream(this.enableDualStream);
  }

  updateAutoReconnect2ndDevice()
  {
    this.atCmdHandler.setAutoReconnect2ndDevice(this.autoReconnect2ndDevice);
  }

  updateForceAvrcpVolMuteSync()
  {
    this.atCmdHandler.setForceAvrcpVolMuteSync(this.forceAvrcpVolMuteSync);
  }

  updateForceAvrcpVolMuteSyncDelay()
  {
    this.atCmdHandler.setForceAvrcpVolMuteSyncDelay(this.forceAvrcpVolMuteSyncDelay);
  }

  updateEnableRoleMismatchReconnectMedia()
  {
    this.atCmdHandler.setEnableRoleMismatchReconnectMedia(this.enableRoleMismatchReconnectMedia);
  }

  updateEnablePktSzMismatchReconnectMedia()
  {
    this.atCmdHandler.setEnablePktSzMismatchReconnectMedia(this.enablePktSzMismatchReconnectMedia);
  }

  updateEnableHfp()
  {
    this.atCmdHandler.setEnableHfp(this.enableHfp);
  }

  updateCodec()
  {
    let mask = 0;
    mask |= this.codecAptX ?(1 << 0) :0;
    mask |= this.codecAptXLL ?(1 << 1) :0;
    mask |= this.codecAptXHD ?(1 << 2) :0;
    mask |= this.codecFastStream ?(1 << 3) :0;
    this.atCmdHandler.setCodecMask(mask);
  }

}
