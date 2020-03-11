
const dgram = require("dgram")
const oid_fh = require('./oid-fh')
const snmp = require('net-snmp')

var version = {
    SNMPv1: 0,
    SNMPv2c: 1,
    SNMPv3: 3
}

const defaultOptions = {
    ip: null,
    community: null,
    port: 161,
    retries: 4,
    timeout: 2000,
    transport: "udp4",
    trapPort: 162,
    version: version.SNMPv2c,
    idBitsSize: 16,
    maxRepetitions: 200,
    enableWarnings: false,
    enableLogs: false
    
}

var dataType = {
    Sequence: '30',
    GetResponsePDU: 'a0',
    GetResponsePDU: 'a2',
    SetRequestPDU: 'a3',
    Integer: '02',
    OctetString: '04',
    Null: '05',
    ObjectIdentifier: '06'
}

const auth = '42 47 4d 50 01 00 00 00 00 00 00 21 00 15 5d a2 a8 6c 00 00 00 00 00 00 00 00 cc cc cc cc 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 00 00 00 01 00 00 00 01 00 00 00 80 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 80 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 -- -- -- -- -- -- -- -- -- -- -- -- 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 0b 00 02 02 fa ff ff 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00'  // Protocolo para Autorização da ONU
const signal = '42 47 4d 50 01 00 00 00 00 00 00 a1 00 15 5d a2 a8 6c 00 00 00 00 00 00 00 00 cc cc cc cc 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 00 00 00 01 00 00 00 26 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 26 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 0b 00 01 00 01'    // Protocolo para obtenção e confirmação do sinal
const getDistance = '42 47 4d 50 01 00 00 00 00 00 00 e1 00 15 5d a2 a8 04 00 00 00 00 00 00 00 00 cc cc cc cc 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 00 00 00 01 00 00 00 25 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 25 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 -- 00 -- 00 --'   // Protocolo para obtenção da distância
const lastOffTime = '42 47 4d 50 01 00 00 00 00 00 00 78 00 15 5d a2 a8 04 00 00 00 00 00 00 00 00 cc cc cc cc 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 00 00 00 01 00 00 00 38 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 38 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 -- 00 -- 00 -- 00 -- 00 00 00 00 00 00 00 00 00 00 00 00 00 00'  // Protocolo para obtenção e confirmação do LastOffTime
const allOpticalPower = '42 47 4d 50 01 00 00 00 00 00 00 eb 00 15 5d a2 a8 04 00 00 00 00 00 00 00 00 cc cc cc cc 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 00 00 00 01 00 00 00 24 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 24 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 -- 00 --'
const headerLanPorts = '42 47 4d 50 01 00 00 00 00 00 00 36 00 15 5d a2 a8 6c 00 00 00 00 00 00 00 00 cc cc cc cc 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 00 00 00 01 00 00 00 01 00 00 -- -- 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 -- -- 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 -- 00 -- 00 -- 00 --'
const headerLan = '-- -- -- 01 01 01 01 00 00 --'
const headerLanEPON = '-- -- -- 01 01 01 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 --'
const bodyLan = '00 52 00 -- -- 81 00 -- -- -- 00 81 00 ff ff ff 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 81 00 ff ff ff 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00'
const bodyLanEPON = '00 66 00 00 03 81 00 ff ff ff 00 81 00 ff ff ff 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 81 00 ff ff ff 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 02 80 00 01 86 a0 00 00 02 80 00 00 02 80 00 00 00 00'
const footerLan = '00 00 02 80 00 0f 42 40 00 0f 42 40 00 00 ff ff ff 81 00 ff ff ff 81 00 00 00 00 00 00 00'
const footerLanEPON = '00 00 ff ff ff 81 00 ff ff ff 81 00 00 00 00 00 00 00'
const setWanHeader = '42 47 4d 50 01 00 00 00 00 00 00 59 00 15 5d a2 a8 6c 00 00 00 00 00 00 00 00 cc cc cc cc 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 00 00 00 01 00 00 00 01 00 00 -- -- 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 -- -- 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 -- 00 -- 00 -- 00 -- 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 --'
const setWanBody = 'ff ff 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 -- 00 -- -- -- 00 -- -- 00 -- -- -- -- -- 00 00 00 ?? -- -- -- -- -- -- -- -- -- -- -- -- 00 -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- |- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- |- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 00 00 00 -- -- -- -- -- -- 00 -- 00 -- -- -- -- -- -- 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00'
const getOnuListBySlot = '42 47 4d 50 01 00 00 00 00 00 00 2c 00 15 5d a2 a8 6c 00 00 00 00 00 00 00 00 cc cc cc cc 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 00 00 00 01 00 00 00 38 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 38 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 00 -- ff ff ff ff 00 00 00 00 00 00 00 00 00 00 00 00 00 00'
const bodySetOnuWebAdmin = '00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 -- 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00'
const headerSetOnuWebAdmin = '42 47 4d 50 01 00 00 00 00 00 00 8f 00 15 5d a2 a8 6c 00 00 00 00 00 00 00 00 cc cc cc cc 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 00 00 00 01 00 00 00 01 00 00 -- -- 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 -- -- 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 00 -- 00 -- 00 -- 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 --'
const getOnuWebAdmin = '42 47 4d 50 01 00 00 00 00 00 00 dc 00 15 5d a2 a8 6c 00 00 00 00 00 00 00 00 cc cc cc cc 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 00 00 00 01 00 00 00 38 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 38 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 00 -- 00 -- 00 -- 00 00 00 00 00 00 00 00 00 00 00 00 00 00'
const setOnuBandwidth = '42 47 4d 50 01 00 00 00 00 00 00 fb 00 15 5d a2 a8 6c 00 00 00 00 00 00 00 00 cc cc cc cc 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 00 00 00 01 00 00 00 01 00 00 00 60 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 60 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 00 0b 00 01 00 02 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 07 d0 00 00 07 d1 00 ff 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00'
const getOnuBandwidth = '42 47 4d 50 01 00 00 00 00 00 00 df 00 15 5d a2 a8 6c 00 00 00 00 00 00 00 00 cc cc cc cc 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 00 00 00 01 00 00 00 38 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 38 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 00 0b 00 01 00 02 00 00 00 00 00 00 00 00 00 00 00 00 00 00'
const delOnuByMacAddress = '42 47 4d 50 01 00 00 00 00 00 00 ec 00 15 5d a2 a8 6c 00 00 00 00 00 00 00 00 cc cc cc cc 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 00 00 00 01 00 00 00 01 00 00 00 68 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 68 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 46 48 54 54 30 39 31 34 64 30 34 38 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00'
const getLanPorts = '42 47 4d 50 01 00 00 00 00 00 00 cb 00 15 5d a2 a8 6c 00 00 00 00 00 00 00 00 cc cc cc cc 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 00 00 00 01 00 00 00 25 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 25 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 -- 00 -- 00 --'
const rebootOnu = '42 47 4d 50 01 00 00 00 00 00 00 f2 00 15 5d a2 a8 6c 00 00 00 00 00 00 00 00 cc cc cc cc 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 00 00 00 01 00 00 00 01 00 00 00 30 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 30 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 -- 00 -- 00 -- 00 01 00 00 00 00 00 00 00 00'
const getOnuIdListByPon = '42 47 4d 50 01 00 00 00 00 00 00 b3 00 15 5d a2 a8 7f 00 00 00 00 00 00 00 00 cc cc cc cc 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 00 00 00 01 00 00 00 3a 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 3a 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 00 03 00 02 ff ff ff ff 00 00 00 00 00 00 00 00 00 00 00 00 00 00'
const getOnuRxPowerListByPon = '42 47 4d 50 01 00 00 00 00 00 00 16 00 15 5d a2 a8 7f 00 00 00 00 00 00 00 00 cc cc cc cc 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 00 00 00 01 00 00 00 24 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 24 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 -- 00 --'

