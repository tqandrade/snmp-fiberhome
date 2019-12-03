var tape = require('tape')
var _test = require('tape-promise').default
var test = _test(tape)

const fh = require('../snmp-fiberhome')
const env = require('./env')


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