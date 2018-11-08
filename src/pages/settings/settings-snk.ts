import { Component, NgZone } from '@angular/core';
import { Platform, Events, IonicPage, NavController, NavParams } from 'ionic-angular';
import { ATCMDHDLQCCSNK } from '../../providers/atcmd-dispatcher/atcmd-handler-qcc-sink';

/**
 * Generated class for the SettingsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-settings',
  templateUrl: 'settings-snk.html',
})
export class SettingsSnkPage {

  protected atCmdHandler : ATCMDHDLQCCSNK.AtCmdHandler_QCC_SNK = null;
  private bindedFunctions : {};

  public pwrOnConnect : boolean = true;
  public pwrOnPairing : boolean = true;
  public remainOnPairing : boolean = true;
  public reconnectLastAttempt : number = 0;
  public connectAttemptRepeat : number = 0;
  public pairingTimeoutToIdle : boolean = false;
  public connectPolicyLast : boolean = false;
  public pairingTimeout : number = 0;
  public connectableTimeout : number = 0;

  public codecAptX : boolean = false;
  public codecAptXLL : boolean = false;
  public codecAptXHD : boolean = false;
  public codecAac : boolean = false;

  constructor
  (
    public platform: Platform,
    public navCtrl: NavController, 
    public navParams: NavParams,
    private zone: NgZone,
    public events: Events
  ) 
  {
    this.atCmdHandler = <ATCMDHDLQCCSNK.AtCmdHandler_QCC_SNK>this.navParams.get('atCmdHandler');

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

    this.atCmdHandler.getPowerOnConnect().then((pwrOnConnect) => {
      this.zone.run(() => {
        this.pwrOnConnect = pwrOnConnect;
      });
    });

    this.atCmdHandler.getPowerOnPairing().then((pwrOnPairing) => {
      this.zone.run(() => {
        this.pwrOnPairing = pwrOnPairing;
      });
    });

    this.atCmdHandler.getRemainOnPairing().then((remainOnPairing) => {
      this.zone.run(() => {
        this.remainOnPairing = remainOnPairing;
      });
    });

    this.atCmdHandler.getReconnectLastAttempt().then((reconnectLastAttempt) => {
      this.zone.run(() => {
        this.reconnectLastAttempt = reconnectLastAttempt;
      });
    });

    this.atCmdHandler.getConnectAttemptRepeat().then((connectAttemptRepeat) => {
      this.zone.run(() => {
        this.connectAttemptRepeat = connectAttemptRepeat;
      });
    });

    this.atCmdHandler.getPairingTimeoutTo().then((pairingTimeoutTo) => {
      this.zone.run(() => {
        this.pairingTimeoutToIdle = (pairingTimeoutTo >= 1 ?true :false);
      });
    });

    this.atCmdHandler.getConnectPolicy().then((connectPolicy) => {
      this.zone.run(() => {
        this.connectPolicyLast = (connectPolicy == 0 ?true :false);
      });
    });

    this.atCmdHandler.getTimerValue(4).then((obj) => {
      this.zone.run(() => {
        this.pairingTimeout = obj.value;
      });
    });

    this.atCmdHandler.getTimerValue(6).then((obj) => {
      this.zone.run(() => {
        this.connectableTimeout = obj.value;
      });
    });

    this.atCmdHandler.getCodecMask().then((mask) => {
      this.zone.run(() => {
        this.codecAptX = ( mask & 0x1 ) ?true :false;
        this.codecAptXLL = ( mask & 0x2 ) ?true :false;
        this.codecAptXHD = ( mask & 0x4 ) ?true :false;
        this.codecAac = ( mask & 0x8 ) ?true :false;
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

  updatePowerOnConnect()
  {
    this.atCmdHandler.setPowerOnConnect(this.pwrOnConnect);
  }

  updatePowerOnPairing()
  {
    this.atCmdHandler.setPowerOnPairing(this.pwrOnPairing);
  }

  updateRemainOnPairing()
  {
    this.atCmdHandler.setRemainOnPairing(this.remainOnPairing);
  }

  updateReconnectLastAttempt()
  {
    this.atCmdHandler.setReconnectLastAttempt(this.reconnectLastAttempt);
  }

  updatePairingTimeoutTo(isIdle)
  {
    this.atCmdHandler.setPairingTimeoutTo(isIdle ?1 :0);
  }

  updateConnectPolicy(isLast)
  {
    this.atCmdHandler.setConnectPolicy(isLast ?0 :1);
  }

  updatePairingTimeout()
  {
    this.atCmdHandler.setTimer(4, this.pairingTimeout);
  }

  updateConnectableTimeout()
  {
    this.atCmdHandler.setTimer(6, this.connectableTimeout);
  }

  updateCodec()
  {
    let mask = 0;
    mask |= this.codecAptX ?(1 << 0) :0;
    mask |= this.codecAptXLL ?(1 << 1) :0;
    mask |= this.codecAptXHD ?(1 << 2) :0;
    mask |= this.codecAac ?(1 << 3) :0;
    this.atCmdHandler.setCodecMask(mask);
  }

}
