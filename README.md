# Introduction
This is an Ionic app example integrated with DataExchanger BLE communication library. You can use this app as a template to start building hybrid mobile application that can communicate with BLE devices. Or if you already have a Ionic app, you can port the DataExchanger providers files to your app and make your app to communicate with BLE devices See [How to enable DataExchanger in existing Ionic apps](https://github.com/GT-tronics/ionic-dx-qcc/blob/master/docs/Enable-DX-In-Existing-App.md).

## Step 0 - Install Ionic and Prepare Cordova for iOS and Android Building Platform
If you have not install Ionic and prepare the cordova building platform, follow these links:
* [Install Ionic](https://ionicframework.com/getting-started)
* [Prepare Cordova iOS Platform](https://cordova.apache.org/docs/en/latest/guide/platforms/ios/index.html)
* [Prepare Corodva Android Platform](https://cordova.apache.org/docs/en/latest/guide/platforms/android/#requirements-and-support)
## Step 1 - Clone The Projects
Find a work space directory where you can clone the [ionic-dx-qcc](https://github.com/GT-tronics/ionic-dx-qcc) and [cordova-plugin-dataexchanger/android_spp](https://github.com/GT-tronics/cordova-plugin-dataexchanger/tree/android_spp) projects.

Create the subdirectory as follows:
```
cd ~/Development
mkdir -p ionic/projects
mkdir -p cordova/plugins
```
Clone [ionic-dx-qcc](https://github.com/GT-tronics/ionic-dx-qcc)
```
cd ~/Development/ionic/projects/
git clone https://github.com/GT-tronics/ionic-dx-qcc.git
```
Clone [cordova-plugin-dataexchanger/android_spp](https://github.com/GT-tronics/cordova-plugin-dataexchanger/tree/android_spp)
```
cd ~/Development/cordova/plugins/
git clone https://github.com/GT-tronics/cordova-plugin-dataexchanger.git
git pull --all
git checkout android_spp
```
## Step 2 - Create cordova platforms
```
cd ~/Development/ionic/projects/ionic-dx-qcc/
ionic cordova platform add iOS
ionic cordova platform add android
```
## Step 3 - Install DataExchanger cordova plugin
```
cd ~/Development/ionic/projects/ionic-dx-qcc/
ionic cordova plugin add ../../../cordova/plugins/cordova-plugin-dataexchanger
```
## Step 4 - Make Some Patches
### CDVPLuginResult
This patch allows the the nested NSDictionary object which contains NSData be able to convert JSON string probably. 
```
cd ~/Development/test/ionic-dx-qcc/
cp ./patches/ios/CDVPluginResult/* ./platforms/ios/CordovaLib/Classes/Public
```
### Android Support V4
The DataExchanger cordova plugin requires this library
```
code ~/Development/ionic/projects/ionic-dx-qcc/platforms/android/app/build.gradle
```
Add the line **implementation 'com.android.support:support-v4:+'** in the dependency section
```
...
dependencies {
    implementation fileTree(include: '*.jar', dir: 'libs')
    // SUB-PROJECT DEPENDENCIES START
    implementation project(path: ':CordovaLib')
    // SUB-PROJECT DEPENDENCIES END
    implementation 'com.android.support:support-v4:+'
}
...
```
## Step 5 - Build And Run The Apps
```
cd ~/Development/test/ionic-dx-qcc/
ionic cordova run ios
```
and/or
```
cd ~/Development/test/ionic-dx-qcc/
ionic cordova run android
```

# Further References
* [How to enable DataExchanger in existing Ionic apps](https://github.com/GT-tronics/ionic-dx-qcc/blob/master/docs/Enable-DX-In-Existing-App.md)
* [DataExchanger Stack For Ionic Mobile](https://github.com/GT-tronics/ionic-dx-qcc/blob/master/docs/api-summary.md)