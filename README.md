# snmp-fiberhome

This module communicates with Fiberhome OLTs using the SNMP protocol. The module is capable of managing the OLT, Slots, Cards, Pon ports and ONUs by performing read and write functions directly in OLT.

[![NPM Version](http://img.shields.io/npm/v/snmp-fiberhome.svg?style=flat)](https://www.npmjs.org/package/commander) [![NPM Downloads](https://img.shields.io/npm/dm/snmp-fiberhome.svg?style=flat)](https://npmcharts.com/compare/snmp-fiberhome?minimal=true)

## Contents

- [Installation](#installation)
- [Usage](#usage)
- [OLT functions](#olt-functions)
  - [getOltInformation()](#getoltinformation)
  - [getOltModel()](#getoltmodel)
  - [getSubrackInformation()](#getsubrackinformation)
  - [getPonPortList()](#getponportlist)
  - [getPonPort()](#getponport)
- [Slot functions](#slot-functions)
  - [getSlots()](#getslots)
  - [getSlotsInformationList()](#getslotsinformationlist)
- [Card functions](#card-functions)
  - [getCardList()](#getcardlist)
  - [getCard()](#getcard)
- [ONU functions](#onu-functions)
  - [addAllOnus()](#addallonus)
  - [addOnu()](#addonu)
  - [authorizeOnu()](#authorizeonu)
  - [convertToOnuIndex()](#converttoonuindex)
  - [delOnu() and delOnuByMacAddress()](#delonu-and-delonubymacaddress)
  - [delWan()](#delwan)
  - [enableLanPorts()](#enablelanports)
  - [getAuthorizedOnus()](#getauthorizedonus)
  - [getBasicOnuInfo()](#getbasiconuinfo)
  - [getBasicOnuListByPon()](#getbasiconulistbypon)
  - [getLanPorts()](#getlanports)
  - [getMacAddressList()](#getmacaddresslist)
  - [getOnu()](#getonu)
  - [getOnuBandwidth()](#getonubandwidth)
  - [getOnuDistance()](#getonudistance)
  - [getOnuIdList()](#getonuidlist)
  - [getOnuIdListByPon()](#getonuidlistbypon)
  - [getOnuIndexList()](#getonuindexlist)
  - [getOnuLastOffTime()](#getonulastofftime)
  - [getOnuListByPon()](#getonulistbypon)
  - [getOnuOpticalPower()](#getonuopticalpower)
  - [getOnuRxPowerListByPon()](#getonurxpowerlistbypon)
  - [getOnuType()](#getonutype)
  - [getOnuUplinkInterface()](#getonuuplinkinterface)
  - [getOnuWebAdmin()](#getonuwebadmin)
  - [getUnauthorizedOnus()](#getunauthorizedonus)
  - [getWan()](#getwan)
  - [parseOnuIndex()](#parseonuindex)
  - [setLanPorts()](#setlanports)
  - [rebootOnu()](#rebootonu)
  - [setOnuBandwidth()](#setonubandwidth)
  - [setOnuWebAdmin()](#setonuwebadmin)
  - [setWan()](#setwan)
- [Extra example](#extra-example)
- [Tests](#tests)
- [Bug fixes and features](#bug-fixes-and-features)
- [Contributions](#contributions)
- [Help us!](#help-us)
- [License](#license)

## Installation

This is a [Node.js](https://nodejs.org/en/) module available through the [npm](https://www.npmjs.com/).

```bash
$ npm install --save snmp-fiberhome 
```

It is loaded using the require() function:

```js
const fh = require('snmp-fiberhome')
```

## Usage

```js
const fh = require('snmp-fiberhome')

const options = {
    ip: '0.0.0.0',             // OLT IP
    community: 'default',
    port: 161,
    trapPort: 162,
    enableWarnings: true,
    enableLogs: true
}

fh.function(options, ...)      // Call of functions
```

**IMPORTANT!** For ONUs using GPON technology, the `macAddress` parameter in the following functions will receive the equipment SERIAL.

The following functions are assigned the `slot`, `pon` and `onuId` parameters to specify a particular ONU. If you work with onuIndex, use the [parseOnuIndex()](#parseonuindex)  function to convert onuIndex to an object containing the values of `slot`, `pon` and `onuId`.

The `onuIndex` parameter is calculated as follows:

    slot*(2^25) + pon*(2^19) + onuId*(2^8)    // for OLT AN5516

See the function [convertToOnuIndex()](#converttoonuindex) to convert the `onuIndex` parameter to `slot`, `pon` and `onuId`

# OLT functions

## getOltInformation()

**Description:** Get relevant information from OLT. If unable to connect to OLT, the return is `false`.

**Function signature:**

```js
getOltInformation(options: <object>) => Promise <object>
```

Example:

```js
fh.getOltInformation(options).then(oltInfo => {
    console.log(oltInfo)
})
```

Output:

```js
{
    alias: 'AN5516-01',
    hardwareModel: 'An5516-01',
    hardwareVersion: 'WKE2.115.331R1A',
    ip: "1.2.3.4",        // OLT IP
    macAddress: '10-0b-d2-12-35-7d',
    oid: '1.3.6.1.4.1.5875.800.1001.11',
    slots: [11, 16, 19, 20],
    softwareVersion: 'RP0700',
    subrack: {
        subrackIndex: 1,
        subrackName: 'AN5516-06',
        subrackType: 'An5516-06',
        totalSlotNumber: 14
    },
    systemContact: 'DefaultsysContact',
    systemLocation: 'DefaultsysLocation',
    systemName: 'Test',
    systemRunningTime: 133001838,
    systemRunningTimeUnit: 'ms',
    temperature: 39,
    temperatureUnit: '°C'
}
```

## getOltModel()

**Description:** Returns the OLT model. If unable to connect to OLT, the return is `false`.

**Function signature:**

```js
getOltModel(options: <object>) => Promise <string>
```

Example:

```js
fh.getOltModel(options).then(onuModel => {
    console.log(onuModel)
})
```

Output:

```js
'An5516-01'
```

## getSubrackInformation()

**Description:** Returns information regarding the subrack. If unable to connect to OLT, the return is `false`.

**Function signature:**

```js
getSubrackInformation(options <object>) => Promise <object>
```

Example:

```js
fh.getSubrackInformation(options).then(info => {
    console.log(info)
})
```

Output:

```js
{
    subrackIndex: 1,
    subrackName: 'AN5516-06',
    subrackType: 'An5516-06',
    totalSlotNumber: 14
}
```

## getPonPortList()

**Description:** Returns an array with the relevant information from all PON ports in the OLT. If unable to connect to OLT, the return is `false`.

**Function signature:**

```js
getPonPortList(options: <object>) => Promise <Array>
```

Example:

```js
fh.getPonPortList(options).then(ponPorts => {
    console.log(ponPorts)
})
```

Output:

```js
[
    {
        authorizedOnus: 2,
        portDescription: 'PON 11/1',
        slot: 11,
        pon: 1,
        portUplinkRate: 1250,
        portUplinkRateUnit: 'Mbit/s',
        portDownlinkRate: 2500,
        portDownlinkRateUnit: 'Mbit/s',
        portEnableStatus: 'enable',    // possible values: 'enable' or 'disable'
        portEnableStatusValue: 1,      // 1 = 'enable', 0 = 'disable'
        portIndex: 369623040,
        portName: 'PON 11/1',
        portOnlineStatus: 'online',    // possible values: 'online' or 'offline'
        portOnlineStatusValue: 1,      // 1 = 'online', 0 = 'offline'
        portType: 'PON',
        portTypeValue: 1
    },
    // { ... }
]
```

## getPonPort()

**Description:** Returns the relevant information for a given PON port in OLT. If any of the input parameters is invalid, the return is `false`.

**Function signature:**

```js
getPonPort(options: <object>, slot: <number>, pon: <number>) => Promise <object>
```

Example:

```js
fh.getPonPort(options, 11, 1).then(ponPort => {
    console.log(ponPort)
})
```

Output:

```js
{
    authorizedOnus: 2,
    portDescription: 'PON 11/1',
    slot: 11,
    pon: 1,
    portUplinkRate: 1250,
    portUplinkRateUnit: 'Mbit/s',
    portDownlinkRate: 2500,
    portDownlinkRateUnit: 'Mbit/s',
    portEnableStatus: 'enable',      // possible values: 'enable' or 'disable'
    portEnableStatusValue: 1,        // 1 = 'enable', 0 = 'disable'
    portIndex: 369623040,
    portName: 'PON 11/1',
    portOnlineStatus: 'online',      // possible values: 'online' or 'offline'
    portOnlineStatusValue: 1,        // 1 = 'online', 0 = 'offline'
    portType: 'PON',
    portTypeValue: 1
}
```

# Slot functions

## getSlots()

**Description:** Returns an array with the number of each slot. If unable to connect to OLT, the return is `false`.

**Function signature:**

```js
getSlots(options: <object>) => Promise <Array>
```

Example:

```js
fh.getSlots(options).then(slots => {
    console.log(slots)
})
```

Output:

```js
[11, 16, 19, 20]
```

## getSlotsInformationList()

**Description:** Returns an array with relevant information from all slots in the OLT. If unable to connect to OLT, the return is `false`.

**Function signature:**

```js
getSlotsInformationList(options: <object>) => Promise <Array>
```

Example:

```js
fh.getSlotsInformationList(options).then(slots => { 
    console.log(slots)
})
```

Output:

```js
[
    {
        slot: 11,
        actualCardType: 'GC8B',
        actualCardTypeValue: 527,
        authorizedCardType: 'GC8B'
        authorizedCardTypeValue: 527,
        cardPresentStatus: 'present',   // possible values: 'present' or 'not present'
        cardPresentStatusValue: 1,      // 1 = 'present', 0 = 'not present'
        cardInformation: {
            availablePorts: 8,
            numberOfPorts: 8,
            cardStatus: 'normal',       // possible values: 'normal' or 'interrupted'
            cardStatusValue: 1,         // 1 = 'normal', 0 = 'interrupted'
            cardType: 'GC8B',
            cardTypeValue: 527,
            cpu: 4.75,
            cpuUnit: '%',
            memory: 41.54,
            memoryUnit: '%',
            hardwareVersion: 'WKE2.200.012R1C',
            slot: '11',
            softwateVersion: 'RP0700'
        }
    },
    // { ... }
]
```

# Card functions

## getCardList()

**Description:** Returns an array with relevant information from all cards. If unable to connect to OLT, the return is `false`.

**Function signature:**

```js
getCardList(options: <object>) => Promise <Array>
```

Example:

```js
fh.getCardList(options).then(cards => {
    console.log(cards)
})
```

Output:

```js
[
    {
        availablePorts: 8,
        numberOfPorts: 8,
        cardStatus: 'normal',   // possible values: 'normal' or 'interrupted'
        cardStatusValue: 1,     // 1 = 'normal', 0 = 'interrupted'
        cardType: 'GC8B',
        cardTypeValue: 527,
        cpu: 4.75,
        cpuUnit: '%',
        memory: 41.54,
        memoryUnit: '%',
        hardwareVersion: 'WKE2.200.012R1C',
        slot: '11',
        softwateVersion: 'RP0700'
    },
    // { ... }
]
```

## getCard()

**Description:** Returns relevant information from a given card. If any of the input parameters is invalid, the return is `false`.

**Function signature:**

```js
getCard(options: <object>, slot: <number>) => Promise <object>
```

Example:

```js
fh.getCard(options, 11).then(card => {
    console.log(card)
})
```

Output:

```js
{
    availablePorts: 8,
    numberOfPorts: 8,
    cardStatus: 'normal',    // possible values: 'normal' or 'interrupted'
    cardStatusValue: 1,      // 1 = 'normal', 0 = 'interrupted'
    cardType: 'GC8B',
    cardTypeValue: 527,
    cpu: 4.75,
    cpuUnit: '%',
    memory: 41.54,
    memoryUnit: '%',
    hardwareVersion: 'WKE2.200.012R1C',
    slot: '11',
    softwateVersion: 'RP0700'
}
```

# ONU functions
For all the following functions, if the ONU, Pon port or Slot is not found, the return is **false**.

## addAllOnus()

**Description:**  This function performs ONU authorization and WAN and Vlans configuration for all unauthorized ONUs in a OLT. The input parameters `wanProfiles` and `lanPortProfiles` are not required. To learn more about the `wanProfiles` input parameter see the [setWan()](#setwan) function. To learn more about the `lanPortProfiles` input parameter, see the [setLanPorts()](#setlanports) function. If the authorized ONU already contains any profiles configured for WAN or Vlan, the old settings will be replaced with the new ones. The return is an array that contains all authorized ONUs. If any of the input parameters is invalid, the return is `false`.

**Function signature:**

```js
addAllOnus(options: <object>, wanProfiles: <Array>, lanPortProfiles: <Array>) => Promise <Array>
```

Example:

```js
fh.addAllOnus(options,
[
    { wanMode: 'internet', wanConnType: 'router', wanVlan: 2001, ipMode: 'pppoe', translationValue: 2000, svlan: 2000 },
    { wanMode: 'tr069', wanConnType: 'router', wanVlan: 2002, ipMode: 'dhcp', translationValue: 2000, svlan: 3000 }
],
[
    { lanPort: 1, vlans: [{ vlanMode: 'transparent', cvlanId: 2001 }, { vlanMode: 'tag', cvlanId: 3011, cos: 3 }] },
    { lanPort: 2, enablePort: false }
]
).then(authOnuList => {
    console.log(authOnuList)
})
```

Output:

```js
[
    {
        _onuIndex: 369623296,
        slot: 11,
        pon: 1,
        onuId: 1,
        macAddress: 'FHTT1231e796',
        onuType: {
            category: 'SFU',
            code: 765,
            mode: 'dual',
            model: 'AN5506-04-F1',
            type: 'GPON'
        }
    },
    // { ... }
]
```

## addOnu()

**Description:** Similar to the [addAllOnus()](#addallonus) function, but performs ONU authorization and WAN and Vlans configuration for a particular ONU. If any of the input parameters is invalid, the return is `false`.

**Function signature:**

```js
addOnu(options: <object>, onu: <object>, wanProfiles: <Array>, lanPortProfiles: <Array>) => Promise <object>
```

`onu: <object>` parameter:

```js
onu: {
    slot: <number>,
    pon: <number>, 
    onuTypeCode: <number>, 
    macAddress: <string>
}
```

Example:

```js
fh.addOnu(options, { slot: 11, pon: 1, onuTypeCode: 765, macAddress: 'FHTT1231e796' },
[
    { wanMode: 'internet', wanConnType: 'router', wanVlan: 2001, ipMode: 'pppoe', translationValue: 2000, svlan: 2000 },
    { wanMode: 'tr069', wanConnType: 'router', wanVlan: 2002, ipMode: 'dhcp', translationValue: 2000, svlan: 3000 }
],
[
    { lanPort: 1, vlans: [{ vlanMode: 'transparent', cvlanId: 2001 }, { vlanMode: 'tag', cvlanId: 3011, cos: 3 }] },
    { lanPort: 2, enablePort: false }
]
).then(onu => {
    console.log(onu)
})
```

Output:

```js
{
    _onuIndex: 369623296,
    slot: 11,
    onuId: 1,
    pon: 1,
    macAddress: 'FHTT1231e796',
    onuType: {
            category: 'SFU',
            code: 765,
            mode: 'dual',
            model: 'AN5506-04-F1',
            type: 'GPON'
        }
}
```

## authorizeOnu()

**Description:** Authorizes a particular ONU. WAN and Vlan settings can be made using the [setWan()](#setwan) and [setLanPorts()](#setlanports) functions, respectively. All input parameters for [authorizeOnu()](#authorizeonu) can be obtained by the [getUnauthorizedOnus()](#getunauthorizedonus) function. If any of the input parameters is invalid, the return is `false`.

**Function signature:**

```js
authorizeOnu(options: <object>, slot: <number>, pon: <number>, onuTypeCode: <number>, macAddress: <string>) => Promise <object>
```

Example:

```js
fh.authorizeOnu(options, 11, 1, 765, 'FHTT1231e796').then(authOnu => {
    console.log(authOnu)
})
```

Output:

```js
{
    slot: 11,
    pon: 1,
    macAddress: 'FHTT1231e796',
    onuType: {
        category: 'SFU',
        code: 765,
        mode: 'dual',
        model: 'AN5506-04-F1',
        type: 'GPON'
    }
}
```

## convertToOnuIndex()

**Description:** Convert `slot`, `pon` and `onuId` parameters to `onuIndex`.

**Function signature:**

```js
convertToOnuIndex(slot: <number>, pon: <number>, onuId: <number>) => <number>
```

Example:

```js
var onuIndex = fh.convertToOnuIndex(11, 1, 1)
console.log(onuIndex)
```

Output:

```js
369623296
```

## delOnu() and delOnuByMacAddress()

**Description:** Deletes a particular ONU. If the ONU is successfully deleted, the function returns the `macAddress` of the respective ONU deleted, otherwise `false`.

**Function signature:**

```js
delOnu(options: <object>, slot: <number>, pon: <number>, onuId: <number>) => Promise <string>
```

**Function signature:**

```js
delOnuByMacAddress(options: <object>, macAddress: <string>) => Promise <string>
```

Example:

```js
fh.delOnu(options, 11, 1, 1).then(macAddress => {
    console.log(macAddress)
})

// or

fh.delOnuByMacAddress(options, 'FHTT1231e796').then(macAddress => {
    console.log(macAddress)
})
```

Output:

```js
'FHTT1231e796'
```

## delWan()

**Description:** Deletes all WAN profiles from a given ONU. If successful, returns `true`, otherwise `false`.

**Function signature:**

```js
delWan(options: <object>, slot: <number>, pon: <number>, onuId: <number>) => Promise <boolean>
```

Example:

```js
fh.delWan(options, 11, 1, 1).then(del => {
    console.log(del)
})
```

Output:

```js
true
```

## enableLanPorts()

**Description:** Enables and disables LAN ports for a specific ONU. If successful, the function returns `onuIndex`, otherwise `false`.

**Function signature:**

```js
enableLanPorts(options: <objecy>, slot: <number>, pon: <number>, onuId: <number>, aLanPorts: <Array>) => Promise <number>
```

Example:

```js
fh.enableLanPorts(options, 11, 1, 1,
[
    { lanPort: 2,  enablePort: false },
    { lanPort: 3,  enablePort: true }
]
).then(onuIndex => {
    console.log(onuIndex)
})
```

Output:

```js
369623296
```

## getAuthorizedOnus()

**Description:** Returns an array containing all authorized ONUs in OLT. If unable to connect to OLT, the return is `false`.

**Function signature:**

```js
getAuthorizedOnus(options: <object>) => Promise <Array>
```

Example:

```js
fh.getAuthorizedOnus(options).then(onuList => {
    console.log(onuList)
})
```

Output:

```js
[
    {
        _onuIndex: 369623296,
        slot: 11,
        pon: 1,
        onuId: 1,
        macAddress: 'FHTT1231e796'
    },
    // { ... }
]
```

## getBasicOnuInfo()

**Description:** Retorns a ONU in OLT based on mac address. The ONU must be authorized.
**NOTE:** The input parameters `slot` and `pon` are not required, but the use will make the return faster. On success, returns an object containing basic ONU information, otherwise returns `false`.

**Function signature:**

```js
getBasicOnuInfo(options: <object>, macAddress: <string>, slot: <number>, pon: <number>) => Promise <object>
```

Example:

```js
fh.getBasicOnuInfo(options, 'FHTT1231e796').then(onu => {
    console.log(onu)
})

// or

fh.getBasicOnuInfo(options, 'FHTT1231e796', 11, 1).then(onu => {
    console.log(onu)
})
```

Output:

```js
{
    _onuIndex: 369623296,
    slot: 11,
    pon: 1,
    onuId: 1,
    macAddress: 'FHTT1231e796'
}
```

## getBasicOnuListByPon()

**Description:** Returns an array containing the basic ONU information pertaining to a particular PON port. This function has a better performance than the [getOnuListByPon()](#getonulistbypon) function.

**NOTE:** If you want more ONU information, see the [getOnuListByPon()](#getonulistbypon) function.

**Function signature:**

```js
getBasicOnuListByPon(options: <object>, slot: <number>, pon: <number>) => Promise <Array>
```

Example:

```js
fh.getBasicOnuListByPon(options, 11, 1).then(onuList => {
    console.log(onuList)
})
```

Output:

```js
[
    {
        _onuIndex: 369623296,
        slot: 11,
        pon: 1,
        onuId: 1,
        macAddress: "FHTT0914d048",
        onuStatus: "online",         // possible values: 'fiber cut', 'online', 'power cut' or 'offline'
        onuStatusValue: 1,           // 0 = 'fiber cut', 1 = 'online', 2 = 'power cut' or 3 = 'offline'
        onuType: {
            category:"SFU",
            code: 785,
            mode: "bridge",
            model: "AN5506-01-A1",
            type: "GPON"
        }
    },
    // { ... }
]
```

## getLanPorts()

**Description:** Returns the LAN ports settings of a given ONU. If any of the input parameters is invalid, the return is `false`.

**Function signature:**

```js
getLanPorts(options: <object>, slot: <number>, pon: <number>, onuId: <number>) => Promise <Array>
```

Example:

```js
fh.getLanPorts(options, 11, 1, 1).then(lanPorts => {
    console.log(lanPorts)
})
```

Output:

```js
[
    {
        lanPort: 1,
        enablePort: true,
        lanSettings: {
            autoNegotiation: {
                auto: true,
                duplex: 'full',
                portSpeed: '100M'
            },
            flowControl: false,
            boardwidthSet: {
                upstreamMin: 640,
                upstreamMax: 1000000,
                downstream: 1000000
            },
            igmpUpCvlan: {
                id: 2001,
                cos: 6,
                tpId: 33024
            },
            igmpUpSvlan: {
                id: null,
                cos: null,
                tpId: 33024
            }
        },
        vlans: [
            {vlanMode: 'transparent', cvlanId: 2001, cos: null, serviceType: 'multicast', tpId: 33024, tls: false, qInQ: false, translation: false},
            {vlanMode: 'tag', cvlanId: 2002, cos: 3, serviceType: 'unicast', tpId: 33024, tls: false, qInQ: false, translation: false}
        ]
    },
    {
        lanPort: 2,
        enablePort: true,
        lanSettings: {
            // { ... }
        },
        vlans: [
            {
                vlanMode: 'transparent', cvlanId: 2001, cos: null, serviceType: 'unicast', tpId: 33024,
                translation: {cos: 5, value: 4000},
                qInQ: {serviceName: 'IPTV', vlanId: 404, cos: 7}
            }
        ]
    },
    // { ... }
]
```

**NOTE 1:** EPON ONUs will contain the `policing` and `dsPolicing` parameters within the `lanSettings` parameter, and `bandwidthSet` within `vlans`. The `boardwidthSet` parameter is returned for GPON only.

**NOTE 2:** If the [getLanPorts()](#getlanports) function does not identify whether the ONU is EPON or GPON, an error will be displayed and the `getLanPortsEPON()` or `getLanPortsGPON()` functions can be used by passing the same input parameters as the [getLanPorts()](#getlanports) function.

## getMacAddressList()

**Description:** Returns an array containing the mac address of all authorized ONUs in a given OLT. If unable to connect to OLT, the return is `false`.

**Function signature:**

```js
getMacAddressList(options: <object>) => Promise <Array>
```

Example:

```js
fh.getMacAddressList(options).then(macAddressList => {
    console.log(macAddressList)
})
```

Output:

```js
[
    {
        _onuIndex: 369623296,
        macAddress: 'FHTT1231e796'
    },
    // { ... }
]
```

## getOnu()

**Description:** Returns relevant information from a particular ONU, such as: opticalPowers (signals), distance, model, macAddress, enters others. If any of the input parameters is invalid, the return is `false`.

**NOTE:** For EPON technology some (or all) values ​​may be returned as zero on `opticalPower`

**Function signature:**

```js
getOnu(options: <object>, slot: <number>, pon: <number>, onuId: <number>) => Promise <object>
```

Example:

```js
fh.getOnu(options, 11, 1, 1).then(onu => {
    console.log(onu)
})
```

Output:

```js
{
    _onuIndex: 369623296,
    slot: 11,
    pon: 1,
    onuId: 1,
    macAddress: 'FHTT1231e796',
    onuLogicAuthId: '',
    onuLogicAuthIdPass: '',
    onuStatus: 'online',          // possible values: 'fiber cut', 'online', 'power cut' or 'offline'
    onuStatusValue: 1,            // 0 = 'fiber cut', 1 = 'online', 2 = 'power cut' or 3 = 'offline'
    softwareVersion: 'RP2522',
    systemName: '',
    firmwareVersion: '',
    hardwareVersion: 'GJ-2.134.285F4G',
    ip: '0.0.0.0',
    distance: {
        _onuIndex: 369623296,
        value: '1.282',
        unit: 'km'
    },
    lastOffTime: {
        _onuIndex: 369623296,
        date: '2019-01-21',
        time: '08:01:04'
    },
    opticalPower: {
        _onuIndex: 369623296,
        rxPower:{
            value: '-19.25',
            unit: 'dBm'
        },
        txPower: {
            value: '3.03',
            unit: 'dBm'
        },
        temperature: {
            value: '45.10',
            unit: '°C'
        },
        voltage: {
            value: '3.21',
            unit: 'V'
        },
        currTxBias: {
            value: '9.70',
            unit: 'mA'
        }
    },
    onuType: {
        category: 'SFU',
        code: 765,
        mode: 'dual',
        model: 'AN5506-04-F1',
        type: 'GPON'
    }, 
    upLinkInterface: {
        downlinkRate: 2500,
        downlinkRateUnit: 'Mbit/s',
        portDescription: 'PON 11/1/1',
        portName: 'PON 11/1/1',
        portStatus: 'enable',       // possible values: 'enable' or 'disable'
        portStatusValue: 1,         // 1 = 'enable', 0 = 'disable'
        portType: 1,
        uplinkRate: 1250,
        uplinkRateUnit: 'Mbit/s'
    }
}
```

## getOnuBandwidth()

**Description:** Returns the bandwidth of a given ONU. If any of the input parameters is invalid, the return is `false`.

**Function signature:**

```js
getOnuBandwidth(options: <object>, slot: <number>, pon: <number>, onuId: <number>) => Promise <object>
```

Example:

```js
fh.getOnuBandwidth(options, 11, 1, 2).then(onu => {
    console.log(onu)
})
```

Output:

```js
{
    _onuIndex: 369623552,
    slot: 11,
    pon: 1,
    onuId: 2,
    upBw: 2048,
    downBw: 1024,
    bandwidthUnit: 'Kbit/s'
}
```

## getOnuDistance()

**Description:** Returns the distance traveled by the fiber to a particular ONU in the kilometer unit. If any of the input parameters is invalid, the return is `false`.

**Function signature:**

```js
getOnuDistance(options: <object>, slot: <number>, pon: <number>, onuId: <number>) => Promise <object>
```

Example:

```js
fh.getOnuDistance(options, 11, 1, 1).then(onu => {
    console.log(onu)
})
```

Output:

```js
{
    _onuIndex: 369623296,
    value: '1.282',
    unit: 'km'
}
```

## getOnuIdList()

**Description:** Returns an array with the `onuId` of all authorized ONUs in OLT. If unable to connect to OLT, the return is `false`.

**Function signature:**

```js
getOnuIdList(options: <object>) => Promise <Array>
```

Example:

```js
fh.getOnuIdList(options).then(onuList => {
    console.log(onuList)
})
```

Output:

```js
[
    {
        _onuIndex: 369623296,
        onuId: 1
    },
    {
        _onuIndex: 369623552,
        onuId: 2
    },
    // { ... }
]
```

## getOnuIdListByPon()

**Description:** Returns an array containing the `onuIndex`, `slot`, `pon` and `onuId` parameters of each ONU belonging to a given PON port.

**Function signature:**

```js
getOnuIdListByPon(options: <object>, slot: <number>, pon: <number>) => Promise <Array>
```

Example:

```js
fh.getOnuIdListByPon(options, 11, 1).then(onuList => {
    console.log(onuList)
})
```

Output:

```js
[
    {
        _onuIndex:369623296,
        slot: 11,
        pon: 1,
        onuId: 1
    },
    // { ... }
]
```

## getOnuIndexList()

**Description:** Returns an array with the index of all authorized ONUs in OLT. If unable to connect to OLT, the return is `false`.

**Function signature:**

```js
getOnuIndexList(options: <object>) => Promise <Array>
```

Example:

```js
fh.getOnuIndexList(options).then(onuList => {
    console.log(onuList)
})
```

Output:

```js
[ 369623296, 371720448, 371720704 ]
```

## getOnuLastOffTime()

**Description:** Returns the date and time of the last disconnection of a given ONU. Date Format: (year)-(month)-(day). Time format: (hour):(minute):(second). If any of the input parameters is invalid, the return is `false`.

**Function signature:**

```js
getOnuLastOffTime(options: <object>, slot: <number>, pon: <number>, onuId: <number>) => Promise <object>
```

Example:

```js
fh.getOnuLastOffTime(options, 11, 1, 1).then(onu => {
    console.log(onu)
})
```

Output:

```js
{
    _onuIndex: 369623296,
    date: '2019-01-21',
    time: '08:01:04'
}
```

## getOnuListByPon()

**Description:** Returns a list of all connected ONUs on a given PON port. If any of the input parameters is invalid, the return is `false`.

**NOTE:** Depending on the number of ONUs connected to the Pon port, the return may take time. Approximately 0.5 seconds for each ONU connected to the port. If you want little ONU information and a faster return, see the [getBasicOnuListByPon()](#getbasiconulistbypon) function.

**Function signature:**

```js
getOnuListByPon(options: <object>, slot: <number>, pon: <number>) => Promise <Array>
```

Example:

```js
fh.getOnuListByPon(options, 11, 1).then(onuList => {
    console.log(onuList)
})
```

Output:

```js
[
    {
        _onuIndex: 369623296,
        slot: 11,
        pon: 1,
        onuId: 1,
        macAddress: 'FHTT1231e796',
        firmwareVersion: '',
        hardwareVersion: 'GJ-2.134.285F4G',
        ip: '0.0.0.0',
        onuLogicAuthId: '',
        onuLogicAuthIdPass: '',
        onuStatus: 'online',         // possible values: 'fiber cut', 'online', 'power cut' or 'offline'
        onuStatusValue: 1,           // 0 = 'fiber cut', 1 = 'online', 2 = 'power cut' or 3 = 'offline'
        softwareVersion: 'RP2522',
        systemName: '',
        distance: {
            _onuIndex: 369623296,
            value: '1.283',
            unit: 'km'
        },
        lastOffTime: {
            _onuIndex: 369623296,
            date: '2009-01-18',
            time: '23:37:39'
        },
        onuType: {
            category: 'SFU',
            code: 765,
            mode: 'dual',
            model: 'AN5506-04-F1',
            type:'GPON'
        },
        opticalPower: {
            _onuIndex: 369623296,
            rxPower:{
                value: '-19.25',
                unit: 'dBm'
            },
            txPower: {
                value: '3.03',
                unit: 'dBm'
            },
            temperature: {
                value: '45.10',
                unit: '°C'
            },
            voltage: {
                value: '3.21',
                unit: 'V'
            },
            currTxBias: {
                value: '9.70',
                unit: 'mA'
            }
        }
    },
    // { ... }
]
```

## getOnuOpticalPower()

**Description:** Returns information related to the signals, voltage, temperature and bias current of a particular ONU. If any of the input parameters is invalid, the return is `false`.

**NOTE:** For EPON technology some (or all) values ​​may be returned as zero.

**Function signature:**

```js
getOnuOpticalPower(options: <object>, slot: <number>, pon: <number>, onuId: <number>) => Promise <object>
```

Example:

```js
fh.getOnuOpticalPower(options, 11, 1, 1).then(onuOpticalPower => {
    console.log(onuOpticalPower)
})
```

Output:

```js
{
    _onuIndex: 369623296,
    rxPower:{
        value: '-19.25',
        unit: 'dBm'
    },
    txPower: {
        value: '3.03',
        unit: 'dBm'
    },
    temperature: {
        value: '45.10',
        unit: '°C'
    },
    voltage: {
        value: '3.21',
        unit: 'V'
    },
    currTxBias: {
        value: '9.70',
        unit: 'mA'
    }
}
```

## getOnuRxPowerListByPon()

**Description:** Returns an array containing the rx signal of all ONUs belonging to a given PON port. If the ONU is offline, the `rxPower` parameter will be equal to "--". If any of the input parameters is invalid, the return is `false`.

**NOTE:** For EPON technology some (or all) values ​​may be returned as zero.

**Function signature:**

```js
getOnuRxPowerListByPon(options: <object>, slot: <number>, pon: <number>) => Promise <Array>
```

Example:

```js
fh.getOnuRxPowerListByPon(options, 3, 2).then(list => {
    console.log(list)
})
```

Output:

```js
[
    {
        _onuIndex: 101712128,
        slot: 3,
        pon: 2,
        onuId: 1,
        rxPower: "-21.49",
        unit: "dBm"
    },
    {
        _onuIndex: 101712384,
        slot: 3,
        pon: 2,
        onuId: 2,
        rxPower: "--",
        unit: "dBm"
    },
    // { ... }
]
```

## getOnuType()

**Description:** Returns ONU type information. If any of the input parameters is invalid, the return is `false`.

**Function signature:**

```js
getOnuType(options: <object>, slot: <number>, pon: <number>, onuId: <number>) => Promise <object>
```

Example:

```js
fh.getOnuType(options, 11, 1, 1).then(onuType => {
    console.log(onuType)
})
```

Output:

```js
{
    category: 'SFU',
    code: 765,
    mode: 'dual',
    model: 'AN5506-04-F1',
    type: 'GPON'
}
```

**NOTE:** The `mode` parameter in `onuType` is the reference to the ONU mode of operation, which can be:
* **router**: operates as a router only
* **bridge**: operates only as bridge
* **dual**: operates as a router and/or bridge

**IMPORTANT!** Not all ONUs will have the `mode` parameter on `onuType`

## getOnuUplinkInterface()

**Description:** Returns information regarding the uplink interface of a given ONU. If any of the input parameters is invalid, the return is `false`.

**Function signature:**

```js
getOnuUplinkInterface(options: <object>, slot: <number>, pon: <number>, onuId: <number>) => Promise <object>
```

Example:

```js
fh.getOnuUplinkInterface(options, 11, 1, 1).then(upLink => {
    console.log(upLink)
})
```

Output:

```js
{
    downlinkRate: 2500,
    downlinkRateUnit: 'Mbit/s',
    portDescription: 'PON 11/1/1',
    portName: 'PON 11/1/1',
    portStatus: 'enable',    // possible values: 'enable' or 'disable'
    portStatusValue: 1,      // 1 = 'enable', 0 = 'disable'
    portType: 1,
    uplinkRate: 1250,
    uplinkRateUnit: 'Mbit/s'
}
```

## getOnuWebAdmin()

**Description:** Returns an array of web access settings for a given ONU. If any of the input parameters is invalid, the return is `false`.

**Function signature:**

```js
getOnuWebAdmin(options: <object>, slot: <number>, pon: <number>, onuId: <number>) => Promise <Array>
```

Example:

```js
fh.getOnuWebAdmin(options, 11, 1, 2).then(profiles => {
    console.log(profiles)
})
```

Output:

```js
[
    {
        group: 'common',        // possible values: 'common' or 'admin'
        groupValue: 1,          // 1 = 'common', 2 = 'admin'
        webUsername: 'user1',
        webPassword: '1111'
    },
    {
        group: 'admin',
        groupValue: 2,
        webUsername: 'user2',
        webPassword: '2222'
    },
    // { ... }
]
```

## getUnauthorizedOnus()

**Description:** Returns an array containing all unauthorized ONUs in OLT. If unable to connect to OLT, the return is `false`.

**Function signature:**

```js
getUnauthorizedOnus(options: <object>) => Promise <Array>
```

Example:

```js
fh.getUnauthorizedOnus(options).then(unauthOnus => {
    console.log(unauthOnus)
})
```

Output:

```js
[
    {
        index: 0,
        slot: 11,
        pon: 1,
        macAddress: 'FHTT1231e796',
        onuType: {
            category: 'SFU',
            code: 765,
            mode: 'dual',
            model: 'AN5506-04-F1',
            type: 'GPON'
        }
    },
    // { ... }
]
```

**NOTE:** The `mode` parameter in `onuType` is the reference to the ONU mode of operation, which can be:
* **router**: operates as a router only
* **bridge**: operates only as bridge
* **dual**: operates as a router and/or bridge

**IMPORTANT!** Not all ONUs will have the `mode` parameter on `onuType`

## getWan()

**Description:** Returns an array containing all wan profiles. To understand more about the returned parameters, see the [setWan()](#setwan) function. If the ONU is not authorized, the return will be `false`

**Function signature:**

```js
getWan(options: <object>, slot: <number>, pon: <number>, onuId: <number>) => Promise <Array>
```

Example:

```js
fh.getWan(options, 11, 1, 1).then(wanProfiles => {
    console.log(wanProfiles)
})
```

Output:

```js
[
    {
        _wanIndex: 1,
        wanName: '1_INTERNET_R_VID_2001',
        wanMode: 'internet',
        wanConnType: 'router',
        wanVlan: 2001,
        cos: null,
        ipMode: 'pppoe',
        pppoeMode: 'auto',
        pppoeName: '',
        pppoePassword: '',
        pppoeProxy: false,
        pppoeUsername: '',
        qInQ: false,
        wanIp: '0.0.0.0',
        wanMask: '128.0.0.0',
        wanGateway: '0.0.0.0',
        wanMasterDNS: '0.0.0.0',
        wanSlaveDNS: '0.0.0.0',
        wanNat: true,
        wanQoS: false,
        lan: {
            lan1: true,
            lan2: true,
            lan3: true,
            lan4: true
        },
        ssid: {
            ssid1: true,
            ssid2: true,
            ssid3: true,
            ssid4: true
        },
        wanCos: 0,
        svlan: 2000,
        svlanCos: null,
        tpid: 33024,
        translationValue: 2000,
        vlanMode: 'transparent'
    },
    // { ... }
]
```

## parseOnuIndex()

**Description:** Converts a `onuIndex` to `slot`, `pon`, and `onuId`.

**Function signature:**

```js
parseOnuIndex(onuIndex: <number>) => <object>
```

Example:

```js
var onu = fh.parseOnuIndex(369623296)
console.log(onu)
```

Output:

```js
{
    _onuIndex: 369623296,
    slot: 11,
    pon: 1,
    onuId: 1
}
```

## setLanPorts()

**Description:** Configures the lan ports of a particular ONU, allowing you to add vlans as well as enable or disable the ports. Values for `cvlanId`, `translation.value` and `vlanId` parameters must be within the range 1 to 4085. The parameter `cos` must be within the range 0 to 7. If any of the input parameters is invalid, the return is `false`.

**Function signature:**

```js
setLanPorts(options: <object>, slot: <number>, pon: <number>, onuId: <number>, aLanPorts: <Array>) => Promise <number>
```

`aLanPorts` parameter (basic):

```js
aLanPorts = [
    {
        lanPort: <number>,
        vlans: [
            {
                vlanMode: <string>,        // 'transparent' or 'tag'. By default is 'transparent'
                cvlanId: <number>,
                cos: <number>              // (optional) Priority or COS
            },
            // { ... }
        ]
    },
    // { ... }
]
```

`aLanPorts` parameter (with optionals):

```js
aLanPorts = [
    {
        lanPort: <number>,
        enablePort: <boolean>,             // By default is true
        clear: <boolean>,                  // Remove all vlans and set default settings. By default is false
        autoNegotiation: {
            auto: <boolean>,               // By default is true
            portSpeed: <string>,           // '10M', '100M' or '1000M'. By default is '100M'
            duplex: <string>               // 'half' or 'full'. By default is 'full'
        },
        flowControl: <boolean>,            // By default is false
        boardwidthSet: {                   // Only GPON
            upstreamMin: <number>,
            upstreamMax: <number>,
            downstream: <number>
        },
        bandwidthSet:{                     // Only EPON
            upMinGuaranteed: <number>,
            upMaxAllowed: <number>,
            downMinGuaranteed: <number>,
            downMaxAllowed: <number>,
            upstreamFixed: <number>
        },
        policing: {                        // Only EPON
            cir: <number>,
            cbs: <number>,
            ebs: <number>
        },
        dsPolicing: {                      // Only EPON
            cir: <number>,
            pir: <number>
        },
        igmpUpCvlan: {
            id: <number>,
            cos: <number>,
            tpId: <number>                 // By default is 33024
        },
        igmpUpSvlan: {
            id: <number>,
            cos: <number>,
            tpId: <number>                 // By default is 33024
        },
        vlans: [
            {
                vlanMode: <string>,        // 'transparent' or 'tag'. By default is 'transparent'
                cvlanId: <number>,
                cos: <number>,             // Priority or COS
                serviceType: <string>,     // 'unicast' or 'multicast'. By default is 'unicast'
                tls: <boolean>,            // If true, use in conjunction with 'qInQ' only
                tpId: <number>             // By default is 33024
                translation: {             // By default is false
                    value: <number>,
                    cos: <number>,
                    tpId: <number>         // By default is 33024
                },
                qInQ: {                    // Only GPON. If used, it will ignore all the above settings.
                    serviceName: <string>, // 'igmp', 'igmp2', 'pppoe' or 'iptv'
                    cos: <number>,
                    vlanId: <number>,      // By default is set automatically
                    tpId: <number>         // By default is 33024
                }
            },
            // { ... }
        ]
    },
    // { ... }
]
```

**NOTE:** If the `clear` parameter is set to true, all settings will be ignored if informed to a specific port. This option removes all vlans and sets the default settings. By default is `false`.

Example:

```js
fh.setLanPorts(options, 11, 1, 1, [
    {
        lanPort: 1,
        vlans: [
            { vlanMode: 'transparent', cvlanId: 3001, serviceType: 'multicast' },
            { vlanMode: 'tag', cvlanId: 3002, cos: 3 },
        ]
    },
    {
        lanPort: 3,
        enablePort: false
    },
    {
        lanPort: 4,
        autoNegotiation: {
            auto: false,
            duplex: 'half',
            portSpeed: '1000M'
        },
        flowControl: true,
        boardwidthSet: {
            upstreamMin: 600,
            upstreamMax: 500000,
            downstream: 500000
        },
        igmpUpCvlan: {
            cos: 1,
            id: 3001
        },
        igmpUpSvlan: {
            cos: 2,
            id: 3002
        },
        vlans: [
            { vlanMode: 'transparent', cvlanId: 3004, translation: { value: 3005, cos: 1 } },
            {
                tls: true,
                qInQ: {
                    serviceName: 'iptv',
                    cos: 2
                }
            }
        ]
    }
]).then(onuIndex => {
    console.log(onuIndex)
})
```

**NOTE:** LAN port 2 will not be changed in the example above and LAN port 1 settings that go beyond the VLAN will not be changed either.

Output:

```js
369623296
```

**NOTE:** If the [setLanPorts()](#setlanports) function does not identify whether the ONU is EPON or GPON, an error will be displayed and the `setLanPortsEPON()` or `setLanPortsGPON()` functions can be used by passing the same input parameters as the [setLanPorts()](#setlanports) function.

## rebootOnu()

**Description:** Restart a particular ONU. If any of the input parameters is invalid or it is not possible to restart the ONU, the return is `false`, otherwise `true`.

**Function signature:**

```js
rebootOnu(options: <object>, slot: <number>, pon: <number>, onuId: <number>) => Promise <boolean>
```

Example:

```js
fh.rebootOnu(options, 11, 1, 1).then(onu => {
    console.log(onu)
})
```

Output:

```js
true
```

## setOnuBandwidth()

**Description:** Sets the bandwidth of a given ONU. The input parameters `upBw` and `downBw` must be in the unit of Kbit/s and the values must be within the range 256 to 1000000. If any of the input parameters is invalid, the return is `false`.

**Function signature:**

```js
setOnuBandwidth(options: <object>, slot: <number>, pon: <number>, onuId: <number>, upBw: <number>, downBw: <number>) => Promise <number>
```

Example:

```js
fh.setOnuBandwidth(options, 11, 1, 2, 2048, 1024).then(onuIndex => {
    console.log(onuIndex)
})
```

Output:

```js
369623552
```

## setOnuWebAdmin()

**Description:** Set the ONU access settings via web. Returns `true` on success and `false` otherwise. Some ONUs only accept a single 'admin' group profile, such as AN5506-01-A1, but if more than one profile is entered, the group profile 'admin' will be set and the others will be ignored for this type of ONU. If any of the input parameters is invalid, the return is `false`.

**Function signature:**

```js
setOnuWebAdmin(options: <object>, slot: <number>, pon: <number>, onuId: <number>, aWebConfig: <Array>) => Promise <boolean>
```

Example:

```js
fh.setOnuWebAdmin(options, 11, 1, 1, [
    {username: 'user1', password: '1111', group: 'common'},
    {username: 'user2', password: '2222', group: 'admin'},
    {username: 'user3', password: '3333', group: 'common'}
]).then(config => {
    console.log(config)
})
```

Output:

```js
true
```

## setWan()

**Description:** Performs the WAN settings. Values not entered in `profiles` parameter will be set to `false`, except for the `lans` and `ssids` parameters, which are all set to true by default. If any of the input parameters is invalid, the return is `false`.

**Function signature:**

```js
setWan(options: <object>, slot: <number>, pon: <number>, onuId: <number>, profiles: <Array>) => Promise <number>
```

`profiles: <Array>` parameter:

```js
var profile = {        // Values:
    wanMode:           // 'tr069', 'internet', 'tr069_internet', 'multicast', 'voip', 'voip_internet', 'radius', 'radius_internet' or 'other'
    wanConnType:       // 'router' or 'bridge'
    wanVlan:           // <number> or false
    wanCos:            // <number> or false
    wanNat:            // true or false
    ipMode:            // 'dhcp', 'static' or 'pppoe'
    wanIp:             // 'x.y.w.z' or false
    wanMask:           // 'x.y.w.z' or false
    wanGateway:        // 'x.y.w.z' or false
    wanMasterDNS:      // 'x.y.w.z' or false
    wanSlaveDNS:       // 'x.y.w.z' or false
    pppoeProxy:        // true or false
    pppoeUsername:     // <string> or false
    pppoePassword:     // <string> or false
    pppoeName:         // <string> or false
    pppoeMode:         // 'auto' or 'payload'
    wanQoS:            // true or false
    vlanMode:          // 'transparent' or 'tag'
    translationValue:  // <number> or false
    cos:               // <number> or false
    QinQ:              // true or false
    tpid:              // <number> By default is 33024
    svlan:             // <number> or false
    svlanCos:          // <number> or false
    lans: { 
        lan1:          // true or false
        lan2:          // true or false
        lan3:          // true or false
        lan4:          // true or false
        },
    ssids: { 
        ssid1:         // true or false
        ssid2:         // true or false
        ssid3:         // true or false
        ssid4:         // true or false
    }
}
```

Example:

```js
fh.setWan(options, 11, 1, 1, [
    { wanMode: 'internet', wanConnType: 'router', wanVlan: 2001, ipMode: 'pppoe', translationValue: 2000, svlan: 2000 },
    { wanMode: 'tr069', wanConnType: 'router', wanVlan: 2002, ipMode: 'dhcp', translationValue: 2000, svlan: 3000 }
]
).then(onuIndex => {
    console.log(onuIndex)
})
```

Output:

```js
369623296
```

# Extra example

If you need to assign different settings for some ONUs types according to the model, use the following example:

```js
const fh = require('snmp-fiberhome')

const options = {
    ip: '1.2.3.4',
    community: 'default',
    port: 161,
    trapPort: 162
}

const Queue = require("promise-queue")
Queue.configure(require('vow').Promise)

const bridges = ['AN5506-01-A1', '...']    // Add your type ONUs. See the table at .\node_modules\snmp-fiberhome\src\tables.js

function example(options) {
    var queue = new Queue(1, 10000)
    fh.getUnauthorizedOnus(options).then(result => {
        if (result.length > 0) {
            console.log(`Unauthorized ONUs found: ${result.length} \nadd...`)
            result.forEach(onu => {
                if (bridges.includes(onu.onuType.model))      // Bridge
                    queue.add(f => fh.addOnu(options, onu,
                        [
                            { wanMode: 'tr069', wanConnType: 'router', wanVlan: 3002, ipMode: 'dhcp', translationValue: 2000, svlan: 3000 }
                        ],
                        [
                            { lanPort: 1, vlans: [{ vlanMode: 'transparent', cvlanId: 2010 }] },
                        ]
                    )).then(onuAuth => {
                        console.log('\t' + onuAuth.macAddress + ' - OK (bridge)')
                    })
                else                                          // Router
                    queue.add(f => fh.addOnu(options, onu,
                        [
                            { wanMode: 'internet', wanConnType: 'router', wanVlan: 2003, ipMode: 'pppoe', translationValue: 2000, svlan: 2000 },
                            { wanMode: 'tr069', wanConnType: 'router', wanVlan: 2004, ipMode: 'dhcp', translationValue: 3000, svlan: 3000 }
                        ],
                        [
                            { lanPort: 1, vlans: [{ vlanMode: 'transparent', cvlanId: 3010 }, { vlanMode: 'tag', cvlanId: 3011, cos: 3 }] },
                            { lanPort: 2, enablePort: false }
                        ]
                    )).then(onuAuth => {
                        console.log('\t' + onuAuth.macAddress + ' - OK')
                    })
            })
        } else
            console.log(`Unauthorized ONUs found: 0`)
    })
}

example(options)
```


## Tests

| OLT       | Status     |
|-----------|------------|
| AN5516-01 | Tested     |
| AN5516-06 | Tested     |
| AN5116    | Not implemented |

---

| ONU          | Tech | Status |
|--------------|------|--------|
| AN5506-01-A1 | GPON | Tested |
| AN5506-04-F1 | GPON | Tested |
|      -     | EPON | Tested |

## Bug fixes and features

Version 1.3.x will focus on the performance of functions.

- (version: 1.3.0)
  - getOnuOpticalPowerList(): discontinued.
  - Function implementation: [getOnuRxPowerListByPon()](#getonurxpowerlistbypon)

# Contributions

This module was sponsored by telecommunications company Valenet:
![](http://valenet.com.br/wp-content/themes/valenet/assets/images/logo.png)

# Help us!

Help us improve this module. If you have any information that the module does not provide or provides incompletely or incorrectly, please use our Github repository or email.

**pt-BR:**
Ajude-nos a melhorar este módulo. Se você tiver alguma informação que o módulo não forneça ou forneça de maneira incompleta ou incorreta, use nosso repositório do Github ou email.


# License

  [MIT](LICENSE) License
