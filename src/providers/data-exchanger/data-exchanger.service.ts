import { Injectable } from "@angular/core";
import 'rxjs/add/operator/toPromise';
import { Platform, AlertController } from 'ionic-angular';
//import { NativeStorage } from '@ionic-native/native-storage';

declare var cordova: any;

//DataExchanger service
@Injectable()
export class DataExchangerService {
    // data-exchnager status
    STORAGE_DEVICE_ID_KEY = 'deviceId';
    inited: any;
    isResetBle: any;
    params: any;
    deviceUUID: any;
    isConnected: any;
    isScanning: any;
    isBtDisabled: any;
    bufferRxDataCRLF: any;
    rxDataBuffer: any;
    dxDataList: any;
    rxLastDate: any;
    progress: any;
    rxCmdBuffer: any;
    dxCmdList: any;
    receiveCmdForceStopTime: any;
    receiveDataForceStopTime: any;
    readyDelayTimeout : any;

    errorUnsupported = {};

    constructor(
        private platform: Platform,
        public alertCtrl: AlertController
        //public storage: NativeStorage,
    ) 
    {
        this.errorUnsupported = {
            error: "unsupported",
            message: "Operation unsupported"
        };
        // init data
        this.inited = false;
        this.isResetBle = false;
        // this.params = {};
        this.deviceUUID = null;
        this.isConnected = null;
        this.isScanning = null;
        this.isBtDisabled = null;
        this.bufferRxDataCRLF = null;
        this.rxDataBuffer = null;
        this.rxLastDate = null;
        this.rxCmdBuffer = null;
        this.dxDataList = [];
        this.dxCmdList = [];
        this.progress = null;
        this.readyDelayTimeout = null;
    }

    showErrorAlert(title, message) {
        let alert = this.alertCtrl.create({
            title: title,
            subTitle: message,
            buttons: ['Ok']
        });
        alert.present();
    }

    init(sysEvtCb : (obj) => void) : Promise<any> {
        return new Promise((resolve,reject)=>{
            this.platform.ready().then(() => {
                // TODO: to remove after upgrading to Dx plugin that takes care of this
                this.rxCmdBuffer = '';
                if(this.inited) {
                    this.isConnected && this.disconnect(this.deviceUUID);
                    this.isConnected = false;
                    this.stopScan();
                    resolve({"state":"init"});
                    return;
                }
                this.isConnected = false;
                this.isScanning = false;
                this.isBtDisabled = true;
                this.inited = true;
                this.deviceUUID = null;
                this.rxDataBuffer = '';
                this.rxCmdBuffer = '';
        
                if (cordova.plugin.dx === undefined) {
                    reject({"retCode":-1,"status":"plugin not loaded"});
                } else {
                    cordova.plugin.dx.init(
                        1,          // number of devices can be connected
                        -70.0,      // proximity power level
                        10.0,       // active scan timeout
                        false,      // auto connect (must be false)
                        true,       // enable command channel
                        false,      // enable scrambler
                        true,       // enable TX backpressure
                        [
                            //"E0678212-80AE-49D6-A337-FB4786FCBC14",    // (Acco Shredder)
                            //"7615CAFE-5D2B-4EE8-A868-8EE93160A6CA",
                            // "fc03952a-a9df-4b96-b130-793521c77104",
                            // "00003900-842f-544f-5348-494241030001",
                            "2285569f-6602-425a-9b33-306100a2050f", // (HomeSpot Device)
                        ],
                        function(obj) {
                            // success
                            // typeof success !== 'undefined' && success(obj);
                            // console.log('[DX] BT init success');
                            if(obj.state == 'init') {
                                console.log('[DX] init success');
                                resolve(obj);
                            } else if(obj.state == 'syson' || obj.state == 'sysoff') {
                                console.log('[DX] Event: ' + obj.state);
                                this.isBtDisabled = obj.state == 'sysoff' ? true : false;
                                //this.onSysEvent(obj.state);
                                typeof sysEvtCb(obj) !== 'undefined' && sysEvtCb(obj);
                            } else if(obj.state == 'sysreset') {
                                console.log('[DX] BT system reset');
                                // TODO: is it really = false?
                                this.isBtDisabled = false;
                                //this.onSysEvent(obj.state);
                                typeof sysEvtCb(obj) !== 'undefined' && sysEvtCb(obj);
                            } else {
                                console.log('[DX] Unknown DX init event!!!');
                            }
                        }.bind(this),
                        function(obj) {
                            if(typeof obj === 'string' && obj == 'already initialized') {
                                console.log('[DX] already initialized');
                                resolve({"state":"init"});
                            } else {
                                console.log('[DX] init error');
                                this.inited = false;
                                reject({"retCode":-2,"status":obj});
                            }
                        }.bind(this)
                    )
                }
            });
        });
    }

