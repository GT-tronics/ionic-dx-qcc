import { Events } from 'ionic-angular';
import { ATCMDHDL } from '../../providers/atcmd-dispatcher/atcmd-handler';
import { ATCMDHDLCOMMON } from '../../providers/atcmd-dispatcher/atcmd-handler-common';

export namespace ATCMDHDLQCCSRC 
{
    enum AddrType { public_addr, private_addr }; 
    enum ProvisionProfileType { none, hfp, a2dp, both };
    enum ConnectState { NONE = 0x0, PRIMARY = 0x1, SECONDARY = 0x2, ERROR = 0x4 };
    enum DeviceState { INIT, PWR_OFF, TEST, IDLE, CONNECTABLE, DISCOVERABLE, CONNECTING, INQUIRING, CONNECTED, CONFIG }

    export class AtCmdHandler_QCC_SRC extends ATCMDHDLCOMMON.AtCmdHandler_COMMON {

        static createInstance(
            uuid : string, 
            name : string, 
            sendCb : (uuid:string, data:string) => Promise<any>,
            events : Events 
        ) : ATCMDHDL.AtCmdHandler
        {
            return new AtCmdHandler_QCC_SRC(uuid, name, sendCb, events);
        }

        public atCmdPDL : AtCmdRec_PDL;
        public atCmdDS : AtCmdRec_DS;
        public atCmdCC : AtCmdRec_CC;
        public atCmdCR : AtCmdRec_CR;
        public atCmdVL : AtCmdRec_VL;
        public atCmdPDLU : AtCmdRec_PDLU;

        constructor(
            uuid : string, 
            name : string,
            sendCb : (uuid:string, data:string) => Promise<any>,
            events : Events
        ) 
        {
            super(uuid, name, sendCb, events);

            // AT+DS?
            this.atCmdDS = new AtCmdRec_DS(this.uuid, this.atCmdRspCallback.bind(this), events);
            this.addAtCmdRecToParser(this.atCmdDS, true);

            // AT+CC?
            this.atCmdCC = new AtCmdRec_CC(this.uuid, this.atCmdRspCallbackNoBroadcast.bind(this), events);
            this.addAtCmdRecToParser(this.atCmdCC, false);
            
            // AT+CR?
            this.atCmdCR = new AtCmdRec_CR(this.uuid, this.atCmdRspCallback.bind(this), events);
            this.addAtCmdRecToParser(this.atCmdCR, true);

            // AT+VL?
            this.atCmdVL = new AtCmdRec_VL(this.uuid, this.atCmdRspCallback.bind(this), events);
            this.addAtCmdRecToParser(this.atCmdVL, false);
                                    
            // AT+PDL?
            this.atCmdPDL = new AtCmdRec_PDL(this.uuid, this.atCmdRspCallback_PDL.bind(this), events);
            this.addAtCmdRecToParser(this.atCmdPDL, false);

            // AT+PDLU?
            this.atCmdPDLU = new AtCmdRec_PDLU(this.uuid, this.atCmdRspCallback.bind(this), events);
            this.addAtCmdRecToParser(this.atCmdPDLU, false);
        }
    
        //
        // Special Callback Override
        //

        // Special Callback to handle PDL unsolicted notification
        // - the key issue is that "OK" is received before the return is available.
        // - therefore, the return must be handled in this callback.
        // - also event broadcast is suppressed.
        // - command sequence example:
        //   AT+PDL?
        //   OK            <== result received after OK (as unsolicted notification)
        //   +PDL:0,...
        //   +PDL:1,...
        //   ...
        //   +PDL-1
        //
        private atCmdRspCallback_PDL( params ) 
        {
            this.atCmdPDL.updateInProgress = false;
            if( params.retCode == 0 && this.atCmdPDL.resolve )
            {
                //console.log("[" + params.cmdRsp + "] completed success: " + JSON.stringify(params));
                this.atCmdPDL.cached = true;
                this.atCmdPDL.resolve(params);
                this.atCmdPDL.resolve = null;
            }
            if( params.retCode < 0 && this.atCmdPDL.reject )
            {
                //console.log("[" + params.cmdRsp + "] completed failed: " + params.retCode);
                this.atCmdPDL.reject(params);
                this.atCmdPDL.reject = null;
            }
        }

