
const OIDs = {

    // OLT
    getOltBasicInformation: "1.3.6.1.2.1.1",
    getOltInformation: "1.3.6.1.4.1.5875.800.3.9.4",

    // SLOT
    getPonPortList: "1.3.6.1.4.1.5875.800.3.9.3.4.1",
    getSlot: "1.3.6.1.4.1.5875.800.3.101.1.1.1",
    getSlotsInformationList: "1.3.6.1.4.1.5875.800.3.9.5.1.1",
    getSubtrackInformation: "1.3.6.1.4.1.5875.800.3.9.1.1.1",

    // CARD
    getCardInformation: "1.3.6.1.4.1.5875.800.3.9.2.1.1",
    getPortName: "1.3.6.1.4.1.5875.800.3.9.3.4.1.2",

    // ONU
    confirmGetOnusBySlot: '1.3.6.1.4.1.5875.91.1.13.3.1.1.6.2',
    confirmGetOnuWebAdmin: '1.3.6.1.4.1.5875.91.1.22.1.1.1.37.2',
    confirmListOpticalRxPowerByPon: "1.3.6.1.4.1.5875.91.1.21.3.1.1.4.2",
    confirmGetOnuOpticalPower: "1.3.6.1.4.1.5875.91.1.22.3.1.1.6.2",
    delOnuByMacAddress: '1.3.6.1.4.1.5875.91.1.13.1.1.1.4.1',
    confirmDelOnuByMacAddress: '1.3.6.1.4.1.5875.91.1.13.1.1.1.4.2',
    getAuth: "1.3.6.1.4.1.5875.800.3.10.1.1",
    getOnuIdListByPon: '1.3.6.1.4.1.5875.91.1.1.1.1.1.23.1',
    confirmGetOnuIdListByPon: '1.3.6.1.4.1.5875.91.1.1.1.1.1.23.2',
    getOnuBandwidth: '1.3.6.1.4.1.5875.91.1.6.1.1.1.40.1',
    getOnuFirmwareVersion: "1.3.6.1.4.1.5875.800.3.10.1.1.14",
    getOnuHardwareVersion: "1.3.6.1.4.1.5875.800.3.10.1.1.13",
    getOnuId: "1.3.6.1.4.1.5875.800.3.10.1.1.4",
    getOnuIp: "1.3.6.1.4.1.5875.800.3.10.1.1.6",
    getOnuLastOffTime: "1.3.6.1.4.1.5875.91.1.22.3.1.1.28.1",
    getOnuLogicAuthId: "1.3.6.1.4.1.5875.800.3.10.1.1.8",
    getOnuLogicAuthIdPass: "1.3.6.1.4.1.5875.800.3.10.1.1.9",
    getOnuMacAddress: "1.3.6.1.4.1.5875.800.3.10.1.1.10",
    getOnuPon: "1.3.6.1.4.1.5875.800.3.10.1.1.3",
    getOnuRemoteRestart: "1.3.6.1.4.1.5875.800.3.10.1.1.15",
    getOnuListBySlot: '1.3.6.1.4.1.5875.91.1.13.3.1.1.6.1', // todo
    getOnuIdList: "1.3.6.1.4.1.5875.800.3.10.1.1.4",
    getOnuIndexList: "1.3.6.1.4.1.5875.800.3.101.2.1.1",
    getOnuSlot: "1.3.6.1.4.1.5875.800.3.10.1.1.2",
    getOnuSoftwareVersion: "1.3.6.1.4.1.5875.800.3.10.1.1.12",
    getOnuStatus: "1.3.6.1.4.1.5875.800.3.10.1.1.11",
    getOnuSystemName: "1.3.6.1.4.1.5875.800.3.10.1.1.7",
    getOnuType: "1.3.6.1.4.1.5875.800.3.10.1.1.5",
    getOnuWebAdmin: '1.3.6.1.4.1.5875.91.1.22.1.1.1.37.1',
    getRxPowerListByPon: "1.3.6.1.4.1.5875.91.1.21.3.1.1.4.1",
    getSerials: "1.3.6.1.4.1.5875.800.3.10.1.1.10",
    getOnuOpticalPower: "1.3.6.1.4.1.5875.91.1.22.3.1.1.6.1",
    getOnuRxPowerListByPon: "1.3.6.1.4.1.5875.91.1.21.3.1.1.4.1",
    confirmGetOnuRxPowerListByPon: "1.3.6.1.4.1.5875.91.1.21.3.1.1.4.2",
    getUnauth: "1.3.6.1.4.1.5875.800.3.11.1.1",
    confirmGetOnuDistance: "1.3.6.1.4.1.5875.91.1.6.3.1.1.7.2",
    confirmGetOnuLastOffTime: "1.3.6.1.4.1.5875.91.1.22.3.1.1.28.2",
    getOnuDistance: "1.3.6.1.4.1.5875.91.1.6.3.1.1.7.1",
    onuGetUplinkInterfaceDownlinkRate: "1.3.6.1.4.1.5875.800.3.9.3.3.1.5",
    onuGetUplinkInterfacePortDescription: "1.3.6.1.4.1.5875.800.3.9.3.3.1.3",
    onuGetUplinkInterfacePortName: "1.3.6.1.4.1.5875.800.3.9.3.3.1.2",
    onuGetUplinkInterfacePortStatus: "1.3.6.1.4.1.5875.800.3.9.3.3.1.4",
    onuGetUplinkInterfacePortType: "1.3.6.1.4.1.5875.800.3.9.3.3.1.1",
    onuGetUplinkInterfaceUplinkRate: "1.3.6.1.4.1.5875.800.3.9.3.3.1.12",
    setAuth: "1.3.6.1.4.1.5875.91.1.13.1.1.1.3.1",
    confirmSetAuth: "1.3.6.1.4.1.5875.91.1.13.1.1.1.3.2",
    setLanPorts: "1.3.6.1.4.1.5875.91.1.8.1.1.1.5.1",
    confirmSetLanPorts: "1.3.6.1.4.1.5875.91.1.8.1.1.1.5.2",
    setLanPortsEPON: "1.3.6.1.4.1.5875.91.1.8.1.1.1.6.1",
    confirmSetLanPortsEPON: "1.3.6.1.4.1.5875.91.1.8.1.1.1.6.2",
    setOnuBandwidth: '1.3.6.1.4.1.5875.91.1.6.1.1.1.40.1',
    confirmSetOnuBandwidth: '1.3.6.1.4.1.5875.91.1.6.1.1.1.40.2',
    setWan: '1.3.6.1.4.1.5875.91.1.8.1.1.1.13.1',
    confirmSetWan: '1.3.6.1.4.1.5875.91.1.8.1.1.1.13.2',
    rebootOnu: '1.3.6.1.4.1.5875.91.1.6.2.1.1.6.1'
}

