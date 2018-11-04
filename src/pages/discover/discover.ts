import { Component, ViewChild, NgZone } from '@angular/core';
import { Platform, Events } from 'ionic-angular';
import { NavController, AlertController } from 'ionic-angular';
import { AtCmdDispatcherService, BtDeviceInfo } from '../../providers/atcmd-dispatcher/atcmd-dispatcher.service';

// Changed to lazy loading
// import { DeviceSnkPage } from '../../pages/device/device-snk'
// import { DeviceSrcPage } from '../../pages/device/device-src'
// import { FirmUpg8266Page } from '../../pages/firm-upg-8266/firm-upg-8266'

@Component({
  selector: 'page-discover',
  templateUrl: 'discover.html'
})
export class DiscoverPage 
{
  unlinkDevInfos : BtDeviceInfo[];
  linkedDevInfos : BtDeviceInfo[];
  connectingDevInfos : { uuid : string, BtDeviceInfo };
  connectedPageNames : { uuid : string, string };

  connectingPrompt : any = null;

  constructor(
    public platform: Platform, 
    private zone: NgZone,
    public events : Events,
    public navCtrl: NavController,
    public alertCtrl : AlertController,
    public dispatcher : AtCmdDispatcherService
  ) 
  {
    this.connectingDevInfos = <{ uuid : string, BtDeviceInfo }>{};
    this.connectedPageNames = <{ uuid : string, string }>{};

    events.subscribe('BT_DEV_CHANGED', this.handleBleDevChanged.bind(this));

    this.dispatcher.init( sysEvtObj => {
      console.log("[DISCOVER] SysEvt: " + JSON.stringify(sysEvtObj));  
      
      // Add code here to handle BLE on/off events
      //
    }).then( successObj => {
      console.log("[DISCOVER] DX init OK " + JSON.stringify(successObj));
    }).catch( failureObj => {
      console.log("[DISCOVER] DX init failed " + JSON.stringify(failureObj));
    });

    this.unlinkDevInfos = [];
    this.linkedDevInfos = this.dispatcher.getLinkedDevices();
  }

