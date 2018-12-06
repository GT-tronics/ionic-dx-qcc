import { Component, NgZone } from '@angular/core';
import { Platform, Events, IonicPage } from 'ionic-angular';
import { NavController, NavParams, AlertController } from 'ionic-angular';
import { AtCmdDispatcherService, BtDeviceInfo } from '../../providers/atcmd-dispatcher/atcmd-dispatcher.service';
import { ATCMDHDLQCCSRC } from '../../providers/atcmd-dispatcher/atcmd-handler-qcc-src';

@IonicPage()

@Component({
  selector: 'page-device',
  templateUrl: 'device-src.html'
})
export class DeviceSrcPage 
{
  protected devInfo : BtDeviceInfo;
  protected pdlRecs : ATCMDHDLQCCSRC.PdlRec[] = [];
  protected deviceState : string = "IDLE";
  protected streamState : string = "STOP";
  protected isRefresh : boolean = true;

  public pairButtonColor : string = "dark";
  public logButtonColor : string = "secondary";
  public logButtonTitle : string = "Start Logging";

  public isVolumeSliderTouchDown : boolean = false;

  protected qccSrcHandler : ATCMDHDLQCCSRC.AtCmdHandler_QCC_SRC = null;

  private bindedFunctions : {};

  constructor(
    public platform: Platform,
    public navCtrl: NavController,
    public navParams: NavParams,
    private zone: NgZone,
    public alertCtrl : AlertController,
    public dispatcher : AtCmdDispatcherService,
    public events: Events
  ) {
      console.log("[DEVICE-SRC] page start ...");

      this.devInfo = this.navParams.get('devInfo');
      var refreshPdl : boolean = this.navParams.get('refreshPdl');

      this.isRefresh = refreshPdl;

      // Register for android's system back button
      let backAction =  platform.registerBackButtonAction(() => {
        console.log("[DEVICE-SRC] user page close");
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
    this.events.subscribe('QCC_SRC_PDL_CHANGED', fn);
    this.bindedFunctions['QCC_SRC_PDL_CHANGED'] = fn;

    fn = this.handleDeviceStateChanged.bind(this);
    this.events.subscribe('QCC_SRC_DEVICE_STATE_CHANGED', fn);
    this.bindedFunctions['QCC_SRC_DEVICE_STATE_CHANGED'] = fn;

    fn = this.handleStreamStateChanged.bind(this);
    this.events.subscribe('QCC_SRC_STREAM_STATE_CHANGED', fn);
    this.bindedFunctions['QCC_SRC_STREAM_STATE_CHANGED'] = fn;

    fn = this.handleVolumeChanged.bind(this);
    this.events.subscribe('QCC_SRC_VOLUME_CHANGED', fn);
    this.bindedFunctions['QCC_SRC_VOLUME_CHANGED'] = fn;
  }

  ionViewDidEnter()
  {
    this.refresh(this.isRefresh);
    this.isRefresh = false;
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

  private refresh( refresh : boolean)
  {
    if( this.getHandler() )
    {
      var state = this.qccSrcHandler.atCmdDS.deviceState
      this.deviceState = this.qccSrcHandler.atCmdDS.deviceStateStrs[state];
      this.pairButtonColor = this.deviceState == 'INQUIRING' ?"danger" :"dark";

      // Request volume
      this.qccSrcHandler.getVolume(0, refresh).then( retVol => {
        console.log("[DEVICE-SRC] get volume 1 success [" + retVol + "]");
        this.zone.run( () => {
          if( retVol >= 0 && retVol < 128 )
          {
            this.pdlRecs[0].avrcpVolume = retVol;
          }
        });
                
        this.qccSrcHandler.getVolume(1, refresh).then( retVol => {
          console.log("[DEVICE-SRC] get volume 2 success [" + retVol + "]");
          this.zone.run( () => {
            if( retVol >= 0 && retVol < 128 )
            {
              this.pdlRecs[1].avrcpVolume = retVol;
            }
          });
                  
          // Request PDL
          this.qccSrcHandler.getPdl(refresh).then( retPdl => {
            console.log("[DEVICE-SRC] get PDL success " + JSON.stringify(retPdl));
            this.zone.run( () => {
              this.pdlRecs = retPdl.pdl;
            });

          }).catch( obj => {
              console.log("[DEVICE-SRC] get PDL fail " + JSON.stringify(obj));
          });

        }).catch( obj => {
          console.log("[DEVICE-SRC] get volume 2 fail " + JSON.stringify(obj));
        });

      }).catch( obj => {
        console.log("[DEVICE-SRC] get volume 1 fail " + JSON.stringify(obj));
      });   

    }
}

  private handleBleDevChanged(params)
  {
    //console.log('[DEVICE-SRC]' + JSON.stringify(params));
    if( params.name == 'QCC_SRC' && params.action == 'disconnect' )
    {
      console.log("[DEVICE-SRC] disconnect page close");
      this.navCtrl.pop({animate: true, animation:'ios-transition', duration:500, direction:'back'});
    }
  }

  private handlePdlChanged(params)
  {
    console.log('[DEVICE-SRC] Pdl changed: ' + JSON.stringify(params));

    // this.zone.run(() => {
    //   this.pdlRecs = params.pdl;
    // });

    this.refreshPdl();
  }

  private handleDeviceStateChanged(params)
  {
    console.log('[DEVICE-SRC] device state changed: ' + JSON.stringify(params));

    this.zone.run( () => {
      this.deviceState = params.state;
      this.pairButtonColor = this.deviceState == 'INQUIRING' ?"danger" :"dark";
      // var ary = this.qccSrcHandler.getPdlImmediate();
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
    // this.qccSrcHandler.refreshPdl();    
  }

  private handleStreamStateChanged(params)
  {
    console.log('[DEVICE-SRC] stream state changed' + JSON.stringify(params));

    this.zone.run( () => {
      if( params.connCount > 0 )
      {
        this.streamState = params.codec + (params.connCount == 2 ?" [Dual]" :"");
      }
      else
      {
        this.streamState = 'STOP';
      }
    });

    // Update PDL since device state has changed
    // this.qccSrcHandler.refreshPdl();    
  }

  private handleVolumeChanged(params)
  {
    console.log('[DEVICE-SRC] volume changed: ' + params.volume);
    if( this.isVolumeSliderTouchDown )
    {
      return;
    }

    this.zone.run( () => {
      this.pdlRecs[params.pdlIdx].avrcpVolume = params.volume;
      console.log('[DEVICE-SRC] volume changed: ' + params.volume);
    });
  }

  private getHandler() : boolean
  {
    if( this.qccSrcHandler == null )
    {
      // this.qccSrcHandler = <ATCMDHDLQCCSRC.AtCmdHandler_QCC_SRC>this.dispatcher.getCmdChHandler(linkedList[foundIdx].uuid);
      this.qccSrcHandler = <ATCMDHDLQCCSRC.AtCmdHandler_QCC_SRC>this.dispatcher.getCmdChHandler(this.devInfo.uuid);
    }
    else
    {
      return true;
    }

    if( this.qccSrcHandler == null )
    {
      // Handler is not any more
      // - likely the device is disconnected
      // - pop this page and let th parent to handle it
      console.log("[DEVICE-SRC] error page close");
      this.navCtrl.pop({animate: true, animation:'ios-transition', duration:500, direction:'back'});
      return false;
    }    

    return true;
  }

  refreshPdl()
  {
    // Clear the list
    this.pdlRecs = [];

    //console.log("[DEVICE-SRC] refresh PDL [" + linkedList[foundIdx].uuid + "][" + linkedList[foundIdx].name + "]");
    console.log("[DEVICE-SRC] refresh PDL [" + this.devInfo.uuid + "][" + this.devInfo.name + "]");

    if( !this.getHandler() )
    {
      return;
    }

    this.qccSrcHandler.refreshPdl().then( ret => {
      console.log("[DEVICE-SRC] refreshing PDL success " + JSON.stringify(ret));
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
        this.pdlRecs = ret.pdl;
      });
    }).catch( ret => {
      console.log("[DEVICE-SRC] refreshing PDL fail " + JSON.stringify(ret));
    });
  }

  refreshDeviceState()
  {
    console.log("[DEVICE-SRC] refresh Device State [" + this.devInfo.uuid + "][" + this.devInfo.name + "]");

    if( !this.getHandler() )
    {
      return;
    }

    this.qccSrcHandler.getDeviceState().then( ret => {
      console.log("[DEVICE-SRC] get device state success " + JSON.stringify(ret));
      this.zone.run(() => {
        this.deviceState = ret.state;
      });
    }).catch( ret => {
      console.log("[DEVICE-SRC] get device state fail " + JSON.stringify(ret));
    });
  }
  
  refreshVolume()
  {
    console.log("[DEVICE-SRC] refresh volume [" + this.devInfo.uuid + "][" + this.devInfo.name + "]");

    if( !this.getHandler() )
    {
      return;
    }

    this.qccSrcHandler.getVolume(0).then( retVol => {
      console.log("[DEVICE-SRC] get volume 1 success [" + retVol + "]");
      this.zone.run(() => {
        if( retVol >= 0 && retVol < 128 )
        {
          this.pdlRecs[0].avrcpVolume = retVol;
        }
      });
      this.qccSrcHandler.getVolume(1).then( retVol => {
        console.log("[DEVICE-SRC] get volume 2 success [" + retVol + "]");
        this.zone.run(() => {
          if( retVol >= 0 && retVol < 128 )
          {
            this.pdlRecs[1].avrcpVolume = retVol;
          }
        });
      }).catch( obj => {
        console.log("[DEVICE-SRC] get volume 2 fail " + JSON.stringify(obj));
      });
    }).catch( obj => {
      console.log("[DEVICE-SRC] get volume 1 fail " + JSON.stringify(obj));
    });
  }
  
  pairButtonPressed(event)
  {
    console.log("[DEVICE-SRC] change pair [" + this.devInfo.uuid + "][" + this.devInfo.name + "]");

    if( !this.getHandler() )
    {
      return;
    }
    
    var onOff = true;
    if( this.pairButtonColor != 'dark' )
    {
      onOff = false;
    }
    this.qccSrcHandler .setPairingOnOff(onOff).then( ret => {
      console.log("[DEVICE-SRC] change pair success " + JSON.stringify(ret));
      this.zone.run( () => {
        if( this.pairButtonColor == 'dark' )
        {
          this.pairButtonColor = 'danger';
        }
        else
        {
          this.pairButtonColor = 'dark';
        }
      });
    }).catch( ret => {
      console.log("[DEVICE-SRC] change pair fail " + JSON.stringify(ret));
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

    console.log("[DEVICE-SRC] Connenting PDL [" + pdlRec.addr + "]");
    this.qccSrcHandler.connectPairedDevice(pdlRec.addr).then( ret => {
      console.log("[DEVICE-SRC] connect PDL success " + JSON.stringify(ret));
      connectingPrompt.dismiss();
      this.qccSrcHandler.refreshPdl();        
    }).catch( ret => {
      console.log("[DEVICE-SRC] connect PDL fail " + JSON.stringify(ret));
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
    
    console.log("[DEVICE-SRC] Disconnecting device in PDL [" + pdlRec.addr + "]");
    this.qccSrcHandler.disconnectDevice(pdlRec.addr).then( ret => {
      console.log("[DEVICE-SRC] disconnect device in PDL success " + JSON.stringify(ret));
      disconnectingPrompt.dismiss();
      this.qccSrcHandler.refreshPdl();        
    }).catch( ret => {
      disconnectingPrompt.dismiss();
      console.log("[DEVICE-SRC] disconnect device in PDL fail " + JSON.stringify(ret));
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
        
    console.log("[DEVICE-SRC] Removing device in PDL [" + pdlRec.addr + "]");
    this.qccSrcHandler.removePDL(pdlRec.addr).then( ret => {
      console.log("[DEVICE-SRC] remove device in PDL success " + JSON.stringify(ret));
      removingPrompt.dismiss();
      this.qccSrcHandler.refreshPdl();
    }).catch( ret => {
      removingPrompt.dismiss();
      console.log("[DEVICE-SRC] remove device in PDL fail " + JSON.stringify(ret));
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
    console.log("[DEVICE-SRC] change logging [" + this.devInfo.uuid + "][" + this.devInfo.name + "]");

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

      this.qccSrcHandler.startLogging();
    }
    else
    {
      this.zone.run(() => {
        this.logButtonColor = 'secondary';
        this.logButtonTitle = 'Start Logging';
      });

      this.qccSrcHandler.stopLogging();
    }
  }

  navToLogPage()
  {
    this.navCtrl.push('AtCmdLogPage', {'atCmdHandler' : this.qccSrcHandler}, {animate: true, animation:'ios-transition', duration:500, direction:'forward'});
  }

  navToScanPage()
  {
    this.navCtrl.push('ScanAndConnectPage', {'atCmdHandler' : this.qccSrcHandler}, {animate: true, animation:'ios-transition', duration:500, direction:'forward'});
  }

  volumeSliderChanged(event, pdlIdx)
  {
    console.log("[DEVICE_SRC] volume slider changed[" + this.devInfo.uuid + "][" + this.devInfo.name + "]");

    if( this.isVolumeSliderTouchDown )
    {
      this.qccSrcHandler.setVolume(pdlIdx, this.pdlRecs[pdlIdx].avrcpVolume);
    }
  }

  volumeSliderTouchDown(event, pdlIdx)
  {
    console.log("[DEVICE_SRC] volume slider touch down [" + this.devInfo.uuid + "][" + this.devInfo.name + "]");
    this.isVolumeSliderTouchDown = true;
  }
  
  volumeSliderTouchUp(event, pdlIdx)
  {
    console.log("[DEVICE_SRC] volume slider touch up [" + this.devInfo.uuid + "][" + this.devInfo.name + "]");
    this.isVolumeSliderTouchDown = false;
    this.qccSrcHandler.setVolume(pdlIdx, this.pdlRecs[pdlIdx].avrcpVolume);
  }

  navToSettingsPage()
  {
    this.navCtrl.push('SettingsSrcPage', {'atCmdHandler' : this.qccSrcHandler}, {animate: true, animation:'ios-transition', duration:500, direction:'forward'});
  }


}
