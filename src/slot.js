const snmp = require('net-snmp')
const tables = require('./tables')
const oid_fh = require('./oid-fh')
const snmp_fh = require('./pack-fiberhome')
const card = require('./card')

const OID = oid_fh.OIDs

function getSlots(options) {
    var aSlots = []
    return new Promise((resolve, reject) => {
        snmp_fh.subtree(options, OID.getSlot).then(varbinds => {
            varbinds.forEach(onu => {
                aSlots.push(onu.value)
            })
            return resolve(aSlots)
        }, error => {
            console.error('Error: Unable to connect to OLT')
            return resolve(false)
        })
    })
}

function getSlotsInformationList(options) {
    return new Promise((resolve, reject) => {
        var aONUs = []
        snmp_fh.subtree(options, OID.getSlotsInformationList).then(varbinds => {
            varbinds.forEach((e, idx) => {
                if (e.oid.split('.')[13] == 2) {
                    aONUs.push({ slot: parseInt(e.oid.split('.')[14]), cardPresentStatus: e.value == 0 ? 'not present' : 'present', cardPresentStatusValue: e.value })
                } else {
                    var index = aONUs.findIndex(e => e.slot == varbinds[idx].oid.split('.')[14])
                    if (index > -1) {
                        if (e.oid.split('.')[13] == 3) {
                            aONUs[index].authorizedCardTypeValue = e.value
                            aONUs[index].authorizedCardType = tables.cardTypeCode[e.value]
                        } else if (e.oid.split('.')[13] == 4) {
                            aONUs[index].actualCardTypeValue = e.value
                            aONUs[index].actualCardType = tables.cardTypeCode[e.value]
                        }
                    }
                }

                if (idx == varbinds.length - 1) {
                    card.getCardList(options).then(cards => {
                        cards.forEach(card => {
                            var index = aONUs.findIndex(e => e.slot == card.slot)
                            if (index > -1)
                                aONUs[index].cardInformation = card
                        })
                        return resolve(aONUs)
                    })
                }
            })
        }, error => {
            console.error('Error: Unable to connect to OLT')
            return resolve(false)
        })
    })
}


module.exports = {
    getSlots,
    getSlotsInformationList
}
