import { Component, NgZone, ViewChild } from '@angular/core';
import { Platform, Events, IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { ATCMDHDLQCCSRC } from '../../providers/atcmd-dispatcher/atcmd-handler-qcc-src';


/**
 * Generated class for the ScanAndConnectPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()

@Component({
  selector: 'page-scan-and-connect',
  templateUrl: 'scan-and-connect.html',
})
export class ScanAndConnectPage 
{
  protected scanRecAry : ATCMDHDLQCCSRC.ScanRec[] = [];
  protected pullToScanMsg = "Pull Down To Scan";

  protected atCmdHandler : ATCMDHDLQCCSRC.AtCmdHandler_QCC_SRC = null;

  private bindedFunctions : {};

  private msgPrompt : any = null;
  private connecting : boolean = false;
  private scanning : boolean = false;

  protected refresher : any = null;

  constructor(
    public platform: Platform,
    public navCtrl: NavController, 
    public navParams: NavParams,
    private zone: NgZone,
    public events: Events,
    public alertCtrl : AlertController
  ) 
  {
    console.log("[SCAN-AND-CONNECT] page start ...");

    this.atCmdHandler = <ATCMDHDLQCCSRC.AtCmdHandler_QCC_SRC>this.navParams.get('atCmdHandler');

    // Register for android's system back button
    let backAction =  platform.registerBackButtonAction(() => {
      console.log("[SCAN-AND-CONNECT] user page close");
      this.navCtrl.pop({animate: true, animation:'ios-transition', duration:500, direction:'back'});
      backAction();
    },2)

    // this.startScan();

    // this.msgPrompt = this.alertCtrl.create({
    //   title: 'Scanning'
    // });
    // this.msgPrompt.present();
  }

  ionViewWillEnter()
  {
    var fn : any;

    this.bindedFunctions = {};

    fn = this.handleBleDevChanged.bind(this);
    this.events.subscribe('BT_DEV_CHANGED', fn);
    this.bindedFunctions['BT_DEV_CHANGED'] = fn;

    fn = this.handleScanUpdate.bind(this);
    this.events.subscribe('QCC_SRC_NEW_SCAN_RESULT', fn);
    this.bindedFunctions['QCC_SRC_NEW_SCAN_RESULT'] = fn;

    fn = this.handleDeviceStateChanged.bind(this);
    this.events.subscribe('QCC_SRC_DEVICE_STATE_CHANGED', fn);
    this.bindedFunctions['QCC_SRC_DEVICE_STATE_CHANGED'] = fn;
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
    //console.log('[SCAN-AND-CONNECT]' + JSON.stringify(params));
    if( params.name == 'QCC_SRC' && params.action == 'disconnect' )
    {
      console.log("[SCAN-AND-CONNECT] disconnect page close");
      this.navCtrl.pop({animate: true, animation:'ios-transition', duration:500, direction:'back'});
    }
  }

  private handleScanUpdate(params)
  {
    console.log('[SCAN-AND-CONNECT] new scan result: ' + JSON.stringify(params));

    if( !this.scanning )
    {
      return;
    }
    
    this.zone.run(() => {
      for( var i = 0; i < this.scanRecAry.length; i++)
      {
        if( this.scanRecAry[i].addr == params.scanRec.addr )
        {
          if( params.scanRec.pathLoss <= 127 )
          {
            this.scanRecAry[i].pathLoss = params.scanRec.pathLoss;
          }
          if( this.scanRecAry[i].remoteDevName == "" )
          {
            this.scanRecAry[i].remoteDevName = params.scanRec.remoteDevName;
            this.scanRecAry[i].isA2dp = params.scanRec.isA2dp;
            this.scanRecAry[i].isHfp = params.scanRec.isHfp;
            this.scanRecAry[i].isAvrcp = params.scanRec.isAvrcp;
            this.scanRecAry[i].isProfileComplete = params.scanRec.isProfileComplete;
          }
          return;
        }
      }

      this.scanRecAry.push(params.scanRec);
    });
  }

  private handleDeviceStateChanged(params)
  {
    console.log('[DEVICE-SRC] device state changed: ' + JSON.stringify(params));

    if( this.connecting )
    {
      if( params.state == 'CONNECTED' )
      {
        this.msgPrompt.dismiss();
        this.connecting = false;
        this.navCtrl.pop({animate: true, animation:'ios-transition', duration:500, direction:'back'});
      }
    }
  }

  private startScan(refresher : any = null) 
  {
    this.atCmdHandler.startScan(true).then( ret => {
      console.log("[SCAN-AND-CONNECT] scanning success " + JSON.stringify(ret));
      // {
      //   "scanRecs" : 
      //     { 
      //       "00:02:5B:00:A5:A5" : 
      //         {
      //           "idx" : 0,
      //           "addr" : "00:02:5B:00:A5:A5",
      //           "addrType" : 0,
      //           "isPhoneProvisioned" : false,
      //           "isMusicProvisioned" : true,
      //           "isPhoneConnected" : 0,
      //           "isMusicConnected" : 0,
      //           "provisionProfile" : 2,
      //           "connectedProfile" : 0,
      //           "remoteDevName":null
      //         },
      //
      //       "D4:A3:3D:B2:4F:23" : 
      //         {
      //           "idx" : 1,
      //           "addr" : "D4:A3:3D:B2:4F:23",
      //           "addrType" : 0,
      //           "isPhoneProvisioned" : false,
      //           "isMusicProvisioned" : true,
      //           "isPhoneConnected" : 0,
      //           "isMusicConnected" : 0,
      //           "provisionProfile" : 2,
      //           "connectedProfile" : 0,
      //           "remoteDevName" : null
      //         },
      //     }
      //   "seqid" : 12,
      //   "uuid" : "0490D0BC-BA9C-9002-AFF8-AC0D053FC4B2",
      //   "cmdRsp" : "+SCAN:",
      //   "retCode" : 0
      // }

      //var scanRecAry = Object.keys(ret.scanRecs).map(i => ret.scanRecs[i]);
      //console.log("[SCAN-AND-CONNECT] scanRecAry " + JSON.stringify(scanRecAry));

      // if( ret.scanRecs.empty )
      // {
      //   this.zone.run(() => {
      //     var scanRec = <ATCMDHDLQCCSRC.ScanRec>{addr:"", remoteDevName:"Pull To Scan"};
      //     this.scanRecAry = [scanRec];
      //   });
      // }
  
      refresher.complete();
      this.scanning = false;
      this.refresher = null;

      this.zone.run(() => {
        this.pullToScanMsg = "Pull Down To Scan";
      });
    }).catch( ret => {
      console.log("[SCAN-AND-CONNECT] scanning fail " + JSON.stringify(ret));

      refresher.complete();
      this.scanning = false;
      this.refresher = null;

      this.zone.run(() => {
        this.pullToScanMsg = "Pull Down To Scan";
      });
    });
  
  }

  scanPullStart(refresher)
  {
  }

  scanPulling(refresher)
  {
  }

  scanRefresh(refresher)
  {
    this.zone.run(() => {
      this.scanRecAry = [];
      this.pullToScanMsg = "Scanning ...";
    });

    this.refresher = refresher;
    this.scanning = true;
    this.startScan(refresher);
  }

  connectDevice(item, addr)
  {
    this.msgPrompt = this.alertCtrl.create({
      title: 'Connecting'
    });
    this.msgPrompt.present();
    
    this.connecting = true;
    if( this.scanning )
    {
      if( this.refresher )
      {
        this.refresher.complete();
        this.refresher = null;
      }
      this.scanning = false;
    }

    this.atCmdHandler.connectDevice(addr).then( ret => {
      console.log("[SCAN-AND-CONNECT] connecting success " + JSON.stringify(ret));
    }).catch( ret => {
      console.log("[SCAN-AND-CONNECT] connecting fail " + JSON.stringify(ret));
      this.msgPrompt.dismiss();

      this.msgPrompt = this.alertCtrl.create({
        title: 'Not Successful. Please retry.'
      });
      this.msgPrompt.present();
    });
  }

}
