var tape = require('tape')
var _test = require('tape-promise').default
var test = _test(tape)

const fh = require('../snmp-fiberhome')
const env = require('./env')

var numRand1 = Math.floor(Math.random() * 2000) + 256
var numRand2 = Math.floor(Math.random() * 2000) + 256

// Deletando perfis WAN e desautorizando a ONU
test('Preparando ambiente:', async (t) => {
    await fh.getWan(env.options, env.onu.slot, env.onu.pon, env.onu.onuId).then(async (wanProfiles) => {
        // Preparando o ambiente para iniciar os testes em sequencia
        if (wanProfiles === false) {
            t.true(true, "Ambiente OK")
            t.end()
            execTests()
        } else {
            if (wanProfiles.length > 0)
                await fh.delWan(env.options, env.onu.slot, env.onu.pon, env.onu.onuId).then(del => {
                    t.assert(del === true, "Perfis WAN deletados com sucesso")
                })
            await fh.delOnuByMacAddress(env.options, env.onu.macAddress).then(macAddress => {
                t.assert(env.onu.macAddress === macAddress, "ONU deletada com sucesso")
                console.log("\nReinicie o teste")
            })
        }
    })
})

function execTests() {

    test('addAllOnus():', async (t) => {
        await fh.addAllOnus(env.options,
            [
                { wanMode: 'internet', wanConnType: 'router', wanVlan: 2001, ipMode: 'pppoe', translationValue: 2000, svlan: 2000 },
                { wanMode: 'tr069', wanConnType: 'router', wanVlan: 2002, ipMode: 'dhcp', translationValue: 2000, svlan: 3000 }
            ],
            [
                { lanPort: 1, vlans: [{ vlanMode: 'transparent', cvlanId: 2001 }, { vlanMode: 'tag', cvlanId: 3011, cos: 3 }] },
                { lanPort: 2, enablePort: false }
            ]
        ).then(authOnuList => {
            t.deepEqual(authOnuList, [
                {
                    _onuIndex: 369623296,
                    slot: env.onu.slot,
                    pon: env.onu.pon,
                    onuId: env.onu.onuId,
                    macAddress: env.onu.macAddress,
                    onuType: {
                        category: 'SFU',
                        code: 785,
                        mode: 'bridge',
                        model: 'AN5506-01-A1',
                        type: 'GPON'
                    }
                }
            ], "Retornou o esperado")
        })
        t.end()
    })

    test('getWan():', async (t) => {
        await fh.getWan(env.options, env.onu.slot, env.onu.pon, env.onu.onuId).then(wans => {
            t.deepEqual(wans, [
                {
                    _wanIndex: 1,
                    cos: null,
                    ipMode: "pppoe",
                    lan: { lan1: true, lan2: true, lan3: true, lan4: true },
                    pppoeMode: "auto",
                    pppoeName: "",
                    pppoePassword: "",
                    pppoeProxy: false,
                    pppoeUsername: "",
                    qInQ: false,
                    ssid: { ssid1: true, ssid2: true, ssid3: true, ssid4: true },
                    svlan: 2000,
                    svlanCos: null,
                    tpid: 33024,
                    translationValue: 2000,
                    vlanMode: "transparent",
                    wanConnType: "router",
                    wanCos: 0,
                    wanGateway: "0.0.0.0",
                    wanIp: "0.0.0.0",
                    wanMask: "128.0.0.0",
                    wanMasterDNS: "0.0.0.0",
                    wanMode: "internet",
                    wanName: "1_INTERNET_R_VID_2001",
                    wanNat: true,
                    wanQoS: false,
                    wanSlaveDNS: "0.0.0.0",
                    wanVlan: 2001
                },
                {
                    _wanIndex: 2,
                    cos: null,
                    ipMode: "dhcp",
                    lan: { lan1: false, lan2: false, lan3: false, lan4: false },
                    pppoeMode: "auto",
                    pppoeName: "",
                    pppoePassword: "",
                    pppoeProxy: false,
                    pppoeUsername: "",
                    qInQ: false,
                    ssid: { ssid1: false, ssid2: false, ssid3: false, ssid4: false },
                    svlan: 3000,
                    svlanCos: null,
                    tpid: 33024,
                    translationValue: 2000,
                    vlanMode: "transparent",
                    wanConnType: "router",
                    wanCos: 0,
                    wanGateway: "0.0.0.0",
                    wanIp: "0.0.0.0",
                    wanMask: "128.0.0.0",
                    wanMasterDNS: "0.0.0.0",
                    wanMode: "tr069",
                    wanName: "2_TR069_R_VID_2002",
                    wanNat: false,
                    wanQoS: false,
                    wanSlaveDNS: "0.0.0.0",
                    wanVlan: 2002,
                }
            ], "Retornou o esperado")
            t.end()
        })
    })

    test('enableLanPorts():', async (t) => {
        await fh.enableLanPorts(env.options, env.onu.slot, env.onu.pon, env.onu.onuId,
            [
                { lanPort: 1, enablePort: false }
            ]
        ).then(onuIndex => {
            t.assert(fh.convertToOnuIndex(env.onu.slot, env.onu.pon, env.onu.onuId) === onuIndex)
            t.end()
        })
    })

    test('getLanPorts():', async (t) => {
        await fh.getLanPorts(env.options, env.onu.slot, env.onu.pon, env.onu.onuId).then(lanPorts => {
            t.deepEqual(lanPorts, [{
                enablePort: false,
                lanPort: 1,
                lanSettings: {
                    autoNegotiation: { auto: true, portSpeed: "1000M", duplex: "full" },
                    boardwidthSet: { upstreamMin: 640, upstreamMax: 1000000, downstream: 1000000 },
                    flowControl: false,
                    igmpUpCvlan: { id: null, tpId: 33024, cos: null },
                    igmpUpSvlan: { id: null, tpId: 33024, cos: null }
                },
                vlans: [{
                    cos: null,
                    cvlanId: 2001,
                    qInQ: false,
                    serviceType: "unicast",
                    tls: false,
                    tpId: 33024,
                    translation: false,
                    vlanMode: "transparent",
                },
                {
                    cos: 3,
                    cvlanId: 3011,
                    qInQ: false,
                    serviceType: "unicast",
                    tls: false,
                    tpId: 33024,
                    translation: false,
                    vlanMode: "tag"
                }]

            }], "Retornou o esperado")
            t.end()
        })
    })

    test('getOnu():', async (t) => {
        await fh.getOnu(env.options, env.onu.slot, env.onu.pon, env.onu.onuId).then(onu => {
            console.log(onu)
            t.true(true, "Verificar!")
            t.end()
        })
    })

    test('setOnuBandwidth():', async (t) => {
        await fh.setOnuBandwidth(env.options, env.onu.slot, env.onu.pon, env.onu.onuId, numRand1, numRand2).then(onuIndex => {
            t.assert(fh.convertToOnuIndex(env.onu.slot, env.onu.pon, env.onu.onuId) === onuIndex, "Retornou o esperado")
            t.end()
        })
    })

    test('getOnuBandwidth():', async (t) => {
        await fh.getOnuBandwidth(env.options, env.onu.slot, env.onu.pon, env.onu.onuId).then(onu => {
            t.deepEqual(onu, {
                _onuIndex: fh.convertToOnuIndex(env.onu.slot, env.onu.pon, env.onu.onuId),
                slot: env.onu.slot,
                pon: env.onu.pon,
                onuId: env.onu.onuId,
                upBw: numRand1,
                downBw: numRand2,
                bandwidthUnit: 'Kbit/s'
            }, "Retornou o esperado")
            t.end()
        })
    })

    test('getOnuIndexList():', async (t) => {
        await fh.getOnuIndexList(env.options).then(onuList => {
            t.true((onuList && onuList.length > 0 && onuList.includes(fh.convertToOnuIndex(env.onu.slot, env.onu.pon, env.onu.onuId))), "Retornou o esperado")
            t.end()
        })
    })

    test('getOnuType():', async (t) => {
        await fh.getOnuType(env.options, env.onu.slot, env.onu.pon, env.onu.onuId).then(onu => {
            t.deepEqual(onu, {
                category: 'SFU',
                code: 785,
                mode: 'bridge',
                model: 'AN5506-01-A1',
                type: 'GPON'
            }, "Retornou o esperado")
            t.end()
        })
    })

    test('getOnuUplinkInterface():', async (t) => {
        await fh.getOnuUplinkInterface(env.options, env.onu.slot, env.onu.pon, env.onu.onuId).then(onu => {
            t.deepEqual(onu, {
                downlinkRate: 2500,
                downlinkRateUnit: 'Mbit/s',
                portDescription: 'PON 11/1/1',
                portName: 'PON 11/1/1',
                portStatus: 'disable',
                portStatusValue: 0,
                portType: 1,
                uplinkRate: 1250,
                uplinkRateUnit: 'Mbit/s'
            }, "Retornou o esperado")
            t.end()
        })
    })

    // Deletando perfis WAN e desautorizando a ONU
    if (false) test('Limpando ambiente:', async (t) => {
        await fh.getWan(env.options, env.onu.slot, env.onu.pon, env.onu.onuId).then(async (wanProfiles) => {
            // Preparando o ambiente para iniciar os testes em sequencia
            if (wanProfiles === false) {
                t.true(true, "Ambiente OK")
                execTests()
            } else {
                if (wanProfiles.length > 0)
                    await fh.delWan(env.options, env.onu.slot, env.onu.pon, env.onu.onuId).then(del => {
                        t.assert(del === true, "Perfis WAN deletados com sucesso")
                    })
                await fh.delOnu(env.options, env.onu.slot, env.onu.pon, env.onu.onuId).then(macAddress => {
                    t.assert(env.onu.macAddress === macAddress, "ONU deletada com sucesso")
                    console.log("\nAmbiente OK")
                })
            }
            t.end()
        })
    })
}

function delay(time) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve()
        }, time)
    })
}