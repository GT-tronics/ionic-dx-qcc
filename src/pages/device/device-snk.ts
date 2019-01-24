import { Component, NgZone } from '@angular/core';
import { Platform, Events, IonicPage } from 'ionic-angular';
import { NavController, NavParams, AlertController } from 'ionic-angular';
import { AtCmdDispatcherService, BtDeviceInfo } from '../../providers/atcmd-dispatcher/atcmd-dispatcher.service';
import { ATCMDHDLQCCSNK } from '../../providers/atcmd-dispatcher/atcmd-handler-qcc-sink';
import { ATCMDHDLIMU } from '../../providers/atcmd-dispatcher/atcmd-handler-imu';

@IonicPage()

@Component({
  selector: 'page-device',
  templateUrl: 'device-snk.html'
})
export class DeviceSnkPage 
{
  protected devInfo : BtDeviceInfo;
  protected pdlRecs : ATCMDHDLQCCSNK.PdlRec[] = [];
  protected deviceState : string = "IDLE";
  protected streamState : string = "STOP";

  public pairingButtonColor : string = "dark";
  public logButtonColor : string = "secondary";
  public playPauseButtonColor : string = "primary";
  public logButtonTitle : string = "Start Logging";
  public playPauseButtonTitle : string = "Play";

  public isPlaying : boolean = false;
  public volumeLevel : number = 0.0;
  public volumeGuardTimeout : any = null;
  public isVolumeSliderTouchDown : boolean = false;

  protected cmdChHandler : ATCMDHDLQCCSNK.AtCmdHandler_QCC_SNK = null;
  protected dataChHandler : ATCMDHDLIMU.AtCmdHandler_IMU = null;

  private bindedFunctions : {};

  private rssiTimer : any = null;

  constructor(
    public platform: Platform,
    public navCtrl: NavController,
    public navParams: NavParams,
    private zone: NgZone,
    public alertCtrl : AlertController,
    public dispatcher : AtCmdDispatcherService,
    public events: Events
  ) {
      this.devInfo = this.navParams.get('devInfo');
      var refreshPdl : boolean = this.navParams.get('refreshPdl');

      if( this.getHandler() )
      {
        var state = this.cmdChHandler.atCmdDS.deviceState
        this.deviceState = this.cmdChHandler.atCmdDS.deviceStateStrs[state];
        this.pairingButtonColor = this.deviceState == 'DISCOVERABLE' ?"danger" :"dark";

        if( refreshPdl )
        {
          this.refreshPdl();
          this.refreshDeviceState();
        }
      }

      // Register for android's system back button
      let backAction =  platform.registerBackButtonAction(() => {
        console.log("[DEVICE-SNK] user page close");
        this.navCtrl.pop({animate: true, animation:'ios-transition', duration:500, direction:'back'});
        backAction();
      },2)
  }

  ionViewWillEnter()
  {
    var fn : any;

    this.bindedFunctions = {};

    fn = this.handleBleDevChanged.bind(this);
    this.events.subscribe('BT_DEV_CHANGED', fn);
    this.bindedFunctions['BT_DEV_CHANGED'] = fn;

    fn = this.handlePdlChanged.bind(this);
    this.events.subscribe('QCC_SNK_PDL_CHANGED', fn);
    this.bindedFunctions['QCC_SNK_PDL_CHANGED'] = fn;

    fn = this.handleDeviceStateChanged.bind(this);
    this.events.subscribe('QCC_SNK_DEVICE_STATE_CHANGED', fn);
    this.bindedFunctions['QCC_SNK_DEVICE_STATE_CHANGED'] = fn;

    fn = this.handleStreamStateChanged.bind(this);
    this.events.subscribe('QCC_SNK_STREAM_STATE_CHANGED', fn);
    this.bindedFunctions['QCC_SNK_STREAM_STATE_CHANGED'] = fn;

    fn = this.handleVolumeChanged.bind(this);
    this.events.subscribe('QCC_SNK_VOLUME_CHANGED', fn);
    this.bindedFunctions['QCC_SNK_VOLUME_CHANGED'] = fn;

    // Refresh active devices' RSSI every 10s
    this.rssiTimer = setInterval(() => {
      this.cmdChHandler.refreshPdlRssi();        
    }, 10000);
  }

  ionViewDidLeave()
  {
    for( var key in this.bindedFunctions )
    {
      var fn = this.bindedFunctions[key];
      this.events.unsubscribe(key, fn);
    }

    this.bindedFunctions = null;

    clearInterval(this.rssiTimer);
  }


  private handleBleDevChanged(params)
  {
    //console.log('[DEVICE-SNK]', JSON.stringify(params));
    if( params.name == 'QCC_SNK' && params.action == 'disconnect' )
    {
      console.log("[DEVICE-SNK] disconnect page close");
      this.navCtrl.pop({animate: true, animation:'ios-transition', duration:500, direction:'back'});
    }
  }