    startScan(success, failure) {
        this.platform.ready().then(() => {
            this.isScanning = true;
            cordova.plugin.dx.startScan(
                // success
                function(obj) {
                    // possible bug: obj could be {} (empty but not null)
                    if( obj != null &&
                        obj.info != null &&
                        obj.info.NAME != null &&
                        obj.info.RSSI != null && 
                        obj.state != null ) {
                        console.log ('[DX] BT Scanned: ' + obj.info.NAME + '[' + obj.info.RSSI + ']' + '[' + obj.state + ']' );
                        this.deviceUUID && console.log('[DX] already connected to UUID: ' + this.deviceUUID);
                        typeof success(obj) !== 'undefined' && success(obj);
                    }
                }.bind(this),
                // failure
                function(obj) {
                    // console.log("startScan fail");
                    // console.log(obj);
                    console.log ('[DX] BT scan error');
                    this.isScanning = false;
                    typeof failure(obj) !== 'undefined' && failure(obj);
                }.bind(this)
            );
        });
    }

    // stop scanning for DataExchange devices.
    //
    stopScan() {
        this.platform.ready().then(() => {
            this.isScanning = false;
            cordova.plugin.dx.stopScan(
                function(obj) {},
                function(obj) {}
            );
        });
    }

    // connect to DataExchanger device.
    connect(devUUID : string, success, failure, rxData, rxCmdRsp) {
        this.platform.ready().then(() => {
            cordova.plugin.dx.connect(
                devUUID,
                function(obj) {
                    //success
                    // typeof success !== 'undefined' && resolve(obj);
                    if (obj.state == 'connected') {
                        console.log ('[DX] Connected device UUID - ' + obj.info.UUID);
                        this.isConnected = true;
                        this.deviceUUID = obj.info.UUID;
                        this.rxDataBuffer = '';
                        this.rxCmdBuffer = '';
                        this.bufferRxDataCRLF = true;
        
                        // Enable Rx Data Notification
                        cordova.plugin.dx.enableRxDataNotification(
                            devUUID,
                            //success
                            function(obj) {
                                var data = this.base64ToString(obj.data);
                                //console.log('[DX] RxData (' + data.length + ') and put into buffer: ' + this.rxDataBuffer);
                                typeof rxData(obj) !== 'undefined' && rxData(obj);
                            }.bind(this),
                            //failure
                            function(obj) {
                                console.log("enableRxDataNotification failure");
                                console.log(obj);
                                typeof failure(obj) !== 'undefined' && failure(obj);
                            }
                        );

                        // Enable Rx Cmd Notification
                        cordova.plugin.dx.enableRxCmdNotification(
                            devUUID,
                            // Success
                            function(obj) {
                                var data = this.base64ToString(obj.data);
                                //console.log('[DX] RxCmd (' + data.length + ') and put into buffer: ' + this.rxCmdBuffer);
                                typeof rxCmdRsp(obj) !== 'undefined' && rxCmdRsp(obj);
                            }.bind(this),
                            function(obj) {
                                //failure
                                // do nothing if failure
                                //reject(obj);
                                typeof failure(obj) !== 'undefined' && failure(obj);
                            }
                        );

                        this.isBtDisabled = false;
                        this.onConnected();
                    } else {
                        console.log ('[DX] Disconnected deviceUUID - ' +obj.info.UUID);
                        this.isBtDisabled = false;
                        this.isConnected = false;
                        this.isResetBle = true;
                        this.deviceUUID = null;
                        this.rxDataBuffer = '';
                        // TODO: to remove after upgrading to Dx plugin this takes care of this
                        this.rxCmdBuffer = '';
                        this.onDisconnected();
                    }

                    // Delay the callback (to declare ready)
                    // - FIXME: this is a design bug in DX library this it prematurely declare ready
                    //   right after all LE characteristics are discovered. Rather, it should wait
                    //   for all notifications (rx, rx2, txc) enabled before declaring ready.
                    // - as a workaround, we will delay the callback response by 2s. 
                    this.readyDelayTimeout = setTimeout(() => {
                        typeof success(obj) !== 'undefined' && success(obj);
                        this.readyDelayTimeout = null;
                    }, 2000);
                }.bind(this),
                function(obj) {
                    //failure
                    console.log ('[DX] BT connect error');
                    typeof failure(obj) !== 'undefined' && failure(obj);
                    if( this.readyDelayTimeout )
                    {
                        clearTimeout(this.readyDelayTimeout);
                        this.readyDelayTimeout = null;
                    }
                }.bind(this)
            );
        });
    }

