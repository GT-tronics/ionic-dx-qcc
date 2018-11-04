# Initialization API
This session documents the DataExchanger Initialization APIs and show the usage examples

## Initialize
**init(sysEvent) : Promise**
### Description
* Initialize the DataExchanger stack
* only need to call once
* this service is global to all pages
### Parameters
* *sysEvent* : callback function
    * function to handle BLE on/off event
    * callback object is
        ```
        {
            "state" : string("syson" or "sysoff")
        }
        ```
### Return
* Promise
    * then object:
        ```
        {
            "state" : string("init")
        }
        ```
    * catch object
        ```
        {
            "retCode" : number,
            "status" : string("Error Description")
        }
        ```
### Example
```
export class HomePage 
{
    ...

    constructor(
        ...
        public dispatcher : AtCmdDispatcherService
    ) 
    {
        ...
    }

    ionViewDidLoad() {
        this.platform.ready().then(() => {
            this.dispatcher.init(sysEvent => {
                console.log("[HOME] SysEvt: " + JSON.stringify(sysEvent));  
                
                // Add code here to handle BLE on/off on-going events
                //
            }).then( obj => {
                console.log("[HOME] DX init OK " + JSON.stringify(obj));
            }).catch( obj => {
                console.log("[HOME] DX init failed " + JSON.stringify(obj));
            });
        });
    }
}
```

#
Next: [Scan and Connect](https://github.com/GT-tronics/ionic3-dx-stack/blob/master/docs/api-scan-connect.md)