
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
    multcast: '03',
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
    QinQ: false,
    tpid: 33024,
    svlan: false,
    svlanCos: false,
    lans: { lan1: true, lan2: true, lan3: true, lan4: true },
    ssids: { ssid1: true, ssid2: true, ssid3: true, ssid4: true }
}

function addAllOnus(options, profilesWan, vlans) {
    var queue = new Queue(1, 10000)
    var aAuthOnus = []
    return new Promise((resolve, reject) => {
        try {
            getUnauthorizedOnus(options).then(result => {
                if (result.length > 0) {
                    if (options.enableLogs)
                        console.log(`Unauthorized ONUs found: ${result.length} \nadd...`)
                    result.forEach(onu => {
                        queue.add(f => addOnu(options, onu, profilesWan, vlans)).then(onuAuth => {
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
            })
        } catch (err) {
            console.error(err.toString())
            return reject(err)
        }
    })
}

function addOnu(options, onu, profilesWan, vlans) {
    return new Promise((resolve, reject) => {
        setTimeout(t => {
            var onuForm = { slot: onu.slot, pon: onu.pon, macAddress: onu.macAddress }
            try {
                authenticateOnu(options, onu.slot, onu.pon, (onu.onuType && onu.onuType.code) || onu.onuTypeCode, onu.macAddress).then(ret => {
                    getBasicOnuInfo(options, onu.macAddress, onu.slot, onu.pon).then(onuAuth => {
                        if (onuAuth) {
                            if (profilesWan && profilesWan.length > 0) {
                                setWan(options, onuAuth.slot, onuAuth.pon, onuAuth.onuId, profilesWan).then(onuIndex => {
                                    if (vlans && vlans.length > 0)
                                        setLanPorts(options, onuAuth.slot, onuAuth.pon, onuAuth.onuId, vlans).then(onuIndex => {
                                            return resolve({ ...ret, ...onuForm, ...parseOnuIndex(onuIndex) })
                                        })
                                    else
                                        return resolve({ ...ret, ...onuForm, ...parseOnuIndex(onuIndex) })
                                })
                            } else if (vlans && vlans.length > 0) {
                                setLanPorts(options, onuAuth.slot, onuAuth.pon, onuAuth.onuId, vlans).then(onuIndex => {
                                    return resolve({ ...ret, ...onuForm, ...parseOnuIndex(onuIndex) })
                                })
                            } else {
                                return resolve({ _onuIndex: onuAuth.onuIndex, ...ret, ...onuForm, ...parseOnuIndex(onuAuth._onuIndex) })
                            }
                        } else
                            return reject('Erro: serial para a onu não foi encontrado na OLT: ' + JSON.stringify(onu))
                    })
                })
            } catch (excp) {
                console.error(excp.toString())
            }
        }, queueTime)
    })
}

function authenticateOnu(options, slot, pon, onuTypeCode, macAddress) {
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
            for (var i = 0; i < 12; i++)    // Serial
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
                        var hex = '' // Adicionando espeço em branco a cada 2 bytes
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
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function getOnu(options, slot, pon, onuId, toIgnore) {
    return new Promise((resolve, reject) => {
        try {
            var onuIndex = convertToOnuIndex(slot, pon, onuId)
            getOnuByIndex(options, onuIndex, toIgnore).then(onu => {
                return resolve(onu)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function getOnuByIndex(options, onuIndex, toIgnore) {
    if (!toIgnore)
        toIgnore = []
    return new Promise((resolve, reject) => {
        try {
            var onu = parseOnuIndex(onuIndex)
            gFunc.isValid(options, onu.slot, onu.pon, onu.onuId).then(isValid => {
                if (isValid && onuIndex) {
                    var oids = [OID.getOnuSlot, OID.getOnuPon, OID.getOnuId, OID.getOnuType, OID.getOnuIp, OID.getOnuSystemName, OID.getOnuLogicAuthId, OID.getOnuLogicAuthIdPass, OID.getOnuMacAddress, OID.getOnuStatus, OID.getOnuSoftwareVersion, OID.getOnuHardwareVersion, OID.getOnuFirmwareVersion, OID.getOnuRemoteRestart]
                    oids = oids.map(oid => oid + '.' + onuIndex)
                    snmp_fh.get(options, oids).then(data => {
                        olt.getOltModel(options).then(oltData => {
                            var oltModel = oltData.includes('5116') ? '5116' : oltData.includes('5516') ? '5516' : null
                            var onu = { _onuIndex: onuIndex }
                            // Formatando/convertendo os dados
                            data.forEach((o, idx) => {
                                if (o.oid.split('.')[12] == 2)                          // OID.getOnuSlot
                                    onu.slot = o.value
                                else if (o.oid.split('.')[12] == 3)                     // OID.getOnuPon
                                    onu.pon = o.value
                                else if (o.oid.split('.')[12] == 4)                     // OID.getOnuId
                                    onu.onuId = o.value
                                else if (o.oid.split('.')[12] == 5)                     // OID.getOnuType
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
                                    getOnuOpticalPower(options, onu.slot, onu.pon, onu.onuId, toIgnore.includes('getOnuOpticalPower')).then(opticalPower => {
                                        if (opticalPower)
                                            onu.opticalPower = opticalPower
                                        getOnuDistance(options, onu.slot, onu.pon, onu.onuId).then(distance => {
                                            onu.distance = distance
                                            getOnuUplinkInterface(options, onu.slot, onu.pon, onu.onuId, toIgnore.includes('getOnuUplinkInterface')).then(upLinkInterface => {
                                                if (upLinkInterface)
                                                    onu.upLinkInterface = upLinkInterface
                                                getOnuLastOffTime(options, onu.slot, onu.pon, onu.onuId).then(lastOffTime => {
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

function getBasicOnuInfo(options, serial, slot, pon) {
    return new Promise((resolve, reject) => {
        try {
            if (slot && pon) {    // Busca otimizada
                gFunc.isValid(options, slot, pon).then(isValid => {
                    if (isValid) {
                        var aOnuOID = []
                        for (var onuId = 1; onuId <= 128; ++onuId)
                            aOnuOID.push(OID.getOnuMacAddress + '.' + convertToOnuIndex(slot, pon, onuId).toString())
                        snmp_fh.get(options, aOnuOID).then(ret => {
                            var idx = ret.findIndex(e => (e.value && e.value.toString().toLowerCase()) == serial.toLowerCase())
                            if (idx > -1) {
                                var onuIndex = parseInt(ret[idx].oid.split(OID.getOnuMacAddress + '.')[1])
                                return resolve({ _onuIndex: onuIndex, ...parseOnuIndex(onuIndex), serial: ret[idx].value.toString() })
                            } else
                                return resolve(false)
                        })
                    } else return resolve(false)
                })
            } else {
                snmp_fh.subtree(options, OID.getOnuMacAddress).then(ret => {
                    var idx = ret.findIndex(e => (e.value && e.value.toString().toLowerCase()) == serial.toLowerCase())
                    if (idx > -1) {
                        var onuIndex = parseInt(ret[idx].oid.split(OID.getOnuMacAddress + '.')[1])
                        return resolve({ _onuIndex: onuIndex, ...parseOnuIndex(onuIndex), serial: ret[idx].value.toString() })
                    } else
                        return resolve(false)
                })
            }
        } catch (err) {
            return reject(err)
        }
    })
}

function getOnuDistance(options, slot, pon, onuId) {
    return new Promise((resolve, reject) => {
        try {
            setTimeout(t => {
                gFunc.isValid(options, slot, pon, onuId).then(isValid => {
                    if (isValid && slot && pon && onuId) {
                        var bgmp = snmp_fh.getDistance
                        bgmp = bgmp.split(' ')
                        bgmp[156] = slot.toHex(2)
                        bgmp[158] = pon.toHex(2)
                        bgmp[160] = onuId.toHex(2)  // ONU NUMBER / ONU Authorized No.  
                        bgmp = bgmp.join(' ')

                        snmp_fh.sendSnmp(OID.getOnuDistance, bgmp, options, true).then(ret => {
                            var hex = '' // Adicionando espeço em branco a cada 2 bytes
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
                })
            }, queueTime)
        } catch (err) {
            return reject(err)
        }
    })
}

function getOnuLastOffTime(options, slot, pon, onuId) {
    return new Promise((resolve, reject) => {
        try {
            setTimeout(t => {
                gFunc.isValid(options, slot, pon, onuId).then(isValid => {
                    if (isValid && slot && pon && onuId) {
                        var bgmp = snmp_fh.lastOffTime
                        bgmp = bgmp.split(' ')
                        bgmp[159] = '01'
                        bgmp[161] = slot.toHex(2)
                        bgmp[163] = pon.toHex(2)
                        bgmp[165] = onuId.toHex(2)
                        bgmp = bgmp.join(' ')
                        snmp_fh.sendSnmp(OID.getOnuLastOffTime, bgmp, options, true).then(ret => {
                            var hex = '' // Adicionando espeço em branco a cada 2 bytes
                            for (var i = 0; i < ret.length; i += 2)
                                hex += ret.substring(i, i + 2) + ' '
                            hex = hex.trim()

                            var value = hex.split('2b 06 01 04 01 ad 73 5b 01 16 03 01 01 1c 01 ')[1]
                            value = value.split(' ')
                            if (value[1] == '81')
                                value = value.splice(3)
                            else
                                value = value.splice(4)

                            var year = hexToInt(value.slice(184, 186).join('')).toString()
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
                })
            }, queueTime)
        } catch (err) {
            return reject(err)
        }
    })
}

function getOnuOpticalPower(options, slot, pon, onuId, ignore) {
    return new Promise((resolve, reject) => {
        try {
            if (ignore)
                return resolve(null)
            setTimeout(t => {
                gFunc.isValid(options, slot, pon, onuId).then(isValid => {
                    if (isValid && slot && pon && onuId) {
                        var bgmp = snmp_fh.signal
                        bgmp = bgmp.split(' ')
                        bgmp[157] = slot.toHex(2)
                        bgmp[159] = pon.toHex(2)
                        bgmp[161] = onuId.toHex(2)  // ONU NUMBER / ONU Authorized No.  
                        bgmp = bgmp.join(' ')
                        snmp_fh.sendSnmp(OID.getOnuOpticalPower, bgmp, options, true).then(ret => {
                            var hex = '' // Adicionando espeço em branco a cada 2 bytes
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
                })
            }, queueTime)
        } catch (err) {
            return reject(err)
        }
    })
}

function getOnuListByPon(options, slot, pon) {
    return new Promise((resolve, reject) => {
        try {
            var queue = new Queue(1, 10000)
            var list = []
            getRxPowerListByPon(options, slot, pon).then(aOnus => {
                if (aOnus)
                    aOnus.forEach((onu, idx) => {
                        queue.add(f => getOnu(options, onu.slot, onu.pon, onu.onuId, ['getOnuOpticalPower', 'getOnuUplinkInterface']).then(o => {
                            list.push({ ...onu, ...o })
                            if (queue.queue.length == 0)
                                return resolve(list)
                        }))
                    })
                else return resolve(false)
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
                    var hex = '' // Adicionando espeço em branco a cada 2 bytes
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
            }
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

function getOnuUplinkInterface(options, slot, pon, onuId, ignore) {
    return new Promise((resolve, reject) => {
        try {
            if (ignore)
                return resolve(null)
            gFunc.isValid(options, slot, pon, onuId).then(isValid => {
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
                                obj.portStatus = o.value == 1 ? 'enable' : o.value == 0 ? 'disable' : '-'
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
                    var hex = '' // Adicionando espeço em branco a cada 2 bytes
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
            } else
                return resolve([])
        })
    })
}

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
                        var hex = '' // Adicionando espeço em branco a cada 2 bytes
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
                        while (value[pos] != '00') {
                            aOnus.push({ _onuIndex: convertToOnuIndex(slot, pon, parseInt(value[pos])), slot, pon, onuId: parseInt(value[pos], 16), opticalRxPower: (hexToInt(value.slice(pos + 3, pos + 7).join('')) / 100).toFixed(2), opticalRxPowerUnit: 'dBm' })
                            pos += 8
                        }
                        snmp_fh.sendSnmp(OID.confirmListOpticalRxPowerByPon, bgmp, options, true).then(retConfirm => {
                            return resolve(aOnus)
                        })
                    })
                } else return resolve(false)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function getMacAddressList(options) {
    return new Promise((resolve, reject) => {
        try {
            snmp_fh.subtree(options, OID.getSerials).then(serialList => {
                var list = []
                serialList.forEach(e => {
                    list.push({ _onuIndex: parseInt(e.oid.split(OID.getSerials + '.')[1]), macOrSerial: e.value.toString() })
                })
                return resolve(list)
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
            }).catch(error => {
                return reject(JSON.stringify(error))
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
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function setOnuWebAdmin(options, slot, pon, onuId, aWebConfig) {
    return new Promise((resolve, reject) => {
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
            } else
                return resolve(false)
        })
    })
}

function setLanPorts(options, slot, pon, onuId, aLanPorts) {
    return new Promise((resolve, reject) => {
        try {
            gFunc.isValid(options, slot, pon, onuId).then(isValid => {
                if (isValid && slot && pon && onuId && aLanPorts && aLanPorts.length > 0) {
                    getLanPorts(options, slot, pon, onuId).then(respLanPorts => {
                        if (respLanPorts.length > 1) {
                            var aLan = [...respLanPorts]
                            aLanPorts.forEach(v => {
                                var idx = aLan.findIndex(e => e.lan == v.lan)
                                if (idx > -1) {
                                    aLan[idx].enable = true
                                    if (v.enable === false)
                                        aLan[idx].enable = false

                                    aLan[idx].vlans = []
                                    if (v.vlans && v.vlans.length > 0)
                                        aLan[idx].vlans = v.vlans

                                    aLan[idx].vlansHex = []
                                    if (v.vlans && v.vlans.length > 0)
                                        v.vlans.forEach(vlan => {
                                            var bodyLan = snmp_fh.bodyLan
                                            bodyLan = bodyLan.split(' ')
                                            var vlanNum = null
                                            if (vlan.tag) {
                                                bodyLan[4] = `01`
                                                if ((vlan.tag < 1 || vlan.tag > 4085) && (options.enableWarnings))
                                                    console.error('Warning! setLanPorts(): Invalid values for vlan tag. Values must be in the range 1 to 4085. The limit value has been set.')
                                                if (vlan.tag < 1)
                                                    vlanNum = 1
                                                if (vlan.tag > 4085)
                                                    vlanNum = 4085

                                                vlanNum = vlan.tag.toHex(4)
                                            } else if (vlan.transparent) {
                                                bodyLan[4] = `03`
                                                if ((vlan.transparent < 1 || vlan.transparent > 4085) && (options.enableWarnings))
                                                    console.error('Warning! setLanPorts(): Invalid values for vlan transparent. Values must be in the range 1 to 4085. The limit value has been set.')
                                                if (vlan.transparent < 1)
                                                    vlanNum = 1
                                                if (vlan.transparent > 4085)
                                                    vlanNum = 4085
                                                vlanNum = vlan.transparent.toHex(4)
                                            } else {
                                                if (options.enableWarnings)
                                                    console.error('Warning! setLanPorts(): "transparent" or "tag" modes not found ". Ignoring config: ' + JSON.stringify(v))
                                                return
                                            }

                                            bodyLan[7] = vlanNum.slice(0, 2)
                                            bodyLan[8] = vlanNum.slice(2, 4)
                                            bodyLan[9] = vlan.cos && vlan.cos >= 0 && vlan.cos < 8 ? vlan.cos.toHex(2) : 'ff'

                                            if (vlan.cos < 0)
                                                bodyLan[9] = '00'
                                            if (vlan.cos > 7)
                                                bodyLan[9] = '07'
                                            if (options.enableWarnings && (vlan.cos < 0 || vlan.cos > 7))
                                                console.error('Warning! setLanPorts(): Invalid values for "cos". Values must be in the range 0 to 7. The limit value has been set.')

                                            bodyLan = bodyLan.join(' ')

                                            aLan[idx].vlansHex.push(bodyLan)
                                        })
                                }
                            })
                            var lans = ''
                            aLan.forEach(l => {
                                if (!l.vlansHex)
                                    l.vlansHex = []

                                // Header LAN
                                var headerLan = snmp_fh.headerLan
                                var headerLength = ((snmp_fh.headerLan.split(' ').length - 2) + (snmp_fh.bodyLan.split(' ').length * l.vlansHex.length) + snmp_fh.footerLan.split(' ').length).toHex(4)
                                headerLan = headerLan.split(' ')
                                headerLan[0] = headerLength.slice(0, 2)                 // Tamanho do sub-pacote 
                                headerLan[1] = headerLength.slice(2, 4)
                                headerLan[2] = l.lan.toHex(2)                           // numero da porta lan
                                headerLan[3] = l.enable === false ? '02' : '01'        // '01' = habilita / '02' = desabilita a porta lan
                                headerLan[9] = l.vlansHex.length.toHex(2)               // Quantidade de vlans na lan1
                                headerLan = headerLan.join(' ')
                                lans += headerLan + ' '

                                // Body loop
                                l.vlansHex.forEach(lan => {
                                    lans += lan + ' '
                                })

                                // footer
                                lans += snmp_fh.footerLan + ' '
                            })

                            lans = lans.trim()

                            // Header package
                            var headerLanPorts = snmp_fh.headerLanPorts
                            headerLanPorts = headerLanPorts.split(' ')
                            var packSize = lans.split(' ').length + 39          // 39 = trecho que vai do tamanho do pacote (posições [122] e [123]) em headerLanPorts até o final
                            headerLanPorts[70] = packSize.toHex(4).slice(0, 2)  // Tamanho do sub-pacote
                            headerLanPorts[71] = packSize.toHex(4).slice(2, 4)  // Tamanho do sub-pacote
                            headerLanPorts[122] = headerLanPorts[70]
                            headerLanPorts[123] = headerLanPorts[71]
                            headerLanPorts[156] = slot.toHex(2)
                            headerLanPorts[158] = pon.toHex(2)
                            headerLanPorts[160] = onuId.toHex(2)                // ONU NUMBER / ONU Authorized No.  
                            headerLanPorts[162] = respLanPorts.length.toHex(2)  // Quantidade de lans

                            headerLanPorts = headerLanPorts.join(' ')
                            lans = headerLanPorts + ' ' + lans
                            snmp_fh.sendSnmp(OID.setLanPorts, lans, options, true).then(ret => {
                                snmp_fh.sendSnmp(OID.confirmSetLanPorts, lans, options, true).then(retConfirm => {
                                    return resolve(convertToOnuIndex(slot, pon, onuId))
                                })
                            })

                        } else {    // ONU com uma única porta LAN. (bridge?)

                            var OID_Value = ''
                            var lans = ''

                            var aLan = [...respLanPorts]
                            // Body -  permitir add somente da lan: 1 ou !lan
                            aLanPorts.forEach(v => {
                                if (!v.lan || v.lan != 1)
                                    return

                                var idx = aLan.findIndex(e => e.lan == v.lan)
                                if (idx > -1) {
                                    if (v.vlans && v.vlans.length > 0)
                                        aLan[idx].enable = true
                                    if (v.enable === false)
                                        aLan[idx].enable = false

                                    aLan[idx].vlans = []
                                    if (v.vlans && v.vlans.length > 0)
                                        aLan[idx].vlans = v.vlans

                                    aLan[idx].vlansHex = []
                                    v.vlans.forEach(vlan => {
                                        var bodyLan = snmp_fh.bodyLan
                                        bodyLan = bodyLan.split(' ')
                                        var vlanNum = null
                                        if (vlan.tag) {
                                            bodyLan[4] = `01`
                                            if ((vlan.tag < 1 || vlan.tag > 4085) && (options.enableWarnings))
                                                console.error('Warning! setLanPorts(): Invalid values for vlan tag. Values must be in the range 1 to 4085. The limit value has been set.')
                                            if (vlan.tag < 1)
                                                vlanNum = 1
                                            if (vlan.tag > 4085)
                                                vlanNum = 4085

                                            vlanNum = vlan.tag.toHex(4)
                                        } else if (vlan.transparent) {
                                            bodyLan[4] = `03`
                                            if ((vlan.transparent < 1 || vlan.transparent > 4085) && (options.enableWarnings))
                                                console.error('Warning! setLanPorts(): Invalid values for vlan transparent. Values must be in the range 1 to 4085. The limit value has been set.')
                                            if (vlan.transparent < 1)
                                                vlanNum = 1
                                            if (vlan.transparent > 4085)
                                                vlanNum = 4085
                                            vlanNum = vlan.transparent.toHex(4)
                                        } else {
                                            if (options.enableWarnings)
                                                console.error('Warning! setLanPorts(): "transparent" or "tag" modes not found ". Ignoring config: ' + JSON.stringify(v))
                                            return
                                        }

                                        bodyLan[7] = vlanNum.slice(0, 2)
                                        bodyLan[8] = vlanNum.slice(2, 4)
                                        bodyLan[9] = vlan.cos && vlan.cos >= 0 && vlan.cos < 8 ? vlan.cos.toHex(2) : 'ff'

                                        if (vlan.cos < 0)
                                            bodyLan[9] = '00'
                                        if (vlan.cos > 7)
                                            bodyLan[9] = '07'
                                        if (options.enableWarnings && (vlan.cos < 0 || vlan.cos > 7))
                                            console.error('Warning! setLanPorts(): Invalid values for "cos". Values must be in the range 0 to 7. The limit value has been set.')

                                        bodyLan = bodyLan.join(' ')

                                        aLan[idx].vlansHex.push(bodyLan)
                                        lans += bodyLan + ' '
                                    })
                                }
                            })

                            // Header Lan
                            aLan.forEach(l => {
                                var headerLan = snmp_fh.headerLan
                                var headerLength = ((snmp_fh.headerLan.split(' ').length - 2) + (lans.trim().split(' ').length) + snmp_fh.footerLan.split(' ').length).toHex(4)
                                headerLan = headerLan.split(' ')
                                headerLan[0] = headerLength.slice(0, 2)                 // Tamanho do sub-pacote 
                                headerLan[1] = headerLength.slice(2, 4)
                                headerLan[2] = l.lan.toHex(2)                           // numero da porta lan
                                headerLan[3] = l.enable === false ? '02' : '01'         // '01' = habilita / '02' = desabilita a porta lan
                                headerLan[9] = l.vlansHex.length.toHex(2)               // Quantidade de vlans na lan1
                                headerLan = headerLan.join(' ')
                                lans = headerLan + ' ' + lans.trim() + ' '

                                // Footer
                                var footer = snmp_fh.footerLan
                                lans += footer.trim()
                            })

                            lans = lans.trim()

                            // Header package
                            var headerLanPorts = snmp_fh.headerLanPorts
                            headerLanPorts = headerLanPorts.split(' ')
                            var packSize = lans.split(' ').length + 39          // 39 = trecho que vai do tamanho do pacote (posições [122] e [123]) em headerLanPorts até o final
                            headerLanPorts[70] = packSize.toHex(4).slice(0, 2)  // Tamanho do sub-pacote
                            headerLanPorts[71] = packSize.toHex(4).slice(2, 4)  // Tamanho do sub-pacote
                            headerLanPorts[122] = headerLanPorts[70]
                            headerLanPorts[123] = headerLanPorts[71]
                            headerLanPorts[156] = slot.toHex(2)
                            headerLanPorts[158] = pon.toHex(2)
                            headerLanPorts[160] = onuId.toHex(2)                // ONU NUMBER / ONU Authorized No.  
                            headerLanPorts[162] = '01'                          // Quantidade de vlans

                            headerLanPorts = headerLanPorts.join(' ')
                            OID_Value = headerLanPorts + ' ' + lans.trim()
                            snmp_fh.sendSnmp(OID.setLanPorts, OID_Value, options, true).then(ret => {
                                snmp_fh.sendSnmp(OID.confirmSetLanPorts, OID_Value, options, true).then(retConfirm => {
                                    return resolve(convertToOnuIndex(slot, pon, onuId))
                                })
                            })
                        }
                    })
                } else return resolve(false)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function getLanPorts(options, slot, pon, onuId) {
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
                            var hex = '' // Adicionando espeço em branco a cada 2 bytes
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

                            for (var idx = 0; idx < numLanPorts; ++idx) {
                                var headerLan = bodyLans.slice(0, 10)
                                bodyLans = bodyLans.slice(10)
                                var lan = null

                                if (headerLan[3] == '01')   // '01' enable, '02' disabled
                                    lan = { lan: parseInt(headerLan[2]), enable: true, vlans: [] }
                                else
                                    lan = { lan: parseInt(headerLan[2]), enable: false, vlans: [] }

                                for (var i = 0; i < parseInt(headerLan[9]); ++i) {
                                    var profile = {}
                                    var bodyLan = bodyLans.slice(0, 84)
                                    var vLan = parseInt(bodyLan[7] + bodyLan[8], 16)
                                    if (bodyLan[4] == '03')
                                        profile.transparent = vLan
                                    else if (bodyLan[4] == '01')
                                        profile.tag = vLan

                                    if (bodyLan[9] != 'ff')
                                        profile.cos = parseInt(bodyLan[9], 16)

                                    lan.vlans.push(profile)

                                    bodyLans = bodyLans.slice(84)
                                }
                                resp.push(lan)
                                var footerLans = bodyLans.slice(0, 30)
                                bodyLans = bodyLans.slice(30)
                            }
                            return resolve(resp)
                        })
                    })
                } else return resolve(false)
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
                        var idx = lanPorts.findIndex(e => e.lan == v.lan || (e.lan == 1 && !v.lan))
                        if (idx > -1)
                            lanPorts[idx].enable = v.enable
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

function setWan(options, slot, pon, onuId, profilesWan) {
    return new Promise((resolve, reject) => {
        try {
            gFunc.isValid(options, slot, pon, onuId).then(isValid => {
                if (isValid && slot && pon && onuId && profilesWan && profilesWan.length > 0) {
                    var header = snmp_fh.setWanHeader
                    var body = snmp_fh.setWanBody
                    header = header.split(' ')
                    header[159] = '01'
                    header[161] = slot.toHex(2)
                    header[163] = pon.toHex(2)
                    header[165] = onuId.toHex(2)        // ONU NUMBER / ONU Authorized No.  

                    var packSize = (body.split(' ').length * profilesWan.length) + 58         // 58 = trecho que vai do tamanho do pacote (posições [122] e [123]) em header até o final
                    header[70] = packSize.toHex(4).slice(0, 2)  // Tamanho do sub-pacote
                    header[71] = packSize.toHex(4).slice(2, 4)  // Tamanho do sub-pacote
                    header[122] = header[70]
                    header[123] = header[71]

                    header[181] = profilesWan.length.toHex(2)
                    header = header.join(' ')

                    var resp = header
                    profilesWan.forEach(profile => {
                        var obj = { ...objStandart, ...profile }
                        obj.wanConnType = obj.wanConnType.toString()

                        var str = [...body].join('')
                        str = str.split(' ')

                        str[67] = modeTab[obj.wanMode.toLowerCase()] ? modeTab[obj.wanMode.toLowerCase()] : '64'                        // WAN_Mode: 00 = TR069, 01 INTERNET, 02 = TR069_INTERNET, 03 = multcast, 04 = VOIP, 05 = VOIP_INTERNET, 07 = RADIUS, 08 = RADIUS_INTERNET, 64 = Other ; 
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

                        str[205] = obj.QinQ ? '01' : '00'

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
    delOnu,
    delOnuByIndex,
    delOnuByMacAddress,
    enableLanPorts,
    getAuthorizedOnus,
    getBasicOnuInfo,
    getLanPorts,
    getMacAddressList,
    getOnu,
    getOnuBandwidth,
    getOnuByIndex,
    getOnuDistance,
    getOnuIdList,
    getOnuIndexList,
    getOnuLastOffTime,
    getOnuListByPon,
    //getOnuListBySlot,   // falied
    getOnuOpticalPower,
    getOnuOpticalPowerList,
    getOnuUplinkInterface,
    getOnuWebAdmin,
    getRxPowerListByPon,
    getUnauthorizedOnus,
    parseOnuIndex,
    setLanPorts,
    setOnuBandwidth,
    setOnuWebAdmin,
    setWan,
}