    // disconnect from DataExchanger device.
    disconnect(uuid : string) : Promise<any> {
        return new Promise((resolve, reject) => {
            this.platform.ready().then(() => {
                var devUUID = (uuid == null ?this.deviceUUID :uuid);
                this.isConnected = false;
                this.deviceUUID = null;
                this.rxDataBuffer = '';
                this.rxCmdBuffer = '';

                if( devUUID == null )
                {
                    reject({"retCode":-1,"status":"device uuid is null"});
                    return;
                }
    
                cordova.plugin.dx.disconnect(
                    devUUID,
                    // Success (request sent)
                    function(obj) {},
                    // Failed
                    function(obj) {
                        console.log ('[DX] BT disconnect request error');
                        reject(obj);
                    }
                )
            });
        });

    }

    sendDxCmd(devUUID : string, str : string):Promise<any> {
        return new Promise( (resolve, reject) => {
            this.platform.ready().then(() => {
                var bytes = this.stringToBytes(str + '\r\n');
                var params = {
                    uuid: devUUID == null ?this.deviceUUID :devUUID,
                    cmd: bytes
                };
                if (str.length == 0) {
                    resolve(params);
                    return;
                }
                else if( params.uuid == null )
                {
                    reject(params);
                    return;
                }
                cordova.plugin.dx.sendCmd(
                    params.uuid,
                    params.cmd,
                    function(obj) {
                        console.log('[DX] TxCmd: ' + str);
                        resolve(params);
                    },
                    function(obj) {
                        reject(params)
                    }
                );
            });
        });
    }

    sendDxData(devUUID : string, str : string):Promise<any> {
        return new Promise( (resolve, reject) => {
            this.platform.ready().then(() => {
                var bytes = this.stringToBytes(str + '\r\n');
                var params = {
                    uuid: devUUID == null ?this.deviceUUID :devUUID,
                    data: bytes
                };
                if (str.length == 0) {
                    resolve(params);
                    return;
                }
                else if( params.uuid == null )
                {
                    reject(params);
                    return;
                }
                cordova.plugin.dx.sendData(
                    params.uuid,
                    params.data,
                    function(obj) {
                        console.log('[DX] TxData: ' + str);
                        resolve(params);
                    },
                    function(obj) {
                        reject(params)
                    }
                );
            });
        });
    }

    // Prime DataExchanger BLE firmware into flash storage.
    // Upgrade procedure - prime, verify, switch
    //
    // Parameter :
    // firmBinaryData = firmware binary blob data
    // firmNameStr = firmware name
    //
    primeDxFirmware(devUUID : string, firmBinaryData, firmNameStr, success, failure, progress) {
        this.platform.ready().then(() => {
            var params = {
                uuid: devUUID == null ?this.deviceUUID :devUUID,
                firmBin: firmBinaryData,
                firmName: firmNameStr,
                ilCmd: null,
                ilCnt: 0,
            };
    
            this.progress = 0;
    
            console.log('[DX] priming BLE firmware ...');
            cordova.plugin.dx.primeFirmwareBinary(
                params.uuid,
                params.firmBin,
                params.firmName,
                params.ilCmd,
                params.ilCnt,
                function(obj) {
                    //success
                    if(!obj.isdone) {
                        /// report priming progress every 10%
                        obj.progress = Number(obj.progress * 10) / 10;
                        if(obj.progress > this.progress) {
                            this.progress = obj.progress;
                            typeof progress(obj) !== 'undefined' && progress(obj);
                        }
                    } else {
                        // priming completed
                        if(obj.status == 'OK') {
                            // prime function is successful. But still need to verify the image integrity
                            if(obj.metas.ImgIntegrity) {
                                console.log('[DX] firmware priming is successful');
                                typeof success(obj) !== 'undefined' && success(obj);
                            } else {
                                console.log('[DX] primed firmware integrity is negative');
                                typeof failure(obj) !== 'undefined' && failure(obj);
                            }
                        }
                    }
                    // resolve(obj);
                }.bind(this),
                function(obj) {
                    //failure
                    console.log('[DX] error priming FirmwareMeta');
                    console.log(obj);
                    typeof failure(obj) !== 'undefined' && failure(obj);
                    // reject(obj);
                }
            );
        });
    }

