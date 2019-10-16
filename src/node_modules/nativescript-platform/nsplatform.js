/**********************************************************************************
 * (c) 2016-2019, Master Technology
 * Licensed under the MIT license or contact me for a Support or Commercial License
 *
 * I do contract work in most languages, so let me solve your problems!
 *
 * Any questions please feel free to email me or put a issue up on the github repo
 * Version 1.3.1                                      Nathan@master-technology.com
 *********************************************************************************/
"use strict";

/* jshint camelcase: false */
/* global global, java, android, NSString, NSObject, UIScreen */
let getResolution, getDevice, getDeviceType;

if (typeof global.nsPlatform === 'undefined') {
	global.nsPlatform = {
		ios: false,
		android: false,
		type: {ANDROID: 1, IOS: 2},
		TYPE: {ANDROID: 1, IOS: 2},
		isAndroid: function() { return global.nsPlatform.android; },
		isIOS: function() { return global.nsPlatform.ios; },
        hasSoftNav: function() {
               const devInfo = getDevice();
               return (devInfo.softNav);
        },
		platform: 0,
	};
    // Screen Sizes since platforms are not accurate after a rotation event
	Object.defineProperty(global.nsPlatform, "screen", {
	    get: function() { return getResolution(); }
    });
	Object.defineProperty(global.nsPlatform, "device", {
	    get: function() { return getDevice(); }
    });
    Object.defineProperty(global.nsPlatform, "deviceType", {
        get: function() { return getDeviceType(); }
    });


	if (typeof java !== 'undefined' && typeof android !== 'undefined') {
		global.nsPlatform.android = true;
		global.nsPlatform.platform = global.nsPlatform.type.ANDROID;
	} else if (typeof NSString !== 'undefined' && typeof NSObject !== 'undefined') {
		global.nsPlatform.ios = true;
		global.nsPlatform.platform = global.nsPlatform.type.IOS;
	}

	// Lock the object down to prevent any changes
	Object.freeze(global.nsPlatform);
}


module.exports = global.nsPlatform;

// ---------------------------------------------------------------
// Getting ios Property
// ---------------------------------------------------------------
function iOSProperty(_this, property) {
	if (typeof property === "function") {
		return property.call(_this);
	}
	else {
		return property;
	}
}


// ---------------------------------------------------------------
// Getting android context
// ---------------------------------------------------------------
function getContext() {
	let ctx = java.lang.Class.forName("android.app.AppGlobals").getMethod("getInitialApplication", null).invoke(null, null);
	if (ctx) { return ctx; }

	return java.lang.Class.forName("android.app.ActivityThread").getMethod("currentApplication", null).invoke(null, null);
}


