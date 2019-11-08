# snmp-fiberhome

This module communicates with Fiberhome OLTs using the SNMP protocol. The module is capable of managing the OLT, Slots, Cards, pon ports and ONUs by performing read and write functions directly in OLT.

[![NPM Version](http://img.shields.io/npm/v/snmp-fiberhome.svg?style=flat)](https://www.npmjs.org/package/commander) [![NPM Downloads](https://img.shields.io/npm/dm/snmp-fiberhome.svg?style=flat)](https://npmcharts.com/compare/snmp-fiberhome?minimal=true)

## Summary
- Installation
- Tests
- Bug fixes and features
- Initial settings
- OLT functions
- Slot functions
- Card functions
- ONU functions
- Extra example
- Contributions
- Help us!
- License

## Installation

This is a [Node.js](https://nodejs.org/en/) module available through the [npm](https://www.npmjs.com/).

```bash
$ npm install --save snmp-fiberhome 
```

It is loaded using the require() function:

```js
const fh = require('snmp-fiberhome')
```

## Tests

| OLT       | Status     |
|-----------|------------|
| AN5516-01 | Tested     |
| AN5116    | Not Tested |

---

| ONU          | Tech | Status |
|--------------|------|--------|
| AN5506-01-A1 | GPON | Tested |
| AN5506-04-F1 | GPON | Tested |

## Bug fixes and features

Version 1.1.x of this module contains:

- Correction of parameters name 'multcast' to 'multicast'
- `setLanPorts()` and `getLanPorts()`: Added more features and changed some parameter names.
- `addAllOnus()`: changed some parameter names.
- `addOnu()`: changed some parameter names.
- `enableLanPorts()`: changed some parameter names.


## Initial settings

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

The following functions are assigned the **slot**, **pon** and **onuId** parameters to specify a particular ONU. If you work with onuIndex, use the `parseOnuIndex()` function to convert onuIndex to an object containing the values of **slot**, **pon** and **onuId**.

The `onuIndex` parameter in the following functions is calculated as follows:

    slot*(2^25) + pon*(2^19) + onuId*(2^8)  // for OLT AN5516

See the function `convertToOnuIndex()`

# OLT functions

## getOltInformation()

**Description:** Get relevant information from OLT.

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

**Description:** Returns the OLT model.

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

**Description:** Returns information regarding the subrack.

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

**Description:** Returns an array with the relevant information from all PON ports in the OLT.
NOTE: Depending on the number of connected ONUs on the OLT, the loading time may take time and cause a timeout. In this case, use the `getPonPort()` function in conjunction with a loop.

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
        portUplinkRate: 1250,
        portUplinkRateUnit: 'Mbit/s',
        portDownlinkRate: 2500,
        portDownlinkRateUnit: 'Mbit/s',
        portEnableStatus: 'enable',
        portEnableStatusValue: 1,
        portIndex: 369623040,
        portName: 'PON 11/1',
        portOnlineStatus: 'online',
        portOnlineStatusValue: 1,
        portType: 'PON',
        portTypeValue: 1
    },
    // { ... }
]
```

## getPonPort()

**Description:** Returns the relevant information for a given PON port in OLT.

**Function signature:**

```js
getPonPort(options: <object>, slot: <number>, ponPort: <number>) => Promise <object>
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
    portUplinkRate: 1250,
    portUplinkRateUnit: 'Mbit/s',
    portDownlinkRate: 2500,
    portDownlinkRateUnit: 'Mbit/s',
    portEnableStatus: 'enable',
    portEnableStatusValue: 1,
    portIndex: 369623040,
    portName: 'PON 11/1',
    portOnlineStatus: 'online',
    portOnlineStatusValue: 1,
    portType: 'PON',
    portTypeValue: 1
}
```

# Slot functions

## getSlots()

**Description:** Returns an array with the number of each slot.

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

**Description:** Returns an array with relevant information from all slots in the OLT.

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
        cardPresentStatus: 'present',
        cardInformation: {
            availablePorts: 8,
            numberOfPorts: 8,
            cardStatus: 'normal',
            cardStatusValue: 1,
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

**Description:** Returns an array with relevant information from all cards.

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
        cardStatus: 'normal',
        cardStatusValue: 1,
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

**Description:** Returns relevant information from a given card. If not found, the return will be `false`.

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
    cardStatus: 'normal',
    cardStatusValue: 1,
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
For all the following functions, if the ONU, pon port or slot is not found, the return is **false**.

## addAllOnus()

**Description:** This function performs WAN and Vlans authorization and configuration for all unauthorized ONUs in a OLT. The input parameters `profilesWan` and `profileLanPorts` are not required. To learn more about the `profilesWan` input parameter see the `setWan()` function. To learn more about the `profileLanPorts` input parameter, see the `setLanPorts()` function. If the authorized ONU already contains any profiles configured for WAN or Vlan, the old settings will be replaced with the new ones. The return is an array that contains all authenticated ONUs.

**Function signature:**

```js
addAllOnus(options: <object>, profilesWan: <Array>, profileLanPorts: <Array>) => Promise <Array>
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
        index: 0,
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