    primeDxFirmwareFor8266(devUUID : string, firmBinaryData, firmNameStr, success, failure, progress) {
        this.platform.ready().then(() => {
            var params = {
                uuid: devUUID == null ?this.deviceUUID :devUUID,
                firmBin: firmBinaryData,
                firmName: firmNameStr,
                ilCmd: null,
                ilCnt: 0,
            };
    
            this.progress = 0;
    
            console.log('[DX] priming 8266 firmware ...');
            cordova.plugin.dx.primeFirmwareBinaryFor8266(
                params.uuid,
                params.firmBin,
                params.firmName,
                params.ilCmd,
                params.ilCnt,
                function(obj) {
                    //success
                    if(!obj.isdone) {
                        /// report priming progress every 10%
                        obj.progress = Number(obj.progress * 10) / 10;
                        if(obj.progress > this.progress) {
                            this.progress = obj.progress;
                            typeof progress(obj) !== 'undefined' && progress(obj);
                        }
                    } else {
                        // priming completed
                        if(obj.status == 'OK') {
                            // prime function is successful. But still need to verify the image integrity
                            if(obj.metas.ImgIntegrity) {
                                console.log('[DX] firmware priming is successful');
                                typeof success(obj) !== 'undefined' && success(obj);
                            } else {
                                console.log('[DX] primed firmware integrity is negative');
                                typeof failure(obj) !== 'undefined' && failure(obj);
                            }
                        }
                    }
                    // resolve(obj);
                }.bind(this),
                function(obj) {
                    //failure
                    console.log('[DX] error priming FirmwareMeta');
                    console.log(obj);
                    typeof failure(obj) !== 'undefined' && failure(obj);
                    // reject(obj);
                }
            );
        });    
    }

    // Switch DataExchanger BLE firmware to image stored in flash.
    // Upgrade procedure - prime, verify, switch
    //
    // Parameter :
    // slotIndex = slot index in flash storage
    // firmNameStr = firmware name
    //
    switchDxFirmware(devUUID : string, slotIndex, keepConfigData, failure) {
        return new Promise( (resolve, reject) => {
            this.platform.ready().then(() => {
                var params = {
                    uuid: this.deviceUUID,
                    slotIdx: slotIndex,
                    keepConfig: keepConfigData
                };
    
                cordova.plugin.dx.switchFirmwareToSlot(
                    params.uuid,
                    params.slotIdx,
                    params.keepConfig,
                    function(obj) {
                        //success
                        console.log('[DX] switching firmware success');
                        console.log(obj);
                        resolve(obj);
                    },
                    function(obj) {
                        //failure
                        console.log('[DX] switching firmware error');
                        console.log(obj);
                        reject(obj);
                    }
                );
            });
        });
    }

    // On DataExchanger response received from Command Channel.
    //
    // Parameter :
    // data = AT response string received 
    //
    onDxCmdResponse(data) {
        this.dxCmdList.push(data);
    }

    // On DataExchanger data received from Data Channel.
    //
    // Parameter :
    // data = serial data string received 
    //
    onDxDataResponse(data) {
        this.dxDataList.push(data);
    }

    // On DataExchanger connection established 
    //
    onConnected() {
        //this.storage.setItem(this.STORAGE_DEVICE_ID_KEY, this.deviceUUID);
    }

    // On DataExchanger connection lost 
    //
    onDisconnected() {
    }

    // On BT system change events.
    //
    // Parameter :
    // state = state of system 
    //
    onSysEvent(state) {
        var alertTitle;
        var alertMessage;
        if (state == 'sysoff') {
            alertTitle = "BT Error";
            alertMessage = "Please make sure your Bluetooth is turned on, otherwise it will not work properly.";
            this.showErrorAlert(alertTitle,alertMessage);
        } else if (state == 'sysreset') {
            alertTitle = "BT Reset";
            alertMessage = "The Bluetooth system already reset";
            this.showErrorAlert(alertTitle,alertMessage);
        }
    }

    bytesToString(buffer) {
        return String.fromCharCode.apply(null, new Uint8Array(buffer));
    }

    stringToBytes(string) {
        var array = new Uint8Array(string.length);
        for (var i=0;i<string.length;i++) {
            array[i] = string.charCodeAt(i);
        }
        return array.buffer;
    }

    base64ToString(b64) {
        return atob(b64.data);
    }

}