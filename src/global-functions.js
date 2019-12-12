const oid_fh = require('./oid-fh')
const snmp_fh = require('./pack-fiberhome')

const OID = oid_fh.OIDs

function isValid(options, slot, pon, onuId, ignore) {
    return new Promise((resolve, reject) => {
        if (ignore)
            return resolve(true)
        try {
            if ((!slot && !pon && !onuId) || slot > 128 || pon > 128 || onuId > 128 || slot <= 0 || pon <= 0 || onuId <= 0) {
                if (options.enableWarnings)
                    console.error('Warning! Invalid parameters: slot:' + slot + ' pon:' + pon + ' ' + onuId)
                return resolve(false)
            } else if (slot && !pon && !onuId) {       // only slot
                snmp_fh.get(options, [OID.getSlot + '.' + slot]).then(ret => {
                    if (ret[0].value == slot)
                        return resolve(true)
                    if (options.enableWarnings)
                        console.error('Warning! slot ' + slot + ' not found')
                    return resolve(false)
                }, err => {
                    console.error('Error: Unable to connect to OLT')
                    return reject(err)
                })
            } else if (slot && pon && !onuId) { // only slot and pon
                var ponIndex = ((slot) * 2 ** 25) + ((pon) * 2 ** 19)
                snmp_fh.get(options, [OID.getPortName + '.' + ponIndex]).then(ret => {
                    if (ret[0].type == 4)
                        return resolve(true)
                    if (options.enableWarnings)
                        console.error('Warning! slot ' + slot + ' or pon ' + pon + ' not found')
                    return resolve(false)
                }, err => {
                    console.error('Error: Unable to connect to OLT')
                    return reject(err)
                })
            } else if (slot && pon && onuId) {  // all
                var ponIndex = ((slot) * 2 ** 25) + ((pon) * 2 ** 19) + ((onuId) * 2 ** 8)
                snmp_fh.get(options, [OID.getOnuStatus + '.' + ponIndex]).then(ret => {
                    if (ret[0].value == 1 || ret[0].value == 3)
                        return resolve(true)
                    if (options.enableWarnings)
                        console.error('Warning! slot ' + slot + ', pon ' + pon + ' or onuId ' + onuId + ' not found')
                    return resolve(false)
                }, err => {
                    console.error('Error: Unable to connect to OLT')
                    return reject(err)
                })
            }
        } catch (err) {
            return reject(err)
        }
    })
}

function timeNow() {
    return new Date().getHours().toString().padStart(2, 0) + ':' + new Date().getMinutes().toString().padStart(2, 0) + ':' + new Date().getSeconds().toString().padStart(2, 0) + ':' + new Date().getMilliseconds().toString().padStart(3, 0)
}

function diffTime(timeStart, timeEnd) {
    var date1 = new Date(2000, 0, 1, timeStart.split(':')[0], timeStart.split(':')[1], timeStart.split(':')[2], timeStart.split(':')[3])
    var date2 = new Date(2000, 0, 1, timeEnd.split(':')[0], timeEnd.split(':')[1], timeEnd.split(':')[2], timeEnd.split(':')[3])

    if (date2 < date1)
        date2.setDate(date2.getDate() + 1)

    var msec = date2 - date1
    var hh = Math.floor(msec / 1000 / 60 / 60)
    msec -= hh * 1000 * 60 * 60
    var mm = Math.floor(msec / 1000 / 60)
    msec -= mm * 1000 * 60
    var ss = Math.floor(msec / 1000)
    msec -= ss * 1000

    return hh.toString().padStart(2, 0) + ':' + mm.toString().padStart(2, 0) + ':' + ss.toString().padStart(2, 0) + '.' + msec.toString().padStart(3, 0)
}

function hexToDec(hexString) {   // Converter negativo/positivo hex para decimal
    hexString = ((hexString.charAt(1) != 'X' && hexString.charAt(1) != 'x') ? hexString = '0X' + hexString : hexString);
    hexString = (hexString.charAt(2) < 8 ? hexString = hexString - 0x00000000 : hexString = hexString - 0xFFFFFFFF - 1);
    return parseInt(hexString, 10);
}


module.exports = {
    isValid,
    timeNow,
    diffTime,
    hexToDec
}