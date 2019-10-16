// ----------------------------------------
// NativeScript-Platforms Typings
// ----------------------------------------
declare enum TYPE {
    ANDROID = 1,
    IOS = 2,
    WINDOWS = 3
}

type Type = {
    ANDROID: number,
    IOS: number,
    WINDOWS: number,
}

interface NsPlatform {
    isIOS(): boolean;
    isAndroid(): boolean;
    isWindows(): boolean;

    windows: boolean;
    ios: boolean;
    android: boolean;
    deviceType: string;

    TYPE: Type;
    type: Type;
    platform: TYPE;

    screen: {
        width: number;
        height: number;
        scale: number;
        widthPixels: number;
        heightPixels: number;
    };
    
    device: {
        emulator: boolean;
        model: string;
        name: string;
        manufacturer: string;
        notch: boolean;
        buttonLess: boolean;
    };
}

declare const nsPlatform: NsPlatform;
export = nsPlatform;