/* Válido para números de tamanho máx. == 16383 em decimal */
function oidDecodeHexToInt(hexValue) {
    var hex = hexValue.replaceAll(' ', '')
    var bin = (parseInt(hex, 16).toString(2)).padStart(8, '0')
    bin = bin.split('')
    bin[0] = '0'
    for (var i = 8; i >= 0; --i)
        bin[i] = bin[i - 1]
    bin = bin.join('')
    var dec = parseInt(bin, 2)
    return dec
}

/* Válido para números de tamanho máx. == 16383 em decimal */
function oidEncodeIntToHex(intValue) {
    var bin = null
    if (intValue > 0 && intValue <= 127) {
        bin = ("00000000" + (intValue.toString(2))).slice(-8)
        hex = parseInt(bin, 2).toHex(2)
    } else if (intValue > 127 && intValue <= 16383) {
        bin = ("0000000000000000" + (intValue.toString(2))).slice(-16)
        bin = bin.split('')
        for (var i = 0; i < 8; ++i)
            bin[i] = bin[i + 1]

        bin[8] = '0'
        bin[0] = '1'
        bin = bin.join('')
        hex = ("0000" + parseInt(bin.slice(0, 8), 2).toString(16) + parseInt(bin.slice(8, 16), 2).toString(16)).slice(-4)
    } else if (intValue > 16383 && intValue <= 2097151) {
        bin = ("000000000000000000000000" + (intValue.toString(2))).slice(-24)
        //TODO: implementar
    } else {
        //console.log("Erro: O tamanho do número", intValue, " em 'oidEncodeIntToHex', não é suportado. Valor máximo: 2097151 ")
        return null
    }
    return hex
}

function oidEncodeStrToHex(oidStr) {
    var hex = ''
    var oid = oidStr.split('.')
    if (oid[0] == parseInt(1) && oid[1] == parseInt(3)) {
        oid.splice(0, 2)        // remove
        hex = '2b'              // 2b = 1.3
    }
    oid.forEach(e => {
        hex += oidEncodeIntToHex(parseInt(e))
    })
    return hex
}


module.exports = {
    OIDs,
    oidEncodeStrToHex,
    oidEncodeIntToHex,
    oidDecodeHexToInt
}