**Description:** Similar to the `addAllOnus()` function, but performs WAN and Vlans authorization and configuration for a particular ONU.

**Function signature:**

```js
addOnu(options: <object>, onu: <object>, profilesWan: <Array>, profileLanPorts: <Array>) => Promise <object>
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
            mode: 'dual'
            model: 'AN5506-04-F1'
            type: 'GPON'
        }
}
```

## authenticateOnu()

**Description:** Authenticates a particular ONU. WAN and Vlan settings can be made using the `setWan()` and `setLanPorts()` functions, respectively. All input parameters for `authenticateOnu()` can be obtained by the `getUnauthorizedOnus()` function.

**Function signature:**

```js
authenticateOnu(options: <object>, slot: <number>, pon: <number>, onuTypeCode: <number>, macAddress: <string>) => Promise <object>
```

Example:

```js
fh.authenticateOnu(options, 11, 1, 765, 'FHTT1231e796').then(authOnu => {
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
        mode: 'dual'
        model: 'AN5506-04-F1'
        type: 'GPON'
    }
}
```

## delOnu() and delOnuByMacAddress()

**Description:** Deletes a particular ONU. If the ONU is successfully deleted, the function returns the mac address of the respective ONU deleted, otherwise false.

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

**Description:** Returns a list of all authorized ONUs in OLT.

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

**Description:** Searches for a ONU in OLT based on mac address. The ONU must be authorized. NOTE: The input parameters `slot` and `pon` are not required, but their use will make the search faster. On success, returns an object containing basic ONU information, otherwise returns `null`.

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

## getLanPorts()

**Description:** Returns the LAN ports settings of a given ONU.

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
                auto: false,
                duplex: 'full',
                portSpeed: '100M'
            },
            flowControl: true,
            boardwidthSet: {
                upstreamMin: 640,
                upstreamMax: 1000000,
                downstream: 1000000
            },
            igmpUpCvlan: {
                cos: 6,
                id: 2001,
                tpId: 33024
            },
            igmpUpSvlan: {
                cos: null,
                id: null,
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
                vlanMode: 'transparent', cvlanId: 2001, cos: null, serviceType: 'unicast', tpId: 33024
                translation: {cos: 5, value: 4000},
                qInQ: {serviceName: 'IPTV', vlanId: 404, cos: 7}
            }
        ]
    },
    // { ... }
]
```

## getMacAddressList()

**Description:** Returns a list containing the mac address of all authorized ONUs in a given OLT

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

**Description:** Returns relevant information from a particular ONU, such as: opticalPowers (signals), distance, model, macAddress, enters others.

**NOTE:** The `opticalPower` parameter is available for GPON technology only. EPON technology will return the parameters with zero value.

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
    onuStatus: 'online',
    onuStatusValue: 1,
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
        portStatus: 'enable',
        portStatusValue: 1,
        portType: 1,
        uplinkRate: 1250,
        uplinkRateUnit: 'Mbit/s'
    }
}
```

## getOnuBandwidth()

**Description:** Returns the bandwidth of a given ONU.

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

**Description:** Returns the distance traveled by the fiber to a particular ONU in the kilometer unit.

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

**Description:** Returns a list with the `onuId` of all authorized ONUs in OLT.

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