        //
        // Support Functions
        //

        protected findPdlIndexByAddress( addr : string ) : {idx:number,errStatus:string}
        {
            if( !this.atCmdPDL.cached )
            {
                return {idx:-1, errStatus:"invalid PDL"};
            }

            var pdlRecs : PdlRec[] = this.atCmdPDL.pdlRecAryMap[AtCmdRec_PDL.gCnt];
            if( pdlRecs.length == 0 )
            {
                return {idx:-2, errStatus:"PDL is empty"};
            }

            for( var idx = 0; idx < pdlRecs.length; idx++ )
            {
                if( pdlRecs[idx].addr == addr )
                {
                    return {idx:idx, errStatus:"success"};
                }
            }

            return {idx:-3, errStatus:"address not in PDL"};
        }

        protected findPdlIndexOfPrimaryDevice() : {idx:number,errStatus:string}
        {
            return this.findPdlIndexOfConnectedDevice(0x5);
        }

        protected findPdlIndexOfSecondaryDevice() : {idx:number,errStatus:string}
        {
            return this.findPdlIndexOfConnectedDevice(0xA);
        }

        private findPdlIndexOfConnectedDevice(mask : number) : {idx:number,errStatus:string}
        {
            if( !this.atCmdPDL.cached )
            {
                return {idx:-1, errStatus:"invalid PDL"};
            }

            var pdlRecs : PdlRec[] = this.atCmdPDL.pdlRecAryMap[AtCmdRec_PDL.gCnt];
            if( pdlRecs.length == 0 )
            {
                return {idx:-2, errStatus:"PDL is empty"};
            }

            for( var idx = 0; idx < pdlRecs.length; idx++ )
            {
                if( (pdlRecs[idx].connectedProfile & mask) > 0 )
                {
                    return {idx:0, errStatus:"success"};
                }
            }

            return {idx:-3, errStatus:"primary device not exists"};
        }

        //
        // Custom Functions (other than setters/getters)
        //

        public refreshPdl() : Promise<any>
        {
            console.log("[refreshPdl] ...");
            if( this.atCmdPDL.updateInProgress )
            {
                var cmd = this.atCmdPDL.cmd;
                return new Promise( (resolve, reject) => {
                    console.log("[" + cmd + "] sent failed");
                    reject({"retCode":-1,"status":"refresh in progress"});
                });
            }

            this.atCmdPDL.cached = false;
            this.atCmdPDL.updateInProgress = true;

            var cmd = this.atCmdPDL.cmd;
            return new Promise((resolve, reject) => {
                this.atCmdPDL.resolve = resolve;
                this.atCmdPDL.reject = reject;
                this.atCmdRefresh(cmd).then( obj => {
                    //console.log("[" + cmd + "] sent ok");
                }).catch( obj => {
                    console.log("[" + cmd + "] sent failed");
                    reject({"retCode":-4,"status":"timeout expired"});
                    this.atCmdPDL.updateInProgress = false;
                    this.atCmdPDL.resolve = null;
                    this.atCmdPDL.reject = null;
                });
            });     
        }

        public removePDL( addr : string ) : Promise<any>
        {
            console.log("[removePDL] ...");
            var ret = this.findPdlIndexByAddress(addr);
            if( ret.idx < 0 )
            {
                return new Promise( (resolve, reject) => {
                    reject({"retCode":ret.idx,"status":ret.errStatus});
                });
            }
            
            var cmd = "AT+PDLR=" + ret.idx;
            return new Promise((resolve, reject) => {
                this.sendCmd(cmd, this.seqId++).then( obj => {
                    console.log("[" + cmd + "] sent ok");
                    resolve({"retCode":0,"status":"success"});
                    // Always refresh PDL after successfully removes a device
                    this.refreshPdl();
                }).catch( obj => {
                    console.log("[" + cmd + "] sent failed");
                    reject({"retCode":-4,"status":"timeout expired"});
                });
            });       
        }

