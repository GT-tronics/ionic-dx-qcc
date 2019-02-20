# Release Notes for Ionic DataExchanger QCC 

## R 0.8.13
* Discover page can now properly returned fail reason for connection request.

## R 0.8.12
* renamed the QCC SRC setting section titles.

## R 0.8.11
* cleaned up the QCC SRC setting page to support Voice Back and Codec setting

## R 0.8.10
* added a show 3d page using BabylonJS
* added BabylonJS provider

## R 0.8.9
* minor changes in scan-and-connect page
* fixed with the correct version of data-exchanger.service.ts

## R 0.8.8
* improved the robustness of data exchanger stack - see [IonicDxProvider's release note](https://github.com/GT-tronics/ionic-dx-providers)

## R 0.8.7
* added a scan-and-connect page to support separated audio device scan and connect in QCC_SRC
* improved the scanning message in Discover page

## R 0.8.6
* added a new doc page to describe how to add new AT command handling in command handler.

## R 0.8.5
* support SPP provision in AT+PDL?
* added phone icon for SPP paired deviced in PDL

## R 0.8.4
* fixed volume sync issues - for the both QCC source and sink
* QCC source is now supporing mult-devices AVRCP volume change and sync.

## R 0.8.3
* replaced the providers directory with the git submodule of https://github.com/GT-tronics/ionic-dx-providers
    * so we can share the same provider with other projects
    * the provider code is identical to previous release.

## R 0.8.2
* fixed no PDL refresh bug
* fixed incorrect profile display
* set blue icon for active hfp and a2dp profile display

## R 0.8.1
* updated README.md

## R 0.8.0
* snapshoted from [ionic3-dx-stack](https://github.com/GT-tronics/ionic3-dx-stack/commit/de574c8b6d57608374e8452695c9fc12e2182760).
* splitted device.html to device-snk.html and device-src.html
* updated source app
    * supported volume changed
    * refresh pdl using +PDLU:
    * rid the name prefix "ble" or replace it with "bt"
