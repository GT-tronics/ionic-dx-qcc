# Release Notes for Ionic DataExchanger QCC 

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