## getOnuIndexList()

**Description:** Returns a list with the index of all authorized ONUs in OLT.

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

**Description:** Returns the date and time of the last disconnection of a given ONU. Date Format:  (year)-(month)-(day). Time format: (hour):(minute):(second).

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

**Description:** Returns a list of all connected ONUs on a given PON port.

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
        onuStatus: 'online',
        onuStatusValue: 1,
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

**Description:** Returns information related to the signals, voltage, temperature and bias current of a particular ONU. 

**NOTE:** This option is available for GPON technology only. EPON technology will return the parameters with zero value.

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

## getOnuOpticalPowerList()

**Description:** Returns a signal list of all authorized ONUs in OLT.

**NOTE:** This option is available for GPON technology only. EPON technology will return the parameters with zero value.

**Function signature:**

```js
getOnuOpticalPowerList(options: <object>) => Promise <Array>
```

Example:

```js
fh.getOnuOpticalPowerList(options).then(onuList => {
    console.log(onuList)
})
```

Output:

```js
[
    {
        _onuIndex: 369623296
        slot: 11,
        pon: 1,
        onuId: 1,
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

## getOnuUplinkInterface()

**Description:** Returns information regarding the uplink interface of a given ONU.

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
    portStatus: 'enable',
    portStatusValue: 1,
    portType: 1,
    uplinkRate: 1250,
    uplinkRateUnit: 'Mbit/s'
}
```

## getOnuWebAdmin()

**Description:** Returns an array of web access settings for a given ONU.

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
        group: 'common',
        groupValue: 1,
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

**Description:** Returns an array containing all unauthorized ONUs in OLT.

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
            mode: 'dual'
            model: 'AN5506-04-F1'
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

Not all ONUs will have the `mode` parameter on `onuType`


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

**Description:** Configures the lan ports of a particular ONU, allowing you to add vlans as well as enable or disable the ports. Values for `cvlanId`, `translation.value` and `vlanId` parameters must be within the range 1 to 4085. The parameter `cos` must be within the range 0 to 7

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
        autoNegotiation: {                 // By default is true
            auto: <boolean>,
            portSpeed: <string>,           // '10M', '100M' or '1000M'. By default is '100M'
            duplex: <string>               // 'half' or 'full'. By default is 'full'
        },
        flowControl: <boolean>,            // By default is false
        boardwidthSet: {
            upstreamMin: <number>,
            upstreamMax: <number>,
            downstream: <number>
        },
        igmpUpCvlan: {
            cos: <number>,
            id: <number>,
            tpId: <number>                 // By default is 33024
        },
        igmpUpSvlan: {
            cos: <number>,
            id: <number>,
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
                qInQ: {                    // If used, it will ignore all the above settings.
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

## setOnuBandwidth()

**Description:** Sets the bandwidth of a given ONU. The input parameters `upBw` and `downBw` must be in the unit of Kbit/s and the values must be within the range 256 to 1000000.

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

**Description:** Set the ONU access settings via web. Returns `true` on success and `false` otherwise. Some ONUs only accept a single 'admin' group profile, such as AN5506-01-A1, but if more than one profile is entered, the group profile 'admin' will be set and the others will be ignored for this type of ONU.

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

**Description:** Performs the WAN settings. Values not entered in `profiles` parameter will be set to `false`, except for the `lans` and `ssids` parameters, which are all set to true by default.

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
    tpid: 33024,
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

# Contributions

This module is sponsored by telecommunications company Valenet:
![](http://valenet.com.br/wp-content/themes/valenet/assets/images/logo.png)

# Help us!

Help us improve this module. If you have any information that the module does not provide or provides incompletely or incorrectly, please use our Github repository or email.

**Pt-Br:**
Ajude-nos a melhorar este módulo. Se você tiver alguma informação que o módulo não forneça ou forneça de maneira incompleta ou incorreta, use nosso repositório do [Github](https://github.com/) ou email. Pode enviar em português Brasil também! :)

Repository: https://github.com/davibaltar/snmp-fiberhome

E-mail: davibaltar.npm@gmail.com

# License

  [MIT](LICENSE) License

Copyright (c) 2019 davibaltar

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.