if (nsPlatform.android) {
	getResolution = function(v) {
		const context = getContext();
		const metrics = new android.util.DisplayMetrics();
		if (v === false) {
            context.getSystemService(android.content.Context.WINDOW_SERVICE).getDefaultDisplay().getMetrics(metrics);
        } else {
            context.getSystemService(android.content.Context.WINDOW_SERVICE).getDefaultDisplay().getRealMetrics(metrics);
        }

		return {
			width: parseInt(metrics.widthPixels / metrics.density,10),
			height: parseInt(metrics.heightPixels / metrics.density,10),
			scale: metrics.density,
			widthPixels: metrics.widthPixels,
			heightPixels: metrics.heightPixels
		};
	};

	let deviceInfoCache = null;
	getDevice = function() {
	    if (deviceInfoCache) { return deviceInfoCache; }
	    deviceInfoCache = {emulator: false, model: "emulator", name: "emulator", manufacturer: "generic", notch: false, softNav: false};
        let context = getContext();

        const res = android.os.Build.FINGERPRINT;
        if (res != null && (res.indexOf("vbox86") >= 0 || res.indexOf("generic") >= 0 || res.indexOf("sdk") >=0 )) { deviceInfoCache.emulator = true; }

        const hwres = android.os.Build.HARDWARE;
        if (hwres != null && (res.indexOf("goldfish") >= 0 || res.indexOf("ranchu") >= 0 || res.indexOf("vbox86") >= 0)) { deviceInfoCache.emulator = true; }


        deviceInfoCache.manufacturer = android.os.Build.MANUFACTURER;
        deviceInfoCache.model = android.os.Build.MODEL;

        const betterModel = android.provider.Settings.Secure.getString(context.getContentResolver(), "bluetooth_name");
        if (betterModel) { deviceInfoCache.name = betterModel.toString();}
        else deviceInfoCache.name = deviceInfoCache.model;

        // Figure out if Android has SoftNav or buttons...
        const fake = getResolution(false);
        const real = getResolution(true);
        deviceInfoCache.softNav = ((fake.widthPixels < real.widthPixels) || (fake.heightPixels < real.heightPixels));

        // Notch detection
        let statusBarHeight = 0;
        let resourceId = context.getResources().getIdentifier("status_bar_height", "dimen", "android");
        if (resourceId > 0) {
            statusBarHeight = context.getResources().getDimensionPixelSize(resourceId);
            //const metrics = new android.util.DisplayMetrics();
            //context.getSystemService(android.content.Context.WINDOW_SERVICE).getDefaultDisplay().getRealMetrics(metrics);
            statusBarHeight = parseInt( (statusBarHeight / real.scale), 10);
        }
        if (statusBarHeight > 24) { deviceInfoCache.notch = true; }


        return deviceInfoCache;
    };

	let deviceTypeCache = null;
    getDeviceType = function() {
        if (deviceTypeCache) { return deviceTypeCache; }
        if (getContext().getResources().getConfiguration().smallestScreenWidthDp >= 600) {
            deviceTypeCache = "Tablet";
        } else {
            deviceTypeCache = "Phone";
        }
        return deviceTypeCache;
    };

} else if (nsPlatform.ios) {
	getResolution = function() {
		const screen = iOSProperty(UIScreen, UIScreen.mainScreen);
		return {
			width: screen.bounds.size.width,
			height: screen.bounds.size.height,
			scale: screen.scale,
			widthPixels: screen.bounds.size.width * screen.scale,
			heightPixels: screen.bounds.size.height * screen.scale,
		};
	};

	let deviceInfoCache = null;
	getDevice = function() {
	    if (deviceInfoCache) { return deviceInfoCache; }
	    deviceInfoCache = {emulator: false, model: "emulator", name: "emulator", manufacturer: "Apple", notch: false, softNav: false};
        // See: https://github.com/NativeScript/ios-runtime/issues/698
        const _SYS_NAMELEN = 256;
        const buffer = interop.alloc(5 * _SYS_NAMELEN);
        uname(buffer);
        let _machine = NSString.stringWithUTF8String(buffer.add(_SYS_NAMELEN * 4)).toString();

        // Get machine name for Simulator
        if (_machine === "x86_64" || _machine === "i386") {
            deviceInfoCache.emulator = true;
            let env = iOSProperty(NSProcessInfo, NSProcessInfo.processInfo).environment;
            _machine = env.objectForKey("SIMULATOR_MODEL_IDENTIFIER");
        }
        deviceInfoCache.model = _machine;

        switch (_machine) {
            // region iPhone's
            case "iPhone1,1":
                deviceInfoCache.name = "iPhone";
                break;
            case "iPhone1,2":
                deviceInfoCache.name = "iPhone3G";
                break;
            case "iPhone2,1":
                deviceInfoCache.name = "iPhone3GS";
                break;
            case "iPhone3,1":
            case "iPhone3,2":
            case "iPhone3,3":
                deviceInfoCache.name = "iPhone4";
                break;
            case "iPhone4,1":
                deviceInfoCache.name = "iPhone4S";
                break;
            case "iPhone5,1":
            case "iPhone5,2":
                deviceInfoCache.name = "iPhone5";
                break;
            case "iPhone5,3":
            case "iPhone5,4":
                deviceInfoCache.name = "iPhone5C";
                break;
            case "iPhone6,1":
            case "iPhone6,2":
                deviceInfoCache.name = "iPhone5S";
                break;
            case "iPhone7,1":
                deviceInfoCache.name = "iPhone6Plus";
                break;
            case "iPhone7,2":
                deviceInfoCache.name = "iPhone6";
                break;
            case "iPhone8,1":
                deviceInfoCache.name = "iPhone6S";
                break;
            case "iPhone8,2":
                deviceInfoCache.name = "iPhone6SPlus";
                break;
            case "iPhone8,4":
                deviceInfoCache.name = "iPhoneSE";
                break;
            case "iPhone9,1":
            case "iPhone9,3":
                deviceInfoCache.name = "iPhone7";
                break;
            case "iPhone9,2":
            case "iPhone9,4":
                deviceInfoCache.name = "iPhone7Plus";
                break;
            case "iPhone10,1":
            case "iPhone10,4":
                deviceInfoCache.name = "iPhone8";
                break;
            case "iPhone10,2":
            case "iPhone10,5":
                deviceInfoCache.name = "iPhone8Plus";
                break;
            case "iPhone10,3":
            case "iPhone10,6":
                deviceInfoCache.name = "iPhoneX";
                deviceInfoCache.softNav = true;
                deviceInfoCache.notch = true;
                break;
            case "iPhone11,2":
                deviceInfoCache.name = "iPhoneXS";
                deviceInfoCache.softNav = true;
                deviceInfoCache.notch = true;
                break;
            case "iPhone11,4":
            case "iPhone11,6":
                deviceInfoCache.name = "iPhoneXSMax";
                deviceInfoCache.softNav = true;
                deviceInfoCache.notch = true;
                break;
            case "iPhone11,8":
                deviceInfoCache.name = "iPhoneXR";
                deviceInfoCache.notch = true;
                deviceInfoCache.softNav = true;
                break;
            // endregion iPhone

            /// region iPad's
            case "iPad1,1":
                deviceInfoCache.name = "iPad";
                break;
            case "iPad2,1":
            case "iPad2,2":
            case "iPad2,3":
            case "iPad2,4":
                deviceInfoCache.name = "iPad 2";
                break;
            case "iPad2,5":
            case "iPad2,6":
            case "iPad2,7":
                deviceInfoCache.name = "iPad Mini 1";
                break;
            case "iPad3,1":
            case "iPad3,2":
            case "iPad3,3":
                deviceInfoCache.name = "iPad 3";
                break;
            case "iPad3,4":
            case "iPad3,5":
            case "iPad3,6":
                deviceInfoCache.name = "iPad 4";
                break;
            case "iPad4,1":
            case "iPad4,2":
            case "iPad4,3":
                deviceInfoCache.name = "iPad Air";
                break;
            case "iPad5,3":
            case "iPad5,4":
                deviceInfoCache.name = "iPad Air 2";
                break;
            case "iPad4,4":
            case "iPad4,5":
            case "iPad4,6":
                deviceInfoCache.name = "iPad Mini 2";
                break;
            case "iPad4,7":
            case "iPad4,8":
            case "iPad4,9":
                deviceInfoCache.name = "iPad Mini 3";
                break;
            case "iPad5,1":
            case "iPad5,2": deviceInfoCache.name = "iPad Mini 4"; break;

            case "iPad6,3":
            case "iPad6,4": deviceInfoCache.name = "iPad 9.7 Pro"; break;

            case "iPad6,7":
            case "iPad6,8": deviceInfoCache.name = "iPad 12.9 Pro"; break;

            case "iPad7,1":
            case "iPad7,2": deviceInfoCache.name = "iPad 12.9 Pro 2"; break;

            case "iPad7,3":
            case "iPad7,4": deviceInfoCache.name = "iPad 10.5 Pro"; break;

            case "iPad6,11":
            case "iPad6,12": deviceInfoCache.name = "iPad 5"; break;  // 5th gen

            case "iPad7,5":
            case "iPad7,6":
                deviceInfoCache.name = "iPad 6"; // 6th Gen
                break;

            case "iPad8,1":
            case "iPad8,2":
            case "iPad8,3":
            case "iPad8,4":
                deviceInfoCache.name = "iPad 11.0 Pro";
                deviceInfoCache.softNav = true;
                break;


            case "iPad8,5":
            case "iPad8,6":
            case "iPad8,7":
            case "iPad8,8":
                deviceInfoCache.name = "iPad 12.9 Pro 3"; // 3rd Gen
                deviceInfoCache.softNav = true;
                break;

            case "iPad11,3":
            case "iPad11,4":
                deviceInfoCache.name = "iPad Air 3"; // 3rd Gen
                break;

            case "iPad11,1":
            case "iPad11,2":
                deviceInfoCache.name = "iPad Mini 5"; // 5th Gen
                break;

            /// endregion iPad

            /// region iPod's
            case "iPod1,1":
                deviceInfoCache.name = "iPod 1G";
                break;
            case "iPod2,1":
                deviceInfoCache.name = "iPod 2G";
                break;
            case "iPod3,1":
                deviceInfoCache.name = "iPod 3G";
                break;
            case "iPod4,1":
                deviceInfoCache.name = "iPod 4G";
                break;
            case "iPod5,1":
                deviceInfoCache.name = "iPod 5G";
                break;
            case "iPod7,1":
                deviceInfoCache.name = "iPod 6G";
                break;
            // endregion

            default:
                deviceInfoCache.name = _machine;
                break;
        }

        return deviceInfoCache;
    };

	getDeviceType = function() {
        if (iOSProperty(UIDevice, UIDevice.currentDevice).userInterfaceIdiom === 0) {
            return "Phone";
        }
        return "Tablet";
    };
}
