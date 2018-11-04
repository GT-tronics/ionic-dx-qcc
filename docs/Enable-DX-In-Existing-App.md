# How to enable DataExchanger in an exisiting Ionic app
This session will instruct you how to make an existing Ionic app to communicate with DataExchanger BLE devices.

**WARNING: Only Ionic v2/v3 and up app is supported. It won't work with Ionic v1 app.**

## Step 1 - Clone The ionic-dx-qcc Project
Find a work space directory where you can clone the [ionic-dx-qcc](https://github.com/GT-tronics/ionic-dx-qcc) project.

Create the subdirectory as follows:
```
cd ~/Development
mkdir -p ionic/projects
```
Clone [ionic-dx-qcc](https://github.com/GT-tronics/ionic-dx-qcc)
```
cd ~/Development/ionic/projects/
git clone https://github.com/GT-tronics/ionic-dx-qcc.git
```

## Step 2 - Clone and Install DataExchanger Cordova Plugin
Until we publish the plugin into the npm registry, the plugin is required to be cloned locally before installation. 

Clone [cordova-plugin-dataexchanger/android_spp](https://github.com/GT-tronics/cordova-plugin-dataexchanger/tree/android_spp)
```
cd ~/Development
mkdir -p cordova/plugins
git clone https://github.com/GT-tronics/cordova-plugin-dataexchanger.git
git pull -all
git checkout android_spp
cd ~/path/to/your/ionic/app
ionic cordova plugin add ~/Development/cordova/plugins/cordova-plugin-dataexchanger
```

## Step 3 - Make Some Patches
### CDVPLuginResult
This patch allows the the nested NSDictionary object which contains NSData be able to convert JSON string probably. 
```
cd ~/Development/test/ionic-dx-qcc/
cp ./patches/ios/CDVPluginResult/* ~/your/own/ionic/app/platforms/ios/CordovaLib/Classes/Public
```
### Android Support V4
The DataExchanger cordova plugin requires this library
```
code ~/your/own/ionic/app/platforms/android/app/build.gradle
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

## Step 4 - Copy DataExchanger and AtCmdDispatcher Provider Files
There are two providers - *data-exchanger.service* and *atcmd-dispatcher* required to interface with the DataExchanger corodova plugin. Copy both to your ionic project.
```
cp ~/Development/ionic/projects/ionic-dx-qcc/src/providers/data-exchanger ~/your/own/ionic/app/src/providers
cp ~/Development/ionic/projects/ionic-dx-qcc/src/providers/atcmd-dispatcher ~/your/own/ionic/app/src/providers
```

## Step 5 - Modify app.modules.ts
Add DataExchangerService and AtCmdDispatcherService.
```
...
import { DataExchangerService } from '../providers/data-exchanger/data-exchanger.service';
import { AtCmdDispatcherService } from '../providers/atcmd-dispatcher/atcmd-dispatcher.service';
...
@NgModule({
...
  providers: [
    ...
    DataExchangerService,
    AtCmdDispatcherService,
    ...
  ]
})
export class AppModule {}
```

## Step 6 - Add DataExchanger Service
Finally, you need to inject DataExchanger service into your application. Take a look at ~/Development/ionic/projects/ionic-dx-qcc/src/pages/discover/discover.ts. The key add-ons are shown in below.
```
...
import { AtCmdDispatcherService, BleDeviceInfo } from '../../providers/atcmd-dispatcher/atcmd-dispatcher.service';

// Depending on the type of hardware, import the associated handlers
import { ATCMDHDLQCCSNK } from '../../providers/atcmd-dispatcher/atcmd-handler-qcc-sink';
import { ATCMDHDLQCCSRC } from '../../providers/atcmd-dispatcher/atcmd-handler-qcc-src';

...

export class HomePage {
    ...
    devInfo : BleDeviceInfo;
    
    constructor(
        ...
        public dispatcher : AtCmdDispatcherService
    ) 
    {
        ...
        this.dispatcher.init();
        ...
    }

    ionViewDidLoad() {
    this.platform.ready().then(() => {
        // Okay, so the platform is ready and our plugins are available.
        // Here you can do any higher level native things you might need.
        ...
    });
}

...

```

