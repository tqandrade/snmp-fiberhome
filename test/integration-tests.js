var tape = require('tape')
var _test = require('tape-promise').default
var test = _test(tape)

const fh = require('../snmp-fiberhome')
const env = require('./env')

// Deletando perfis WAN e desautorizando a ONU
test('Preparando ambiente:', async (t) => {
    await fh.getWan(env.options, env.onu.slot, env.onu.pon, env.onu.onuId).then(async (wanProfiles) => {
        // Preparando o ambiente para iniciar os testes em sequencia
        if (wanProfiles === false)
            t.true(true, "Ambiente OK")
        else
            if (wanProfiles.length > 0)
                await fh.delWan(env.options, env.onu.slot, env.onu.pon, env.onu.onuId).then(del => {
                    t.assert(del === true, "Perfis WAN deletados com sucesso")
                })
        await fh.delOnuByMacAddress(env.options, env.onu.macAddress).then(macAddress => {
            t.assert(env.onu.macAddress === macAddress, "ONU deletada com sucesso")
        })
    })
    t.end()
})

test('Adicionando ONU:', async (t) => {

})
