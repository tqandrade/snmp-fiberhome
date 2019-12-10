
const tables = require('./tables')
const snmp_fh = require('./pack-fiberhome')
const oid_fh = require('./oid-fh')
const slot = require('./slot')
const gFunc = require('./global-functions')

const OID = oid_fh.OIDs

function convertToOnuIndex(slot, pon, onuId) {
    return (slot) * 2 ** 25 + (pon) * 2 ** 19 + (onuId) * 2 ** 8
}

function parsePonIndex(ponIndex) {
    var indexBin = (parseInt(ponIndex)).toString(2)
    var obj = {
        _ponIndex: ponIndex,
        slot: parseInt(indexBin.slice(-33, -25), 2),
        pon: parseInt(indexBin.slice(-25, -19), 2),
    }
    return obj
}

function getBasicPonPortList(options) {
    return new Promise((resolve, reject) => {
        try {
            var aPon = []
            var varbinds = []
            snmp_fh.subtree(options, OID.getPonPortList + '.4').then(varbinds4 => {
                varbinds.push(...varbinds4)
                snmp_fh.subtree(options, OID.getPonPortList + '.5').then(varbinds5 => {
                    varbinds.push(...varbinds5)
                    snmp_fh.subtree(options, OID.getPonPortList + '.12').then(varbinds12 => {
                        varbinds.push(...varbinds12)
                        varbinds.forEach((e, idx) => {
                            if (e.oid.split('.')[13] == 4) {
                                var objPortIndex = parsePonIndex(parseInt(e.oid.split('.')[14]))
                                aPon.push({ portIndex: objPortIndex._ponIndex, slot: objPortIndex.slot, pon: objPortIndex.pon, portEnableStatusValue: e.value, portEnableStatus: e.value == 1 ? 'enable' : e.value == 0 ? 'disable' : 'undefined' })
                            } else {
                                var index = aPon.findIndex(e => e.portIndex == varbinds[idx].oid.split('.')[14])
                                if (index > -1) {
                                    if (e.oid.split('.')[13] == 4) {
                                        aPon[index].portEnableStatusValue = e.value
                                        aPon[index].portEnableStatus = e.value == 1 ? 'enable' : e.value == 0 ? 'disable' : 'undefined'
                                    } else if (e.oid.split('.')[13] == 5) {
                                        aPon[index].portOnlineStatusValue = e.value
                                        aPon[index].portOnlineStatus = e.value == 1 ? 'online' : e.value == 0 ? 'offline' : 'undefined'
                                    } else if (e.oid.split('.')[13] == 12)
                                        aPon[index].authorizedOnus = e.value
                                }
                                if (idx == varbinds.length - 1)
                                    return resolve(aPon)
                            }
                        })
                    })
                })
            }, error => {
                console.error('Error: Unable to connect to OLT')
                return resolve(false)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function getPonPortList(options) {
    return new Promise((resolve, reject) => {
        try {
            var aPon = []
            var varbinds = []
            snmp_fh.subtree(options, OID.getPonPortList + '.1').then(varbinds1 => {
                varbinds.push(...varbinds1)
                snmp_fh.subtree(options, OID.getPonPortList + '.2').then(varbinds2 => {
                    varbinds.push(...varbinds2)
                    snmp_fh.subtree(options, OID.getPonPortList + '.3').then(varbinds3 => {
                        varbinds.push(...varbinds3)
                        snmp_fh.subtree(options, OID.getPonPortList + '.4').then(varbinds4 => {
                            varbinds.push(...varbinds4)
                            snmp_fh.subtree(options, OID.getPonPortList + '.5').then(varbinds5 => {
                                varbinds.push(...varbinds5)
                                snmp_fh.subtree(options, OID.getPonPortList + '.6').then(varbinds6 => {
                                    varbinds.push(...varbinds6)
                                    snmp_fh.subtree(options, OID.getPonPortList + '.12').then(varbinds12 => {
                                        varbinds.push(...varbinds12)
                                        snmp_fh.subtree(options, OID.getPonPortList + '.13').then(varbinds13 => {
                                            varbinds.push(...varbinds13)
                                            varbinds.forEach((e, idx) => {
                                                if (e.oid.split('.')[13] == 1) {
                                                    var objPortIndex = parsePonIndex(parseInt(e.oid.split('.')[14]))
                                                    aPon.push({ portIndex: objPortIndex._ponIndex, slot: objPortIndex.slot, pon: objPortIndex.pon, portTypeValue: e.value, portType: tables.portTypeCode[e.value] })
                                                } else {
                                                    var index = aPon.findIndex(e => e.portIndex == varbinds[idx].oid.split('.')[14])
                                                    if (index > -1) {
                                                        if (e.oid.split('.')[13] == 2)
                                                            aPon[index].portName = e.value.toString()
                                                        else if (e.oid.split('.')[13] == 3)
                                                            aPon[index].portDescription = e.value.toString()
                                                        else if (e.oid.split('.')[13] == 4) {
                                                            aPon[index].portEnableStatusValue = e.value
                                                            aPon[index].portEnableStatus = e.value == 1 ? 'enable' : e.value == 0 ? 'disable' : 'undefined'
                                                        } else if (e.oid.split('.')[13] == 5) {
                                                            aPon[index].portOnlineStatusValue = e.value
                                                            aPon[index].portOnlineStatus = e.value == 1 ? 'online' : e.value == 0 ? 'offline' : 'undefined'
                                                        } else if (e.oid.split('.')[13] == 6) {
                                                            aPon[index].portDownlinkRate = e.value
                                                            aPon[index].portDownlinkRateUnit = 'Mbit/s'
                                                        } else if (e.oid.split('.')[13] == 12)
                                                            aPon[index].authorizedOnus = e.value
                                                        else if (e.oid.split('.')[13] == 13) {
                                                            aPon[index].portUplinkRate = e.value
                                                            aPon[index].portUplinkRateUnit = 'Mbit/s'
                                                        }
                                                    }
                                                }
                                                if (idx == varbinds.length - 1)
                                                    return resolve(aPon)
                                            })
                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            }, error => {
                console.error('Error: Unable to connect to OLT')
                return resolve(false)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function getOltInformation(options) {
    return new Promise((resolve, reject) => {
        try {
            var olt = {}
            snmp_fh.subtree(options, OID.getOltBasicInformation).then(varbindsBasic => {
                varbindsBasic.forEach((e, idx) => {
                    if (e.oid.split('.')[7] == 1)
                        olt.alias = e.value.toString()
                    else if (e.oid.split('.')[7] == 2) {
                        olt.hardwareModel = tables.oltModels[e.value]
                        olt.oid = e.value
                    } else if (e.oid.split('.')[7] == 3) {
                        olt.systemRunningTime = e.value
                        olt.systemRunningTimeUnit = 'ms'
                    } else if (e.oid.split('.')[7] == 4)
                        olt.systemContact = e.value.toString()
                    else if (e.oid.split('.')[7] == 5)
                        olt.systemName = e.value.toString()
                    else if (e.oid.split('.')[7] == 6)
                        olt.systemLocation = e.value.toString()

                    if (idx == varbindsBasic.length - 1) {
                        snmp_fh.subtree(options, OID.getOltInformation).then(varbinds => {
                            varbinds.forEach((e, idx) => {
                                if (e.oid.split('.')[11] == 1)
                                    olt.ip = e.value
                                else if (e.oid.split('.')[11] == 2)
                                    olt.macAddress = e.value.toString()
                                else if (e.oid.split('.')[11] == 3)
                                    olt.softwareVersion = e.value.toString()
                                else if (e.oid.split('.')[11] == 4)
                                    olt.hardwareVersion = e.value.toString()
                                else if (e.oid.split('.')[11] == 5) {
                                    olt.temperature = e.value
                                    olt.temperatureUnit = '°C'
                                }

                                if (idx == varbinds.length - 1)
                                    getSubrackInformation(options).then(subrack => {
                                        olt.subrack = subrack
                                        slot.getSlots(options).then(slots => {
                                            olt.slots = slots
                                            return resolve(olt)
                                        })
                                    })
                            })
                        })
                    }
                })
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function getOltModel(options) {
    return new Promise((resolve, reject) => {
        try {
            snmp_fh.get(options, ['1.3.6.1.2.1.1.2.0']).then(data => {
                return resolve(tables.oltModels[data[0].value])
            }, error => {
                console.error('Error: Unable to connect to OLT')
                return resolve(false)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function getPonPort(options, slot, pon) {
    return new Promise((resolve, reject) => {
        try {
            gFunc.isValid(options, slot, pon).then(isValid => {
                if (isValid && slot && pon) {
                    var ponPort = null
                    portIndex = convertToOnuIndex(slot, pon, 0)
                    var oid = OID.getPonPortList
                    snmp_fh.get(options, [oid + '.1.' + portIndex, oid + '.2.' + portIndex, oid + '.3.' + portIndex, oid + '.4.' + portIndex, oid + '.5.' + portIndex, oid + '.6.' + portIndex, oid + '.12.' + portIndex, oid + '.13.' + portIndex,]).then(data => {
                        data.forEach((e, idx) => {
                            if (e.oid.split('.')[13] == 1) {
                                var objPortIndex = parsePonIndex(parseInt(e.oid.split('.')[14]))
                                ponPort = { portIndex: objPortIndex._ponIndex, slot: objPortIndex.slot, pon: objPortIndex.pon, portTypeValue: e.value, portType: tables.portTypeCode[e.value] }
                            } else if (e.oid.split('.')[13] == 2)
                                ponPort.portName = e.value.toString()
                            else if (e.oid.split('.')[13] == 3)
                                ponPort.portDescription = e.value.toString()
                            else if (e.oid.split('.')[13] == 4) {
                                ponPort.portEnableStatusValue = e.value
                                ponPort.portEnableStatus = e.value == 1 ? 'enable' : e.value == 0 ? 'disable' : 'undefined'
                            } else if (e.oid.split('.')[13] == 5) {
                                ponPort.portOnlineStatusValue = e.value
                                ponPort.portOnlineStatus = e.value == 1 ? 'online' : e.value == 0 ? 'offline' : 'undefined'
                            } else if (e.oid.split('.')[13] == 6) {
                                ponPort.portDownlinkRate = e.value
                                ponPort.portDownlinkRateUnit = 'Mbit/s'
                            } else if (e.oid.split('.')[13] == 12)
                                ponPort.authorizedOnus = e.value
                            else if (e.oid.split('.')[13] == 13) {
                                ponPort.portUplinkRate = e.value
                                ponPort.portUplinkRateUnit = 'Mbit/s'
                            }
                        })
                        return resolve(ponPort)
                    })
                } else return resolve(false)
            }, error => {
                console.error('Error: Unable to connect to OLT')
                return resolve(false)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function getSubrackInformation(options) {
    return new Promise((resolve, reject) => {
        try {
            var obj = {}
            snmp_fh.subtree(options, OID.getSubtrackInformation).then(varbinds => {
                varbinds.forEach(e => {
                    if (e.oid.split('.')[13] == 1)
                        obj.subrackIndex = e.value
                    else if (e.oid.split('.')[13] == 2)
                        obj.subrackType = tables.subrackType[e.value] || 'not found'
                    else if (e.oid.split('.')[13] == 3)
                        obj.subrackName = e.value.toString()
                    else if (e.oid.split('.')[13] == 4)
                        obj.totalSlotNumber = e.value
                })
                return resolve(obj)
            }, error => {
                console.error('Error: Unable to connect to OLT')
                return resolve(false)
            })
        } catch (err) {
            return reject(err)
        }
    })
}


module.exports = {
    getBasicPonPortList,
    getPonPortList,
    getOltInformation,
    getOltModel,
    getPonPort,
    getSubrackInformation
}