function createPackage(objSNMP, requestId = 6189) {
    // se tam. total do pacote <= 255, entao: 81 XY     ; onde XY é o inteiro de 1 bytes convertidos para hex. que representa o tam. do pacote - 3 (head)
    // se tam. total do pacote > 255, entao:  82 XY ZW  ; onde XY ZW é o inteiro de 2 bytes convertidos para hex. que representa o tam. do pacote - 3 (head)       

    /* Calculando tamanho dos sub pacotes */
    var packageSize = 0
    objSNMP.pdu.varbindList.size = 0
    objSNMP.pdu.varbindList.forEach(varbind => {
        var varbindSize = 0
        varbind.value.size = varbind.value.value.replaceAll(' ', '').split('').length / 2
        varbindSize += varbind.value.size

        if (varbind.value.size > 255)
            varbindSize += 1   // Acrescimo(no cabeçalho) de 1 byte na representação do tamanho do sub pacote

        // head varbind value
        varbindSize += /*04:*/1 + /*0x8? e TAM_value_bytes*/2
        varbindSize += /*06:*/1 + /*TAM_OID_bytes:*/1 + /*OID_bytes:*/(parseInt(varbind.OID.value.replaceAll(' ', '').split('').length) / 2)
        varbind.size = varbindSize

        if (varbind.size > 255)
            varbindSize += 1

        // Head varbind
        varbindSize +=/*type:*/1 + /*0x8? e TAM_value_bytes:*/2
        objSNMP.pdu.varbindList.size += varbindSize
    })

    // Head varbind list
    packageSize = objSNMP.pdu.varbindList.size
    if (objSNMP.pdu.varbindList.size > 255)
        packageSize += 1

    packageSize += /*Value:*/ /*type:*/1 + /*0x8? e TAM_value_bytes:*/2
    requestIdHex = requestId.toHex(4)

    /* Tamanho total do pacote */
    packageSize +=  /*requiredId: type | size | bytes */1 + 1 + (parseInt(requestIdHex.split('').length) / 2) + /*erro + erro_index*/6
    objSNMP.pdu.size = packageSize

    if (objSNMP.pdu.size > 255)
        packageSize += 1

    // Head PDU 
    packageSize += /*pdu:*//*type:*/1 + /*0x8? e TAM_value_bytes:*/2
    packageSize += /*version:*/3 + /*community: type | size | bytes */1 + 1 + (parseInt(objSNMP.community.strToHex().replaceAll(' ', '').split('').length) / 2)
    objSNMP.size = packageSize

    if (objSNMP.size > 255)
        ++packageSize

    // Head package
    packageSize += /*type:*/1 + /*0x8? e TAM_value_bytes:*/2

    /* Construcao do pacote SNMP */
    var raw = ''
    raw += `${dataType.Sequence} `

    if (objSNMP.size > 255)
        raw += `82 ${objSNMP.size.toHex(4)} `
    else
        raw += `81 ${objSNMP.size.toHex(2)} `

    raw += `${dataType.Integer} 01 ${version.SNMPv2c.toHex(2)} `    // VERSION: <tipo> | <tamanho> | <versao>
    raw += `${dataType.OctetString} ${(objSNMP.community.strToHex().replaceAll(' ', '').split('').length / 2).toHex(2)} ${objSNMP.community.strToHex()}`       // COMMUNITY: <tipo> | <tamanho> | <community>

    // PDU:  
    raw += `${dataType.SetRequestPDU} `
    if (objSNMP.pdu.size > 255)
        raw += `82 ${objSNMP.pdu.size.toHex(4)} `
    else
        raw += `81 ${objSNMP.pdu.size.toHex(2)} `

    // <tipo> | <tamanho> 
    raw += `${dataType.Integer} ${("00" + requestIdHex.split('').length / 2).slice(-2)} ${requestIdHex} `   // Request ID: <tipo> | <tamanho> | <valor>
    raw += `${dataType.Integer} 01 00 `                                                                     // Error: <tipo> | <tamanho> | <valor>
    raw += `${dataType.Integer} 01 00 `                                                                     // Error Idx: <tipo> | <tamanho> | <valor>

    // VARBIND LIST
    raw += `${dataType.Sequence} `
    if (objSNMP.pdu.varbindList.size > 255)
        raw += `82 ${objSNMP.pdu.varbindList.size.toHex(4)} `
    else
        raw += `81 ${objSNMP.pdu.varbindList.size.toHex(2)} `

    // VARBIND 0..n:
    objSNMP.pdu.varbindList.forEach(varbind => {
        raw += `${dataType.Sequence} `
        if (objSNMP.pdu.varbindList.size > 255)
            raw += `82 ${varbind.size.toHex(4)} `
        else
            raw += `81 ${varbind.size.toHex(2)} `

        // VARBIND n: Type
        if (!varbind.type) { // Padrao: ObjectIdentifier
            raw += `${dataType.ObjectIdentifier} `
            raw += `${(varbind.OID.value.replaceAll(' ', '').split('').length / 2).toHex(2)} `
            raw += `${varbind.OID.value} `               // 15 = Quantidade de nós na OID 1.3.6.1.4.1.5875.91.1.13.1.1.1.2.1
        } else {
            // TODO: Verificar tipo e construir objeto
        }

        // VARBIND n: Value
        raw += `${dataType.OctetString} `
        if (varbind.value.size > 255)
            raw += `82 ${varbind.value.size.toHex(4)} `
        else
            raw += `81 ${varbind.value.size.toHex(2)} `

        raw += varbind.value.value
    })
    raw = raw.replaceAll(' ', '')
    return raw
}

