# DataExchanger Stack For Ionic Mobile
Each Bluetooth-enabled product which adopts the DataExchanger serial communication framework is presented with its own AT command set to the mobile app for device control and status polling or notification. 

The DataExchanger service component of Ionic mobile apps is responsible for the Bluetooth communication including scanning devices and making connections. While the component provides the service for managing the serial communication, the apps are still required to handle AT commands. 

To provide further abstraction and a standard method to handle AT commands, an additional layer of service, AtCmdDispatcher with AtCmdHandler, is introduced to simplify the command processing with one of the goals to allow application to access the functions and data of a particular product hardware through an object model without the achknowledge of those specific set of AT commands. Another goal is to add new object models for new products by not rewriting the common AT command handling code.

Below depicts the DataExchanger API stack and further below the links to show the specific APIs.

![DataExchanger Stack](https://github.com/GT-tronics/ionic-dx-qcc/blob/master/docs/DX_API.png)

## Initialization
* [Initialization](https://github.com/GT-tronics/ionic-dx-qcc/blob/master/docs/api-init.md)

## Connection Management
* [Scan and Connect](https://github.com/GT-tronics/ionic-dx-qcc/blob/master/docs/api-scan-connect.md)
* [Device List](https://github.com/GT-tronics/ionic-dx-qcc/blob/master/docs/api-device-list.md)

## AT Command Dispatcher And Handler 
* [AT Command Dispatch and Handler Explain](https://github.com/GT-tronics/ionic-dx-qcc/blob/master/docs/atcmd-dispatcher/api-dispatcher-handler-explain.md)
* [Adding New Product (AT Command Handler)](https://github.com/GT-tronics/ionic-dx-qcc/blob/master/docs/atcmd-dispatcher/api-create-new-handler.md)
* [QCC-SNK Handler](https://github.com/GT-tronics/ionic-dx-qcc/blob/master/docs/atcmd-dispatcher/api-qcc-snk-handler.md)
* [Adding New Command Handling in Existing Handler](https://github.com/GT-tronics/ionic-dx-qcc/blob/master/docs/api-expanding-handler.md)