        public connectDevice( addr : string ) : Promise<any>
        {
            console.log("[connectDevice] ...");
            var ret = this.findPdlIndexByAddress(addr);
            if( ret.idx < 0 )
            {
                return new Promise( (resolve, reject) => {
                    reject({"retCode":ret.idx,"status":ret.errStatus});
                });
            }
            
            var cmd = "AT+CN=1," + ret.idx;
            return new Promise((resolve, reject) => {
                this.sendCmd(cmd, this.seqId++).then( obj => {
                    console.log("[" + cmd + "] sent ok");
                    resolve({"retCode":0,"status":"success"});
                }).catch( obj => {
                    console.log("[" + cmd + "] sent failed");
                    reject({"retCode":-4,"status":"timeout expired"});
                });
            });  
        }

        public disconnectDevice( addr : string ) : Promise<any>
        {
            console.log("[disconnectDevice] ...");
            var ret = this.findPdlIndexByAddress(addr);
            if( ret.idx < 0 )
            {
                return new Promise( (resolve, reject) => {
                    reject({"retCode":ret.idx,"status":ret.errStatus});
                });
            }
            
            var cmd = "AT+CN=0," + ret.idx;
            return new Promise((resolve, reject) => {
                this.sendCmd(cmd, this.seqId++).then( obj => {
                    console.log("[" + cmd + "] sent ok");
                    resolve({"retCode":0,"status":"success"});
                }).catch( obj => {
                    console.log("[" + cmd + "] sent failed");
                    reject({"retCode":-4,"status":"timeout expired"});
                });
            });  
        }

        public isDeviceConnected( addr : string ) : boolean
        {
            var ret : {idx:number,errStatus:string};
            if( addr == null )
            {
                ret = this.findPdlIndexOfPrimaryDevice();
                if( ret.idx == -3 )
                {
                    ret = this.findPdlIndexOfSecondaryDevice();
                }
            }
            else
            {
                ret = this.findPdlIndexByAddress(addr);
            }
            
            if( ret.idx < 0 )
            {
                return false;
            }

            var connectedProfile = this.atCmdPDL.pdlRecAryMap[AtCmdRec_PDL.gCnt][ret.idx].connectedProfile;
            if( connectedProfile > 0 )
            {
                return true;
            }

            return false;
        }

        //
        // Setters
        //

        public setPairingOnOff( onOff : boolean ) : Promise<any>
        {
            var cmd = "AT+PR=" + (onOff ? 1 :0);
            return new Promise((resolve, reject) => {
                this.sendCmd(cmd, this.seqId++).then( obj => {
                    console.log("[" + cmd + "] sent ok");
                    resolve({"retCode":0,"status":"success"});
                }).catch( obj => {
                    console.log("[" + cmd + "] sent failed");
                    reject({"retCode":-1,"status":"timeout expired"});
                });
            });       
        }

        public setCodecMask( mask : number ) : Promise<any>
        {
            var cmd = "AT+CC=" + mask;
            return new Promise((resolve, reject) => {
                this.sendCmd(cmd, this.seqId++).then( obj => {
                    console.log("[" + cmd + "] sent ok");
                    this.atCmdCC.mask = mask;
                    resolve({"retCode":0,"status":"success"});
                }).catch( obj => {
                    console.log("[" + cmd + "] sent failed");
                    reject({"retCode":-1,"status":"timeout expired"});
                });
            });       
        }

