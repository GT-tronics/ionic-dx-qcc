# DataExchanger Stack For Ionic Mobile
Each Bluetooth-enabled product which adopts the DataExchanger serial communication framework is presented with its own AT command set to the mobile app for device control and status polling or notification. 

The DataExchanger service component of Ionic mobile apps is responsible for the Bluetooth communication including scanning devices and making connections. While the component provides the service for managing the serial communication, the apps are still required to handle AT commands. 

To provide further abstraction and a standard method to handle AT commands, an additional layer of service, AtCmdDispatcher with AtCmdHandler, is introduced to simplify the command processing with the goals to present each product as a live object with its own methods and data that the application code can access directly, and to add new classes for new products by not rewriting the common AT command handling code.

Below depicts the DataExchanger API stack and further below the links to show the specific APIs.

![DataExchanger Stack](https://github.com/GT-tronics/ionic3-dx-stack/blob/master/docs/DX_API.png)

## Initialization
* [Initialization](https://github.com/GT-tronics/ionic3-dx-stack/blob/master/docs/api-init.md)

## Connection Management
* [Scan and Connect](https://github.com/GT-tronics/ionic3-dx-stack/blob/master/docs/api-scan-connect.md)
* [Device List](https://github.com/GT-tronics/ionic3-dx-stack/blob/master/docs/api-device-list.md)

## AT Command Dispatcher And Handler 
* [AT Command Dispatch and Handler Explain](https://github.com/GT-tronics/ionic3-dx-stack/blob/master/docs/atcmd-dispatcher/api-dispatcher-handler-explain.md)
* [Adding New Product (AT Command Handler)](https://github.com/GT-tronics/ionic3-dx-stack/blob/master/docs/atcmd-dispatcher/api-create-new-handler.md)
* [QCC-SNK Handler](https://github.com/GT-tronics/ionic3-dx-stack/blob/master/docs/atcmd-dispatcher/api-qcc-snk-handler.md)