  private handlePdlChanged(params)
  {
    console.log('[DEVICE-SNK] PDL changed: ' + JSON.stringify(params));

    // {
    //   "pdl" : 
    //     [
    //       {
    //         "idx" : 0,
    //         "addr" : "00:02:5B:00:A5:A5",
    //         "addrType" : 0,
    //         "isPhoneProvisioned" : false,
    //         "isMusicProvisioned" : true,
    //         "isPhoneConnected" : 0,
    //         "isMusicConnected" : 0,
    //         "provisionProfile" : 2,
    //         "connectedProfile" : 0,
    //         "remoteDevName":null
    //       },
    //       {
    //         "idx" : 1,
    //         "addr" : "D4:A3:3D:B2:4F:23",
    //         "addrType" : 0,
    //         "isPhoneProvisioned" : false,
    //         "isMusicProvisioned" : true,
    //         "isPhoneConnected" : 0,
    //         "isMusicConnected" : 0,
    //         "provisionProfile" : 2,
    //         "connectedProfile" : 0,
    //         "remoteDevName" : null
    //       }
    //     ],
    //   "seqid" : 12,
    //   "uuid" : "0490D0BC-BA9C-9002-AFF8-AC0D053FC4B2",
    //   "cmdRsp" : "+PDL:",
    //   "retCode" : 0
    // }

    this.zone.run(() => {
      this.pdlRecs = params.pdl;
    });
  }

  private handleDeviceStateChanged(params)
  {
    console.log('[DEVICE-SNK] device state changed: ' + JSON.stringify(params));

      this.zone.run( () => {
        this.deviceState = params.state;
        this.pairingButtonColor = this.deviceState == 'DISCOVERABLE' ?"danger" :"dark";
      // setTimeout(() => {
      //   this.cmdChHandler.refreshPdl();        
      // },0);
      // var ary = this.cmdChHandler.getPdlImmediate();
      // if( ary == null )
      // {
      //   this.pdlRecs = [];
      // }
      // else
      // {
      //   this.pdlRecs = ary;
      // }
    });

    // Update PDL since device state has changed
    this.cmdChHandler.refreshPdl();        
  }

  private handleStreamStateChanged(params)
  {
    console.log('[DEVICE-SNK] stream state changed: ' + JSON.stringify(params));

    this.zone.run( () => {
      if( params.action == 'connect' )
      {
        this.streamState = params.codec;
        this.isPlaying = true;
      }
      else
      {
        this.streamState = 'STOP';
        this.isPlaying = false;
      }
    });

    // Update PDL since device state has changed
    this.cmdChHandler.refreshPdl();    
  }

  private handleVolumeChanged(params)
  {
    if( this.isVolumeSliderTouchDown )
    {
      return;
    }

    this.zone.run( () => {
      this.volumeLevel = params.volume;
      console.log('[DEVICE-SNK] volume changed: ' + params.volume);
    });
  }

  private getHandler() : boolean
  {
    if( this.cmdChHandler == null )
    {
      // this.cmdChHandler = <ATCMDHDLQCCSNK.AtCmdHandler_QCC_SNK>this.dispatcher.getCmdChHandler(linkedList[foundIdx].uuid);
      this.cmdChHandler = <ATCMDHDLQCCSNK.AtCmdHandler_QCC_SNK>this.dispatcher.getCmdChHandler(this.devInfo.uuid);
    }

    if( this.dataChHandler == null )
    {
      this.dataChHandler = <ATCMDHDLIMU.AtCmdHandler_IMU>this.dispatcher.getDataChHandler(this.devInfo.uuid);
    }
 
    if( this.cmdChHandler == null && this.dataChHandler == null )
    {
      // Handler is not any more
      // - likely the device is disconnected
      // - pop this page and let th parent to handle it
      console.log("[DEVICE-SNK] error page close");
      this.navCtrl.pop({animate: true, animation:'ios-transition', duration:500, direction:'back'});
      return false;
    }    

    return true;
  }