        public setVolume( vol : number ) : Promise<any>
        {
            var cmd = "AT+VL=0,0,10," + vol;
            return new Promise((resolve, reject) => {
                this.sendCmd(cmd, this.seqId++).then( obj => {
                    console.log("[" + cmd + "] sent ok");
                    this.atCmdVL.vol = vol;
                    resolve({"retCode":0,"status":"success"});
                }).catch( obj => {
                    console.log("[" + cmd + "] sent failed");
                    reject({"retCode":-1,"status":"timeout expired"});
                });
            });       
        }

        //
        // Getters
        //

        public getPdlImmediate() : any
        {
            if( this.atCmdPDL.cached )
            {
                return {"pdl" : this.atCmdPDL.pdlRecAryMap[AtCmdRec_PDL.gCnt]};
            }

            return null;
        }

        public getPdl(cache : boolean = true) : Promise<any>
        {
            if( cache && this.atCmdPDL.cached )
            {
                return new Promise ((resolve, reject) => {
                    resolve({"pdl" : this.atCmdPDL.pdlRecAryMap[AtCmdRec_PDL.gCnt]});
                });
            }

            return this.refreshPdl();
        }

        public getPrimaryDeviceAddress() : string
        {
            var ret = this.findPdlIndexOfPrimaryDevice();
            if( ret.idx < 0 )
            {
                return null;
            }

            return this.atCmdPDL.pdlRecAryMap[AtCmdRec_PDL.gCnt][ret.idx].addr;
        }

        public getSecondaryDeviceAddress() : string
        {
            var ret = this.findPdlIndexOfSecondaryDevice();
            if( ret.idx < 0 )
            {
                return null;
            }

            return this.atCmdPDL.pdlRecAryMap[AtCmdRec_PDL.gCnt][ret.idx].addr;
        }

        public getPrimaryDeviceRemoteName() : string
        {
            var ret = this.findPdlIndexOfPrimaryDevice();
            if( ret.idx < 0 )
            {
                return null;
            }

            return this.atCmdPDL.pdlRecAryMap[AtCmdRec_PDL.gCnt][ret.idx].remoteDevName;
        }

        public getSecondaryDeviceRemoteName() : string
        {
            var ret = this.findPdlIndexOfSecondaryDevice();
            if( ret.idx < 0 )
            {
                return null;
            }

            return this.atCmdPDL.pdlRecAryMap[AtCmdRec_PDL.gCnt][ret.idx].remoteDevName;
        }

        public getCodecMask(cache : boolean = true) : Promise<any>
        {
            if( cache &&  this.atCmdCC.cached )
            {
                return new Promise ((resolve, reject) => {
                    resolve(this.atCmdCC.mask);
                });
            }

            var cmd = this.atCmdCC.cmd;
            return new Promise((resolve, reject) => {
                this.atCmdRefresh(cmd).then( obj => {
                    console.log("[" + cmd + "] sent ok");
                    resolve(this.atCmdCC.mask);
                }).catch( obj => {
                    console.log("[" + cmd + "] sent failed");
                    reject({"retCode":-1,"status":"timeout expired"});
                });
            });
        }

        public getStreamState(cache : boolean = true) : Promise<any>
        {
            if( this.atCmdCR.cached )
            {
                return new Promise ((resolve, reject) => {
                    if( this.atCmdCR.codecCode == -1 )
                    {
                        reject({"retCode":-2,"status":"not updated yet"});
                    }
                    else
                    {
                        var codecCode = this.atCmdCR.codecCode;
                        resolve({
                            "retCode" : 0,
                            'connCount' : this.atCmdCR.connCount,
                            'codecCode' : codecCode, 
                            'codecCodeStr' : this.atCmdCR.codecStrs[codecCode]
                        });
                    }
                });
            }

            return new Promise ((resolve, reject) => {
                reject({"retCode":-2,"status":"not updated yet"});
            });
        }

