require('./src/prototype-functions')
const gFunc = require('./src/global-functions')
const olt = require('./src/olt')
const slot = require('./src/slot')
const card = require('./src/card')
const onu = require('./src/onu')


module.exports = {

    version: { SNMPv1: 0, SNMPv2c: 1, SNMPv3: 3 },

    // OLT
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
    delOnu: onu.delOnu,
    delOnuByIndex: onu.delOnuByIndex,
    delOnuByMacAddress: onu.delOnuByMacAddress,
    enableLanPorts: onu.enableLanPorts,
    getAuthorizedOnus: onu.getAuthorizedOnus,
    getBasicOnuInfo: onu.getBasicOnuInfo,
    getLanPorts: onu.getLanPorts,
    getMacAddressList: onu.getMacAddressList,
    getOnu: onu.getOnu,
    getOnuBandwidth: onu.getOnuBandwidth,
    getOnuByIndex: onu.getOnuByIndex,
    getOnuDistance: onu.getOnuDistance,
    getOnuIdList: onu.getOnuIdList,
    getOnuIndexList: onu.getOnuIndexList,
    getOnuLastOffTime: onu.getOnuLastOffTime,
    getOnuListByPon: onu.getOnuListByPon,
    getOnuOpticalPower: onu.getOnuOpticalPower,
    getOnuOpticalPowerList: onu.getOnuOpticalPowerList,
    getOnuUplinkInterface: onu.getOnuUplinkInterface,
    getOnuWebAdmin: onu.getOnuWebAdmin,
    getRxPowerListByPon: onu.getRxPowerListByPon,
    getUnauthorizedOnus: onu.getUnauthorizedOnus,
    parseOnuIndex: onu.parseOnuIndex,
    setLanPorts: onu.setLanPorts,
    setOnuBandwidth: onu.setOnuBandwidth,
    setOnuWebAdmin: onu.setOnuWebAdmin,
    setWan: onu.setWan,

    // Global Functions
    timeNow: gFunc.timeNow,
    diffTime: gFunc.diffTime,
    isValid: gFunc.isValid,
}
