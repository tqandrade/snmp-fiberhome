require('./src/prototype-functions')
const gFunc = require('./src/global-functions')
const olt = require('./src/olt')
const slot = require('./src/slot')
const card = require('./src/card')
const onu = require('./src/onu')


module.exports = {

    version: { SNMPv1: 0, SNMPv2c: 1, SNMPv3: 3 },

    // OLT
    getBasicPonPortList: olt.getBasicPonPortList,
    getOltInformation: olt.getOltInformation,
    getOltModel: olt.getOltModel,
    getPonPort: olt.getPonPort,
    getPonPortList: olt.getPonPortList,
    getSubrackInformation: olt.getSubrackInformation,

    // SLOT
    getSlots: slot.getSlots,
    getSlotsInformationList: slot.getSlotsInformationList,

    // CARD
    getCard: card.getCard,
    getCardList: card.getCardList,

    // ONU
    addAllOnus: onu.addAllOnus,
    addOnu: onu.addOnu,
    authenticateOnu: onu.authenticateOnu,
    authorizeOnu: onu.authorizeOnu,
    convertToOnuIndex: onu.convertToOnuIndex,
    delOnu: onu.delOnu,
    delOnuByIndex: onu.delOnuByIndex,
    delOnuByMacAddress: onu.delOnuByMacAddress,
    delWan: onu.delWan,
    enableLanPorts: onu.enableLanPorts,
    getAuthorizedOnus: onu.getAuthorizedOnus,
    getBasicOnuInfo: onu.getBasicOnuInfo,
    getBasicOnuListByPon: onu.getBasicOnuListByPon,
    getBasicOnuListByPonValenet: onu.getBasicOnuListByPonValenet,
    getLanPorts: onu.getLanPorts,
    getLanPortsEPON: onu.getLanPortsEPON,
    getLanPortsGPON: onu.getLanPortsGPON,
    getMacAddressList: onu.getMacAddressList,
    getOnu: onu.getOnu,
    getOnuBandwidth: onu.getOnuBandwidth,
    getOnuByIndex: onu.getOnuByIndex,
    getOnuDistance: onu.getOnuDistance,
    getOnuIdList: onu.getOnuIdList,
    getOnuIdListByPon: onu.getOnuIdListByPon,
    getOnuIndexList: onu.getOnuIndexList,
    getOnuLastOffTime: onu.getOnuLastOffTime,
    getOnuListByPon: onu.getOnuListByPon,
    getOnuOpticalPower: onu.getOnuOpticalPower,
    getOnuRxPowerListByPon: onu.getOnuRxPowerListByPon,
    getOnuOpticalPowerList: onu.getOnuOpticalPowerList,
    getOnuType: onu.getOnuType,
    getOnuUplinkInterface: onu.getOnuUplinkInterface,
    getOnuWebAdmin: onu.getOnuWebAdmin,
    getUnauthorizedOnus: onu.getUnauthorizedOnus,
    getWan: onu.getWan,
    parseOnuIndex: onu.parseOnuIndex,
    rebootOnu: onu.rebootOnu,
    setLanPorts: onu.setLanPorts,
    setLanPortsEPON: onu.setLanPortsEPON,
    setLanPortsGPON: onu.setLanPortsGPON,
    setOnuBandwidth: onu.setOnuBandwidth,
    setOnuWebAdmin: onu.setOnuWebAdmin,
    setWan: onu.setWan,

    // Global Functions
    timeNow: gFunc.timeNow,
    diffTime: gFunc.diffTime,
    isValid: gFunc.isValid,
}