        public getDeviceState(cache : boolean = true) : Promise<any>
        {
            if( cache && this.atCmdDS.cached )
            {
                return new Promise ((resolve, reject) => {
                    var stateCode = this.atCmdDS.deviceState;
                    resolve({'stateCode' : stateCode, 'state' : this.atCmdDS.deviceStateStrs[stateCode]});
                });
            }

            var cmd = this.atCmdDS.cmd;
            return new Promise((resolve, reject) => {
                this.atCmdRefresh(cmd).then( obj => {
                    console.log("[" + cmd + "] sent ok");
                    var stateCode = this.atCmdDS.deviceState;
                    resolve({'stateCode' : stateCode, 'state' : this.atCmdDS.deviceStateStrs[stateCode]});
                }).catch( obj => {
                    console.log("[" + cmd + "] sent failed");
                    reject({"retCode":-1,"status":"timeout expired"});
                });
            });
        }


        public getVolume(cache : boolean = true) : Promise<any>
        {
            if( cache &&  this.atCmdVL.cached )
            {
                return new Promise ((resolve, reject) => {
                    resolve(this.atCmdVL.vol);
                });
            }

            var cmd = this.atCmdVL.cmd;
            return new Promise((resolve, reject) => {
                this.atCmdRefresh(cmd).then( ret => {
                    console.log("[" + cmd + "] sent ok");
                    resolve(ret.volume);
                }).catch( obj => {
                    console.log("[" + cmd + "] sent failed");
                    reject({"retCode":-1,"status":"timeout expired"});
                });
            });
        }

    }

    interface Map<T> {
        [s : number] : T;
    }

    export interface PdlRec 
    {
        idx : number;
        displayName : string;
        addr : string;
        addrType : AddrType;
        isPhoneProvisioned : boolean;
        isMusicProvisioned : boolean;
        isPhoneConnected : ConnectState;
        isMusicConnected : ConnectState;
        provisionProfile : number;
        connectedProfile : number;
        remoteDevName : string;
    }

    interface PdlRecMap extends Map<PdlRec[]>
    {
    }

    //
    // AT+PDL? AT-CMD Record
    //

    export class AtCmdRec_PDL extends ATCMDHDL.AtCmdRec 
    {
        static gCnt = 0;

        public pdlRecAryMap : PdlRecMap;
        public updateInProgress : boolean;

        constructor(
            uuid : string,
            cb : ( obj : {} ) => void,
            events : Events
        )
        {
            super(uuid, 'AT+PDL?', "\\+PDL\\:(-?[0-9]+)(?:,(.+),([0-9]+),(0x[0-9a-fA-F]+),(0x[0-9a-fA-F]+),(.*))?", cb, events);
            this.pdlRecAryMap = <PdlRecMap>{};
        }

