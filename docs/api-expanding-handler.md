# Adding New AT Command Handling in Command Handler

In this section, we will explore how to add new AT command handling in a command handler. For this exercise, we will use the QCC-SNK handler (ATCMDHDLQCCSNK.ts) and add I2C AT commands handling in the handler.

## The New AT Commands
The following are the new I2C AT commands and their responses:

### Query I2C Config
```
AT+I2CC?
```
Example:
```
AT+I2CC?
+I2CC:0,1,6,7\r\n
OK
```

### Read and Write I2C
```
AT+I2CRW=<U8>port,<U8>chipAddr,<U8>byteToRead,<S0*>hexStrToWrite
```

    where

    \<port\> is the I2C port which is always 0

    \<chipAddr\> is the I2C chip address

    \<byteToRead\> is the number of bytes should be read after the write

    \<hexStrToWrite\> is a hex string (no space) represents the an array of bytes that should be written to I2C. For example, "FFAB0001" will send bytes 0xFF, 0xAB, 0x00, and 0x01 to I2C in that order.

Example 1 (write-then-read):
```
AT+I2CRW=0,16,16,FF14
+I2CRW:0x6E7F0,01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F \r\n
OK
```
Example 2: (write-only)
```
AT+I2CRW=0,16,0,FF14
OK
```
Example 3: (read-only)
```
AT+I2CRW=0,16,4
+I2CRW:0x887D0,01 02 03 04 \r\n
OK
```

## Adding Code In ATCMDHDLQCCSNK.ts
The following provides a guide on how to add the I2C AT command handling in the handler and also how to create a new method for application to access the data from an I2C chip (9-axis IMU).

### Step 1: Define New AtCmdRec
Each AT command which has some data returning will need a special AtCmdRec object created and registered with the parser, so the parser would know how to process the command. If an AT command doesn't have any thing to return other than OK or ERR=, it is not neccessary to create an AtCmdRec object.

In this exercise, there are two new AtCmdRec required - one for AT+I2CC? and the other one for AT+I2CRW=. 

Add the blocks as below in ATCMDHDLQCCSNK.ts. 
```C
    ...

    //
    // AT+TMQ= AT-CMD Record
    //

    export class AtCmdRec_TMQ extends ATCMDHDL.AtCmdRec 
    {
        ...
    }

//----> ADD THIS BLOCK
    export class AtCmdRec_I2CC extends ATCMDHDL.AtCmdRec 
    {
        public sdaPin : number;
        public sclPin : number;

        constructor(
            uuid : string,
            cb : ( obj : {} ) => void,
            events : Events
        )
        {
            super(uuid, 'AT+I2CC?', "\\+I2CC\\:0,1,(.[0-9]+),([0-9]+)", cb, events);
        }

        match(matchAry : any[]) 
        {
            this.sdaPin = matchAry[1];
            this.sclPin = matchAry[2];

            this.params = 
            {
                "cmdRsp" : "+I2CC:",
                "uuid" : this.uuid,
                "seqId" : this.seqId,
                "retCode" : 0,
                "status" : "success",
                "sdaPin" : this.sdaPin,
                "sclPin" : this.sclPin
            }

            // Always put this to last
            super.match(matchAry);
        }
    }
//<---- ADD THIS BLOCK END

//----> ADD THIS BLOCK
    export class AtCmdRec_I2CRW extends ATCMDHDL.AtCmdRec 
    {
        public timeStamp : number;
        public bytes : [];

        constructor(
            uuid : string,
            cb : ( obj : {} ) => void,
            events : Events
        )
        {
            super(uuid, 'AT+I2CRW?', "\\+I2CRW\\:0x([0-9A-F]+),(.+)", cb, events);
        }

        private hexToBytes(hex : string) : [] 
        {
            for (var bytes = [], c = 0; c < hex.length; c += 2)
            {
                bytes.push(parseInt(hex.substr(c, 2), 16));
            }
            return bytes;
        }

        match(matchAry : any[]) 
        {
            this.timeStamp = matchAry[1];
            var bytesStr = hexToBytes(matchAry[2]);

            this.params = 
            {
                "cmdRsp" : "+I2CRW:",
                "uuid" : this.uuid,
                "seqId" : this.seqId,
                "retCode" : 0,
                "status" : "success",
                "timeStamp" : this.timeStamp,
                "bytes" : this.bytes
            }

            // Always put this to last
            super.match(matchAry);
        }
    }
//<---- ADD THIS BLOCK END


    // Register subclass with base class
    // - this will allow AtCmdHandler to create an instance of AtCmdHandler_QCC_SNK
    //
    ATCMDHDL.AtCmdHandler.registerSubClass('QCC_SNK', AtCmdHandler_QCC_SNK.createInstance)
      
}  // namespace ATCMDHDLQCCSINK
```