  refreshPdl()
  {
    // var linkedList : BtDeviceInfo[] = this.dispatcher.getLinkedDevices();
    // var foundIdx = -1;

    // // Find the 1st connected device
    // for( var i = 0 ; i < linkedList.length; i++ )
    // {
    //   var devInfo = linkedList[i];
    //   if( devInfo.isConnected() )
    //   {
    //     foundIdx = i;
    //     break;
    //   }
    // }

    // if( foundIdx < 0 )
    // {
    //   let prompt = this.alertCtrl.create({
    //     title: 'Connect to a device first',
    //     buttons: [
    //         {
    //             text: 'Ok'
    //         }
    //     ]
    //   });
    //   prompt.present();
    //   return;
    // }

    // Clear the list
    this.zone.run( () => {
      this.pdlRecs = [];
    });
    
    //console.log("[DEVICE-SNK] refresh PDL [" + linkedList[foundIdx].uuid + "][" + linkedList[foundIdx].name + "]");
    console.log("[DEVICE-SNK] refresh PDL [" + this.devInfo.uuid + "][" + this.devInfo.name + "]");

    if( !this.getHandler() )
    {
      return;
    }

    this.cmdChHandler.refreshPdl().then( ret => {
      console.log("[DEVICE-SNK] refresh PDL success " + JSON.stringify(ret));
      //this.pdlRecs = ret.pdl;
    }).catch( ret => {
      console.log("[DEVICE-SNK] refresh PDL fail " + JSON.stringify(ret));
    });
  }

  refreshDeviceState()
  {
    console.log("[DEVICE-SNK] refresh Device State [" + this.devInfo.uuid + "][" + this.devInfo.name + "]");

    if( !this.getHandler() )
    {
      return;
    }

    this.cmdChHandler.getDeviceState().then( ret => {
      console.log("[DEVICE-SNK] get device state success " + JSON.stringify(ret));
      this.zone.run(() => {
        this.deviceState = ret.state;
      });
    }).catch( ret => {
      console.log("[DEVICE-SNK] get device state fail " + JSON.stringify(ret));
      this.zone.run(() => {
        this.deviceState = ret.state;
      });
    });
  }

  pairingButtonPressed(event)
  {
    console.log("[DEVICE-SNK] change pairing [" + this.devInfo.uuid + "][" + this.devInfo.name + "]");

    if( !this.getHandler() )
    {
      return;
    }
    
    var onOff = true;
    if( this.pairingButtonColor != 'dark' )
    {
      onOff = false;
    }
    this.cmdChHandler .setPairingOnOff(onOff).then( ret => {
      console.log("[DEVICE-SNK] change pairing success " + JSON.stringify(ret));
      this.zone.run( () => {
        if( this.pairingButtonColor == 'dark' )
        {
          this.pairingButtonColor = 'danger';
        }
        else
        {
          this.pairingButtonColor = 'dark';
          // this.deviceState = 'CONNECTABLE';
        }
      });
    }).catch( ret => {
      console.log("[DEVICE-SNK] change pairing fail " + JSON.stringify(ret));
    });;
  }

  connectPdl(item, pdlRec)
  {
    item.close();

    if( !this.getHandler() )
    {
      return;
    }
    
    if( pdlRec.isMusicConnected )
    {
      // THe selected device is alreay connected
      // - just return
      return;
    }

    // Create a "conneting" prompt
    let connectingPrompt = this.alertCtrl.create({
      title: 'Connecting'
    });
    connectingPrompt.present();

    console.log("[DEVICE-SNK] Connenting PDL [" + pdlRec.addr + "]");
    this.cmdChHandler.connectDevice(pdlRec.addr).then( ret => {
      console.log("[DEVICE-SNK] connect PDL success " + JSON.stringify(ret));
      connectingPrompt.dismiss();
    }).catch( ret => {
      console.log("[DEVICE-SNK] connect PDL fail " + JSON.stringify(ret));
      connectingPrompt.dismiss();
      let prompt = this.alertCtrl.create({
        title: 'Connect failed [' + ret.status + ']',
        buttons: [
            {
                text: 'Ok'
            }
        ]
      });
      prompt.present();
    });
  }

  disconnectPdl(item, pdlRec)
  {
    item.close();

    if( !this.getHandler() )
    {
      return;
    }
    
    if( !pdlRec.isMusicConnected )
    {
      return;
    }

    // Create a "disconneting" prompt
    let disconnectingPrompt = this.alertCtrl.create({
      title: 'Disconnecting'
    });
    disconnectingPrompt.present();
    
    console.log("[DEVICE-SNK] Disconnecting device in PDL [" + pdlRec.addr + "]");
    this.cmdChHandler.disconnectDevice(pdlRec.addr).then( ret => {
      console.log("[DEVICE-SNK] disconnect device in PDL success " + JSON.stringify(ret));
      disconnectingPrompt.dismiss();
    }).catch( ret => {
      disconnectingPrompt.dismiss();
      console.log("[DEVICE-SNK] disconnect device in PDL fail " + JSON.stringify(ret));
      let prompt = this.alertCtrl.create({
        title: 'Disconnect failed [' + ret.status + ']',
        buttons: [
            {
                text: 'Ok'
            }
        ]
      });
      prompt.present();
    });     
  }