        match(matchAry : any[]) 
        {
            var idx = +matchAry[1];
            var pdlRec : PdlRec;

            //console.log("[AtCmdRec_PDL] match: " + matchAry[0]);

            if( idx == -1 )
            {

                // Last one received
                // - clear the previous map record.
                if( this.pdlRecAryMap[AtCmdRec_PDL.gCnt-1])
                {
                    delete this.pdlRecAryMap[AtCmdRec_PDL.gCnt-1];
                }

                this.params = { "pdl" : this.pdlRecAryMap[AtCmdRec_PDL.gCnt] };
                this.params['seqid'] = this.seqId;
                this.params['uuid'] = this.uuid;
                this.params['cmdRsp'] = "+PDL:";
                this.params['retCode'] = 0;
                this.params['status'] = "success";

                //console.log(this.params);

                // Notify
                super.match(matchAry);
                return;
            }
            else
            {
                var addr = matchAry[2];
                var addrType = <AddrType>+matchAry[3];
                var provisionProfile = parseInt(matchAry[4],16);
                var connectedProfile = parseInt(matchAry[5],16);
                var remoteDevName = matchAry[6];
                var isPhoneProvisioned : boolean = false;
                var isMusicProvisioned : boolean = false;                
                var isPhoneConnected : ConnectState = ConnectState.NONE;
                var isMusicConnected : ConnectState = ConnectState.NONE;
    
                if( provisionProfile & 0x1 )
                {
                    isPhoneProvisioned = true;
                }

                if( provisionProfile & 0xc )
                {
                    isMusicProvisioned = true;
                }

                // Determine call/phone connect status
                // - only primary phone is supported
                if( (connectedProfile & 0x3) == 0x1 )
                {
                    isPhoneConnected = ConnectState.PRIMARY;
                }
                else if( (connectedProfile & 0x3) != 0x0 )
                {
                    isPhoneConnected = ConnectState.ERROR;
                }

                // Determine a2dp/music connect status
                if( (connectedProfile & 0xc) )
                {
                    isMusicConnected = ConnectState.ERROR;
                }
                else if( connectedProfile & 0x4 )
                {
                    if( connectedProfile & 0x10 )
                    {
                        isMusicConnected = ConnectState.PRIMARY;
                    }
                    else if( connectedProfile & 0x20 )
                    {
                        isMusicConnected = ConnectState.SECONDARY;
                    }
                    else
                    {
                        isMusicConnected = ConnectState.ERROR;
                    }
                }
                
                pdlRec = 
                { 
                    idx : idx,
                    displayName : remoteDevName.length > 0 ?remoteDevName :addr, 
                    addr : addr, 
                    addrType : addrType,
                    isPhoneProvisioned : isPhoneProvisioned,
                    isMusicProvisioned : isMusicProvisioned,
                    isPhoneConnected : isPhoneConnected, 
                    isMusicConnected : isMusicConnected,
                    provisionProfile : provisionProfile, 
                    connectedProfile : connectedProfile,
                    remoteDevName : remoteDevName
                };
                
                if( idx == 0 )
                {
                    AtCmdRec_PDL.gCnt++;
                }
            }

            var seqId = AtCmdRec_PDL.gCnt;
            var pdlRecAry = this.pdlRecAryMap[seqId];

            if( !pdlRecAry )
            {
                pdlRecAry = [];
                this.pdlRecAryMap[seqId] = pdlRecAry;
            }
            
            pdlRecAry.push(pdlRec);        
        }
    }

    //
    // AT+DS? AT-CMD Record
    //

    export class AtCmdRec_DS extends ATCMDHDL.AtCmdRec 
    {
        public deviceState : DeviceState;
        public deviceStateStrs : string[];

        constructor(
            uuid : string,
            cb : ( obj : {} ) => void,
            events : Events
        )
        {
            super(uuid, 'AT+DS?', "\\+DS\\:([0-9]+)", cb, events);
            this.deviceState = DeviceState.INIT;
            this.deviceStateStrs = ["INIT", "PWR_OFF", "TEST", "IDLE", "CONNECTABLE", "DISCOVERABLE", "CONNECTING", "INQUIRING", "CONNECTED", "CONFIG"];
 
            // Enable broadcast
            this.eventId = "QCC_SRC_DEVICE_STATE_CHANGED";
        }

        match(matchAry : any[]) 
        {
            this.deviceState = <DeviceState>+matchAry[1];
            this.params = 
            {
                "cmdRsp" : "+DS:",
                "uuid" : this.uuid,
                "seqId" : this.seqId,
                "retCode" : 0, 
                "status" : "success",
                "stateCode" : this.deviceState,
                "state" : this.deviceStateStrs[this.deviceState],
            }

            // Always put this to last
            super.match(matchAry);
        }
    }

    //
    // AT+CC? AT-CMD Record
    //

    export class AtCmdRec_CC extends ATCMDHDL.AtCmdRec 
    {
        public mask : number;

        constructor(
            uuid : string,
            cb : ( obj : {} ) => void,
            events : Events
        )
        {
            super(uuid, 'AT+CC?', "\\+CC\\:(.+)", cb, events);
            this.mask = 0;
        }

