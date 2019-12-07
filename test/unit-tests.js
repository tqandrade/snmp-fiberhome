var tape = require('tape')
var _test = require('tape-promise').default
var test = _test(tape)

const fh = require('../snmp-fiberhome')
const env = require('./env')

var numRand1 = Math.floor(Math.random() * 2000) + 256

// ONU deve estar autorizada na OLT para realizar os teste a seguir:

test('isValid():', async (t) => {
    await fh.isValid(env.options).then(ret => {
        t.assert(ret === false, "Vazio")
    })
    await fh.isValid(env.options, 99, 99, 99).then(ret => {
        t.assert(ret === false, "Não encontrou SLOT, PON e ONUID")
    })
    await fh.isValid(env.options, 99, 99).then(ret => {
        t.assert(ret === false, "Não encontrou SLOT e PON")
    })
    await fh.isValid(env.options, 99).then(ret => {
        t.assert(ret === false, "Não encontrou SLOT")
    })
    await fh.isValid(env.options, env.onu.slot, env.onu.pon, env.onu.onuId).then(ret => {
        t.assert(ret === true, "Encontrou SLOT, PON e ONUID")
    })
    await fh.isValid(env.options, env.onu.slot, env.onu.pon).then(ret => {
        t.assert(ret === true, "Encontrou SLOT e PON")
    })
    await fh.isValid(env.options, env.onu.slot).then(ret => {
        t.assert(ret === true, "Encontrou SLOT")
    })
    t.end()
})

test('convertToOnuIndex():', async (t) => {
    t.assert(fh.convertToOnuIndex(11, 1, 1) === 369623296, "Retornou o esperado")
    t.end()
})

test('setOnuWebAdmin():', async (t) => {
    await fh.setOnuWebAdmin(env.options, env.onu.slot, env.onu.pon, env.onu.onuId, [
        { username: 'user1', password: numRand1.toString(), group: 'admin' },
    ]).then(config => {
        t.true(config, "Retornou o esperado")
        t.end()
    })
})

test('OLT functions:', async (t) => {
    await fh.getOltModel(env.options).then(onuModel => {
        t.assert(onuModel === 'An5516-01', "getOltModel(): Retornou o esperado")
    })
    if (false) await fh.getOltModel({ ...env.options, ip: "1.2.3.4" }).then(onuModel => {
        t.false(onuModel, "getOltModel(): Retornou 'false'")
    })
    await fh.getSubrackInformation(env.options).then(info => {
        t.deepEqual(info, {
            subrackIndex: 1,
            subrackName: 'AN5516-06',
            subrackType: 'An5516-06',
            totalSlotNumber: 14
        }, "getSubrackInformation(): Retornou o esperado")
    })
    await fh.getPonPort(env.options, env.onu.slot, env.onu.pon).then(ponPort => {
        ponPort.authorizedOnus = null
        ponPort.portOnlineStatus = null
        ponPort.portOnlineStatusValue = null

        t.deepEqual(ponPort, {
            authorizedOnus: null,
            portDescription: "PON 11/1",
            slot: 11,
            pon: 1,
            portDownlinkRate: 2500,
            portDownlinkRateUnit: "Mbit/s",
            portEnableStatus: "enable",
            portEnableStatusValue: 1,
            portIndex: 369623040,
            portName: "PON 11/1",
            portOnlineStatus: null,
            portOnlineStatusValue: null,
            portType: "PON",
            portTypeValue: 1,
            portUplinkRate: 1250,
            portUplinkRateUnit: "Mbit/s"
        }, "getPonPort(): Retornou o esperado")
    })
    await fh.getSlots(env.options).then(slots => {
        t.deepEqual(slots, [11, 16, 19, 20], "getSlots(): Retornou o esperado")
    })
    t.end()
})

test('getBasicOnuInfo():', async (t) => {
    await fh.getBasicOnuInfo(env.options, env.onu.macAddress).then(onu => {
        t.deepEqual(onu, {
            _onuIndex: fh.convertToOnuIndex(env.onu.slot, env.onu.pon, env.onu.onuId),
            slot: env.onu.slot,
            pon: env.onu.pon,
            onuId: env.onu.onuId,
            macAddress: env.onu.macAddress
        }, "Retornou o esperado")
    })
    t.end()
})

test('getOnuWebAdmin():', async (t) => {
    await fh.getOnuWebAdmin(env.options, env.onu.slot, env.onu.pon, env.onu.onuId).then(profiles => {
        t.deepEqual(profiles, [
            {
                group: 'admin',
                groupValue: 2,
                webUsername: 'user1',
                webPassword: numRand1.toString()
            }
        ], "Retornou o esperado")
        t.end()
    })
})

test('getOnuDistance():', async (t) => {
    await fh.getOnuDistance(env.options, env.onu.slot, env.onu.pon, env.onu.onuId).then(onu => {
        t.deepEqual(onu, {
            _onuIndex: fh.convertToOnuIndex(env.onu.slot, env.onu.pon, env.onu.onuId),
            value: '0.229',
            unit: 'km'
        }, "Retornou o esperado")
        t.end()
    })
})