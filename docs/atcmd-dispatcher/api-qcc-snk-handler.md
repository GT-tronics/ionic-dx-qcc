# QCC-SNK AT Command Handler
## Methods
* [Refresh PDL](#refresh-pdl)
* [Remove PDL](#remove-pdl)
* [Connect Device](#connect-device)
* [Disconnect Device](#disconnect-device)
* [Refresh RSSI](#refresh-rssi)
* [Set Local Bluetooth Name](#set-local-bluetooth-name)
* [Set Volume Sync](#set-volume-sync)
* [Set Sleep Mode](#set-sleep-mode)
* [Set Power On Pairing](#set-power-on-pairing)
* [Set Stop Connect Attempt](#set-stop-connect-attempt)
* [Set Connect Attempt Repeat](#set-connect-attempt-repeat)
* [Set Pairing Timeout To](#set-pairing-timeout-to)
* [Set Connect Policy](#set-connect-policy)
* [Set Volume](#set-volume)
* [Set Pairing On/Off](#set-pairing-on/off)
* [Set Codec Mask](#set-codec-mask)
* [Set EQ Bank Index](#set-eq-bank-index)
* [Set EQ Bass](#set-eq-bass)
* [Set EQ 3D](#set-eq-3d)
* [Set Timer](#set-timer)
* [Get PDL](#get-pdl)
* [Get Local Bluetooth Name](#get-local-bluetooth-name)
* [Get Primary Device Address](#get-primary-device-address)
* [Get Secondary Device Address](#get-secondary-device-address)
* [Get Primary Device Remote Name](#get-primary-device-remote-name)
* [Get Secondary Device Remote Name](#get-secondary-device-remote-name)
* [Get Sleep Mode](#get-sleep-mode)
* [Get Volume Sync](#get-volume-sync)
* [Get Power On Pairing](#get-power-on-pairing)
* [Get Power On Connect](#get-power-on-connect)
* [Get Stop Connect Attempt](#get-stop-connect-attempt)
* [Get Power On Pairing](#get-power-on-pairing)
* [Get Pairing Timeout To](#get-pairing-timeout-to)
* [Get Connect Policy](#get-connect-policy)
* [Get Stream State](#get-stream-state)
* [Get Device State](#get-device-state)
* [Get Play State](#get-play-state)
* [Get Volume](#get-volume)
* [Get Codec Mask](#get-codec-mask)
* [Get Bank Index](#get-bank-index)
* [Get EQ PEQ Parameters](#get-eq-peq-parameters)
* [Get Timer Value](#get-timer-value)
## Event Notifications
Event notification is implemented as [Ionic Event](https://ionicframework.com/docs/api/util/Events/). To receive the notification, import the "Events" service and subscribe the event with the EventId string for each event.  
* [BLE Device Changed Event](#ble-device-changed-event) 
* [PDL Changed Event](#pdl-changed-event)
* [RSSI Changed Event](#rssi-changed-event)
* [Volume Changed Event](#volume-changed-event)
* [Stream State Changed Event](#stream-state-changed-event)
* [Device State Changed Event](#device-state-changed-event)

## Refresh PDL
refreshPDL() : Promise
### Description
* refresh the Pairing Device List (PDL)
* the PDL content are stored in *atCmdPDL.pdlRecAryMap* object.
    * use the atCmdPDL.seqId (:number) to locate the pdlRecAry.
* please note:
    * always check the *atCmdPDL.invalid* variable to make sure the contents are valid before accessing *atCmdPDL.pdlRecAryMap* object.
    * order of the pdlRecAry (i.e. the index) can be changed after a new device is connected. Use the BT address as the key instead.
### Parameters
* None
### Return
* Promise
    * then object
        ```
        {
            'seqid' : number (sequence id),
            'uuid'  : string (device UUID)
            'cmdRsp' : string ("+PDL:")
            'retCode' : number (0)
            {
                seqId : 
                [
                    'idx' : number (PDL index), 
                    'addr' : string (BT address), 
                    'addrType' : number (adress type), 
                    'provisionProfile' : number (provisioned profile), 
                    'connectedProfile' : number (connectedProfile),
                    'remoteDevName' : string (remote name)
                ],
                ...
            }
        }
        ```
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
### Event Notification
* event id : "QCC_SNK_PDL_CHANGED"
* event object
    ```
    {
        'seqid' : number (sequence id),
        'uuid'  : string (device UUID)
        'cmdRsp' : string ("+PDL:")
        'retCode' : number (0)
        'status' : string ("success")
        {
            seqId : 
            [
                'idx' : number (PDL index), 
                'addr' : string (BT address), 
                'addrType' : number (adress type), 
                'provisionProfile' : number (provisioned profile), 
                'connectedProfile' : number (connectedProfile),
                'remoteDevName' : string (remote name)
            ],
            ...
        }
    }
    ```
### Example
```
```

## Remove PDL
removePDL(addr : string) : Promise
### Description:
* remove a particular device from Pairing Device List (PDL)
* please note:
    * removing a device from PDL will 1st disconnect the device if it was connected.
    * after succesfully removed a device, the PDL will be refreshed
### Parameters
* addr : string
    * bluetooth address 
### Return
* Promise
    * then object
        ```
        {
            'retCode' : number (0)
            'status' : string ("success")
        }
        ```
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : PDL is invalid
        * -2 : PDL is empty
        * -3 : address not in PDL
        * -4 : timeout
### Example
```
```

## Connect Device
connectDevice(addr : string) : Promise
### Description:
* connect a particular device from Pairing Device List (PDL)
### Parameters
* addr : string
    * bluetooth address 
### Return
* Promise
    * then object
        ```
        {
            'retCode' : number (0)
            'status' : string ("success")
        }
        ```
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : PDL is invalid
        * -2 : PDL is empty
        * -3 : address not in PDL
        * -4 : timeout
### Example
```
```

## Disconnect Device
disconnectDevice(addr : string) : Promise
### Description:
* disconnect a particular device from Pairing Device List (PDL)
### Parameters
* addr : string
    * bluetooth address 
### Return
* Promise
    * then object
        ```
        {
            'retCode' : number (0)
            'status' : string ("success")
        }
        ```
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : PDL is invalid
        * -2 : PDL is empty
        * -3 : address not in PDL
        * -4 : timeout
### Example
```
```

## Refresh RSSI
refreshRssi(addr : string) : Promise
### Description:
* refresh RSSI (received power) of a particular device from Pairing Device List
### Parameters
* addr : string
    * bluetooth address 
### Return
* Promise
    * then object
        ```
        {
            'retCode' : number ( 0 - success, -5 - invalid RSSI)
            'status' : string ("success" or "invalid rssi")
            'cmdRsp' : '+RSQ:'
            'uuid' : string ( device UUID )
            'seqId' : number ( command sequence id )
            'addr' : string( remote device bluetooth address )
            'rssi' : number ( received power value )
        }
        ```
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : PDL is invalid
        * -2 : PDL is empty
        * -3 : address not in PDL
        * -4 : timeout
        * -5 : invalid RSSI
### Example
```
```

## Set Local Bluetooth Name
setLocalBluetoothName(name : string) : Promise
### Description:
* set local bluetooth name
* this name will appear in the native Bluetooth setting's discovered and paired list on the mobile device.
### Parameters
* name : string
    * local bluetooth name 
### Return
* Promise
    * then object
        ```
        {
            'retCode' : number (0)
            'status' : string ("success")
        }
        ```
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
### Example
```
```

## Set Volume Sync
setVolumeSync(volSync : boolean) : Promise
### Description:
* set volume sync mode
* if sync is on, changing volume in the device will automatically adjustment in the mobile vice versa.
### Parameters
* volSync : boolean
    * true : volume sync is on
    * false : volume sync is off 
### Return
* Promise
    * then object
        ```
        {
            'retCode' : number (0)
            'status' : string ("success")
        }
        ```
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
### Example
```
```

## Set Sleep Mode
setSleepMode(sleepMode : SleepMode) : Promise
### Description:
* set sleep mode
### Parameters
* sleepMode : SleepMode
    * 0 - SleepMode.NORMAL
    * 1 - SleepMode.LED_OFF
### Return
* Promise
    * then object
        ```
        {
            'retCode' : number (0)
            'status' : string ("success")
        }
        ```
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
### Example
```
```

## Set Power On Pairing
setPowerOnPairing(onOff : boolean) : Promise
### Description:
* set power on pairing
### Parameters
* onOff : boolean
    * true : power on will enter into pairing mode
    * false : power on will not enter into pairing mode 
### Return
* Promise
    * then object
        ```
        {
            'retCode' : number (0)
            'status' : string ("success")
        }
        ```
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
### Example
```
```

## Set Stop Connect Attempt
setStopConnectAttempt(onOff : boolean) : Promise
### Description:
* set stop connect attempt
### Parameters
* onOff : boolean
    * true : stop any connect attempt immediately
    * false : otherwise 
### Return
* Promise
    * then object
        ```
        {
            'retCode' : number (0)
            'status' : string ("success")
        }
        ```
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
### Example
```
```

## Set Connect Attempt Repeat
setConnectAttmeptRepeat(repeat : number) : Promise
### Description:
* set connect attempt repeat
### Parameters
* repeat : number
    * number of repeat connect attempt
### Return
* Promise
    * then object
        ```
        {
            'retCode' : number (0)
            'status' : string ("success")
        }
        ```
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
### Example
```
```

## Set Pairing Timeout To
setPairingTimeoutTo(pairingTimoutTo : PairingTimeoutTo) : Promise
### Description:
* set pariing timeout to
### Parameters
* pairingTimoutTo : PairingTimeoutTo
    * 0 - PairingTimoutTo.IDLE : 0 
    * 1 - PairingTimoutTo.CONNECTABLE
### Return
* Promise
    * then object
        ```
        {
            'retCode' : number (0)
            'status' : string ("success")
        }
        ```
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
### Example
```
```

## Set Connect Policy
setConnectPolicy(connectPolicy : ConnectPolicy) : Promise
### Description:
* set connect policy
### Parameters
* connectPolicy : ConnectPolicy
    * 0 - PairingTimoutTo.CONNECT_TO_LAST
    * 1 - ConnectPolicy.CONNECT_TO_LIST 
### Return
* Promise
    * then object
        ```
        {
            'retCode' : number (0)
            'status' : string ("success")
        }
        ```
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
### Example
```
```

## Set Volume
setVolume(vol : number) : Promise
### Description:
* set Volume level
### Parameters
* vol : number
    * 0 - 999 representing 0 to 99.9%
### Return
* Promise
    * then object
        ```
        {
            'retCode' : number (0)
            'status' : string ("success")
        }
        ```
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
### Example
```
```

## Set Pairing On/Off
setPairingOnOff(onOff : boolean) : Promise
### Description:
* set pairing on or off
### Parameters
* trackDir : TrackDir
    * 0 - pairing off
    * 1 - pairing on
### Return
* Promise
    * then object
        ```
        {
            'retCode' : number (0)
            'status' : string ("success")
        }
        ```
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
### Example
```
```

## Set Codec Mask
setCodecMask(mask : number) : Promise
### Description:
* set codec mask
### Parameters
* mask : number
    * 4 bits in the mask to represent the following codec
        * bit 0 - aptx
        * bit 1 - aptx-ll
        * bit 2 - aptx-hd
        * bit 3 - AAC
### Return
* Promise
    * then object
        ```
        {
            'retCode' : number (0)
            'status' : string ("success")
        }
        ```
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
### Example
```
```

## Set EQ Bank Index
setEqBankIndex(bankIdx : number) : Promise
### Description:
* set EQ bank index
### Parameters
* bankIdx : number
    * Range 0 - 4 
### Return
* Promise
    * then object
        ```
        {
            'retCode' : number (0)
            'status' : string ("success")
        }
        ```
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
### Example
```
```

## Set EQ Bass
setEqBass(onOff : boolean) : Promise
### Description:
* set EQ bass
### Parameters
* onOff : boolean
    * true : EQ bass on
    * false : EQ bass off
### Return
* Promise
    * then object
        ```
        {
            'retCode' : number (0)
            'status' : string ("success")
        }
        ```
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
### Example
```
```

## Set EQ 3D
setEq3D(onOff : boolean) : Promise
### Description:
* set EQ 3D
### Parameters
* onOff : boolean
    * true : EQ 3D enhancement on
    * false : EQ 3D enhancement off
### Return
* Promise
    * then object
        ```
        {
            'retCode' : number (0)
            'status' : string ("success")
        }
        ```
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
### Example
```
```

## Set Timer
setEqUserEq(timer : TimerKey, val : number) : Promise
### Description:
* set timer
### Parameters
* timer : TimerKey
    * true : User EQ on
* val : number
    * timer value
### Return
* Promise
    * then object
        ```
        {
            'retCode' : number (0)
            'status' : string ("success")
        }
        ```
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
### Example
```
```

## Get PDL
getPdl(cache : boolean) : Promise
### Description:
* get PDL
* cache default is true that it always takes the cached values
### Parameters
* cache : boolean
    * false : refresh before taking the name
    * true : take the cache value
### Return
* Promise
    * then object
        ```
        [
            {
                'idx' : number (PDL index), 
                'addr' : string (BT address), 
                'addrType' : number (adress type),
                isPhoneProvisoned : boolean,
                isMusicProvisioned : boolean,
                isPhoneConnected : ConnectState : { 0 - no, 1 - primary, 2 - secondary } 
                isMusicConnected : ConnectState : { 0 - no, 1 - primary, 2 - secondary } 
                'remoteDevName' : string (remote name)
            },
            ...
        ],
        ```
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
### Example
```
```

## Get Local Bluetooth Name
getLocalBluetoothName(cache : boolean) : Promise
### Description:
* get local device name
* cache default is true that it always takes the cached values
### Parameters
* cache : boolean
    * false : refresh before taking the name
    * true : take the cache value
### Return
* Promise
    * then object
        ```
        name : string
        ```
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
### Example
```
```

## Get Primary Device Address
getPrimaryDeviceAddress() : string
### Description:
* get primary device address
* no option for cache or not. If cache is not available it will return failure.
### Parameters
* None
### Return
* address : string (or null if failed)
### Example
```
```

## Get Secondary Device Address
getSecondaryDeviceAddress() : string
### Description:
* get secondary device address
* no option for cache or not. If cache is not available it will return failure.
### Parameters
* None
### Return
* address : string (or null if failed)
### Example
```
```

## Get Primary Device Remote Name
getPrimaryDeviceRemoteName() : string
### Description:
* get primary device remote name
* no option for cache or not. If cache is not available it will return failure.
### Parameters
* None
### Return
* remoteName : string (or null if failed)
### Example
```
```

## Get Secondary Device Remote Name
getSecondaryDeviceRemoteName() : string
### Description:
* get secondary device remote name
* no option for cache or not. If cache is not available it will return failure.
### Parameters
* None
### Return
* remoteName : string (or null if failed)
### Example
```
```

## Get Sleep Mode
getSleepMode(cache : boolean) : Promise
### Description:
* get sleep mode
* cache default is true that it always take the cache value if it is available
### Parameters
* cache : boolean
    * false : refresh before taking the value
    * true : take the cached value
### Return
* Promise
    * then object
        ```
        sleepMode : SleepMode
        ```
        * 0 - SleepMode.NORMAL
        * 1 - SleepMode.LED_OFF
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
### Example
```
```

## Get Volume Sync
getVolumeSync(cache : boolean) : Promise
### Description:
* get volume sync
* cache default is true that it always take the cache value if it is available
### Parameters
* cache : boolean
    * false : refresh before taking the value
    * true : take the cached value
### Return
* Promise
    * then object
        ```
        volSync : boolean
        ```
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
### Example
```
```

## Get Power On Pairing
getPowerOnPairing(cache : boolean) : Promise
### Description:
* get power on pairing
* cache default is true that it always take the cache value if it is available
### Parameters
* cache : boolean
    * false : refresh before taking the value
    * true : take the cached value
### Return
* Promise
    * then object
        ```
        pwrOnPairing : boolean
        ```
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
### Example
```
```

## Get Power On Connect
getPowerOnConnect(cache : boolean) : Promise
### Description:
* get power on pairing
* cache default is true that it always take the cache value if it is available
### Parameters
* cache : boolean
    * false : refresh before taking the value
    * true : take the cached value
### Return
* Promise
    * then object
        ```
        pwrOnPConnect : boolean
        ```
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
### Example
```
```

## Get Stop Connect Attempt
getStopConnectAttempt(cache : boolean) : Promise
### Description:
* get stop connect attempt
* cache default is true that it always take the cache value if it is available
### Parameters
* cache : boolean
    * false : refresh before taking the value
    * true : take the cached value
### Return
* Promise
    * then object
        ```
        stopConnectAttempt : boolean
        ```
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
### Example
```
```

## Get Power On Pairing
getPConnectAttemptRepeat(cache : boolean) : Promise
### Description:
* get connect attempt repeat
* cache default is true that it always take the cache value if it is available
### Parameters
* cache : boolean
    * false : refresh before taking the value
    * true : take the cached value
### Return
* Promise
    * then object
        ```
        connectAttemptRepeat : number
        ```
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
### Example
```
```

## Get Pairing Timeout To
getPairingTimeoutTo(cache : boolean) : Promise
### Description:
* get power on pairing
* cache default is true that it always take the cache value if it is available
### Parameters
* cache : boolean
    * false : refresh before taking the value
    * true : take the cached value
### Return
* Promise
    * then object
        ```
        pairingTimeoutTo : PairingTimeoutTo
        ```
        * 0 - PairingTimeoutTo.IDLE
        * 1 - PairingTImeoutTo.CONNECTABLE
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
### Example
```
```

## Get Connect Policy
getConnectPolicy(cache : boolean) : Promise
### Description:
* get connect policy
* cache default is true that it always take the cache value if it is available
### Parameters
* cache : boolean
    * false : refresh before taking the value
    * true : take the cached value
### Return
* Promise
    * then object
        ```
        connectPolicy : ConnectPolicy
        ```
        0 - ConnectPolicy.CONNECT_TO_LAST
        1 - ConnectPolicy.CONNECT_TO_LIST
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
### Example
```
```

## Get Stream State
getStreamState(cache : boolean) : Promise
### Description:
* get stream state
* cache default is true that it always take the cache value
* use this to show the current codec and play status
    * e.g. action = "connect" and codec = "SBC" mean it is streaming with SBC codec.
    * e.g. action = "disconnect" means streaming is stopped.
### Parameters
* cache : boolean
    * false : refresh before taking the value
    * true : take the cached value
### Return
* Promise
    * then object
        ```
        {
            'addr' : string (remote device bluetooth address)
            'action' : string("connect" or "disconnect")
            'codecCode' : number (0 - 4 represent the codec)
            'codec' : string ("SBC", "APTX", "APTX-LL", "APTX-HD", "AAC")
        }
        ```
        * notes:
            * the return object shows the last changed events
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
        * -2 : not updated yet
### Example
```
```

## Get Device State
getDeviceState(cache : boolean) : Promise
### Description:
* get device state
* cache default is true that it always take the cache value if it is available
### Parameters
* cache : boolean
    * false : refresh before taking the value
    * true : take the cached value
### Return
* Promise
    * then object
        ```
        {
            'stateCode' : number (0 - 13 represent the state)
            'state' : string ("IDLE", "CONNECTABLE", "DISCOVERABLE", "CONNECTED", "OCE", "ICE", "ACTIVE_CALL", "TEST", "TWC_WAIT", "TWC_ON_HOLD", "TWC_MULTI_CALL", "ACTIVE_CALL_NO_SCO", "A2DP_STREAMING", or "IN_CONFIG_MODE")
        }
        ```
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
### Example
```
```

## Get Play State
getPlayState(cache : boolean) : Promise
### Description:
* get audio play state
* cache default is true that it always take the cache value if it is available
### Parameters
* cache : boolean
    * false : refresh before taking the value
    * true : take the cached value
### Return
* Promise
    * then object
        ```
        playState : PlayState
        ```
        0 - PlayState.PAUSE
        1 - PlayState.PLAYING
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
### Example
```
```

## Get Volume
getVolume(cache : boolean) : Promise
### Description:
* get volume level
* cache default is true that it always take the cache value if it is available
### Parameters
* cache : boolean
    * false : refresh before taking the value
    * true : take the cached value
### Return
* Promise
    * then object
        ```
        vol : number
        ```
        0 - 9999 - 0 to 99.9%
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
### Example
```
```

## Get Codec Mask
getCodecMask(cache : boolean) : Promise
### Description:
* get codec mask config
* cache default is true that it always take the cache value if it is available
### Parameters
* cache : boolean
    * false : refresh before taking the value
    * true : take the cached value
### Return
* Promise
    * then object
        ```
        mask : number
        
        bit 0 - APT-X
        bit 1 - APT-X-LL
        bit 2 - APT-X-HD
        bit 3 - AAC
        ```
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
### Example
```
```

## Get Bank Index
getEqBnakIndex(cache : boolean) : Promise
### Description:
* get current EQ bank index
* cache default is true that it always take the cache value if it is available
### Parameters
* cache : boolean
    * false : refresh before taking the value
    * true : take the cached value
### Return
* Promise
    * then object
        ```
        bankIdx : number
        ```
        0 - 5 - current bank number
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
### Example
```
```

## Get EQ PEQ Parameters
getEqPEQParameters(cache : boolean) : Promise
### Description:
* get EQ PEQ parameters
* cache default is true that it always take the cache value if it is available
### Parameters
* cache : boolean
    * false : refresh before taking the value
    * true : take the cached value
### Return
* Promise
    * then object
        ```
        hexStr : string
        ```
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
### Example
```
```

## Get Timer Value
getTimerValue(cache : boolean) : Promise
### Description:
* get timer value
* cache default is true that it always take the cache value if it is available
### Parameters
* cache : boolean
    * false : refresh before taking the value
    * true : take the cached value
### Return
* Promise
    * then object
        ```
        {
            "timer" : number,
            "value" : number
        }
        ```
    * catch object
        ```
        {
            'retCode' : number (error code)
            'status' : string (error description)
        }
        ```
        retCode
        * -1 : timeout
### Example
```
```

## BLE Device Changed Event
* event id : "BLE_DEV_CHANGED"
* event object
    ```
    {
        'action' : string ('connect' or 'disconnect')
        'uuid' : string (device UUID)
        'name' : string (device name)
        'info' : 
            {
                ... (TBD)
            }
    }
    ```

## PDL Changed Event
* event id : "QCC_SNK_PDL_CHANGED"
* event object
    ```
    {
        'retCode' : number (0)
        'status' : string ("success")
        'seqid' : number (sequence id),
        'uuid'  : string (device UUID)
        'cmdRsp' : string ("+PDL:")
        {
            seqId : 
            [
                'idx' : number (PDL index), 
                'addr' : string (BT address), 
                'addrType' : number (adress type), 
                'provisionProfile' : number (provisioned profile), 
                'connectedProfile' : number (connectedProfile),
                'remoteDevName' : string (remote name)
            ],
            ...
        }
    }
    ```

## RSSI Changed Event
* event id : "QCC_SNK_RSSI_CHANGED"
* event object
    ```
    {
        'retCode' : number ( 0 - success, -5 - invalid RSSI)
        'status' : string ("success" or "invalid rssi")
        'cmdRsp' : '+RSQ:'
        'uuid' : string ( device UUID )
        'seqId' : number ( command sequence id )
        'addr' : string( remote device bluetooth address )
        'rssi' : number ( received power value )
    }
    ```    

## Volume Changed Event
* event id : "QCC_SNK_VOLUME_CHANGED"
* event object
    ```
    {
        'retCode' : number (0)
        'status' : string ("success")
        'seqid' : number (sequence id),
        'uuid'  : string (device UUID)
        'cmdRsp' : string ("+VL:")
        'volume' : number ( 0 - 9999 representing 0 - 99.9%)
    }
    ```

## Stream State Changed Event
* event id : "QCC_SNK_STREAM_STATE_CHANGED"
* event object
    ```
    {
        'retCode' : number (0)
        'status' : string ("success")
        'seqid' : number (sequence id),
        'uuid'  : string (device UUID)
        'cmdRsp' : string ("+CR:")
        'addr' : string (remote device bluetooth address)
        'primary : boolean (true or false - secondary)
        'action' : string ("connect" or "disconnect")
        'codecCode' : number (0 - 4 representing the codec)
        'codec' : string("SBC", "APTX", "APTX-LL", "APTX-HD", or "AAC")
        
    }
    ```

## Device State Changed Event
* event id : "QCC_SNK_DEVICE_STATE_CHANGED"
* event object
    ```
    {
        'retCode' : number (0)
        'status' : string ("success")
        'seqid' : number (sequence id),
        'uuid'  : string (device UUID)
        'cmdRsp' : string ("+DS:")
        'stateCode' : number (0 - 13 represent the state)
        'state' : string("IDLE", "CONNECTABLE", "DISCOVERABLE", "CONNECTED", "OCE", "ICE", "ACTIVE_CALL", "TEST", "TWC_WAIT", "TWC_ON_HOLD", "TWC_MULTI_CALL", "ACTIVE_CALL_NO_SCO", "A2DP_STREAMING", or "IN_CONFIG_MODE")
    }
    ```