function sendSnmp(oid, value, opt, waitResponse = false) {
    return new Promise((resolve, reject) => {
        var options = { ...defaultOptions, ...opt }
        var client = dgram.createSocket("udp4")
        var objSNMP = {
            version: version.SNMPv2c.toHex(2),
            community: options.community,
            pdu: {
                type: dataType.SetRequestPDU,
                requestId: 6189,    // Número aleatório ('18 2d'),
                varbindList: [{
                    OID: {
                        type: dataType.ObjectIdentifier,
                        value: oid_fh.oidEncodeStrToHex(oid)
                    },
                    value: {
                        type: dataType.OctetString,
                        value: value
                    }
                }]
            }
        }
        var package = createPackage(objSNMP)
        var packageFormated = Buffer.from(package.replaceAll(' ', ''), "hex")
        client.once("message", function (msg, rinfo) {
            client.close()
            if (waitResponse)
                return resolve(msg.toString("hex"))

        })
        client.once("err", function (err) {
            //console.log("client error: \n" + err.stack)
            client.close()
        })

        client.once("close", function () {
            //console.log("closed.")
        })
        client.send(packageFormated, 0, packageFormated.length, options.port, options.ip || options.host, function (err, bytes) {
            if (!waitResponse)
                return resolve(true)
        })
    })
}