  removePdl(item, pdlRec)
  {
    item.close();

    if( !this.getHandler() )
    {
      return;
    }

    // Create a "Removing" prompt
    let removingPrompt = this.alertCtrl.create({
      title: 'Removing'
    });
    removingPrompt.present();
        
    console.log("[DEVICE-SNK] Removing device in PDL [" + pdlRec.addr + "]");
    this.cmdChHandler.removePDL(pdlRec.addr).then( ret => {
      console.log("[DEVICE-SNK] remove device in PDL success " + JSON.stringify(ret));
      removingPrompt.dismiss();
      this.cmdChHandler.refreshPdl();
    }).catch( ret => {
      removingPrompt.dismiss();
      console.log("[DEVICE-SNK] remove device in PDL fail " + JSON.stringify(ret));
      let prompt = this.alertCtrl.create({
        title: 'Remove failed [' + ret.status + ']',
        buttons: [
            {
                text: 'Ok'
            }
        ]
      });
      prompt.present();
    });
  }

  logButtonPressed(event)
  {
    console.log("[DEVICE_SNK] change logging [" + this.devInfo.uuid + "][" + this.devInfo.name + "]");

    if( !this.getHandler() )
    {
      return;
    }

    if( this.logButtonColor == 'secondary' )
    {
      this.zone.run(() => {
        this.logButtonColor = 'danger';
        this.logButtonTitle = 'End Logging';
      });

      this.cmdChHandler.startLogging();
    }
    else
    {
      this.zone.run(() => {
        this.logButtonColor = 'secondary';
        this.logButtonTitle = 'Start Logging';
      });

      this.cmdChHandler.stopLogging();
    }
  }

  playPauseButtonPressed(event)
  {
    console.log("[DEVICE_SNK] change play pause state [" + this.devInfo.uuid + "][" + this.devInfo.name + "]");

    if( !this.getHandler() )
    {
      return;
    }

    // if( this.playPauseButtonTitle == 'Play' )
    // {
    //   this.zone.run(() => {
    //     this.playPauseButtonTitle = 'Pause';
    //   });

    //   this.cmdChHandler.setPlayState(1);
    // }
    // else
    // {
    //   this.zone.run(() => {
    //     this.playPauseButtonTitle = 'Play';
    //   });

    //   this.cmdChHandler.setPlayState(0);
    // }

    if( this.isPlaying )
    {
      this.zone.run(() => {
        this.isPlaying = false;
      });
      this.cmdChHandler.setPlayState(0);
  }
    else
    {
      this.zone.run(() => {
        this.isPlaying = true;
      });
      this.cmdChHandler.setPlayState(1);
    }

  }

  skipForwardButtonPressed(event)
  {
    console.log("[DEVICE_SNK] skip forward [" + this.devInfo.uuid + "][" + this.devInfo.name + "]");

    if( !this.getHandler() )
    {
      return;
    }

    this.cmdChHandler.setAudioTrack(1);
  }

  skipBackwardButtonPressed(event)
  {
    console.log("[DEVICE_SNK] skip backward [" + this.devInfo.uuid + "][" + this.devInfo.name + "]");

    if( !this.getHandler() )
    {
      return;
    }

    this.cmdChHandler.setAudioTrack(0);
  }

  volumeSliderChanged(event)
  {
    console.log("[DEVICE_SNK] volume slider changed[" + this.devInfo.uuid + "][" + this.devInfo.name + "]");

    if( this.isVolumeSliderTouchDown )
    {
      this.cmdChHandler.setVolume(this.volumeLevel);
    }
  }

  volumeSliderTouchDown(event)
  {
    console.log("[DEVICE_SNK] volume slider touch down [" + this.devInfo.uuid + "][" + this.devInfo.name + "]");
    this.isVolumeSliderTouchDown = true;
  }

  volumeSliderTouchUp(event)
  {
    console.log("[DEVICE_SNK] volume slider touch up [" + this.devInfo.uuid + "][" + this.devInfo.name + "]");
    this.isVolumeSliderTouchDown = false;
    this.cmdChHandler.setVolume(this.volumeLevel);
  }

  navToLogPage()
  {
    this.navCtrl.push('AtCmdLogPage', {'cmdChHandler' : this.cmdChHandler, 'dataChHandler' : this.dataChHandler}, {animate: true, animation:'ios-transition', duration:500, direction:'forward'});
  }

  navToSettingsPage()
  {
    this.navCtrl.push('SettingsSnkPage', {'cmdChHandler' : this.cmdChHandler, 'dataChHandler' : this.dataChHandler}, {animate: true, animation:'ios-transition', duration:500, direction:'forward'});
  }

  navToShow3dPage()
  {
    this.navCtrl.push('Show3dPage', {'cmdChHandler' : this.cmdChHandler, 'dataChHandler' : this.dataChHandler}, {animate: true, animation:'ios-transition', duration:500, direction:'forward'});
  }

}