### Step 2: Instantiate and Register The New AtCmdRec Class
Add the blocks as below in ATCMDHDLQCCSNK.ts.

```C
export class AtCmdHandler_QCC_SNK extends ATCMDHDLCOMMON.AtCmdHandler_COMMON 
    {
        ...

        public atCmdEQPQ : AtCmdRec_EQPQ;
        public atCmdTMQ : AtCmdRec_TMQ;

//----> ADD THIS BLOCK BEGIN
       // Add new I2C commands
        public atCmdI2CC : AtCmdRec_I2CC;
        public atCmdI2CRW : AtCmdRec_I2CRW;
//<---- ADD THIS BLOCK END

        constructor(
            uuid : string, 
            name : string,
            sendCb : (uuid:string, data:string) => Promise<any>,
            events : Events
        ) 
        {
            super(uuid, name, sendCb, events);

            ... 

            // AT+RSQ=
            this.atCmdRSQ = new AtCmdRec_RSQ(this.uuid, this.atCmdRspCallback_RSQ.bind(this), events);
            this.addAtCmdRecToParser(this.atCmdRSQ, false);

//----> ADD THIS BLOCK BEGIN
            // AT+I2CC
            this.atCmdI2CC = new AtCmdRec_I2CC(this.uuid, this.atCmdRspCallback.bind(this), events);
            this.addAtCmdRecToParser(this.atCmdI2CC, false);
//<---- ADD THIS BLOCK END

//----> ADD THIS BLOCK BEGIN
            // AT+I2CRW
            this.atCmdI2CRW = new AtCmdRec_I2CRW(this.uuid, this.atCmdRspCallback.bind(this), events);
            this.addAtCmdRecToParser(this.atCmdI2CRW, false);
//<---- ADD THIS BLOCK END

            this.refreshPdl();
        }

        ...
```

### Step 3 Create A New Method For Application
In this example, we are creating a new method called "readImu". This method should send the corresponding I2C command to the IMU chip and retrieve the bytes that represents the 9 axis IMU readings.
```C
        ...

        public refreshRssi( addr : string = null ) : Promise<any>
        {
            ...
        }
        
//----> ADD THIS BLOCK BEGIN
        public readImu() : Promise<any>
        {
            // Sample parameters.
            var port = 0;
            var chipAddr = 32;
            var byteToRead = 18;
            var i2cRegAddr = "0102";

            var cmd = this.atCmdI2CRW.cmd + port + ',' + chipAddr + ',' + byteToRead + ',' + i2cRegAddr;

            return new Promise((resolve, reject) => {
                this.atCmdRefresh(cmd).then( obj => {
                    console.log("[" + cmd + "] sent ok");

                    var imuValues = [];
                    // You got 18 bytes in an array from this.atCmdI2CRW.bytes.
                    // But You may need to calculate the 9 parameters for ACC, GYO, and CMP, each is 16 bit signed number
                    
                    resolve
                    ({
                        "timeStamp" : this.atCmdI2CRW.timeStamp,
                        "imuValues" : imuValues
                    });
                }).catch( obj => {
                    console.log("[" + cmd + "] sent failed");
                    reject({"retCode":-1,"status":"timeout expired"});
                });
            });
        }
//<---- ADD THIS BLOCK END

        ...
```
    
## Conclusion
Now you have just expanded the ATCMDHDLQCCSNK object to encapsulate the access of an IMU that requires the sink hardware to communicate through I2C. You can follow the same code pattern to handle other AT commands. 

### Side Note
As for the other I2C commands for other functions on the same chip or on a totally different I2C chip, you just need to replicate another readImu equivalent method. There is no other things to change or add in the code, and as a matter of fact not even any change in the firmware for the sink hardware is neccessary. Just wire up the I2C chip to the sink hardware I2C interface and write a readImu equivalent method in ATCMDHDLQCCSNK class to access the new chip data and functions.    