function subtree(opt, oid) {
    return new Promise((resolve, reject) => {
        var options = { ...defaultOptions, ...opt }
        var aVarbinds = []
        var session = snmp.createSession(options.ip || options.host, options.community, options)
        session.subtree(oid, options.maxRepetitions, function feedCb(varbinds) {
            aVarbinds.push(...varbinds)
        }, function doneCb(error) {
            if (error)
                return reject(error.toString())
            else
                return resolve(aVarbinds)
        })
    })
}

function get(opt, oids) {
    return new Promise((resolve, reject) => {
        var options = { ...defaultOptions, ...opt }
        var session = snmp.createSession(options.ip || options.host, options.community, options)
        session.get(oids, function (error, varbinds) {
            if (error) {
                return reject(error)
            } else {
                return resolve(varbinds)
            }
            // If done, close the session
            session.close()
        })
    })
}


module.exports = {
    allOpticalPower,
    auth,
    bodyLan,
    bodyLanEPON,
    bodySetOnuWebAdmin,
    createPackage,
    dataType,
    defaultOptions,
    delOnuByMacAddress,
    footerLan,
    footerLanEPON,
    get,
    getDistance,
    getLanPorts,
    getOnuBandwidth,
    getOnuIdListByPon,
    getOnuListBySlot,
    getOnuRxPowerListByPon,
    getOnuWebAdmin,
    headerLan,
    headerLanEPON,
    headerSetOnuWebAdmin,
    headerLanPorts,
    lastOffTime,
    rebootOnu,
    sendSnmp,
    setOnuBandwidth,
    setWanBody,
    setWanHeader,
    signal,
    subtree,
    version
}
