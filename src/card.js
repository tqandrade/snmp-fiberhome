
const tables = require('./tables')
const oid_fh = require('./oid-fh')
const snmp_fh = require('./pack-fiberhome')


const OID = oid_fh.OIDs

function getCardList(options) {
    var aCards = []
    return new Promise((resolve, reject) => {
        snmp_fh.subtree(options, OID.getCardInformation).then(cards => {
            cards.forEach(card => {
                if (card.oid.split('.')[13] == 2) {
                    aCards.push({ slot: card.oid.split('.')[14], cardTypeValue: card.value, cardType: tables.cardTypeCode[card.value] })      // cardType 
                } else {
                    var idx = aCards.findIndex(e => e.slot == card.oid.split('.')[14])
                    if (idx > -1) {
                        if (card.oid.split('.')[13] == 3)
                            aCards[idx].hardwareVersion = card.value.toString()
                        else if (card.oid.split('.')[13] == 4)
                            aCards[idx].softwateVersion = card.value.toString()
                        else if (card.oid.split('.')[13] == 5) {
                            aCards[idx].cardStatusValue = card.value
                            aCards[idx].cardStatus = card.value == 1 ? 'normal' : card.value == 0 ? 'interrupted' : 'undefined'
                        } else if (card.oid.split('.')[13] == 6) {
                            aCards[idx].numberOfPorts = card.value
                        } else if (card.oid.split('.')[13] == 7) {
                            aCards[idx].availablePorts = card.value
                        } else if (card.oid.split('.')[13] == 8) {
                            aCards[idx].cpu = card.value / 100
                            aCards[idx].cpuUnit = '%'
                        } else if (card.oid.split('.')[13] == 9) {
                            aCards[idx].memory = card.value / 100
                            aCards[idx].memoryUnit = '%'
                        }
                    }
                }
            })
            return resolve(aCards)
        }, error => {
            console.error('Error: Unable to connect to OLT')
            return resolve(false)
        })
    })
}

function getCard(options, slot) {
    return new Promise((resolve, reject) => {
        getCardList(options).then(cards => {
            if (cards === false)
                return resolve(false)
            var idx = cards.findIndex(e => e.slot == slot)
            if (idx > -1) {
                return resolve(cards[idx])
            } else
                return resolve(false)
        }, error => {
            return resolve(false)
        })
    })
}


module.exports = {
    getCard,
    getCardList
}