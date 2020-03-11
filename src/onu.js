
const oid_fh = require('./oid-fh')
const snmp_fh = require('./pack-fiberhome')
const table = require('./tables')
const olt = require('./olt')
const gFunc = require('./global-functions')

const Queue = require("promise-queue")
Queue.configure(require('vow').Promise)

const OID = oid_fh.OIDs
const queueTime = 50           // Tempo para iniciar o processamento na fila 

const modeTab = {
    tr069: '00',
    internet: '01',
    tr069_internet: '02',
    multicast: '03',
    voip: '04',
    voip_internet: '05',
    radius: '07',
    radius_internet: '08',
    other: '64'
}

// objeto contendo os valores 'defaults'
var objStandart = {
    wanMode: 'internet',
    wanConnType: 'router',  // mode
    wanVlan: false,         // vlanId
    wanCos: false,
    wanNat: true,           // nat
    ipMode: 'dhcp',
    wanIp: false,           // ip
    wanMask: false,         // subNet
    wanGateway: false,      // gateway
    wanMasterDNS: false,    // masterDNS
    wanSlaveDNS: false,     // slaveDNS
    pppoeProxy: false,
    pppoeUsername: false,
    pppoePassword: false,
    pppoeName: false,
    pppoeMode: 'auto',
    wanQoS: false,
    vlanMode: 'transparent',
    translationValue: false,
    cos: false,
    qInQ: false,
    tpid: 33024,
    svlan: false,
    svlanCos: false,
    lans: { lan1: true, lan2: true, lan3: true, lan4: true },
    ssids: { ssid1: true, ssid2: true, ssid3: true, ssid4: true }
}

const lanPortDefault = {
    lanPort: 0,
    enablePort: true,
    autoNegotiation: {
        auto: true,
        duplex: "full",
        portSpeed: "100M"
    },
    boardwidthSet: {
        downstream: 1000000,
        upstreamMax: 1000000,
        upstreamMin: 640
    },
    flowControl: false,
    igmpUpCvlan: {
        cos: null,
        id: null,
        tpId: 33024
    },
    igmpUpSvlan: {
        cos: null,
        id: null,
        tpId: 33024
    }
}

function addAllOnus(options, wanProfiles, lanPortProfiles) {
    var queue = new Queue(1, 10000)
    var aAuthOnus = []
    return new Promise((resolve, reject) => {
        try {
            getUnauthorizedOnus(options).then(result => {
                if (result === false)
                    return resolve(false)
                if (result.length > 0) {
                    if (options.enableLogs)
                        console.log(`Unauthorized ONUs found: ${result.length} \nadd...`)
                    result.forEach(onu => {
                        queue.add(f => addOnu(options, onu, wanProfiles, lanPortProfiles)).then(onuAuth => {
                            aAuthOnus.push(onuAuth)
                            if (options.enableLogs)
                                console.log('\t' + onuAuth.macAddress + ' - OK')
                            if (result.length == aAuthOnus.length)
                                return resolve(aAuthOnus)
                        })
                    })
                } else {
                    if (options.enableLogs)
                        console.log(`Unauthorized ONUs found: 0`)
                    return resolve([])
                }
            }, error => {
                return resolve(false)
            })
        } catch (err) {
            console.error(err.toString())
            return reject(err)
        }
    })
}

function addOnu(options, onu, wanProfiles, lanPortProfiles) {
    return new Promise((resolve, reject) => {
        setTimeout(t => {
            var onuForm = { slot: onu.slot, pon: onu.pon, macAddress: onu.macAddress }
            try {
                authorizeOnu(options, onu.slot, onu.pon, (onu.onuType && onu.onuType.code) || onu.onuTypeCode, onu.macAddress).then(ret => {
                    if (ret === false)
                        return resolve(false)
                    getBasicOnuInfo(options, onu.macAddress, onu.slot, onu.pon).then(onuAuth => {
                        if (onuAuth) {
                            if (wanProfiles && wanProfiles.length > 0) {
                                setWan(options, onuAuth.slot, onuAuth.pon, onuAuth.onuId, wanProfiles).then(onuIndex => {
                                    if (lanPortProfiles && lanPortProfiles.length > 0)
                                        setLanPorts(options, onuAuth.slot, onuAuth.pon, onuAuth.onuId, lanPortProfiles).then(onuIndex => {
                                            return resolve({ ...ret, ...onuForm, ...parseOnuIndex(onuIndex) })
                                        })
                                    else
                                        return resolve({ ...ret, ...onuForm, ...parseOnuIndex(onuIndex) })
                                })
                            } else if (lanPortProfiles && lanPortProfiles.length > 0) {
                                setLanPorts(options, onuAuth.slot, onuAuth.pon, onuAuth.onuId, lanPortProfiles).then(onuIndex => {
                                    return resolve({ ...ret, ...onuForm, ...parseOnuIndex(onuIndex) })
                                })
                            } else {
                                return resolve({ _onuIndex: onuAuth.onuIndex, ...ret, ...onuForm, ...parseOnuIndex(onuAuth._onuIndex) })
                            }
                        } else
                            return reject('Erro: macAddress para a onu não foi encontrado na OLT: ' + JSON.stringify(onu))
                    })
                })
            } catch (excp) {
                console.error(excp.toString())
            }
        }, queueTime)
    })
}

function authenticateOnu(options, slot, pon, onuTypeCode, macAddress) {
    console.error("authenticateOnu(): Deprecated function. Use 'authorizeOnu()'. The 'authenticateOnu()' will be deprecated in later versions")
    return new Promise((resolve, reject) => {
        authorizeOnu(options, slot, pon, onuTypeCode, macAddress).then(ret => {
            return resolve(ret)
        }, err => {
            return reject(err)
        })
    })
}