        match(matchAry : any[]) 
        {
            this.mask = +matchAry[1];
            this.params = 
            {
                "cmdRsp" : "+CC:",
                "uuid" : this.uuid,
                "seqId" : this.seqId,
                "retCode" : 0,
                "status" : "success",
                "mask" : this.mask
            }

            // Always put this to last
            super.match(matchAry);
        }
    }

    //
    // AT+CR? AT-CMD Record
    //

    export class AtCmdRec_CR extends ATCMDHDL.AtCmdRec 
    {
        public connCount : number;
        public codecCode : number;
        public codecStrs : string[];

        constructor(
            uuid : string,
            cb : ( obj : {} ) => void,
            events : Events
        )
        {
            // Notification only
            // - there is no AT+CR? command.
            // - but will set that anyways
            super(uuid, 'AT+CR?', "\\+CR\\:([0-9]+),([0-9]+)", cb, events);
            this.connCount = 0;
            this.codecCode = -1;
            this.codecStrs = ["UNKNOWN", "SBC", "FASTSTREAM", "APTX", "APTX-LL", "APTX-HD"];

            // Enable broadcast
            this.eventId = "QCC_SRC_STREAM_STATE_CHANGED";
        }

        match(matchAry : any[]) 
        {
            this.connCount = +matchAry[1];
            this.codecCode = +matchAry[2];

            this.params = 
            {
                "cmdRsp" : "+CR:",
                "uuid" : this.uuid,
                "seqId" : this.seqId,
                "retCode" : 0,
                "status" : "success",
                "connCount" : this.connCount,
                "codecCode" : this.codecCode,
                "codec" : this.codecStrs[this.codecCode]
            }

            // Always put this to last
            super.match(matchAry);
        }
    }

    //
    // AT+VL? AT-CMD Record
    //

    export class AtCmdRec_VL extends ATCMDHDL.AtCmdRec 
    {
        public vol : number;

        constructor(
            uuid : string,
            cb : ( obj : {} ) => void,
            events : Events
        )
        {
            super(uuid, 'AT+VL?', "\\+VL\\:([0-9]+),([0-9]+),([0-9]+),([0-9]+)", cb, events);
            this.vol = 0;

            // Enable broadcast
            this.eventId = "QCC_SRC_VOLUME_CHANGED";
        }

        match(matchAry : any[]) 
        {
            this.vol = +matchAry[4];
            this.params = 
            {
                "cmdRsp" : "+VL:",
                "uuid" : this.uuid,
                "seqId" : this.seqId,
                "retCode" : 0,
                "status" : "success",
                "volume" : this.vol
            }
            // Always put this to last
            super.match(matchAry);
        }
    }

    //
    // AT+PDLU PDL Change Notifcation
    //

    export class AtCmdRec_PDLU extends ATCMDHDL.AtCmdRec 
    {
        constructor(
            uuid : string,
            cb : ( obj : {} ) => void,
            events : Events
        )
        {
            super(uuid, 'AT+PDLU?', "\\+PDLU\\:(.+)", cb, events);

            // Enable broadcast
            this.eventId = "QCC_SRC_PDL_CHANGED";
        }

        match(matchAry : any[]) 
        {
            var firstAddr = +matchAry[1];
            this.params = 
            {
                "cmdRsp" : "+PDLU:",
                "uuid" : this.uuid,
                "seqId" : this.seqId,
                "retCode" : 0,
                "status" : "success",
                "firstAddr" : firstAddr
            }
            // Always put this to last
            super.match(matchAry);
        }
    }

    //
    // Register subclass with base class
    // - this will allow AtCmdHandler to create an instance of AtCmdHandler_QCC_SRC
    //
    ATCMDHDL.AtCmdHandler.registerSubClass('QCC_SRC', AtCmdHandler_QCC_SRC.createInstance)

}  // namespace ATCMDHDLQCCSRC