  ionViewDidLoad() {
    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
    });
  }

  handleBleDevChanged(params)
  {
    //console.log('[DISCOVER]', JSON.stringify(params));

    if( params.name != 'QCC_SNK' && params.name != 'QCC_SRC' && params.name != 'DXS' )
    {
      return;
    }

    // Update the device list UI
    this.zone.run(()=>{
      this.linkedDevInfos = this.dispatcher.getLinkedDevices();
      this.unlinkDevInfos = this.dispatcher.getUnlinkDevices();
    });

    if( this.connectingPrompt == null )
    {
      return;
    }

    var activateFailedPrompt : boolean = false;

    if( params.name ==  "QCC_SNK" && params.action == "connect" )
    {
      this.connectingPrompt.dismiss();
      this.connectingPrompt = null;
      
      var devInfo = this.connectingDevInfos[params.uuid];

      if( devInfo == null )
      {
        activateFailedPrompt = true;
      }
      else
      {
        console.log("[DISCOVER] connect QCC-SNK");
        this.navCtrl.push('DeviceSnkPage', {'devInfo' : devInfo}, {animate: true, animation:'ios-transition', duration:500, direction:'forward'});
        delete this.connectingDevInfos[params.uuid];
        this.connectedPageNames[params.uuid] = 'DeviceSnkPage';
      }
    }
    else if( params.name ==  "QCC_SRC" && params.action == "connect" )
    {
      this.connectingPrompt.dismiss();
      this.connectingPrompt = null;

      var devInfo = this.connectingDevInfos[params.uuid];

      if( devInfo == null )
      {
        activateFailedPrompt = true;
      }
      else
      {
        console.log("[DISCOVER] connect QCC-SRC");
        this.navCtrl.push('DeviceSrcPage', {'devInfo' : devInfo}, {animate: true, animation:'ios-transition', duration:500, direction:'forward'});
        delete this.connectingDevInfos[params.uuid];
        this.connectedPageNames[params.uuid] = 'DeviceSrcPage';
      }
    }
    else if( params.name ==  "DXS" && params.action == "connect" )
    {
      this.connectingPrompt.dismiss();
      this.connectingPrompt = null;

      var devInfo = this.connectingDevInfos[params.uuid];

      if( devInfo == null )
      {
        activateFailedPrompt = true;
      }
      else
      {
        console.log("[DISCOVER] connect DXS");
        this.navCtrl.push('FirmUpg8266Page', {'devInfo' : devInfo}, {animate: true, animation:'ios-transition', duration:500, direction:'forward'});
        delete this.connectingDevInfos[params.uuid];
        this.connectedPageNames[params.uuid] = 'FirmUpg8266Page';
      }
    }

    if( activateFailedPrompt )
    {
      let prompt = this.alertCtrl.create({
        title: 'Connect failed [internal error]',
        buttons: [
            {
                text: 'Ok'
            }
        ]
      });
      prompt.present();
    }
  }

  scanPull()
  {
  }

  scanRefresh(refresher)
  {
    // Empty the list
    this.linkedDevInfos = this.dispatcher.getLinkedDevices();
    this.unlinkDevInfos = [];

    setTimeout(() => {
      this.dispatcher.stopScan();
      refresher.complete();
    }, 3000);

    this.dispatcher.startScan(
      successObj => {
        //console.log("[HOME] scan success " + JSON.stringify(successObj));

            // Add code here to process the scan result. 
            // - for example, update the device list UI
            // - check for successObj.active for the device availability. If false,
            //   it means the device is no longer available (i.e. not advertising 
            //   any more), therefore it cannot be connected 

            this.zone.run(() => {
              this.linkedDevInfos = this.dispatcher.getLinkedDevices();
              this.unlinkDevInfos = this.dispatcher.getUnlinkDevices();
              //console.log( "[DISCOVER] " + JSON.stringify(this.linkedDevInfos));
              //console.log( "[DISCOVER] " + JSON.stringify(this.unlinkDevInfos));
            });
          },
      failureObj => {
        console.log("[DISCOVER] scan failure " + failureObj.status);
      }
    );
  }

  connectDevice(item, devInfo)
  {
    item.close();

    if( devInfo.isConnected() )
    {
      var pageName = this.connectedPageNames[devInfo.uuid];
      console.log("[DISCOVER] nav to " + pageName);
      this.navCtrl.push(pageName, {'devInfo' : devInfo, 'refreshPdl' : true}, {animate: true, animation:'ios-transition', duration:500, direction:'forward'});
      return;
    }

    this.connectingPrompt = this.alertCtrl.create({
      title: 'Connecting'
    });
    this.connectingPrompt.present();
    
    this.connectingDevInfos[devInfo.uuid] = devInfo;

    console.log("[DISCOVER] Connecting [" + devInfo.uuid + "][" + devInfo.name + "]");
    this.dispatcher.connect(devInfo.uuid, 10000).then( ret => {
      console.log("[DISCOVER] Connected [" + ret.status + "]");
    }).catch( ret => {
      this.connectingPrompt.dismiss();
      this.connectingPrompt = null;
      console.log("[DISCOVER] Connect fail [" + ret.status + "]");
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

  disconnectDevice(item, devInfo)
  {
    item.close();

    if( !devInfo.isConnected() )
    {
      return;
    }

    console.log("[DISCOVER] Disconnecting [" + devInfo.uuid + "][" + devInfo.name + "]");
    this.dispatcher.disconnect(devInfo.uuid).catch( ret => {
      console.log("[DISCOVER] Disconnect fail " + JSON.stringify(ret));
    });

    this.zone.run(() => {
      this.linkedDevInfos = this.dispatcher.getLinkedDevices();
      this.unlinkDevInfos = this.dispatcher.getUnlinkDevices();
    });
  }

  removeDevice(item, devInfo)
  {
    item.close();

    console.log("[DISCOVER] removing device [" + devInfo.uuid + "][" + devInfo.name + "]");
    this.dispatcher.removeLinkedDevice(devInfo.uuid);

    this.zone.run(() => {
      this.linkedDevInfos = this.dispatcher.getLinkedDevices();
      this.unlinkDevInfos = this.dispatcher.getUnlinkDevices();
    });
  }

  // startScanButtonPressed(event) {
  //   this.dispatcher.startScan(
  //     successObj => {
  //       console.log("[HOME] scan success " + JSON.stringify(successObj));

  //           // Add code here to process the scan result. 
  //           // - for example, update the device list UI
  //           // - check for successObj.active for the device availability. If false,
  //           //   it means the device is no longer available (i.e. not advertising 
  //           //   any more), therefore it cannot be connected 
  //     },
  //     failureObj => {
  //       console.log("[HOME] scan failure " + failureObj.status);
  //     }
  //   );
  // }

  // stopScanButtonPressed(event) {
  //   this.dispatcher.stopScan();
  //   var unlinkDevInfoList : BtDeviceInfo[] = this.dispatcher.getUnlinkDevices();
  //   for( var i = 0; i < unlinkDevInfoList.length; i++ )
  //   {
  //     var devInfo = unlinkDevInfoList[i];
  //     console.log("Unlink: [" + devInfo.uuid + "][" + devInfo.name + "][" + devInfo.rssi + "][" + devInfo.active + "]");
  //   }
  // }

  // connectButtonPressed(event) 
  // {
  //   var linkedList : BtDeviceInfo[] = this.dispatcher.getLinkedDevices();
  //   var unlinkList : BtDeviceInfo[] = this.dispatcher.getUnlinkDevices();

  //   if( linkedList.length > 0 )
  //   {
  //     var sortedList: BtDeviceInfo[] = linkedList.sort((obj1, obj2) => {
  //       if( obj1.active && obj2.active )
  //       {
  //         if (obj1.rssi > obj2.rssi) {
  //           return -1;
  //         }
  //         if (obj1.rssi < obj2.rssi) {
  //             return 1;
  //         }
  //       }
  //       else if( obj1.active )
  //       {
  //         return -1;
  //       }
  //       else if( obj2.active )
  //       {
  //         return 1;
  //       }
  //       return 0;
  //     });
  //     this.devInfo = sortedList[0];
  //   }
  //   else if( unlinkList.length > 1 )
  //   {
  //     var sortedList: BtDeviceInfo[] = unlinkList.sort((obj1, obj2) => {
  //       if (obj1.rssi > obj2.rssi) {
  //           return -1;
  //       }
  //       if (obj1.rssi < obj2.rssi) {
  //           return 1;
  //       }
  //       return 0;
  //     });
  //     this.devInfo = sortedList[0];
  //   }
  //   else
  //   {
  //     this.devInfo = unlinkList[0];
  //   }

  //   if( this.devInfo )
  //   {
  //     console.log("[Home] Connecting [" + this.devInfo.uuid + "][" + this.devInfo.name + "]");
  //     this.dispatcher.connect(this.devInfo.uuid, 10000).then( ret => {
  //       console.log("[Home] Connected [" + ret.status + "]");
  //     }).catch( ret => {
  //       console.log("[Home] Connect fail [" + ret.status + "]");
  //     });
  //   }
  // }

  // disconnectButtonPressed(event)
  // {
  //   if( this.devInfo )
  //   {
  //     console.log("[Home] Disconnecting [" + this.devInfo.uuid + "][" + this.devInfo.name + "]");
  //     this.dispatcher.disconnect(this.devInfo.uuid).catch( ret => {
  //       console.log("[Home] Disconnect fail " + JSON.stringify(ret));
  //     });
  //   }
  // }

  // refreshPDLButtonPressed(event)
  // {
  //   if( this.devInfo )
  //   {
  //     console.log("[Home] refreshing PDL [" + this.devInfo.uuid + "][" + this.devInfo.name + "]");
  //     var handler : ATCMDHDLQCCSNK.AtCmdHandler_QCC_SNK = <ATCMDHDLQCCSNK.AtCmdHandler_QCC_SNK>this.dispatcher.getCmdChHandler(this.devInfo.uuid);
  //     if( handler )
  //     {
  //       handler.refreshPdl().then( ret => {
  //         console.log("[Home] refreshing PDL success " + JSON.stringify(ret));
  //       }).catch( ret => {
  //         console.log("[Home] refreshing PDL fail " + JSON.stringify(ret));
  //       });
  //     }
  //     else
  //     {
  //       console.log("[Home] refreshing PDL fail [handler null]");
  //     }
  //   }
  // }

  // refreshRSSIButtonPressed(event)
  // {
  //   if( this.devInfo )
  //   {
  //     console.log("[Home] refreshing RSSI [" + this.devInfo.uuid + "][" + this.devInfo.name + "]");
  //     var handler : ATCMDHDLQCCSNK.AtCmdHandler_QCC_SNK = <ATCMDHDLQCCSNK.AtCmdHandler_QCC_SNK>this.dispatcher.getCmdChHandler(this.devInfo.uuid);
  //     if( handler )
  //     {
  //       handler.refreshRssi().then( ret => {
  //         console.log("[Home] refreshing RSSI success " + JSON.stringify(ret));
  //       }).catch( ret => {
  //         console.log("[Home] refreshing RSSI fail " + JSON.stringify(ret));
  //       });;
  //     }
  //     else
  //     {
  //       console.log("[Home] refreshing RSSI fail [handler null]");
  //     }
  //   }
  // }

  // enterPairingButtonPressed(event)
  // {
  //   if( this.devInfo )
  //   {
  //     console.log("[Home] entering pairing [" + this.devInfo.uuid + "][" + this.devInfo.name + "]");
  //     var handler : ATCMDHDLQCCSNK.AtCmdHandler_QCC_SNK = <ATCMDHDLQCCSNK.AtCmdHandler_QCC_SNK>this.dispatcher.getCmdChHandler(this.devInfo.uuid);
  //     if( handler )
  //     {
  //       handler.setPairingOnOff(true).then( ret => {
  //         console.log("[Home] entering pairing success " + JSON.stringify(ret));
  //       }).catch( ret => {
  //         console.log("[Home] entering pairing fail " + JSON.stringify(ret));
  //       });;
  //     }
  //     else
  //     {
  //       console.log("[Home] entering pairing fail [handler null]");
  //     }
  //   }
  // }

}