function authorizeOnu(options, slot, pon, onuTypeCode, macAddress) {
    return new Promise((resolve, reject) => {
        try {
            gFunc.isValid(options, slot, pon).then(isValid => {
                if (isValid && slot && pon && onuTypeCode && macAddress) {
                    // Header
                    var OID_Value = snmp_fh.auth
                    OID_Value = OID_Value.split(' ')
                    OID_Value[229] = slot.toHex(2)
                    OID_Value[231] = pon.toHex(2)

                    // ONU Type Code
                    var onuTypeCodeHex = onuTypeCode.toHex(4)
                    OID_Value[232] = onuTypeCodeHex.slice(0, 2)
                    OID_Value[233] = onuTypeCodeHex.slice(2, 4)

                    // macAdrress or Serial
                    for (var i = 0; i < 12; i++)
                        OID_Value[158 + i] = macAddress.strToHex().split(' ')[i]
                    OID_Value = OID_Value.join(' ')

                    snmp_fh.sendSnmp(OID.setAuth, OID_Value, options, true).then(ret => {
                        snmp_fh.sendSnmp(OID.confirmSetAuth, OID_Value, options, true).then(retConfirm => {
                            return resolve({ slot, pon, onuType: table.ONUType[onuTypeCode], macAddress })
                        })
                    })
                } else return resolve(false)
            }, error => {
                return resolve(false)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function convertToOnuIndex(slot, pon, onuId) {
    return (slot) * 2 ** 25 + (pon) * 2 ** 19 + (onuId) * 2 ** 8
}

function delOnu(options, slot, pon, onuId, onuIndex) {
    return new Promise((resolve, reject) => {
        try {
            if (onuIndex)
                delOnuByIndex(options, onuIndex)
            else
                getOnu(options, slot, pon, onuId).then(onu => {
                    if (onu) {
                        delOnuByMacAddress(options, onu.macAddress).then(ret => {
                            return resolve(ret)
                        })
                    } else
                        return resolve(false)
                })
        } catch (err) {
            return reject(err)
        }
    })
}

function delOnuByIndex(options, onuIndex) {
    return new Promise((resolve, reject) => {
        try {
            var onu = parseOnuIndex(onuIndex)
            getOnu(options, onu.slot, onu.pon, onu.onuId).then(onuFound => {
                if (onuFound && onuFound.macAddress) {
                    delOnuByMacAddress(options, onuFound.macAddress).then(ret => {
                        return resolve(ret)
                    })
                } else
                    return resolve(false)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function delOnuByMacAddress(options, macAddress) {
    return new Promise((resolve, reject) => {
        try {
            var delOnu = snmp_fh.delOnuByMacAddress
            delOnu = delOnu.split(' ')
            for (var i = 0; i < 12; i++)    // macAddress or serial
                delOnu[158 + i] = macAddress.strToHex().split(' ')[i]
            delOnu = delOnu.join(' ')

            snmp_fh.sendSnmp(OID.delOnuByMacAddress, delOnu, options, true).then(ret => {
                snmp_fh.sendSnmp(OID.confirmDelOnuByMacAddress, delOnu, options, true).then(retConfirm => {
                    if (ret.split('').length > 370)
                        return resolve(false)
                    return resolve(macAddress)
                })
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function delWan(options, slot, pon, onuId) {
    return new Promise((resolve, reject) => {
        var delWan = snmp_fh.setWanHeader
        delWan = delWan.split(' ')
        // Tamanho do pacote
        delWan[70] = '00'
        delWan[71] = '3a'
        delWan[122] = '00'
        delWan[123] = '3a'

        delWan[159] = '01'
        delWan[161] = slot.toHex(2)
        delWan[163] = pon.toHex(2)
        delWan[165] = onuId.toHex(2)            // ONU NUMBER / ONU Authorized No.
        delWan[181] = '00'                      // Quantidade de Wans
        delWan = delWan.join(' ')

        var confirmDelWan = delWan.slice(0, -6)
        confirmDelWan = confirmDelWan.split(' ')
        confirmDelWan[59] = '00'
        confirmDelWan[70] = '00'
        confirmDelWan[71] = '38'
        confirmDelWan[122] = '00'
        confirmDelWan[123] = '38'
        confirmDelWan = confirmDelWan.join(' ')

        getWan(options, slot, pon, onuId).then(wanProfilesBefore => {
            snmp_fh.sendSnmp(OID.setWan, delWan, options, true).then(ret => {
                snmp_fh.sendSnmp(OID.confirmSetWan, confirmDelWan, options, true).then(retConfirm => {
                    getWan(options, slot, pon, onuId).then(wanProfilesAfter => {
                        if (wanProfilesBefore.length == wanProfilesAfter.length)
                            return resolve(false)
                        return resolve(true)
                    })
                })
            })
        })
    })
}

function getAuthorizedOnus(options) {
    return new Promise((resolve, reject) => {
        try {
            getMacAddressList(options).then(serialList => {
                var onuList = []
                serialList.map(onu => {
                    onuList.push({ ...onu, ...parseOnuIndex(onu._onuIndex) })
                })
                return resolve(onuList)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function formatVarbindList(varbindList, type) {
    var aONUs = []
    varbindList.forEach(varbind => {
        var oid = varbind.oid.split('.')
        if (varbind.value != 0 && varbind.value != null) {
            if (oid[12] == 2) {
                aONUs.push({ index: parseInt(oid[13]), slot: varbind.value })
            } else {
                var idx = aONUs.findIndex(e => e.index == oid[13])
                if (idx > -1) {
                    if (type == 'auth') {
                        if (oid[12] == 3)
                            aONUs[idx].pon = varbind.value
                        else if (oid[12] == 4)
                            aONUs[idx].onuId = varbind.value
                        else if (oid[12] == 5)
                            aONUs[idx].onuType = table.ONUType[varbind.value]
                        else if (oid[12] == 10)
                            aONUs[idx].macAddress = varbind.value.toString()
                    } else if (type == 'unauth') {
                        if (oid[12] == 3)
                            aONUs[idx].pon = varbind.value
                        else if (oid[12] == 4)
                            aONUs[idx].onuType = table.ONUType[varbind.value]
                        else if (oid[12] == 7)
                            aONUs[idx].macAddress = varbind.value.toString()
                    }
                }
            }
        }
    })
    return aONUs
}

function getOnuBandwidth(options, slot, pon, onuId) {
    return new Promise((resolve, reject) => {
        try {
            gFunc.isValid(options, slot, pon, onuId).then(isValid => {
                if (isValid && slot && pon && onuId) {
                    var getBW = snmp_fh.getOnuBandwidth
                    getBW = getBW.split(' ')
                    getBW[161] = slot.toHex(2)
                    getBW[163] = pon.toHex(2)
                    getBW[165] = onuId.toHex(2)            // ONU NUMBER / ONU Authorized No.  
                    getBW[151] = getBW[161]
                    getBW[153] = getBW[163]
                    getBW = getBW.join(' ')
                    snmp_fh.sendSnmp(OID.getOnuBandwidth, getBW, options, true).then(ret => {
                        var hex = '' // Adicionando espaço em branco a cada 2 bytes
                        for (var i = 0; i < ret.length; i += 2)
                            hex += ret.substring(i, i + 2) + ' '
                        hex = hex.trim()
                        var value = hex.split('2b 06 01 04 01 ad 73 5b 01 06 01 01 01 28 01 ')[1]
                        value = value.split(' ')
                        if (value[1] == '81')
                            value = value.splice(3)
                        else
                            value = value.splice(4)

                        var upBw = value[185] + value[186] + value[187]
                        var downBw = value[189] + value[190] + value[191]
                        upBw = parseInt(upBw, 16)
                        downBw = parseInt(downBw, 16)
                        snmp_fh.sendSnmp(OID.confirmSetOnuBandwidth, getBW, options, true).then(retConfirm => {
                            return resolve({ _onuIndex: convertToOnuIndex(slot, pon, onuId), slot, pon, onuId, upBw, downBw, bandwidthUnit: 'Kbit/s' })
                        })
                    })
                } else return resolve(false)
            }, error => {
                return resolve(false)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function getOnu(options, slot, pon, onuId, toIgnore, lite) {
    return new Promise((resolve, reject) => {
        try {
            var onuIndex = convertToOnuIndex(slot, pon, onuId)
            if (lite)
                getBasicOnuByIndex(options, onuIndex, toIgnore).then(onu => {
                    return resolve(onu)
                })
            else
                getOnuByIndex(options, onuIndex, toIgnore, lite).then(onu => {
                    return resolve(onu)
                })
        } catch (err) {
            return reject(err)
        }
    })
}

function getOnuByIndex(options, onuIndex, toIgnore, ignoreValid) {
    if (!toIgnore)
        toIgnore = []
    return new Promise((resolve, reject) => {
        try {
            var _onu = parseOnuIndex(onuIndex)
            gFunc.isValid(options, _onu.slot, _onu.pon, _onu.onuId, ignoreValid).then(isValid => {
                if (isValid && onuIndex) {
                    var oids = [OID.getOnuType, OID.getOnuIp, OID.getOnuSystemName, OID.getOnuLogicAuthId, OID.getOnuLogicAuthIdPass, OID.getOnuMacAddress, OID.getOnuStatus, OID.getOnuSoftwareVersion, OID.getOnuHardwareVersion, OID.getOnuFirmwareVersion, OID.getOnuRemoteRestart]
                    oids = oids.map(oid => oid + '.' + onuIndex)
                    snmp_fh.get(options, oids).then(data => {
                        olt.getOltModel(options).then(oltData => {
                            var oltModel = oltData.includes('5116') ? '5116' : oltData.includes('5516') ? '5516' : null
                            var onu = { ..._onu }
                            // Formatando/convertendo os dados
                            data.forEach((o, idx) => {
                                if (o.oid.split('.')[12] == 5)                          // OID.getOnuType
                                    onu.onuType = table.ONUType[o.value] || 'not identified'
                                else if (o.oid.split('.')[12] == 6 && o.value)          // OID.getOnuIp
                                    onu.ip = o.value.toString()
                                else if (o.oid.split('.')[12] == 7 && o.value)          // OID.getOnuSystemName
                                    onu.systemName = o.value.toString()
                                else if (o.oid.split('.')[12] == 8 && o.value)          // OID.getOnuLogicAuthId
                                    onu.onuLogicAuthId = o.value.toString()
                                else if (o.oid.split('.')[12] == 9 && o.value)          // OID.getOnuLogicAuthIdPass
                                    onu.onuLogicAuthIdPass = o.value.toString()
                                else if (o.oid.split('.')[12] == 10 && o.value)         // OID.getOnuMacAddress
                                    onu.macAddress = o.value.toString()
                                else if (o.oid.split('.')[12] == 11) {                  // OID.getOnuStatus
                                    onu.onuStatusValue = o.value
                                    onu.onuStatus = oltModel == '5116' ? table.onuStatus_5116[o.value] : oltModel == '5516' ? table.onuStatus_5516[o.value] : 'not identified'
                                    // TODO: verificar se é NGPON e utilizar: table.onuStatus_5516_NGPON
                                } else if (o.oid.split('.')[12] == 12 && o.value)       // OID.getOnuSoftwareVersion
                                    onu.softwareVersion = o.value.toString()
                                else if (o.oid.split('.')[12] == 13 && o.value)         // OID.getOnuHardwareVersion
                                    onu.hardwareVersion = o.value.toString()
                                else if (o.oid.split('.')[12] == 14 && o.value)         // OID.getOnuFirmwareVersion
                                    onu.firmwareVersion = o.value.toString()
                                else if (o.oid.split('.')[12] == 15 && o.value)         // OID.getOnuRemoteRestart
                                    onu.remoteRestart = o.value.toString()

                                if (idx == data.length - 1) {
                                    if (!onu.slot)
                                        return resolve(onu)
                                    getOnuOpticalPower(options, onu.slot, onu.pon, onu.onuId, toIgnore.includes('getOnuOpticalPower'), ignoreValid).then(opticalPower => {
                                        if (opticalPower)
                                            onu.opticalPower = opticalPower
                                        getOnuDistance(options, onu.slot, onu.pon, onu.onuId, ignoreValid).then(distance => {
                                            onu.distance = distance
                                            getOnuUplinkInterface(options, onu.slot, onu.pon, onu.onuId, toIgnore.includes('getOnuUplinkInterface'), ignoreValid).then(upLinkInterface => {
                                                if (upLinkInterface)
                                                    onu.upLinkInterface = upLinkInterface
                                                getOnuLastOffTime(options, onu.slot, onu.pon, onu.onuId, ignoreValid).then(lastOffTime => {
                                                    onu.lastOffTime = lastOffTime
                                                    return resolve(onu)
                                                })
                                            })
                                        })
                                    })
                                }
                            })
                        })
                    })
                } else return resolve(false)
            }, error => {
                return resolve(false)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function getBasicOnuByIndex(options, onuIndex, toIgnore) {
    if (!toIgnore)
        toIgnore = []
    return new Promise((resolve, reject) => {
        try {
            var _onu = parseOnuIndex(onuIndex)
            var oids = [OID.getOnuType, OID.getOnuMacAddress, OID.getOnuStatus]
            oids = oids.map(oid => oid + '.' + onuIndex)
            snmp_fh.get(options, oids).then(data => {
                olt.getOltModel(options).then(oltData => {
                    var oltModel = oltData.includes('5116') ? '5116' : oltData.includes('5516') ? '5516' : null
                    var onu = { ..._onu }
                    // Formatando/convertendo os dados
                    data.forEach((o, idx) => {
                        if (o.oid.split('.')[12] == 5)                          // OID.getOnuType
                            onu.onuType = table.ONUType[o.value] || 'not identified'
                        else if (o.oid.split('.')[12] == 10 && o.value)         // OID.getOnuMacAddress
                            onu.macAddress = o.value.toString()
                        else if (o.oid.split('.')[12] == 11) {                  // OID.getOnuStatus
                            onu.onuStatusValue = o.value
                            onu.onuStatus = oltModel == '5116' ? table.onuStatus_5116[o.value] : oltModel == '5516' ? table.onuStatus_5516[o.value] : 'not identified'
                            // TODO: verificar se é NGPON e utilizar: table.onuStatus_5516_NGPON
                        }
                        if (idx == data.length - 1) {
                            if (!onu.slot)
                                return resolve(onu)
                            if (toIgnore.includes('getOnuDistance') && toIgnore.includes('getOnuLastOffTime'))
                                return resolve(onu)
                            else {
                                getOnuDistance(options, onu.slot, onu.pon, onu.onuId, true).then(distance => {
                                    onu.distance = distance
                                    getOnuLastOffTime(options, onu.slot, onu.pon, onu.onuId, true).then(lastOffTime => {
                                        onu.lastOffTime = lastOffTime
                                        return resolve(onu)
                                    })
                                })
                            }
                        }
                    })

                })
            })

        } catch (err) {
            return reject(err)
        }
    })
}

function getOnuBySerial(options, serial) {
    return new Promise((resolve, reject) => {
        try {
            // TODO
            return resolve(false)
        } catch (err) {
            return reject(err)
        }
    })
}

function getBasicOnuInfo(options, macAddress, slot, pon) {
    return new Promise((resolve, reject) => {
        try {
            if (macAddress && (!slot && !pon) || (macAddress && slot && pon)) {
                if (slot && pon) {    // Busca otimizada
                    gFunc.isValid(options, slot, pon).then(isValid => {
                        if (isValid) {
                            var aOnuOID = []
                            for (var onuId = 1; onuId <= 128; ++onuId)
                                aOnuOID.push(OID.getOnuMacAddress + '.' + convertToOnuIndex(slot, pon, onuId).toString())
                            snmp_fh.get(options, aOnuOID).then(ret => {
                                var idx = ret.findIndex(e => (e.value && e.value.toString().toLowerCase()) == macAddress.toLowerCase())
                                if (idx > -1) {
                                    var onuIndex = parseInt(ret[idx].oid.split(OID.getOnuMacAddress + '.')[1])
                                    return resolve({ _onuIndex: onuIndex, ...parseOnuIndex(onuIndex), macAddress: ret[idx].value.toString() })
                                } else
                                    return resolve(false)
                            })
                        } else return resolve(false)
                    }, error => {
                        return resolve(false)
                    })
                } else {
                    snmp_fh.subtree(options, OID.getOnuMacAddress).then(ret => {
                        var idx = ret.findIndex(e => (e.value && e.value.toString().toLowerCase()) == macAddress.toLowerCase())
                        if (idx > -1) {
                            var onuIndex = parseInt(ret[idx].oid.split(OID.getOnuMacAddress + '.')[1])
                            return resolve({ _onuIndex: onuIndex, ...parseOnuIndex(onuIndex), macAddress: ret[idx].value.toString() })
                        } else
                            return resolve(false)
                    })
                }
            } else
                return resolve(false)
        } catch (err) {
            return reject(err)
        }
    })
}

function getOnuDistance(options, slot, pon, onuId, ignoreValid) {
    return new Promise((resolve, reject) => {
        try {
            setTimeout(t => {
                gFunc.isValid(options, slot, pon, onuId, ignoreValid).then(isValid => {
                    if (isValid && slot && pon && onuId) {
                        var bgmp = snmp_fh.getDistance
                        bgmp = bgmp.split(' ')
                        bgmp[156] = slot.toHex(2)
                        bgmp[158] = pon.toHex(2)
                        bgmp[160] = onuId.toHex(2)  // ONU NUMBER / ONU Authorized No.  
                        bgmp = bgmp.join(' ')

snmp_fh.sendSnmp(OID.getOnuDistance, bgmp, options, true).then(ret => {
                            var hex = '' // Adicionando espaço em branco a cada 2 bytes
                            for (var i = 0; i < ret.length; i += 2)
                                hex += ret.substring(i, i + 2) + ' '
                            hex = hex.trim()
                            var value = hex.split('2b 06 01 04 01 ad 73 5b 01 06 03 01 01 07 01 ')[1]
                            value = value.split(' ')
                            if (value[1] == '81')
                                value = value.splice(3)
                            else
                                value = value.splice(4)

                            var obj = {
                                _onuIndex: convertToOnuIndex(slot, pon, onuId),
                                value: (hexToInt(value.slice(-2).join('')) / 1000).toFixed(3),
                                unit: 'km'
                            }
                            snmp_fh.sendSnmp(OID.confirmGetOnuDistance, bgmp, options, true).then(retConfirm => { // Confirmação    
                                return resolve(obj)
                            })
                        })
                    } else return resolve(false)
                }, error => {
                    return resolve(false)
                })
            }, queueTime)
        } catch (err) {
            return reject(err)
        }
    })
}

function getOnuLastOffTime(options, slot, pon, onuId, ignoreValid) {
    return new Promise((resolve, reject) => {
        try {
            setTimeout(t => {
                gFunc.isValid(options, slot, pon, onuId, ignoreValid).then(isValid => {
                    if (isValid && slot && pon && onuId) {
                        var bgmp = snmp_fh.lastOffTime
                        bgmp = bgmp.split(' ')
                        bgmp[159] = '01'
                        bgmp[161] = slot.toHex(2)
                        bgmp[163] = pon.toHex(2)
                        bgmp[165] = onuId.toHex(2)
                        bgmp = bgmp.join(' ')
                        snmp_fh.sendSnmp(OID.getOnuLastOffTime, bgmp, options, true).then(ret => {
                            var hex = '' // Adicionando espaço em branco a cada 2 bytes
                            for (var i = 0; i < ret.length; i += 2)
                                hex += ret.substring(i, i + 2) + ' '
                            hex = hex.trim()

                            var value = hex.split('2b 06 01 04 01 ad 73 5b 01 16 03 01 01 1c 01 ')[1]
                            value = value.split(' ')
                            if (value[1] == '81')
                                value = value.splice(3)
                            else
                                value = value.splice(4)

                            var year = hexToInt(value.slice(184, 186).join('')).toString().padStart(4, '0')
                            var mouth = hexToInt(value.slice(186, 187).join('')).toString().padStart(2, '0')
                            var day = hexToInt(value.slice(187, 188).join('')).toString().padStart(2, '0')
                            var hours = hexToInt(value.slice(188, 189).join('')).toString().padStart(2, '0')
                            var minutes = hexToInt(value.slice(189, 190).join('')).toString().padStart(2, '0')
                            var seconds = hexToInt(value.slice(190, 191).join('')).toString().padStart(2, '0')
                            var obj = {
                                _onuIndex: convertToOnuIndex(slot, pon, onuId),
                                date: `${year}-${mouth}-${day}`,
                                time: `${hours}:${minutes}:${seconds}`
                            }
                            snmp_fh.sendSnmp(OID.confirmGetOnuLastOffTime, bgmp, options, true).then(retConfirm => {
                                return resolve(obj)
                            })
                        })
                    } else return resolve(false)
                }, error => {
                    return resolve(false)
                })
            }, queueTime)
        } catch (err) {
            return reject(err)
        }
    })
}

function getOnuOpticalPower(options, slot, pon, onuId, ignore, ignoreValid) {
    return new Promise((resolve, reject) => {
        try {
            if (ignore)
                return resolve(null)
            setTimeout(t => {
                gFunc.isValid(options, slot, pon, onuId, ignoreValid).then(isValid => {
                    if (isValid && slot && pon && onuId) {
                        var bgmp = snmp_fh.signal
                        bgmp = bgmp.split(' ')
                        bgmp[157] = slot.toHex(2)
                        bgmp[159] = pon.toHex(2)
                        bgmp[161] = onuId.toHex(2)  // ONU NUMBER / ONU Authorized No.  
                        bgmp = bgmp.join(' ')
                        snmp_fh.sendSnmp(OID.getOnuOpticalPower, bgmp, options, true).then(ret => {
                            var hex = '' // Adicionando espaço em branco a cada 2 bytes
                            for (var i = 0; i < ret.length; i += 2)
                                hex += ret.substring(i, i + 2) + ' '
                            hex = hex.trim()

                            var value = hex.split('2b 06 01 04 01 ad 73 5b 01 16 03 01 01 06 01 ')[1]
                            value = value.split(' ')
                            if (value[1] == '81')
                                value = value.splice(3)
                            else
                                value = value.splice(4)

                            var obj = {
                                _onuIndex: convertToOnuIndex(slot, pon, onuId),
                                temperature: {
                                    value: (hexToInt(value.slice(174, 176).join('')) / 100).toFixed(2),
                                    //status: '--',   //value[177] == '02' ? 'Normal' : 'Warning',
                                    unit: '°C'
                                },
                                voltage: {
                                    value: (hexToInt(value.slice(180, 182).join('')) / 100).toFixed(2),
                                    //status: '--',   //value[183] == '02' ? 'Normal' : 'Warning',
                                    unit: 'V'
                                },
                                currTxBias: {
                                    value: (hexToInt(value.slice(186, 188).join('')) / 100).toFixed(2),
                                    //status: '--',   //value[189] == '02' ? 'Normal' : 'Warning',
                                    unit: 'mA'
                                },
                                txPower: {
                                    value: (hexToInt(value.slice(192, 194).join('')) / 100).toFixed(2),
                                    //status: '--',   //value[195] == '00' ? 'High' : value[195] == '01' ? 'Low' : 'Normal',
                                    unit: 'dBm'
                                },
                                rxPower: {
                                    value: (hexToInt(value.slice(198, 200).join('')) / 100).toFixed(2),
                                    //status: '--',   //value[201] == '00' ? 'High' : value[201] == '01' ? 'Low' : 'Normal',
                                    unit: 'dBm'
                                }
                            }
                            snmp_fh.sendSnmp(OID.confirmGetOnuOpticalPower, bgmp, options, true).then(retConfirm => {
                                return resolve(obj)
                            })
                        })
                    } else return resolve(false)
                }, error => {
                    return resolve(false)
                })
            }, queueTime)
        } catch (err) {
            return reject(err)
        }
    })
}

function getOnuByPonWithOffset(options, slot, pon, offset) {
    return new Promise((resolve, reject) => {
        setTimeout(t => {
            try {
                gFunc.isValid(options, slot, pon).then(isValid => {
                    if (isValid) {
                        var queue = new Queue(1, 10000)
                        var aOnuOID = []
                        var aResp = []
                        var list = []
                        for (var onuId = 1 + (offset * 16); onuId <= 16 + (offset * 16); ++onuId)
                            aOnuOID.push(OID.getOnuMacAddress + '.' + convertToOnuIndex(slot, pon, onuId).toString())
                        snmp_fh.get(options, aOnuOID).then(ret => {
                            ret.forEach(e => {
                                if (e.value && e.value.length > 0)
                                    aResp.push({ _onuIndex: e.oid.split('.')[13], ...parseOnuIndex(parseInt(e.oid.split('.')[13])), macAddress: e.value.toString() })
                            })
                            if (aResp.length > 0)
                                aResp.forEach((onu, idx) => {
                                    queue.add(f => getOnu(options, onu.slot, onu.pon, onu.onuId, ['getOnuUplinkInterface']).then(o => {
                                        list.push({ ...onu, ...o })
                                        if (queue.queue.length == 0) {
                                            return resolve(list)
                                        }

                                    }))
                                })
                            else
                                return resolve([])
                        })

                    } else return resolve(false)
                }, error => {
                    return resolve(false)
                })
            } catch (err) {
                return reject(err)
            }
        }, 30)
    })
}

function getOnuListByPon_OLD(options, slot, pon) {
    return new Promise((resolve, reject) => {
        var list = []
        try {
            var queue = new Queue(1, 10)
            for (var offset = 0; offset < 8; ++offset) {
                const _offset = offset
                queue.add(f => getOnuByPonWithOffset(options, slot, pon, _offset)).then(onus => {
                    list.push(...onus)
                    if (queue.queue.length == 0)
                        return resolve(list)
                })
            }
        } catch (err) {
            return reject(err)
        }
    })
}

function getOnuListByPon(options, slot, pon) {
    return new Promise((resolve, reject) => {
        var list = []
        try {
            var queue = new Queue(1, 1000)
            getOnuIdListByPon(options, slot, pon).then(portList => {
                portList.forEach(onu => {
                    queue.add(f => getOnu(options, onu.slot, onu.pon, onu.onuId, ['getOnuUplinkInterface']).then(o => {
                        list.push({ ...onu, ...o })
                        if (queue.queue.length == 0) {
                            return resolve(list)
                        }

                    }))
                })
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function getBasicOnuListByPon(options, slot, pon) {
    return new Promise((resolve, reject) => {
        var list = []
        try {
            var queue = new Queue(1, 1000)
            getOnuIdListByPon(options, slot, pon).then(portList => {
                if (portList === false)
                    return resolve(false)
                cont = portList.length
                portList.forEach(onu => {
                    queue.add(f => getOnu(options, onu.slot, onu.pon, onu.onuId, ['getOnuUplinkInterface', 'getOnuDistance', 'getOnuLastOffTime'], true).then(o => {
                        list.push({ ...onu, ...o })
                        if (queue.queue.length == 0)
                            return resolve(list)
                    }))
                })
            }, err => { return resolve(false) })
        } catch (err) {
            return reject(err)
        }
    })
}

// Versão customizada para a Valenet
function getBasicOnuListByPonValenet(options, slot, pon) {
    return new Promise((resolve, reject) => {
        var list = []
        try {
            var queue = new Queue(1, 1000)
            getOnuIdListByPon(options, slot, pon).then(portList => {
                if (portList === false)
                    return resolve(portList)
                cont = portList.length
                portList.forEach(onu => {
                    queue.add(f => getOnu(options, onu.slot, onu.pon, onu.onuId, ['getOnuUplinkInterface'], true).then(o => {
                        list.push({ ...onu, ...o })
                        if (queue.queue.length == 0)
                            return resolve(list)
                    }))
                })
            }, err => { return resolve(false) })
        } catch (err) {
            return reject(err)
        }
    })
}

function getOnuIdListByPon(options, slot, pon) {
    return new Promise((resolve, reject) => {
        try {
            gFunc.isValid(options, slot, pon).then(isValid => {
                if (isValid && slot && pon) {
                    var bgmp = snmp_fh.getOnuIdListByPon
                    bgmp = bgmp.split(' ')
                    bgmp[163] = slot.toHex(2)
                    bgmp = bgmp.join(' ')
                    snmp_fh.sendSnmp(OID.getOnuIdListByPon, bgmp, options, true).then(ret => {
                        snmp_fh.sendSnmp(OID.confirmGetOnuIdListByPon, bgmp, options, true).then(confirm => {
                            bgmp = bgmp.split(' ')
                            bgmp[164] = pon.toHex(4).slice(0, 2)
                            bgmp[165] = pon.toHex(4).slice(2, 4)
                            bgmp = bgmp.join(' ')
                            snmp_fh.sendSnmp(OID.getOnuIdListByPon, bgmp, options, true).then(portList => {
                                snmp_fh.sendSnmp(OID.confirmGetOnuIdListByPon, bgmp, options, true).then(confirm2 => {
                                    var respPortList = []
                                    var hex = '' // Adicionando espaço em branco a cada 2 bytes
                                    for (var i = 0; i < portList.length; i += 2)
                                        hex += portList.substring(i, i + 2) + ' '
                                    hex = hex.trim()
                                    var value = hex.split('2b 06 01 04 01 ad 73 5b 01 01 01 01 01 17 01 ')[1]
                                    value = value.split(' ')
                                    if (value[1] == '81')
                                        value = value.splice(3)
                                    else
                                        value = value.splice(4)

                                    var numPorts = parseInt((value[162] + value[163]), 16)
                                    if (numPorts > 0) {
                                        value = value.slice(164)
                                        for (var i = 0; i < numPorts; ++i) {
                                            var onuId = parseInt((value[6] + value[7]), 16)
                                            respPortList.push({ _onuIndex: convertToOnuIndex(slot, pon, onuId), slot, pon, onuId })
                                            value = value.slice(44)
                                        }
                                        return resolve(respPortList)
                                    } else
                                        return resolve(false)
                                })
                            })
                        })
                    })
                } else return resolve(false)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

// failed
function getOnuListBySlot(options, slot) {
    return new Promise((resolve, reject) => {
        gFunc.isValid(options, slot).then(isValid => {
            if (isValid && slot) {
                var oidValue = snmp_fh.getOnuListBySlot
                oidValue = oidValue.split(' ')
                oidValue[161] = slot.toHex(2)
                oidValue = oidValue.join(' ')

                snmp_fh.sendSnmp(OID.getOnuListBySlot, oidValue, options, true).then(ret => {
                    var hex = '' // Adicionando espaço em branco a cada 2 bytes
                    for (var i = 0; i < ret.length; i += 2)
                        hex += ret.substring(i, i + 2) + ' '
                    hex = hex.trim()

                    var value = hex.split('2b 06 01 04 01 ad 73 5b 01 0d 03 01 01 06 01 ')[1]
                    value = value.split(' ')
                    if (value[1] == '81')
                        value = value.splice(3)
                    else
                        value = value.splice(4)

                    amount = value[163]
                    var aOnus = []
                    for (var idx = 0; idx < amount; ++idx) {
                        var onuHex = value.slice(164 + (idx * 230), 164 + (idx * 230) + 230)
                        var onu = {}
                        onu.slot = parseInt(onuHex[1], 16)
                        onu.pon = parseInt(onuHex[3], 16)
                        onu.onuId = parseInt(onuHex[5], 16)
                        onu.serial = ''
                        for (var s = 0; s < 12; s++)
                            onu.serial += onuHex[20 + s] != '00' ? String.fromCharCode(parseInt(onuHex[20 + s], 16)) : ''

                        onu.onuTypeModel = ''
                        for (var m = 0; m < 12; m++)
                            onu.onuTypeModel += String.fromCharCode(parseInt(onuHex[36 + m], 16))
                        onu.onuTypeModel = onu.onuTypeModel.trim()
                        aOnus.push(onu)
                    }
                    snmp_fh.sendSnmp(OID.confirmGetOnusBySlot, oidValue, options, true).then(ret => {
                        return resolve(aOnus)
                    })
                })
            } else return resolve(false)
        }, error => {
            return resolve(false)
        })
    })
}

function getOnuIdList(options) {
    return new Promise((resolve, reject) => {
        try {
            snmp_fh.subtree(options, OID.getOnuIdList).then(serialList => {
                var list = []
                serialList.forEach(e => {
                    list.push({ _onuIndex: parseInt(e.oid.split(OID.getOnuIdList + '.')[1]), onuId: e.value })
                })
                return resolve(list)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function getOnuIndexList(options) {
    return new Promise((resolve, reject) => {
        try {
            var aONUs = []
            snmp_fh.subtree(options, OID.getOnuIndexList).then(varbinds => {
                varbinds.forEach(onu => {
                    aONUs.push(onu.value)
                })
                return resolve(aONUs)
            }, error => {
                console.error('Error: Unable to connect to OLT')
                return resolve(false)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function getOnuRxPowerListByPon(options, slot, pon, ignoreValid) {
    return new Promise((resolve, reject) => {
        try {
            gFunc.isValid(options, slot, pon, ignoreValid).then(isValid => {
                if (isValid && slot && pon) {
                    var bgmp = snmp_fh.getOnuRxPowerListByPon
                    bgmp = bgmp.split(' ')
                    bgmp[157] = slot.toHex(2)
                    bgmp[159] = pon.toHex(2)
                    bgmp = bgmp.join(' ')
                    snmp_fh.sendSnmp(OID.getOnuRxPowerListByPon, bgmp, options, true).then(ret => {
                        snmp_fh.sendSnmp(OID.confirmGetOnuRxPowerListByPon, bgmp, options, true).then(confirm => {
                            var hex = '' // Adicionando espaço em branco a cada 2 bytes
                            for (var i = 0; i < ret.length; i += 2)
                                hex += ret.substring(i, i + 2) + ' '
                            hex = hex.trim()

                            var value = hex.split('2b 06 01 04 01 ad 73 5b 01 15 03 01 01 04 01 ')[1]
                            value = value.split(' ')
                            if (value[1] == '81')
                                value = value.splice(3)
                            else
                                value = value.splice(4)

                            var numOnus = parseInt((value[230] + value[231]), 16)
                            value = value.slice(232)
                            var list = []
                            for (var i = 0; i < numOnus; ++i) {
                                var obj = {}

                                obj.onuId = parseInt((value[0] + value[1]), 16)
                                obj._onuIndex = convertToOnuIndex(slot, pon, obj.onuId)
                                obj.slot = slot
                                obj.pon = pon
                                obj.rxPower = (gFunc.hexToDec(value[4] + value[5] + value[6] + value[7]) / 100).toFixed(2).toString()
                                obj.unit = 'dBm'
                                list.push(obj)
                                value = value.slice(8)
                            }

                            getOnuIdListByPon(options, slot, pon).then(onuList => {
                                onuList.map(e => {
                                    var idx = list.findIndex(o => o.onuId == e.onuId)
                                    if (idx > -1) {
                                        e.rxPower = list[idx].rxPower
                                    } else {
                                        e.rxPower = "--"
                                    }
                                    e.unit = 'dBm'
                                })
                                return resolve(onuList)
                            })
                        })
                    })
                } else return resolve(false)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function getOnuOpticalPowerList(options) {
    return new Promise((resolve, reject) => {
        try {
            aOpticalPower = []
            var queue = new Queue(1, 10000)
            getOnuIndexList(options).then(aONUs => {
                if (aONUs === false)
                    return resolve(false)
                aONUs.forEach(onuIndex => {
                    var onu = parseOnuIndex(onuIndex)
                    queue.add(f => getOnuOpticalPower(options, onu.slot, onu.pon, onu.onuId).then(onuOpticalPower => {
                        aOpticalPower.push({ _onuIndex: onuIndex, ...onu, opticalPower: onuOpticalPower })
                        if (queue.queue.length == 0)
                            return resolve(aOpticalPower)
                    }))
                })
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function getOnuType(options, slot, pon, onuId) {
    return new Promise((resolve, reject) => {
        try {
            var onuIndex = convertToOnuIndex(slot, pon, onuId)
            gFunc.isValid(options, slot, pon, onuId).then(isValid => {
                if (isValid && onuIndex) {
                    snmp_fh.get(options, [OID.getOnuType + '.' + onuIndex]).then(data => {
                        if (data[0].oid.split('.')[12] == 5 && data[0].type == 2)
                            return resolve(table.ONUType[data[0].value])
                        return resolve(null)
                    })
                } else {
                    if (options.enableWarnings)
                        console.error('getOnuType(): Invalid input parameters.')
                    return resolve(false)
                }
            }, error => {
                return resolve(false)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function getOnuUplinkInterface(options, slot, pon, onuId, ignore, ignoreValid) {
    return new Promise((resolve, reject) => {
        try {
            if (ignore)
                return resolve(null)
            gFunc.isValid(options, slot, pon, onuId, ignoreValid).then(isValid => {
                if (isValid && slot && pon && onuId) {
                    var oids = [OID.onuGetUplinkInterfacePortName, OID.onuGetUplinkInterfacePortDescription, OID.onuGetUplinkInterfacePortType, OID.onuGetUplinkInterfacePortStatus, OID.onuGetUplinkInterfaceDownlinkRate, OID.onuGetUplinkInterfaceUplinkRate]
                    var onuIndex = convertToOnuIndex(slot, pon, onuId)
                    oids = oids.map(oid => oid + '.' + onuIndex)

                    snmp_fh.get(options, oids).then(data => {
                        var obj = { downlinkRateUnit: 'Mbit/s', uplinkRateUnit: 'Mbit/s' }
                        data.forEach((o, idx) => {
                            if (o.oid.split('.')[13] == 1)
                                obj.portType = o.value
                            else if (o.oid.split('.')[13] == 2)
                                obj.portName = o.value.toString()
                            else if (o.oid.split('.')[13] == 3)
                                obj.portDescription = o.value.toString()
                            else if (o.oid.split('.')[13] == 4) {
                                obj.portStatus = o.value == 1 ? 'enable' : o.value == 0 ? 'disable' : 'undefined'
                                obj.portStatusValue = o.value
                            } else if (o.oid.split('.')[13] == 5)
                                obj.downlinkRate = o.value
                            else if (o.oid.split('.')[13] == 12)
                                obj.uplinkRate = o.value

                            if (idx == data.length - 1)
                                return resolve(obj)
                        })
                    })
                } else return resolve(false)
            }, error => {
                return resolve(false)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function getOnuWebAdmin(options, slot, pon, onuId) {
    return new Promise((resolve, reject) => {
        gFunc.isValid(options, slot, pon, onuId).then(isValid => {
            if (isValid && slot && pon && onuId) {
                var oidValue = snmp_fh.getOnuWebAdmin
                oidValue = oidValue.split(' ')
                oidValue[161] = slot.toHex(2)
                oidValue[163] = pon.toHex(2)
                oidValue[165] = onuId.toHex(2)
                oidValue = oidValue.join(' ')
                snmp_fh.sendSnmp(OID.getOnuWebAdmin, oidValue, options, true).then(ret => {
                    var hex = '' // Adicionando espaço em branco a cada 2 bytes
                    for (var i = 0; i < ret.length; i += 2)
                        hex += ret.substring(i, i + 2) + ' '
                    hex = hex.trim()

                    var value = hex.split('2b 06 01 04 01 ad 73 5b 01 16 01 01 01 25 01 ')[1]
                    value = value.split(' ')
                    if (value[1] == '81')
                        value = value.splice(3)
                    else
                        value = value.splice(4)

                    amount = value[191]
                    var aProfiles = []
                    for (var idx = 0; idx < amount; ++idx) {
                        var onuHex = value.slice(192 + (idx * 84), 192 + (idx * 84) + 84)
                        var onu = {}

                        onu.webUsername = ''
                        for (var s = 0; s < 16; s++)
                            onu.webUsername += onuHex[0 + s] != '00' ? String.fromCharCode(parseInt(onuHex[0 + s], 16)) : ''

                        onu.webPassword = ''
                        for (var s = 0; s < 16; s++)
                            onu.webPassword += onuHex[16 + s] != '00' ? String.fromCharCode(parseInt(onuHex[16 + s], 16)) : ''

                        onu.group = onuHex[51] == '01' ? 'common' : onuHex[51] == '02' ? 'admin' : 'undefined'
                        onu.groupValue = parseInt(onuHex[51])

                        aProfiles.push(onu)
                    }
                    snmp_fh.sendSnmp(OID.confirmGetOnuWebAdmin, oidValue, options, true).then(retConfirm => {
                        return resolve(aProfiles)
                    })
                })
            } else return resolve([])
        }, error => {
            return resolve(false)
        })
    })
}

/*
**WARNING!** This function presented inconsistency and flaws. 
For this reason, it was removed in version 1.0.11. We hope to 
correct the errors and return them in future releases. */
function getRxPowerListByPon(options, slot, pon) {
    return new Promise((resolve, reject) => {
        try {
            gFunc.isValid(options, slot, pon).then(isValid => {
                if (isValid && slot && pon) {
                    var bgmp = snmp_fh.allOpticalPower
                    bgmp = bgmp.split(' ')
                    bgmp[157] = slot.toHex(2)
                    bgmp[159] = pon.toHex(2)
                    bgmp = bgmp.join(' ')
                    snmp_fh.sendSnmp(OID.getRxPowerListByPon, bgmp, options, true).then(ret => {
                        var hex = '' // Adicionando espaço em branco a cada 2 bytes
                        for (var i = 0; i < ret.length; i += 2)
                            hex += ret.substring(i, i + 2) + ' '
                        hex = hex.trim()
                        var value = hex.split('2b 06 01 04 01 ad 73 5b 01 15 03 01 01 04 01 ')[1]
                        value = value.split(' ')
                        if (value[1] == '81')
                            value = value.splice(3)
                        else
                            value = value.splice(4)

                        pos = 233
                        aOnus = []
                        while (value[pos] != '00' && pos < value.length) {
                            aOnus.push({ _onuIndex: convertToOnuIndex(slot, pon, parseInt(value[pos])), slot, pon, onuId: parseInt(value[pos], 16), opticalRxPower: (hexToInt(value.slice(pos + 3, pos + 7).join('')) / 100).toFixed(2), opticalRxPowerUnit: 'dBm' })
                            pos += 8
                        }
                        snmp_fh.sendSnmp(OID.confirmListOpticalRxPowerByPon, bgmp, options, true).then(retConfirm => {
                            return resolve(aOnus)
                        })
                    })
                } else return resolve(false)
            }, error => {
                return resolve(false)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

//getOnuListBypon

function getMacAddressList(options) {
    return new Promise((resolve, reject) => {
        try {
            snmp_fh.subtree(options, OID.getSerials).then(serialList => {
                var list = []
                serialList.forEach(e => {
                    list.push({ _onuIndex: parseInt(e.oid.split(OID.getSerials + '.')[1]), macAddress: e.value.toString() })
                })
                return resolve(list)
            }, error => {
                console.error('Error: Unable to connect to OLT')
                return resolve(false)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function getUnauthorizedOnus(options) {
    return new Promise((resolve, reject) => {
        try {
            snmp_fh.subtree(options, OID.getUnauth).then(varbindList => {
                return resolve(formatVarbindList(varbindList, 'unauth'))
            }, error => {
                console.error('Error: Unable to connect to OLT')
                return resolve(false)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function getWan(options, slot, pon, onuId) {
    return new Promise((resolve, reject) => {
        try {
            gFunc.isValid(options, slot, pon, onuId).then(isValid => {
                if (isValid && slot && pon && onuId) {
                    var getWan = snmp_fh.setWanHeader.slice(0, -6)
                    getWan = getWan.split(' ')
                    // Tamanho do pacote
                    getWan[59] = '00'
                    getWan[70] = '00'
                    getWan[71] = '38'
                    getWan[122] = '00'
                    getWan[123] = '38'

                    getWan[159] = '01'
                    getWan[161] = slot.toHex(2)
                    getWan[163] = pon.toHex(2)
                    getWan[165] = onuId.toHex(2)            // ONU NUMBER / ONU Authorized No.
                    getWan = getWan.join(' ')
                    snmp_fh.sendSnmp(OID.setWan, getWan, options, true).then(ret => {
                        snmp_fh.sendSnmp(OID.confirmSetWan, getWan, options, true).then(confirm => {
                            var hex = '' // Adicionando espaço em branco a cada 2 bytes
                            for (var i = 0; i < ret.length; i += 2)
                                hex += ret.substring(i, i + 2) + ' '
                            hex = hex.trim()
                            var value = hex.split('2b 06 01 04 01 ad 73 5b 01 08 01 01 01 0d 01 ')[1]
                            value = value.split(' ')
                            if (value[1] == '81')
                                value = value.splice(3)
                            else
                                value = value.splice(4)

                            var numProfiles = parseInt(value[185], 16)
                            var aWans = []
                            if (numProfiles == 0)           // quantidade de perfis WAN
                                return resolve([])
                            else {
                                value = value.slice(186)    // eliminando somente o header
                                for (var wanProfile = 0; wanProfile < numProfiles; ++wanProfile) {
                                    var objWan = {}
                                    objWan._wanIndex = parseInt(value[1], 16)
                                    objWan.wanName = ''
                                    for (var i = 0; i < 64; ++i)
                                        if (value[2 + i] == '00')
                                            objWan.wanName += ""
                                        else
                                            objWan.wanName += String.fromCharCode(parseInt(value[2 + i], 16))
                                    objWan.wanName = objWan.wanName.trim()

                                    objWan.wanMode = value[67] == '00' ? 'tr069' : value[67] == '01' ? 'internet' : value[67] == '02' ? 'tr069_internet' : value[67] == '03' ? 'multicast' : value[67] == '04' ? 'voip' : value[67] == '05' ? 'voip_internet' : value[67] == '07' ? 'radius' : value[67] == '08' ? 'radius_internet' : value[67] == '64' ? 'other' : 'other_' + value[67]
                                    objWan.wanConnType = value[69] == '00' ? 'bridge' : value[69] == '01' ? 'router' : 'other_' + value[69]
                                    objWan.wanVlan = parseInt(value[70] + value[71], 16)
                                    if (objWan.wanVlan == 65535)
                                        objWan.wanVlan = null
                                    objWan.wanCos = parseInt(value[73], 16)
                                    objWan.wanNat = value[74] == '01' ? true : false
                                    objWan.ipMode = value[76] == '00' ? 'dhcp' : value[76] == '01' ? 'static' : value[76] == '02' ? 'pppoe' : 'other_' + value[76]
                                    objWan.wanIp = `${parseInt(value[77], 16)}.${parseInt(value[78], 16)}.${parseInt(value[79], 16)}.${parseInt(value[80], 16)}`

                                    if (value[84] == '00')
                                        objWan.wanMask = '0.0.0.0'
                                    else {
                                        var maskInt = parseInt(value[84], 16)
                                        var maskOne = Array(maskInt).fill('1')
                                        maskOne = maskOne.join(',')
                                        maskOne = maskOne.replaceAll(',', '')

                                        var maskZeros = Array(32 - maskInt).fill('0')
                                        maskZeros = maskZeros.join(',')
                                        maskZeros = maskZeros.replaceAll(',', '')

                                        var mask = maskOne + maskZeros
                                        objWan.wanMask = `${parseInt(mask.slice(0, 8), 2)}.${parseInt(mask.slice(8, 16), 2)}.${parseInt(mask.slice(16, 24), 2)}.${parseInt(mask.slice(24, 32), 2)}`

                                    }

                                    objWan.wanGateway = `${parseInt(value[85], 16)}.${parseInt(value[86], 16)}.${parseInt(value[87], 16)}.${parseInt(value[88], 16)}`
                                    objWan.wanMasterDNS = `${parseInt(value[89], 16)}.${parseInt(value[90], 16)}.${parseInt(value[91], 16)}.${parseInt(value[92], 16)}`
                                    objWan.wanSlaveDNS = `${parseInt(value[93], 16)}.${parseInt(value[94], 16)}.${parseInt(value[95], 16)}.${parseInt(value[96], 16)}`
                                    objWan.pppoeProxy = value[283] == '01' ? true : false

                                    objWan.pppoeUsername = ''
                                    for (var i = 0; i < 32; ++i)
                                        if (value[98 + i] == '00')
                                            objWan.pppoeUsername += ""
                                        else
                                            objWan.pppoeUsername += String.fromCharCode(parseInt(value[98 + i], 16))
                                    objWan.pppoeUsername = objWan.pppoeUsername.trim()

                                    objWan.pppoePassword = ''
                                    for (var i = 0; i < 32; ++i)
                                        if (value[130 + i] == '00')
                                            objWan.pppoeUsername += ""
                                        else
                                            objWan.pppoePassword += String.fromCharCode(parseInt(value[130 + i], 16))
                                    objWan.pppoePassword = objWan.pppoePassword.trim()

                                    objWan.pppoeName = ''
                                    for (var i = 0; i < 32; ++i)
                                        if (value[162 + i] == '00')
                                            objWan.pppoeUsername += ""
                                        else
                                            objWan.pppoeName += String.fromCharCode(parseInt(value[162 + i], 16))
                                    objWan.pppoeName = objWan.pppoeName.trim()

                                    objWan.pppoeMode = value[195] == '00' ? 'auto' : value[195] == '01' ? 'payload' : 'other_' + value[195]
                                    objWan.wanQoS = value[196] == '01' ? true : value[196] == '00' ? false : 'other_' + value[196]

                                    objWan.lan = {}
                                    var lans = (parseInt(value[197], 16)).toString(2).padStart(4, '0')
                                    lans = lans.split('')
                                    objWan.lan.lan1 = lans[0] == '1' ? true : false
                                    objWan.lan.lan2 = lans[1] == '1' ? true : false
                                    objWan.lan.lan3 = lans[2] == '1' ? true : false
                                    objWan.lan.lan4 = lans[3] == '1' ? true : false

                                    objWan.ssid = {}
                                    var ssids = (parseInt(value[198], 16)).toString(2).padStart(4, '0')
                                    ssids = ssids.split('')
                                    objWan.ssid.ssid1 = ssids[0] == '1' ? true : false
                                    objWan.ssid.ssid2 = ssids[1] == '1' ? true : false
                                    objWan.ssid.ssid3 = ssids[2] == '1' ? true : false
                                    objWan.ssid.ssid4 = ssids[3] == '1' ? true : false

                                    objWan.vlanMode = value[199] == '01' ? 'tag' : value[199] == '03' ? 'transparent' : 'other_' + value[199]

                                    objWan.translationValue = parseInt(value[201] + value[202], 16)
                                    if (objWan.translationValue == 65535)
                                        objWan.translationValue = null

                                    objWan.cos = value[204] == '00' ? null : parseInt(value[204], 16)
                                    objWan.qInQ = value[205] == '01' ? true : false
                                    objWan.tpid = parseInt(value[206] + value[207], 16)

                                    objWan.svlan = parseInt(value[208] + value[209], 16)
                                    if (objWan.svlan == 65535)
                                        objWan.svlan = null

                                    objWan.svlanCos = parseInt(value[210] + value[211], 16)
                                    if (objWan.svlanCos == 65535)
                                        objWan.svlanCos = null

                                    aWans.push(objWan)
                                    value = value.slice(229)        // Tamanho do perfil WAN
                                }
                            }
                            return resolve(aWans)
                        })
                    })
                } else return resolve(false)
            }, error => {
                return resolve(false)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function hexToInt(hex) {
    if (hex.length % 2 != 0)
        hex = "0" + hex
    var num = parseInt(hex, 16)
    var maxVal = Math.pow(2, hex.length / 2 * 8)
    if (num > maxVal / 2 - 1)
        num = num - maxVal
    return num
}

function parseOnuIndex(onuIndex) {
    var indexBin = (parseInt(onuIndex)).toString(2)
    var obj = {
        _onuIndex: onuIndex,
        slot: parseInt(indexBin.slice(-33, -25), 2),
        pon: parseInt(indexBin.slice(-25, -19), 2),
        onuId: parseInt(indexBin.slice(-19, -8), 2)

    }
    return obj
}

function rebootOnu(options, slot, pon, onuId) {
    return new Promise((resolve, reject) => {
        try {
            gFunc.isValid(options, slot, pon, onuId).then(isValid => {
                if (isValid && slot && pon && onuId) {
                    var bgmp = snmp_fh.rebootOnu
                    bgmp = bgmp.split(' ')
                    bgmp[157] = slot.toHex(2)
                    bgmp[159] = pon.toHex(2)
                    bgmp[161] = onuId.toHex(2)
                    bgmp = bgmp.join(' ')
                    snmp_fh.sendSnmp(OID.rebootOnu, bgmp, options, true).then(ret => {
                        var hex = '' // Adicionando espaço em branco a cada 2 bytes
                        for (var i = 0; i < ret.length; i += 2)
                            hex += ret.substring(i, i + 2) + ' '
                        hex = hex.trim()
                        var value = hex.split('2b 06 01 04 01 ad 73 5b 01 06 02 01 01 06 01 ')[1]
                        value = value.split(' ')
                        if (value[1] == '81')
                            value = value.splice(3)
                        else
                            value = value.splice(4)

                        if (value.length == 130)
                            return resolve(true)
                        return resolve(false)
                    })
                } else return resolve(false)
            }, error => {
                return resolve(false)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function setOnuBandwidth(options, slot, pon, onuId, upBw, downBw) {
    return new Promise((resolve, reject) => {
        try {
            gFunc.isValid(options, slot, pon, onuId).then(isValid => {
                if (isValid && slot && pon && onuId && Number.isInteger(upBw) && Number.isInteger(downBw)) {
                    if (upBw < 256) upBw = 256
                    if (upBw > 1000000) upBw = 1000000
                    if (downBw < 256) downBw = 256
                    if (downBw > 1000000) downBw = 1000000

                    var setBW = snmp_fh.setOnuBandwidth
                    setBW = setBW.split(' ')
                    setBW[161] = slot.toHex(2)
                    setBW[163] = pon.toHex(2)
                    setBW[165] = onuId.toHex(2)            // ONU NUMBER / ONU Authorized No.  
                    setBW[181] = upBw.toHex(6).slice(0, 2)
                    setBW[182] = upBw.toHex(6).slice(2, 4)
                    setBW[183] = upBw.toHex(6).slice(4, 6)
                    setBW[185] = downBw.toHex(6).slice(0, 2)
                    setBW[186] = downBw.toHex(6).slice(2, 4)
                    setBW[187] = downBw.toHex(6).slice(4, 6)
                    setBW = setBW.join(' ')
                    snmp_fh.sendSnmp(OID.setOnuBandwidth, setBW, options, true).then(ret => {
                        snmp_fh.sendSnmp(OID.confirmSetOnuBandwidth, setBW, options, true).then(retConfirm => {
                            return resolve(convertToOnuIndex(slot, pon, onuId))
                        })
                    })
                } else return resolve(false)
            }, error => {
                return resolve(false)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function setOnuWebAdmin(options, slot, pon, onuId, aWebConfig) {
    return new Promise((resolve, reject) => {
        try {
            gFunc.isValid(options, slot, pon, onuId).then(isValid => {
                if (isValid && slot && pon && onuId) {
                    var oidValue = ''
                    aWebConfig.forEach(webConfig => {
                        var bodySetOnuWebAdmin = snmp_fh.bodySetOnuWebAdmin
                        bodySetOnuWebAdmin = bodySetOnuWebAdmin.split(' ')

                        for (var idx = 0; idx < 16 && webConfig.username.split('')[idx]; ++idx)
                            bodySetOnuWebAdmin[idx] = (webConfig.username).charCodeAt(idx).toString(16)

                        for (var idx = 0; idx < 16 && webConfig.password.split('')[idx]; ++idx)
                            bodySetOnuWebAdmin[idx + 16] = (webConfig.password).charCodeAt(idx).toString(16)

                        bodySetOnuWebAdmin[51] = webConfig.group == 'admin' || webConfig.group == 2 ? '02' : '01'
                        oidValue += bodySetOnuWebAdmin.join(' ') + ' '
                    })
                    oidValue = oidValue.trim()

                    var headerSetOnuWebAdmin = snmp_fh.headerSetOnuWebAdmin
                    headerSetOnuWebAdmin = headerSetOnuWebAdmin.split(' ')

                    headerSetOnuWebAdmin[161] = slot.toHex(2)
                    headerSetOnuWebAdmin[163] = pon.toHex(2)
                    headerSetOnuWebAdmin[165] = onuId.toHex(2)
                    headerSetOnuWebAdmin[187] = aWebConfig.length.toHex(2)

                    var packSize = oidValue.split(' ').length + 64
                    headerSetOnuWebAdmin[70] = packSize.toHex(4).slice(0, 2)
                    headerSetOnuWebAdmin[71] = packSize.toHex(4).slice(2, 4)
                    headerSetOnuWebAdmin[122] = headerSetOnuWebAdmin[70]
                    headerSetOnuWebAdmin[123] = headerSetOnuWebAdmin[71]
                    headerSetOnuWebAdmin = headerSetOnuWebAdmin.join(' ')
                    oidValue = headerSetOnuWebAdmin + ' ' + oidValue

                    snmp_fh.sendSnmp(OID.getOnuWebAdmin, oidValue, options, true).then(ret => {
                        snmp_fh.sendSnmp(OID.confirmGetOnuWebAdmin, oidValue, options, true).then(retConfirm => {
                            return resolve(true)
                        })
                    })
                } else return resolve(false)
            }, error => {
                return resolve(false)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function setLanPorts(options, slot, pon, onuId, aLanPorts) {
    return new Promise((resolve, reject) => {
        try {
            getOnuType(options, slot, pon, onuId).then(onuType => {
                if (onuType && onuType.type == 'GPON')
                    setLanPortsGPON(options, slot, pon, onuId, aLanPorts).then(resp => {
                        return resolve(resp)
                    }, errorEPON => {
                        return reject(errorEPON)
                    })
                else if (onuType && onuType.type == 'EPON')
                    setLanPortsEPON(options, slot, pon, onuId, aLanPorts).then(resp => {
                        return resolve(resp)
                    }, errorGPON => {
                        return reject(errorGPON)
                    })
                else {
                    console.error("setLanPorts(): The ONU type was not identified as GPON or EPON in 'src/tables.js' -> 'ONUType'. Use the setLanPortsGPON (options, slot, pon, onuId, aLanPorts) or setLanPortsEPON (options, slot, pon, onuId, aLanPorts) function.")
                }
            }, err => {
                return reject(err)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function setLanPortsEPON(options, slot, pon, onuId, aLanPorts) {
    return new Promise((resolve, reject) => {
        try {
            gFunc.isValid(options, slot, pon, onuId).then(isValid => {
                if (isValid && slot && pon && onuId && aLanPorts && aLanPorts.length > 0) {
                    getLanPorts(options, slot, pon, onuId).then(respLanPorts => {
                        if (respLanPorts.length > 0) {
                            // Realizando merge entre os parametros de entrada e os já configurados na ONU 
                            hexTosend = ''
                            var lanPortsMerged = []
                            respLanPorts.forEach(c => {
                                c = { ...c, ...c.lanSettings }
                                delete c.lanSettings
                                var index = aLanPorts.findIndex(e => e.lanPort == c.lanPort)
                                if (index < 0)
                                    lanPortsMerged.push({ ...c, lanSettingsHex: null, vlansHex: [] })
                                else if (aLanPorts[index].clear === true)
                                    lanPortsMerged.push({ ...lanPortDefault, lanPort: aLanPorts[index].lanPort, lanSettingsHex: null, vlansHex: [] })
                                else
                                    lanPortsMerged.push({ ...c, ...aLanPorts[index], lanSettingsHex: null, vlansHex: [] })
                            })

                            // Convertendo dados para Hex
                            lanPortsMerged.forEach(lan => {
                                // Convertendo VLANS para Hex
                                var regTransparentCvlanId = []
                                if (lan.vlans && lan.vlans.length > 0) {
                                    lan.vlans.forEach((vlan, index) => {

                                        var bodyLan = snmp_fh.bodyLanEPON
                                        bodyLan = bodyLan.split(' ')

                                        if (vlan.tag || vlan.transparent) {
                                            console.error("Error! setLanPorts(): Parameter 'tag' and 'transparent' were deprecated in version 1.1.0. See documentation at 'https://www.npmjs.com/package/snmp-fiberhome'")
                                            return
                                        }

                                        if (vlan.vlanMode == 'tag' && regTransparentCvlanId.includes(vlan.cvlanId))
                                            console.error("Error! 'Tag' CVLANID has been used by other 'Transparent' service!")

                                        regTransparentCvlanId.push(vlan.cvlanId)

                                        bodyLan[3] = '00'   // unicast
                                        if (vlan.serviceType && vlan.serviceType.toLowerCase() == 'multicast')
                                            bodyLan[3] = '01'

                                        var vlanNum = null
                                        if (vlan.vlanMode && vlan.vlanMode.toLowerCase() == 'tag') {
                                            bodyLan[4] = `01`
                                            if ((vlan.cvlanId < 1 || vlan.cvlanId > 4085) && (options.enableWarnings))
                                                console.error('Warning! setLanPorts(): Invalid values for vlan tag. Values must be in the range 1 to 4085. The limit value has been set.')
                                            if (vlan.cvlanId < 1)
                                                vlanNum = 1
                                            if (vlan.cvlanId > 4085)
                                                vlanNum = 4085
                                            vlanNum = vlan.cvlanId.toHex(4)
                                        } else if (vlan.vlanMode && vlan.vlanMode.toLowerCase() == 'transparent') {
                                            bodyLan[4] = `03`
                                            if ((vlan.cvlanId < 1 || vlan.cvlanId > 4085) && (options.enableWarnings))
                                                console.error('Warning! setLanPorts(): Invalid values for vlan transparent. Values must be in the range 1 to 4085. The limit value has been set.')
                                            if (vlan.cvlanId < 1)
                                                vlanNum = 1
                                            if (vlan.cvlanId > 4085)
                                                vlanNum = 4085
                                            vlanNum = vlan.cvlanId.toHex(4)
                                        }

                                        bodyLan[5] = vlan.tpId ? vlan.tpId.toHex(4).slice(0, 2) : '81'
                                        bodyLan[6] = vlan.tpId ? vlan.tpId.toHex(4).slice(2, 4) : '00'
                                        bodyLan[7] = vlanNum ? vlanNum.slice(0, 2) : 'ff'
                                        bodyLan[8] = vlanNum ? vlanNum.slice(2, 4) : 'ff'
                                        bodyLan[9] = (vlan.cos && vlan.cos >= 0 && vlan.cos < 8) || vlan.cos === 0 ? vlan.cos.toHex(2) : 'ff'

                                        if (vlan.cos < 0)
                                            bodyLan[9] = '00'
                                        if (vlan.cos > 7)
                                            bodyLan[9] = '07'
                                        if (options.enableWarnings && (vlan.cos < 0 || vlan.cos > 7))
                                            console.error('Warning! setLanPorts(): Invalid values for "cos". Values must be in the range 0 to 7. The limit value has been set.')

                                        /* ** TLS ** */
                                        bodyLan[74] = '00'
                                        if (vlan.tls) {
                                            bodyLan[74] = '01'
                                            bodyLan[4] = `03`
                                        }

                                        /* ** Translation ** */
                                        if (vlan.translation) {
                                            bodyLan[10] = '01'
                                            bodyLan[11] = vlan.translation.tpId ? vlan.translation.tpId.toHex(4).slice(0, 2) : '81'
                                            bodyLan[12] = vlan.translation.tpId ? vlan.translation.tpId.toHex(4).slice(2, 4) : '00'
                                            bodyLan[13] = vlan.translation.value ? vlan.translation.value.toHex(4).slice(0, 2) : 'ff'
                                            bodyLan[14] = vlan.translation.value ? vlan.translation.value.toHex(4).slice(2, 4) : 'ff'
                                            bodyLan[15] = vlan.translation.cos || vlan.translation.cos === 0 ? vlan.translation.cos.toHex(2) : 'ff'
                                        }

                                        /* ** QinQ ** */ // DISABLED (BUG)
                                        if (vlan.qInQ && false) {
                                            bodyLan[16] = '01'  // QinQ State
                                            var vlanId = vlan.qInQ.vlanId
                                            for (var p = 0; p < 30; ++p) {
                                                if (vlan.qInQ.serviceName.split('')[p])
                                                    bodyLan[33 + p] = (vlan.qInQ.serviceName.split('')[p].charCodeAt(0)).toString(16)
                                                else
                                                    bodyLan[33 + p] = '00'
                                            }

                                            bodyLan[63] = vlan.qInQ.tpId ? vlan.qInQ.tpId.toHex(4).slice(0, 2) : '81'
                                            bodyLan[64] = vlan.qInQ.tpId ? vlan.qInQ.tpId.toHex(4).slice(2, 4) : '00'
                                            bodyLan[65] = vlanId ? vlanId.toHex(4).slice(0, 2) : 'ff'
                                            bodyLan[66] = vlanId ? vlanId.toHex(4).slice(2, 4) : 'ff'
                                            bodyLan[67] = vlan.qInQ.cos || vlan.qInQ.cos === 0 ? vlan.qInQ.cos.toHex(2) : 'ff'
                                        }

                                        if (vlan.bandwidthSet) {
                                            bodyLan[85] = vlan.bandwidthSet.upMinGuaranteed ? vlan.bandwidthSet.upMinGuaranteed.toHex(6).slice(0, 2) : '00'
                                            bodyLan[86] = vlan.bandwidthSet.upMinGuaranteed ? vlan.bandwidthSet.upMinGuaranteed.toHex(6).slice(2, 4) : '02'
                                            bodyLan[87] = vlan.bandwidthSet.upMinGuaranteed ? vlan.bandwidthSet.upMinGuaranteed.toHex(6).slice(4, 6) : '80'

                                            bodyLan[89] = vlan.bandwidthSet.upMaxAllowed ? vlan.bandwidthSet.upMaxAllowed.toHex(6).slice(0, 2) : '01'
                                            bodyLan[90] = vlan.bandwidthSet.upMaxAllowed ? vlan.bandwidthSet.upMaxAllowed.toHex(6).slice(2, 4) : '86'
                                            bodyLan[91] = vlan.bandwidthSet.upMaxAllowed ? vlan.bandwidthSet.upMaxAllowed.toHex(6).slice(4, 6) : 'a0'

                                            bodyLan[93] = vlan.bandwidthSet.downMinGuaranteed ? vlan.bandwidthSet.downMinGuaranteed.toHex(6).slice(0, 2) : '00'
                                            bodyLan[94] = vlan.bandwidthSet.downMinGuaranteed ? vlan.bandwidthSet.downMinGuaranteed.toHex(6).slice(2, 4) : '02'
                                            bodyLan[95] = vlan.bandwidthSet.downMinGuaranteed ? vlan.bandwidthSet.downMinGuaranteed.toHex(6).slice(4, 6) : '80'

                                            bodyLan[97] = vlan.bandwidthSet.downMaxAllowed ? vlan.bandwidthSet.downMaxAllowed.toHex(6).slice(0, 2) : '0f'
                                            bodyLan[98] = vlan.bandwidthSet.downMaxAllowed ? vlan.bandwidthSet.downMaxAllowed.toHex(6).slice(2, 4) : '42'
                                            bodyLan[99] = vlan.bandwidthSet.downMaxAllowed ? vlan.bandwidthSet.downMaxAllowed.toHex(6).slice(4, 6) : '40'

                                            bodyLan[101] = vlan.bandwidthSet.upstreamFixed ? vlan.bandwidthSet.upstreamFixed.toHex(6).slice(0, 2) : '00'
                                            bodyLan[102] = vlan.bandwidthSet.upstreamFixed ? vlan.bandwidthSet.upstreamFixed.toHex(6).slice(2, 4) : '00'
                                            bodyLan[103] = vlan.bandwidthSet.upstreamFixed ? vlan.bandwidthSet.upstreamFixed.toHex(6).slice(4, 6) : '00'
                                        } else {
                                            bodyLan[85] = '00'; bodyLan[86] = '02'; bodyLan[87] = '80'
                                            bodyLan[89] = '01'; bodyLan[90] = '86'; bodyLan[91] = 'a0'
                                            bodyLan[93] = '00'; bodyLan[94] = '02'; bodyLan[95] = '80'
                                            bodyLan[97] = '0f'; bodyLan[98] = '42'; bodyLan[99] = '40'
                                            bodyLan[101] = '00'; bodyLan[102] = '00'; bodyLan[103] = '00'
                                        }

                                        //bodyLan[75] = (index + 1).toHex(2)
                                        bodyLan = bodyLan.join(' ')

                                        lan.vlansHex.push(bodyLan)
                                    })
                                }

                                // Header LAN port
                                var headerLan = snmp_fh.headerLanEPON
                                var headerLength = ((snmp_fh.headerLanEPON.split(' ').length - 2) + (snmp_fh.bodyLanEPON.split(' ').length * lan.vlansHex.length) + snmp_fh.footerLanEPON.split(' ').length).toHex(4)
                                headerLan = headerLan.split(' ')
                                headerLan[0] = headerLength.slice(0, 2)                         // Tamanho do sub-pacote 
                                headerLan[1] = headerLength.slice(2, 4)
                                headerLan[2] = lan.lanPort.toHex(2)                                 // numero da porta lan
                                headerLan[3] = lan.enablePort === false ? '02' : '01'               // '01' = habilita / '02' = desabilita a porta lan
                                headerLan[4] = lan.autoNegotiation.auto === false ? '02' : '01'
                                headerLan[5] = lan.autoNegotiation.portSpeed == '1000M' ? '02' : lan.autoNegotiation.portSpeed == '100M' ? '01' : '00'  // '00' = '10M'
                                headerLan[6] = lan.autoNegotiation.duplex == 'half' ? '00' : '01'   // '01' = 'full'
                                headerLan[7] = lan.flowControl === true ? '01' : '00'

                                /* ** Policing State ** */
                                if (lan.policing && lan.policing.state !== false) {
                                    headerLan[8] = '01'

                                    // CIR
                                    var policingCir = 0
                                    if (lan.policing.cir) {           // 0 - 100000
                                        if (lan.policing.cir < 0)
                                            policingCir = 0
                                        else if (lan.policing.cir > 100000)
                                            policingCir = 100000
                                        else
                                            policingCir = lan.policing.cir
                                    }
                                    headerLan[10] = policingCir.toHex(6).slice(0, 2)
                                    headerLan[11] = policingCir.toHex(6).slice(2, 4)
                                    headerLan[12] = policingCir.toHex(6).slice(4, 6)

                                    // CBS
                                    var policingCbs = 0
                                    if (lan.policing.cbs) {           // 0 - 4294967294
                                        if (lan.policing.cbs < 0)
                                            policingCbs = 0
                                        else if (lan.policing.cbs > 4294967294)
                                            policingCbs = 4294967294
                                        else
                                            policingCbs = lan.policing.cbs
                                    }
                                    headerLan[13] = policingCbs.toHex(8).slice(0, 2)
                                    headerLan[14] = policingCbs.toHex(8).slice(2, 4)
                                    headerLan[15] = policingCbs.toHex(8).slice(4, 6)
                                    headerLan[16] = policingCbs.toHex(8).slice(6, 8)

                                    // EBS
                                    var policingEbs = 0
                                    if (lan.policing.ebs) {           // 0 - 4294967294
                                        if (lan.policing.ebs < 0)
                                            policingEbs = 0
                                        else if (lan.policing.ebs > 4294967294)
                                            policingEbs = 4294967294
                                        else
                                            policingEbs = lan.policing.ebs
                                    }
                                    headerLan[17] = policingEbs.toHex(8).slice(0, 2)
                                    headerLan[18] = policingEbs.toHex(8).slice(2, 4)
                                    headerLan[19] = policingEbs.toHex(8).slice(4, 6)
                                    headerLan[20] = policingEbs.toHex(8).slice(6, 8)
                                }

                                /* ** DS Policing ** */
                                if (lan.dsPolicing && lan.dsPolicing.state !== false) {
                                    headerLan[21] = '01'

                                    // CIR
                                    var dsPolicingCir = 0
                                    if (lan.dsPolicing.cir) {           // 0 - 16777215
                                        if (lan.dsPolicing.cir < 0)
                                            dsPolicingCir = 0
                                        else if (lan.dsPolicing.cir > 16777215)
                                            dsPolicingCir = 16777215
                                        else
                                            dsPolicingCir = lan.dsPolicing.cir
                                    }
                                    headerLan[23] = dsPolicingCir.toHex(6).slice(0, 2)
                                    headerLan[24] = dsPolicingCir.toHex(6).slice(2, 4)
                                    headerLan[25] = dsPolicingCir.toHex(6).slice(4, 6)

                                    // PIR
                                    var dsPolicingPir = 0
                                    if (lan.dsPolicing.pir) {           // 0 - 16777215
                                        if (lan.dsPolicing.pir < 0)
                                            dsPolicingPir = 0
                                        else if (lan.dsPolicing.pir > 16777215)
                                            dsPolicingPir = 16777215
                                        else
                                            dsPolicingPir = lan.dsPolicing.pir
                                    }
                                    headerLan[27] = dsPolicingPir.toHex(6).slice(0, 2)
                                    headerLan[28] = dsPolicingPir.toHex(6).slice(2, 4)
                                    headerLan[29] = dsPolicingPir.toHex(6).slice(4, 6)
                                }

                                headerLan[31] = lan.vlansHex.length.toHex(2)                         // Quantidade de vlans na porta lan
                                headerLan = headerLan.join(' ')
                                hexTosend += headerLan + ' '

                                // Body loop
                                lan.vlansHex.forEach(profile => {
                                    hexTosend += profile + ' '
                                })

                                // footer
                                var footerLan = snmp_fh.footerLanEPON
                                footerLan = footerLan.split(' ')

                                var igmpUpCvlanId = lan.igmpUpCvlan.id ? lan.igmpUpCvlan.id : 65535   // 65535 == 'ffff'
                                footerLan[2] = igmpUpCvlanId.toHex(4).slice(0, 2)
                                footerLan[3] = igmpUpCvlanId.toHex(4).slice(2, 4)
                                footerLan[4] = lan.igmpUpCvlan.cos || lan.igmpUpCvlan.cos === 0 ? lan.igmpUpCvlan.cos.toHex(2) : 'ff'

                                var igmpUpCvlanTpId = lan.igmpUpCvlan.tpId ? lan.igmpUpCvlan.tpId : 33024
                                footerLan[5] = igmpUpCvlanTpId.toHex(4).slice(0, 2)
                                footerLan[6] = igmpUpCvlanTpId.toHex(4).slice(2, 4)

                                var igmpUpSvlanId = lan.igmpUpSvlan.id ? lan.igmpUpSvlan.id : 65535   // 65535 == 'ffff'
                                footerLan[7] = igmpUpSvlanId.toHex(4).slice(0, 2)
                                footerLan[8] = igmpUpSvlanId.toHex(4).slice(2, 4)
                                footerLan[9] = lan.igmpUpSvlan.cos || lan.igmpUpSvlan.cos === 0 ? lan.igmpUpSvlan.cos.toHex(2) : 'ff'

                                var igmpUpSvlanTpId = lan.igmpUpSvlan.tpId ? lan.igmpUpSvlan.tpId : 33024
                                footerLan[10] = igmpUpSvlanTpId.toHex(4).slice(0, 2)
                                footerLan[11] = igmpUpSvlanTpId.toHex(4).slice(2, 4)

                                footerLan = footerLan.join(' ')
                                hexTosend += footerLan + ' '
                            })

                            hexTosend = hexTosend.trim()

                            // Header package
                            var headerLanPorts = snmp_fh.headerLanPorts
                            headerLanPorts = headerLanPorts.split(' ')
                            var packSize = hexTosend.split(' ').length + 39             // 39 = trecho que vai do tamanho do pacote (posições [122] e [123]) em headerLanPorts até o final
                            headerLanPorts[70] = packSize.toHex(4).slice(0, 2)          // Tamanho do sub-pacote
                            headerLanPorts[71] = packSize.toHex(4).slice(2, 4)          // Tamanho do sub-pacote
                            headerLanPorts[122] = headerLanPorts[70]
                            headerLanPorts[123] = headerLanPorts[71]
                            headerLanPorts[156] = slot.toHex(2)
                            headerLanPorts[158] = pon.toHex(2)
                            headerLanPorts[160] = onuId.toHex(2)                        // ONU NUMBER / ONU Authorized No.  
                            headerLanPorts[162] = respLanPorts.length.toHex(2)          // Quantidade de portas lan

                            headerLanPorts = headerLanPorts.join(' ')
                            hexTosend = headerLanPorts + ' ' + hexTosend

                            snmp_fh.sendSnmp(OID.setLanPortsEPON, hexTosend, options, true).then(ret => {
                                snmp_fh.sendSnmp(OID.confirmSetLanPortsEPON, hexTosend, options, true).then(retConfirm => {
                                    return resolve(convertToOnuIndex(slot, pon, onuId))
                                })
                            })
                        } else
                            return resolve(false)
                    })
                } else return resolve(false)
            }, error => {
                return resolve(false)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function setLanPortsGPON(options, slot, pon, onuId, aLanPorts) {
    return new Promise((resolve, reject) => {
        try {
            gFunc.isValid(options, slot, pon, onuId).then(isValid => {
                if (isValid && slot && pon && onuId && aLanPorts && aLanPorts.length > 0) {
                    getLanPorts(options, slot, pon, onuId).then(respLanPorts => {
                        if (respLanPorts.length > 0) {
                            // Realizando merge entre os parametros de entrada e os já configurados na ONU 
                            hexTosend = ''
                            var lanPortsMerged = []
                            respLanPorts.forEach(c => {
                                c = { ...c, ...c.lanSettings }
                                delete c.lanSettings
                                var index = aLanPorts.findIndex(e => e.lanPort == c.lanPort)
                                if (index < 0)
                                    lanPortsMerged.push({ ...c, lanSettingsHex: null, vlansHex: [] })
                                else if (aLanPorts[index].clear === true)
                                    lanPortsMerged.push({ ...lanPortDefault, lanPort: aLanPorts[index].lanPort, lanSettingsHex: null, vlansHex: [] })
                                else
                                    lanPortsMerged.push({ ...c, ...aLanPorts[index], lanSettingsHex: null, vlansHex: [] })
                            })

                            // Convertendo dados para Hex
                            lanPortsMerged.forEach(lan => {
                                // Convertendo VLANS para Hex
                                var regTransparentCvlanId = []
                                if (lan.vlans && lan.vlans.length > 0) {
                                    lan.vlans.forEach((vlan, index) => {

                                        var bodyLan = snmp_fh.bodyLan
                                        bodyLan = bodyLan.split(' ')

                                        if (vlan.tag || vlan.transparent) {
                                            console.error("Error! setLanPorts(): Parameter 'tag' and 'transparent' were deprecated in version 1.1.0. See documentation at 'https://www.npmjs.com/package/snmp-fiberhome'")
                                            return
                                        }

                                        if (vlan.vlanMode == 'tag' && regTransparentCvlanId.includes(vlan.cvlanId))
                                            console.error("Error! 'Tag' CVLANID has been used by other 'Transparent' service!")

                                        regTransparentCvlanId.push(vlan.cvlanId)

                                        /* ** TLS ** */
                                        bodyLan[74] = '00'
                                        if (vlan.tls) {
                                            bodyLan[74] = '01'
                                            bodyLan[4] = `03`
                                        }

                                        /* ** Translation ** */
                                        if (vlan.translation) {
                                            bodyLan[10] = '01'
                                            bodyLan[13] = vlan.translation.value ? vlan.translation.value.toHex(4).slice(0, 2) : 'ff'
                                            bodyLan[14] = vlan.translation.value ? vlan.translation.value.toHex(4).slice(2, 4) : 'ff'
                                            bodyLan[15] = vlan.translation.cos || vlan.translation.cos === 0 ? vlan.translation.cos.toHex(2) : 'ff'
                                        }

                                        /* ** QinQ ** */
                                        if (vlan.qInQ) {
                                            bodyLan[16] = '01'  // QinQ State
                                            bodyLan[67] = vlan.qInQ.cos || vlan.qInQ.cos === 0 ? vlan.qInQ.cos.toHex(2) : 'ff'
                                            var vlanId = vlan.qInQ.vlanId
                                            if (vlan.qInQ.serviceName.toUpperCase() == 'IGMP') {         // IGMP: 49 47 4d 50
                                                bodyLan[33] = '49'; bodyLan[34] = '47'; bodyLan[35] = '4d'; bodyLan[36] = '50'
                                                bodyLan[65] = vlanId ? vlanId.toHex(4).slice(0, 2) : '0b'
                                                bodyLan[66] = vlanId ? vlanId.toHex(4).slice(2, 4) : 'b8'
                                            } else if (vlan.qInQ.serviceName.toUpperCase() == 'PPPOE') { // PPPoE: 50 50 50 6f 45
                                                bodyLan[33] = '50'; bodyLan[34] = '50'; bodyLan[35] = '50'; bodyLan[36] = '6f'; bodyLan[37] = '45'
                                                bodyLan[65] = vlanId ? vlanId.toHex(4).slice(0, 2) : '03'
                                                bodyLan[66] = vlanId ? vlanId.toHex(4).slice(2, 4) : '93'
                                            } else if (vlan.qInQ.serviceName.toUpperCase() == 'IPTV') {  // IPTV: 49 50 54 56
                                                bodyLan[33] = '49'; bodyLan[34] = '50'; bodyLan[35] = '54'; bodyLan[36] = '56'
                                                bodyLan[65] = vlanId ? vlanId.toHex(4).slice(0, 2) : '01'
                                                bodyLan[66] = vlanId ? vlanId.toHex(4).slice(2, 4) : '94'
                                            } else if (vlan.qInQ.serviceName.toUpperCase() == 'IGMP2') { // IGMP2: 49 47 4d 50 32
                                                bodyLan[33] = '49'; bodyLan[34] = '47'; bodyLan[35] = '4d'; bodyLan[36] = '50'; bodyLan[37] = '32'
                                                bodyLan[65] = vlanId ? vlanId.toHex(4).slice(0, 2) : '0b'
                                                bodyLan[66] = vlanId ? vlanId.toHex(4).slice(2, 4) : 'b9'
                                            }
                                        }

                                        bodyLan[3] = '00'   // unicast
                                        if (vlan.serviceType && vlan.serviceType.toLowerCase() == 'multicast')
                                            bodyLan[3] = '01'

                                        var vlanNum = null
                                        if (vlan.vlanMode && vlan.vlanMode.toLowerCase() == 'tag') {
                                            bodyLan[4] = `01`
                                            if ((vlan.cvlanId < 1 || vlan.cvlanId > 4085) && (options.enableWarnings))
                                                console.error('Warning! setLanPorts(): Invalid values for vlan tag. Values must be in the range 1 to 4085. The limit value has been set.')
                                            if (vlan.cvlanId < 1)
                                                vlanNum = 1
                                            if (vlan.cvlanId > 4085)
                                                vlanNum = 4085
                                            vlanNum = vlan.cvlanId.toHex(4)
                                        } else if (vlan.vlanMode && vlan.vlanMode.toLowerCase() == 'transparent') {
                                            bodyLan[4] = `03`
                                            if ((vlan.cvlanId < 1 || vlan.cvlanId > 4085) && (options.enableWarnings))
                                                console.error('Warning! setLanPorts(): Invalid values for vlan transparent. Values must be in the range 1 to 4085. The limit value has been set.')
                                            if (vlan.cvlanId < 1)
                                                vlanNum = 1
                                            if (vlan.cvlanId > 4085)
                                                vlanNum = 4085
                                            vlanNum = vlan.cvlanId.toHex(4)
                                        }

                                        bodyLan[7] = vlanNum ? vlanNum.slice(0, 2) : 'ff'
                                        bodyLan[8] = vlanNum ? vlanNum.slice(2, 4) : 'ff'
                                        bodyLan[9] = (vlan.cos && vlan.cos >= 0 && vlan.cos < 8) || vlan.cos === 0 ? vlan.cos.toHex(2) : 'ff'

                                        if (vlan.cos < 0)
                                            bodyLan[9] = '00'
                                        if (vlan.cos > 7)
                                            bodyLan[9] = '07'
                                        if (options.enableWarnings && (vlan.cos < 0 || vlan.cos > 7))
                                            console.error('Warning! setLanPorts(): Invalid values for "cos". Values must be in the range 0 to 7. The limit value has been set.')

                                        //bodyLan[75] = (index + 1).toHex(2)
                                        bodyLan = bodyLan.join(' ')

                                        lan.vlansHex.push(bodyLan)
                                    })
                                }

                                // Header LAN port
                                var headerLan = snmp_fh.headerLan
                                var headerLength = ((snmp_fh.headerLan.split(' ').length - 2) + (snmp_fh.bodyLan.split(' ').length * lan.vlansHex.length) + snmp_fh.footerLan.split(' ').length).toHex(4)
                                headerLan = headerLan.split(' ')
                                headerLan[0] = headerLength.slice(0, 2)                         // Tamanho do sub-pacote 
                                headerLan[1] = headerLength.slice(2, 4)
                                headerLan[2] = lan.lanPort.toHex(2)                                 // numero da porta lan
                                headerLan[3] = lan.enablePort === false ? '02' : '01'               // '01' = habilita / '02' = desabilita a porta lan
                                headerLan[4] = lan.autoNegotiation.auto === false ? '02' : '01'
                                headerLan[5] = lan.autoNegotiation.portSpeed == '1000M' ? '02' : lan.autoNegotiation.portSpeed == '100M' ? '01' : '00'  // '00' = '10M'
                                headerLan[6] = lan.autoNegotiation.duplex == 'half' ? '00' : '01'   // '01' = 'full'
                                headerLan[7] = lan.flowControl === true ? '01' : '00'
                                headerLan[9] = lan.vlansHex.length.toHex(2)                         // Quantidade de vlans na porta lan
                                headerLan = headerLan.join(' ')
                                hexTosend += headerLan + ' '

                                // Body loop
                                lan.vlansHex.forEach(profile => {
                                    hexTosend += profile + ' '
                                })

                                // footer
                                var footerLan = snmp_fh.footerLan
                                footerLan = footerLan.split(' ')

                                var upstreamMin = lan.boardwidthSet.upstreamMin ? lan.boardwidthSet.upstreamMin : 640
                                footerLan[1] = upstreamMin.toHex(6).slice(0, 2)
                                footerLan[2] = upstreamMin.toHex(6).slice(2, 4)
                                footerLan[3] = upstreamMin.toHex(6).slice(4, 6)

                                var upstreamMax = lan.boardwidthSet.upstreamMax ? lan.boardwidthSet.upstreamMax : 1000000
                                footerLan[5] = upstreamMax.toHex(6).slice(0, 2)
                                footerLan[6] = upstreamMax.toHex(6).slice(2, 4)
                                footerLan[7] = upstreamMax.toHex(6).slice(4, 6)

                                var downstream = lan.boardwidthSet.downstream ? lan.boardwidthSet.downstream : 1000000
                                footerLan[9] = downstream.toHex(6).slice(0, 2)
                                footerLan[10] = downstream.toHex(6).slice(2, 4)
                                footerLan[11] = downstream.toHex(6).slice(4, 6)

                                var igmpUpCvlanId = lan.igmpUpCvlan.id ? lan.igmpUpCvlan.id : 65535   // 65535 == 'ffff'
                                footerLan[14] = igmpUpCvlanId.toHex(4).slice(0, 2)
                                footerLan[15] = igmpUpCvlanId.toHex(4).slice(2, 4)

                                footerLan[16] = lan.igmpUpCvlan.cos || lan.igmpUpCvlan.cos === 0 ? lan.igmpUpCvlan.cos.toHex(2) : 'ff'

                                var igmpUpCvlanTpId = lan.igmpUpCvlan.tpId ? lan.igmpUpCvlan.tpId : 33024
                                footerLan[17] = igmpUpCvlanTpId.toHex(4).slice(0, 2)
                                footerLan[18] = igmpUpCvlanTpId.toHex(4).slice(2, 4)

                                var igmpUpSvlanId = lan.igmpUpSvlan.id ? lan.igmpUpSvlan.id : 65535   // 65535 == 'ffff'
                                footerLan[19] = igmpUpSvlanId.toHex(4).slice(0, 2)
                                footerLan[20] = igmpUpSvlanId.toHex(4).slice(2, 4)

                                footerLan[21] = lan.igmpUpSvlan.cos || lan.igmpUpSvlan.cos === 0 ? lan.igmpUpSvlan.cos.toHex(2) : 'ff'

                                var igmpUpSvlanTpId = lan.igmpUpSvlan.tpId ? lan.igmpUpSvlan.tpId : 33024
                                footerLan[22] = igmpUpSvlanTpId.toHex(4).slice(0, 2)
                                footerLan[23] = igmpUpSvlanTpId.toHex(4).slice(2, 4)

                                footerLan = footerLan.join(' ')
                                hexTosend += footerLan + ' '
                            })

                            hexTosend = hexTosend.trim()

                            // Header package
                            var headerLanPorts = snmp_fh.headerLanPorts
                            headerLanPorts = headerLanPorts.split(' ')
                            var packSize = hexTosend.split(' ').length + 39          // 39 = trecho que vai do tamanho do pacote (posições [122] e [123]) em headerLanPorts até o final
                            headerLanPorts[70] = packSize.toHex(4).slice(0, 2)  // Tamanho do sub-pacote
                            headerLanPorts[71] = packSize.toHex(4).slice(2, 4)  // Tamanho do sub-pacote
                            headerLanPorts[122] = headerLanPorts[70]
                            headerLanPorts[123] = headerLanPorts[71]
                            headerLanPorts[156] = slot.toHex(2)
                            headerLanPorts[158] = pon.toHex(2)
                            headerLanPorts[160] = onuId.toHex(2)                // ONU NUMBER / ONU Authorized No.  
                            headerLanPorts[162] = respLanPorts.length.toHex(2)  // Quantidade de portas lan

                            headerLanPorts = headerLanPorts.join(' ')
                            hexTosend = headerLanPorts + ' ' + hexTosend
                            snmp_fh.sendSnmp(OID.setLanPorts, hexTosend, options, true).then(ret => {
                                snmp_fh.sendSnmp(OID.confirmSetLanPorts, hexTosend, options, true).then(retConfirm => {
                                    return resolve(convertToOnuIndex(slot, pon, onuId))
                                })
                            })
                        } else
                            return resolve(false)
                    })
                } else return resolve(false)
            }, error => {
                return resolve(false)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function getLanPorts(options, slot, pon, onuId) {
    return new Promise((resolve, reject) => {
        try {
            getOnuType(options, slot, pon, onuId).then(onuType => {
                if (onuType && onuType.type == 'GPON')
                    getLanPortsGPON(options, slot, pon, onuId).then(resp => {
                        return resolve(resp)
                    }, errorEPON => {
                        return reject(errorEPON)
                    })
                else if (onuType && onuType.type == 'EPON')
                    getLanPortsEPON(options, slot, pon, onuId).then(resp => {
                        return resolve(resp)
                    }, errorGPON => {
                        return reject(errorGPON)
                    })
                else {
                    console.error("getLanPorts(): The ONU type was not identified as GPON or EPON in 'src/tables.js' -> 'ONUType'. Use the getLanPortsGPON (options, slot, pon, onuId) or getLanPortsEPON (options, slot, pon, onuId) function.")
                }
            }, err => {
                return reject(err)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function getLanPortsEPON(options, slot, pon, onuId) {
    return new Promise((resolve, reject) => {
        try {
            gFunc.isValid(options, slot, pon, onuId).then(isValid => {
                if (isValid && slot && pon && onuId) {
                    var getLanPorts = snmp_fh.getLanPorts
                    getLanPorts = getLanPorts.split(' ')

                    getLanPorts[156] = slot.toHex(2)
                    getLanPorts[158] = pon.toHex(2)
                    getLanPorts[160] = onuId.toHex(2)            // ONU NUMBER / ONU Authorized No.
                    getLanPorts = getLanPorts.join(' ')

                    snmp_fh.sendSnmp(OID.setLanPortsEPON, getLanPorts, options, true).then(ret => {
                        snmp_fh.sendSnmp(OID.confirmSetLanPortsEPON, getLanPorts, options, true).then(confirm => {
                            var hex = '' // Adicionando espaço em branco a cada 2 bytes
                            for (var i = 0; i < ret.length; i += 2)
                                hex += ret.substring(i, i + 2) + ' '
                            hex = hex.trim()
                            var value = hex.split('2b 06 01 04 01 ad 73 5b 01 08 01 01 01 06 01 ')[1]
                            value = value.split(' ')
                            if (value[1] == '81')
                                value = value.splice(3)
                            else
                                value = value.splice(4)

                            var numLanPorts = parseInt(value[166])
                            var bodyLans = value.slice(167) // obtem da posição 167 até o final
                            var resp = []

                            // LANS
                            for (var idx = 0; idx < numLanPorts; ++idx) {
                                var headerLan = bodyLans.slice(0, 32)       // Tamanho do headerLan 
                                bodyLans = bodyLans.slice(32)
                                var lan = null

                                if (headerLan[3] == '01')   // '01' enable, '02' disabled
                                    lan = { lanPort: parseInt(headerLan[2]), enablePort: true, vlans: [] }
                                else
                                    lan = { lanPort: parseInt(headerLan[2]), enablePort: false, vlans: [] }

                                lan.lanSettings = {}
                                lan.lanSettings.autoNegotiation = {}

                                lan.lanSettings.autoNegotiation.auto = true
                                if (headerLan[4] == '02')
                                    lan.lanSettings.autoNegotiation.auto = false

                                /* ** Port Auto Negotiation ** */
                                var portSpeed = 'undefined'
                                if (headerLan[5] == '00')
                                    portSpeed = '10M'
                                else if (headerLan[5] == '01')
                                    portSpeed = '100M'
                                else if (headerLan[5] == '02')
                                    portSpeed = '1000M'

                                var duplex = 'undefined'
                                if (headerLan[6] == '00')
                                    duplex = 'half'
                                else if (headerLan[6] == '01')
                                    duplex = 'full'

                                lan.lanSettings.autoNegotiation.portSpeed = portSpeed
                                lan.lanSettings.autoNegotiation.duplex = duplex

                                lan.lanSettings.flowControl = false
                                if (headerLan[7] == '01')
                                    lan.lanSettings.flowControl = true

                                /* ** Policing State ** */
                                lan.lanSettings.policing = { state: false }
                                if (headerLan[8] == '01')
                                    lan.lanSettings.policing.state = true
                                lan.lanSettings.policing.cir = parseInt(headerLan[10] + headerLan[11] + headerLan[12], 16)                    // 0 - 100000
                                lan.lanSettings.policing.cbs = parseInt(headerLan[13] + headerLan[14] + headerLan[15] + headerLan[16], 16)      // 0 - 4294967294
                                lan.lanSettings.policing.ebs = parseInt(headerLan[17] + headerLan[18] + headerLan[19] + headerLan[20], 16)      // 0 - 4294967294

                                /* ** DS Policing ** */
                                lan.lanSettings.dsPolicing = { state: false }
                                if (headerLan[21] == '01')
                                    lan.lanSettings.dsPolicing.state = true
                                lan.lanSettings.dsPolicing.cir = parseInt(headerLan[23] + headerLan[24] + headerLan[25], 16)                  // 0 - 16777215
                                lan.lanSettings.dsPolicing.pir = parseInt(headerLan[27] + headerLan[28] + headerLan[29], 16)                  // 0 - 16777215

                                // Profiles
                                for (var i = 0; i < parseInt(headerLan[31]); ++i) {
                                    var profile = {}
                                    var bodyLan = bodyLans.slice(0, 104)     // Tamanho de cada perfil

                                    profile.serviceType = 'multicast'
                                    if (bodyLan[3] == '00')
                                        profile.serviceType = 'unicast'

                                    profile.tpId = parseInt(bodyLan[5] + bodyLan[6], 16)
                                    /* ** TLS ** */
                                    profile.tls = false
                                    if (bodyLan[74] == '01')    // Verificar. (75?)
                                        profile.tls = true
                                    else {
                                        //profile.tls = false
                                        var vLan = parseInt(bodyLan[7] + bodyLan[8], 16)
                                        if (bodyLan[4] == '03') {
                                            profile.vlanMode = 'transparent'
                                            profile.cvlanId = vLan
                                        } else if (bodyLan[4] == '01') {
                                            profile.vlanMode = 'tag'
                                            profile.cvlanId = vLan
                                        }

                                        profile.cos = null
                                        if (bodyLan[9] != 'ff')
                                            profile.cos = parseInt(bodyLan[9], 16)
                                    }

                                    /* ** Translation ** */
                                    profile.translation = false
                                    if (bodyLan[10] == '01') {
                                        profile.translation = {}
                                        profile.translation.tpId = parseInt(bodyLan[11] + bodyLan[12], 16)
                                        profile.translation.value = parseInt(bodyLan[13] + bodyLan[14], 16)
                                        profile.translation.cos = null
                                        if (bodyLan[15] != 'ff')
                                            profile.translation.cos = parseInt(bodyLan[15], 16)
                                    }

                                    /* ** QinQ ** */
                                    profile.qInQ = false
                                    if (bodyLan[16] == '01') {
                                        profile.qInQ = {}
                                        profile.qInQ.serviceName = ''
                                        profile.qInQ.tpId = parseInt(bodyLan[63] + bodyLan[64], 16)
                                        profile.qInQ.vlanId = parseInt(bodyLan[65] + bodyLan[66], 16)

                                        profile.qInQ.cos = null
                                        if (bodyLan[67] != 'ff')
                                            profile.qInQ.cos = parseInt(bodyLan[67])

                                        for (var i = 0; i < 30; ++i)
                                            if (bodyLan[33 + i] != '00')
                                                profile.qInQ.serviceName += String.fromCharCode(parseInt(bodyLan[33 + i], 16))
                                    }

                                    /* ** bandwidth ** */
                                    profile.bandwidthSet = {}
                                    profile.bandwidthSet.upMinGuaranteed = parseInt(bodyLan[85] + bodyLan[86] + bodyLan[87], 16)            // 0 - 1000000
                                    profile.bandwidthSet.upMaxAllowed = parseInt(bodyLan[89] + bodyLan[90] + bodyLan[91], 16)               // 256 - 1000000
                                    profile.bandwidthSet.downMinGuaranteed = parseInt(bodyLan[93] + bodyLan[94] + bodyLan[95], 16)          // 0 - 1000000
                                    profile.bandwidthSet.downMaxAllowed = parseInt(bodyLan[97] + bodyLan[98] + bodyLan[99], 16)             // 0 - 1000000
                                    profile.bandwidthSet.upstreamFixed = parseInt(bodyLan[101] + bodyLan[102] + bodyLan[103], 16)           // 0 - 1000000

                                    lan.vlans.push(profile)
                                    bodyLans = bodyLans.slice(104)          // Tamanho de cada perfil
                                }

                                var footerLans = bodyLans.slice(0, 18)      // tamanho do footer

                                lan.lanSettings.igmpUpCvlan = { id: null }
                                if (footerLans[2] != 'ff')
                                    lan.lanSettings.igmpUpCvlan.id = parseInt(footerLans[2] + footerLans[3], 16)

                                lan.lanSettings.igmpUpCvlan.cos = null
                                if (footerLans[4] != 'ff')
                                    lan.lanSettings.igmpUpCvlan.cos = parseInt(footerLans[4], 16)

                                lan.lanSettings.igmpUpCvlan.tpId = parseInt(footerLans[5] + footerLans[6], 16)

                                lan.lanSettings.igmpUpSvlan = { id: null }
                                if (footerLans[7] != 'ff')
                                    lan.lanSettings.igmpUpSvlan.id = parseInt(footerLans[7] + footerLans[8], 16)

                                lan.lanSettings.igmpUpSvlan.cos = null
                                if (footerLans[9] != 'ff')
                                    lan.lanSettings.igmpUpSvlan.cos = parseInt(footerLans[9], 16)

                                lan.lanSettings.igmpUpSvlan.tpId = parseInt(footerLans[10] + footerLans[11], 16)

                                bodyLans = bodyLans.slice(18)               // tamanho do footer
                                resp.push(lan)
                            }
                            return resolve(resp)
                        })
                    })
                } else return resolve(false)
            }, error => {
                return resolve(false)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function getLanPortsGPON(options, slot, pon, onuId) {
    return new Promise((resolve, reject) => {
        try {
            gFunc.isValid(options, slot, pon, onuId).then(isValid => {
                if (isValid && slot && pon && onuId) {
                    var getLanPorts = snmp_fh.getLanPorts
                    getLanPorts = getLanPorts.split(' ')

                    getLanPorts[156] = slot.toHex(2)
                    getLanPorts[158] = pon.toHex(2)
                    getLanPorts[160] = onuId.toHex(2)            // ONU NUMBER / ONU Authorized No.
                    getLanPorts = getLanPorts.join(' ')

                    snmp_fh.sendSnmp(OID.setLanPorts, getLanPorts, options, true).then(ret => {
                        snmp_fh.sendSnmp(OID.confirmSetLanPorts, getLanPorts, options, true).then(confirm => {
                            var hex = '' // Adicionando espaço em branco a cada 2 bytes
                            for (var i = 0; i < ret.length; i += 2)
                                hex += ret.substring(i, i + 2) + ' '
                            hex = hex.trim()
                            var value = hex.split('2b 06 01 04 01 ad 73 5b 01 08 01 01 01 05 01 ')[1]
                            value = value.split(' ')
                            if (value[1] == '81')
                                value = value.splice(3)
                            else
                                value = value.splice(4)

                            var numLanPorts = parseInt(value[166])
                            var bodyLans = value.slice(167)
                            var resp = []

                            // LANS
                            for (var idx = 0; idx < numLanPorts; ++idx) {
                                var headerLan = bodyLans.slice(0, 10)
                                bodyLans = bodyLans.slice(10)
                                var lan = null

                                if (headerLan[3] == '01')   // '01' enable, '02' disabled
                                    lan = { lanPort: parseInt(headerLan[2]), enablePort: true, vlans: [] }
                                else
                                    lan = { lanPort: parseInt(headerLan[2]), enablePort: false, vlans: [] }

                                lan.lanSettings = {}
                                lan.lanSettings.autoNegotiation = {}

                                lan.lanSettings.autoNegotiation.auto = true
                                if (headerLan[4] == '02')
                                    lan.lanSettings.autoNegotiation.auto = false

                                /* ** Port Auto Negotiation ** */
                                var portSpeed = 'undefined'
                                if (headerLan[5] == '00')
                                    portSpeed = '10M'
                                else if (headerLan[5] == '01')
                                    portSpeed = '100M'
                                else if (headerLan[5] == '02')
                                    portSpeed = '1000M'

                                var duplex = 'undefined'
                                if (headerLan[6] == '00')
                                    duplex = 'half'
                                else if (headerLan[6] == '01')
                                    duplex = 'full'

                                lan.lanSettings.autoNegotiation.portSpeed = portSpeed
                                lan.lanSettings.autoNegotiation.duplex = duplex

                                lan.lanSettings.flowControl = false
                                if (headerLan[7] == '01')
                                    lan.lanSettings.flowControl = true

                                // Profiles
                                for (var i = 0; i < parseInt(headerLan[9]); ++i) {
                                    var profile = {}
                                    var bodyLan = bodyLans.slice(0, 84)

                                    profile.serviceType = 'multicast'
                                    if (bodyLan[3] == '00')
                                        profile.serviceType = 'unicast'

                                    profile.tpId = parseInt(bodyLan[5] + bodyLan[6], 16)
                                    /* ** TLS ** */
                                    profile.tls = false
                                    if (bodyLan[74] == '01')
                                        profile.tls = true
                                    else {
                                        //profile.tls = false
                                        var vLan = parseInt(bodyLan[7] + bodyLan[8], 16)
                                        if (bodyLan[4] == '03') {
                                            profile.vlanMode = 'transparent'
                                            profile.cvlanId = vLan
                                        } else if (bodyLan[4] == '01') {
                                            profile.vlanMode = 'tag'
                                            profile.cvlanId = vLan
                                        }

                                        profile.cos = null
                                        if (bodyLan[9] != 'ff')
                                            profile.cos = parseInt(bodyLan[9], 16)
                                    }

                                    /* ** Translation ** */
                                    profile.translation = false
                                    if (bodyLan[10] == '01') {
                                        profile.translation = {}
                                        profile.translation.tpId = parseInt(bodyLan[11] + bodyLan[12], 16)
                                        profile.translation.value = parseInt(bodyLan[13] + bodyLan[14], 16)
                                        profile.translation.cos = null
                                        if (bodyLan[15] != 'ff')
                                            profile.translation.cos = parseInt(bodyLan[15], 16)
                                    }

                                    /* ** QinQ ** */
                                    profile.qInQ = false
                                    if (bodyLan[16] == '01') {

                                        profile.qInQ = {}
                                        profile.qInQ.serviceName = ''

                                        profile.qInQ.tpId = parseInt(bodyLan[63] + bodyLan[64], 16)

                                        profile.qInQ.cos = null
                                        if (bodyLan[67] != 'ff')
                                            profile.qInQ.cos = parseInt(bodyLan[67])

                                        profile.qInQ.vlanId = parseInt(bodyLan[65] + bodyLan[66], 16)

                                        for (var i = 0; i < 5; ++i)
                                            if (bodyLan[33 + i] != '00')
                                                profile.qInQ.serviceName += String.fromCharCode(parseInt(bodyLan[33 + i], 16))
                                    }

                                    profile.cos = null
                                    if (bodyLan[9] != 'ff')
                                        profile.cos = parseInt(bodyLan[9], 16)

                                    lan.vlans.push(profile)
                                    bodyLans = bodyLans.slice(84)
                                }

                                var footerLans = bodyLans.slice(0, 30)

                                lan.lanSettings.boardwidthSet = {}
                                lan.lanSettings.boardwidthSet.upstreamMin = parseInt(footerLans[1] + footerLans[2] + footerLans[3], 16)     // 0 - 1000000
                                lan.lanSettings.boardwidthSet.upstreamMax = parseInt(footerLans[5] + footerLans[6] + footerLans[7], 16)     // 256 - 1000000
                                lan.lanSettings.boardwidthSet.downstream = parseInt(footerLans[9] + footerLans[10] + footerLans[11], 16)    // 0 - 1000000

                                lan.lanSettings.igmpUpCvlan = { id: null }
                                if (footerLans[14] != 'ff')
                                    lan.lanSettings.igmpUpCvlan.id = parseInt(footerLans[14] + footerLans[15], 16)

                                lan.lanSettings.igmpUpCvlan.tpId = parseInt(footerLans[17] + footerLans[18], 16)

                                lan.lanSettings.igmpUpCvlan.cos = null
                                if (footerLans[16] != 'ff')
                                    lan.lanSettings.igmpUpCvlan.cos = parseInt(footerLans[16], 16)

                                lan.lanSettings.igmpUpSvlan = { id: null }
                                if (footerLans[19] != 'ff')
                                    lan.lanSettings.igmpUpSvlan.id = parseInt(footerLans[19] + footerLans[20], 16)

                                lan.lanSettings.igmpUpSvlan.tpId = parseInt(footerLans[22] + footerLans[23], 16)

                                lan.lanSettings.igmpUpSvlan.cos = null
                                if (footerLans[21] != 'ff')
                                    lan.lanSettings.igmpUpSvlan.cos = parseInt(footerLans[21], 16)

                                bodyLans = bodyLans.slice(30)
                                resp.push(lan)
                            }
                            return resolve(resp)
                        })
                    })
                } else return resolve(false)
            }, error => {
                return resolve(false)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function enableLanPorts(options, slot, pon, onuId, aLanPorts) {
    return new Promise((resolve, reject) => {
        try {
            getLanPorts(options, slot, pon, onuId).then(lanPorts => {
                if (lanPorts && aLanPorts && aLanPorts.length > 0) {
                    aLanPorts.forEach(v => {
                        var idx = lanPorts.findIndex(e => e.lanPort == v.lanPort || (e.lanPort == 1 && !v.lanPort))
                        if (idx > -1)
                            lanPorts[idx].enablePort = v.enablePort
                    })
                    setLanPorts(options, slot, pon, onuId, lanPorts).then(onuIndex => {
                        return resolve(onuIndex)
                    })
                } else
                    return resolve(false)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function setWan(options, slot, pon, onuId, wanProfiles) {
    return new Promise((resolve, reject) => {
        try {
            gFunc.isValid(options, slot, pon, onuId).then(isValid => {
                if (isValid && slot && pon && onuId && wanProfiles && wanProfiles.length > 0) {
                    var header = snmp_fh.setWanHeader
                    var body = snmp_fh.setWanBody
                    header = header.split(' ')
                    header[159] = '01'
                    header[161] = slot.toHex(2)
                    header[163] = pon.toHex(2)
                    header[165] = onuId.toHex(2)        // ONU NUMBER / ONU Authorized No.  

                    var packSize = (body.split(' ').length * wanProfiles.length) + 58         // 58 = trecho que vai do tamanho do pacote (posições [122] e [123]) em header até o final
                    header[70] = packSize.toHex(4).slice(0, 2)  // Tamanho do sub-pacote
                    header[71] = packSize.toHex(4).slice(2, 4)  // Tamanho do sub-pacote
                    header[122] = header[70]
                    header[123] = header[71]

                    header[181] = wanProfiles.length.toHex(2)
                    header = header.join(' ')

                    var resp = header
                    wanProfiles.forEach(profile => {
                        var obj = { ...objStandart, ...profile }
                        obj.wanConnType = obj.wanConnType.toString()

                        var str = [...body].join('')
                        str = str.split(' ')

                        str[67] = modeTab[obj.wanMode.toLowerCase()] ? modeTab[obj.wanMode.toLowerCase()] : '64'                        // WAN_Mode: 00 = TR069, 01 = INTERNET, 02 = TR069_INTERNET, 03 = multicast, 04 = VOIP, 05 = VOIP_INTERNET, 07 = RADIUS, 08 = RADIUS_INTERNET, 64 = Other ; 
                        str[69] = (obj.wanConnType.toLowerCase() == 'bridge' || obj.wanConnType.toString() == '2') ? '00' : '01'        // WAN_Conn_Type: 00 = Bridge, 01 = Router   

                        str[70] = obj.wanVlan ? obj.wanVlan.toHex(4).slice(0, 2) : 'ff'                                                 // WAN_Vlan_Id (Obs.: ff ff  para vazio)   
                        str[71] = obj.wanVlan ? obj.wanVlan.toHex(4).slice(2, 4) : 'ff'

                        str[73] = obj.wanCos ? obj.wanCos.toHex(2) : '00'                                                               // WAN_Cos (Obs.: 00   padrão)

                        str[74] = obj.wanNat ? '01' : '00'                                                                              // WAN_NAT_Enable: 00 = Disable, 01 = Enable 
                        if (obj.wanMode.toLowerCase() == 'tr069')
                            str[74] = obj.wanNat = '00'    // Disable

                        str[76] = obj.ipMode.toLowerCase() == 'dhcp' ? '00' : obj.ipMode.toLowerCase() == 'static' ? '01' : obj.ipMode.toLowerCase() == 'pppoe' ? '02' : '00'                                         // WAN_D_S_P: 00 = DHCP, 01 = Static, 02 = PPPOE 

                        var ipAddress = obj.wanIp ? obj.wanIp : '0.0.0.0'
                        ipAddress = ipAddress.split('.')
                        str[77] = parseInt(ipAddress[0]).toHex(2)                   // Wan_Ip_Address: Ex.: c0 a8 02 03: 192.168.2.3   (default: 00)
                        str[78] = parseInt(ipAddress[1]).toHex(2)
                        str[79] = parseInt(ipAddress[2]).toHex(2)
                        str[80] = parseInt(ipAddress[3]).toHex(2)

                        var wanMask = obj.wanMask ? obj.wanMask : '128.0.0.0'
                        var wanMaskBin = (parseInt(wanMask.split('.')[0])).toString(2) + (parseInt(wanMask.split('.')[1])).toString(2) + (parseInt(wanMask.split('.')[2])).toString(2) + (parseInt(wanMask.split('.')[3])).toString(2)
                        str[84] = (wanMaskBin.split('1').length - 1).toString(16).padStart(2, '0')

                        var wanGateway = obj.wanGateway ? obj.wanGateway : '0.0.0.0'
                        wanGateway = wanGateway.split('.')
                        str[85] = parseInt(wanGateway[0]).toHex(2)                  // Wan_Gateway: Ex.: c0 a8 00 01: 192.168.0.1 ;
                        str[86] = parseInt(wanGateway[1]).toHex(2)
                        str[87] = parseInt(wanGateway[2]).toHex(2)
                        str[88] = parseInt(wanGateway[3]).toHex(2)

                        var wanMasterDNS = obj.wanMasterDNS ? obj.wanMasterDNS : '0.0.0.0'
                        wanMasterDNS = wanMasterDNS.split('.')
                        str[89] = parseInt(wanMasterDNS[0]).toHex(2)                // Wan_Master_DNS: Ex.: 08 08 08 08: 8.8.8.8 ;
                        str[90] = parseInt(wanMasterDNS[1]).toHex(2)
                        str[91] = parseInt(wanMasterDNS[2]).toHex(2)
                        str[92] = parseInt(wanMasterDNS[3]).toHex(2)

                        var wanSlaveDNS = obj.wanSlaveDNS ? obj.wanSlaveDNS : '0.0.0.0'
                        wanSlaveDNS = wanSlaveDNS.split('.')
                        str[93] = parseInt(wanSlaveDNS[0]).toHex(2)                 // Wan_Slave_DNS: Ex.: 04 04 04 04: 4.4.4.4 ;
                        str[94] = parseInt(wanSlaveDNS[1]).toHex(2)
                        str[95] = parseInt(wanSlaveDNS[2]).toHex(2)
                        str[96] = parseInt(wanSlaveDNS[3]).toHex(2)

                        str[97] = obj.pppoeProxy ? '01' : '00'

                        str.formatField(98, obj.pppoeUsername, '00', 32)            // WAN_PPPOE_Username     (default: 00)
                        str.formatField(130, obj.pppoePassword, '00', 32)           // WAN_PPPOE_Password     (default: 00)
                        str.formatField(162, obj.pppoeName, '00', 32)               // WAN_PPPOE_NAME         (default: 00)

                        str[195] = obj.pppoeMode == 'auto' ? '00' : '01'
                        str[196] = obj.wanQoS ? '01' : '00'

                        var lan = obj.lans
                        var lans = (lan.lan4 == true ? '1' : '0') + (lan.lan3 == true ? '1' : '0') + (lan.lan2 == true ? '1' : '0') + (lan.lan1 == true ? '1' : '0')
                        str[197] = parseInt(lans, 2).toHex(2)

                        var ssid = obj.ssids
                        var ssids = (ssid.ssid4 ? '1' : '0') + (ssid.ssid3 ? '1' : '0') + (ssid.ssid2 ? '1' : '0') + (ssid.ssid1 ? '1' : '0')
                        str[198] = parseInt(ssids, 2).toHex(2)

                        str[199] = obj.vlanMode.toLowerCase() == 'tag' ? '01' : '03'
                        str[200] = obj.translationValue && obj.vlanMode.toLowerCase() != 'tag' ? '01' : '00'   // 00 = desabilita 'Transalation State' e 01 = habilita 'Transalation State' (OBS.: para 'tag', desabilitar )

                        str[201] = obj.translationValue && obj.vlanMode.toLowerCase() != 'tag' ? obj.translationValue.toHex(4).slice(0, 2) : 'ff'                 // -- -- Translation Value (Obs.: ff ff  para vazio)   
                        str[202] = obj.translationValue && obj.vlanMode.toLowerCase() != 'tag' ? obj.translationValue.toHex(4).slice(2, 4) : 'ff'

                        str[204] = obj.cos ? (parseInt(obj.cos)).toString(16).padStart(2, '0') : '00'

                        str[205] = obj.qInQ ? '01' : '00'

                        str[206] = obj.tpid.toHex(4).slice(0, 2)
                        str[207] = obj.tpid.toHex(4).slice(2, 4)

                        str[208] = obj.svlan ? obj.svlan.toHex(4).slice(0, 2) : 'ff'
                        str[209] = obj.svlan ? obj.svlan.toHex(4).slice(2, 4) : 'ff'

                        str[210] = obj.svlanCos ? '00' : 'ff'
                        str[211] = obj.svlanCos ? obj.svlanCos.toHex(2) : 'ff'

                        str = str.join(' ')
                        resp = resp + ' ' + str
                    })

                    snmp_fh.sendSnmp(OID.setWan, resp, options, true).then(ret => {
                        snmp_fh.sendSnmp(OID.confirmSetWan, resp, options, true).then(retConfirm => {
                            return resolve(convertToOnuIndex(slot, pon, onuId))
                        })
                    })
                } else return resolve(false)
            }, error => {
                return resolve(false)
            })
        } catch (err) {
            return reject(err)
        }
    })
}


module.exports = {
    addAllOnus,
    addOnu,
    authenticateOnu,
    authorizeOnu,
    convertToOnuIndex,
    delOnu,
    delOnuByIndex,
    delOnuByMacAddress,
    delWan,
    enableLanPorts,
    getAuthorizedOnus,
    getBasicOnuInfo,
    getBasicOnuListByPon,
    getBasicOnuListByPonValenet,
    getLanPorts,
    getLanPortsEPON,
    getLanPortsGPON,
    getMacAddressList,
    getOnu,
    getOnuBandwidth,
    getOnuByIndex,
    getOnuDistance,
    getOnuIdList,
    getOnuIdListByPon,
    getOnuIndexList,
    getOnuLastOffTime,
    getOnuListByPon,
    getOnuOpticalPower,
    getOnuRxPowerListByPon,
    getOnuOpticalPowerList,
    getOnuType,
    getOnuUplinkInterface,
    getOnuWebAdmin,
    getRxPowerListByPon,
    getUnauthorizedOnus,
    getWan,
    parseOnuIndex,
    rebootOnu,
    setLanPorts,
    setLanPortsEPON,
    setLanPortsGPON,
    setOnuBandwidth,
    setOnuWebAdmin,
    setWan,
}
