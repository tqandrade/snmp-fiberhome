
const cardTypeCode = {
    // 5116
    260: 'EC2',
    259: 'GUP7',
    401: 'GFUP',
    249: 'GUPE7',
    286: 'AC16',

    // 5516
    508: 'EC4B',
    514: 'EC8B',
    502: 'GC4B',
    527: 'GC8B',
    526: 'XG2B',
    525: 'XG2A',
    405: 'GU4E',
    406: 'GU4F',
    407: 'HU2F',
    408: 'HU1F',
    415: 'HU1A',
    414: 'HU2A',
    413: 'GU6F',
    410: 'GU6E',
    425: 'HU4A',
    552: 'ECOB',
    550: 'GCOB',
    553: 'XG8A',
    557: 'XG8B',
    549: 'GSOF',
    551: 'TIMA',
    545: 'XP4A',
    575: 'XP8A',
    605: 'CE1B',
    743: 'PUBA',
    378: 'HSUC',
    355: 'HSWA',
    379: 'HSWB',
    365: 'HSWD',
    360: 'HSUA',
    374: 'HSUB',
    602: 'C155A',
    577: 'MROF',
    579: 'CATA',
    580: 'CAUA',
    610: 'CIO',
    611: 'PWR',
    583: 'APSA',
    584: 'VPSA',
    585: 'CVTA',
    587: 'SETA',
    588: 'SHUA',
    578: 'PPDA',
    590: 'BRMA',
    591: 'PPEA',
    420: 'GS8F',
    555: 'XG4B',
    741: 'FAN',
    0: 'no line card is detected'
}

const portTypeCode = {
    // 5116
    1: 'PON',
    2: 'FE',
    3: 'GE',
    4: 'Gigabit optical port',
    5: 'pots port',
    6: '10-Gigabit optical port',
    7: 'Gigabit electrical port',

    // 5516
    734: 'GPON PON PORT',
    727: 'EPON PON PORT',
    733: 'SFP',
    731: 'XFP',
    732: 'ETH',
    632: 'Extern Clock Port',
    633: 'Inner Clock Port',
    712: 'GPON ONU PON PORT',
    264: 'LAN',
    600: 'POTS',
    601: 'CATV',
    606: 'USB',
    761: 'COM',
    626: 'SSID PORT',
    814: 'XGPON1',
    813: '10G GPON PORT',
    263: 'EPON ONU PON',
    808: '1GPON PON PORT',
    807: '10GPON PON PORT',
    809: '10GPON LAN PORT',
    631: 'TEST PORT',
    630: 'OTDR PORT',
    802: '10GEPON PON PORT',
    636: 'ROF PORT',
    637: 'IFP PORT',
    817: 'C_AP PORT',
    815: '40GPON OLT WPON',
    816: '40GPON ONU WPON'
}

const ONUType = {
    /********/
    /* GPON */
    /********/

    /* Category: GPON Old ONU */ // AN5506 - 06A (sem identificacao)
    348: { code: 348, category: 'GPON Old ONU', model: 'AN5506-04-A', type: 'GPON', mode: 'bridge' }, 
    340: { code: 340, category: 'GPON Old ONU', model: 'AN5506-04-B', type: 'GPON', mode: 'bridge' },
    752: { code: 752, category: 'GPON Old ONU', model: 'AN5506-07-A2', type: 'GPON' },
    345: { code: 345, category: 'GPON Old ONU', model: 'AN5506-07-B', type: 'GPON' },
    341: { code: 341, category: 'GPON Old ONU', model: 'AN5506-06-E', type: 'GPON' },

    /* Category: SFU */     //AN5506-02-A (sem identificacao)
    884: { code: 884, category: 'SFU', model: 'AN5506-04-GA', type: 'GPON' },
    785: { code: 785, category: 'SFU', model: 'AN5506-01-A1', type: 'GPON', mode: 'bridge' }, 
    786: { code: 786, category: 'SFU', model: 'AN5506-01-B1', type: 'GPON' },
    767: { code: 767, category: 'SFU', model: 'AN5506-04-A1', type: 'GPON' },
    768: { code: 768, category: 'SFU', model: 'AN5506-04-B2', type: 'GPON' },
    872: { code: 872, category: 'SFU', model: 'AN5506-02-B', type: 'GPON', mode: 'dual' },
    750: { code: 750, category: 'SFU', model: 'AN5506-04-C1', type: 'GPON' },
    765: { code: 765, category: 'SFU', model: 'AN5506-04-F1', type: 'GPON', mode: 'dual' },
    766: { code: 766, category: 'SFU', model: 'AN5506-04-G1', type: 'GPON' },
    866: { code: 866, category: 'SFU', model: 'AN5506-04-D', type: 'GPON' },
    874: { code: 874, category: 'SFU', model: 'AN5506-06-G', type: 'GPON' },
    878: { code: 878, category: 'SFU', model: 'AN5121-4GP', type: 'GPON' },
    879: { code: 879, category: 'SFU', model: 'AN5121-4G', type: 'GPON' },
    885: { code: 885, category: 'SFU', model: 'AN5506-04-CA', type: 'GPON' },
    857: { code: 857, category: 'SFU', model: 'GPON SFU', type: 'GPON' },

    /* Category: MDU */
    754: { code: 754, category: 'MDU', model: 'AN5506-07-A1', type: 'GPON' },
    755: { code: 755, category: 'MDU', model: 'AN5506-07-B1', type: 'GPON' },
    756: { code: 756, category: 'MDU', model: 'AN5506-09-A1', type: 'GPON' },
    757: { code: 757, category: 'MDU', model: 'AN5506-09-B1', type: 'GPON' },
    758: { code: 758, category: 'MDU', model: 'AN5506-10-A1', type: 'GPON' },
    759: { code: 759, category: 'MDU', model: 'AN5506-10-B1', type: 'GPON' },
    795: { code: 795, category: 'MDU', model: 'AN5506-09-A1K', type: 'GPON' },
    851: { code: 851, category: 'MDU', model: 'AN5506-07-A1K', type: 'GPON' },
    852: { code: 852, category: 'MDU', model: 'AN5506-10-A1K', type: 'GPON' },
    860: { code: 860, category: 'MDU', model: 'AN5506-06-EG', type: 'GPON' },
    877: { code: 877, category: 'MDU', model: 'AN5121-8GR', type: 'GPON' },

    /* Category: HGU */
    762: { code: 762, category: 'HGU', model: 'HG260', type: 'GPON', mode: 'dual' },
    792: { code: 792, category: 'HGU', model: 'HG266', type: 'GPON', mode: 'dual' },
    853: { code: 853, category: 'HGU', model: 'HG261', type: 'GPON', mode: 'dual' },

    /* Category: 行业 ONU */
    788: { code: 788, category: '行业 ONU', model: 'AN5506-04-P1', type: 'GPON' },
    865: { code: 865, category: '行业 ONU', model: 'AN5506-02-AKW', type: 'GPON' },

    /* Category: MDU ONU */
    32: { code: 32, category: 'MDU ONU', model: 'AN5006-20', type: 'GPON' },
    56: { code: 56, category: 'MDU ONU', model: 'AN5006-30', type: 'GPON' },
    27: { code: 27, category: 'MDU ONU', model: 'AN5006-15', type: 'GPON' },
    886: { code: 886, category: 'MDU ONU', model: 'AN5172-8GR', type: 'GPON' },

    /* Category: 印尼 GPON FTTDP */
    875: { code: 875, category: '印尼 GPON FTTDP', model: 'AN5506-01-VP', type: 'GPON' },

    /* Category: 印尼 GPON FTTDP */
    882: { code: 882, category: 'CBU', model: 'AN5161-CGF', type: 'GPON' },


    /********/
    /* EPON */
    /********/

    /* Category: FTTH beoutside CTC */     // AN5006-04P3  (sem identificacao)
    1: { code: 1, category: 'FTTH beoutside CTC', model: 'AN5006-02', type: 'EPON' },
    2: { code: 2, category: 'FTTH beoutside CTC', model: 'AN5006-02A', type: 'EPON' },
    3: { code: 3, category: 'FTTH beoutside CTC', model: 'AN5006-03', type: 'EPON' },
    4: { code: 4, category: 'FTTH beoutside CTC', model: 'AN5006-04', type: 'EPON' },
    5: { code: 5, category: 'FTTH beoutside CTC', model: 'AN5006-05', type: 'EPON' },
    6: { code: 6, category: 'FTTH beoutside CTC', model: 'AN5006-05A', type: 'EPON' },
    34: { code: 34, category: 'FTTH beoutside CTC', model: 'AN5006-04P1', type: 'EPON' },
    37: { code: 37, category: 'FTTH beoutside CTC', model: 'AN5006-04P2', type: 'EPON' },
    60: { code: 60, category: 'FTTH beoutside CTC / CBU', model: 'AN5161-CEF', type: 'EPON' },
    51: { code: 51, category: 'FTTH beoutside CTC', model: 'AN5006-04P4', type: 'EPON' },

    /* Category: Uncategorized */
    88: { code: 88, category: 'uncategorized', model: 'Commom EPON SFU', type: 'EPON' },

    /* Category: FTTH CTC */
    15: { code: 15, category: 'FTTH CTC', model: 'OTHER-1', type: 'EPON' },
    16: { code: 16, category: 'FTTH CTC', model: 'OTHER-2', type: 'EPON' },
    17: { code: 17, category: 'FTTH CTC', model: 'OTHER-3', type: 'EPON' },
    18: { code: 18, category: 'FTTH CTC', model: 'OTHER-4', type: 'EPON' },
    100: { code: 100, category: 'FTTH CTC', model: 'OTHER6', type: 'EPON' },
    101: { code: 101, category: 'FTTH CTC', model: 'OTHER7', type: 'EPON' },
    21: { code: 21, category: 'FTTH CTC', model: 'AN5006-02-A/C', type: 'EPON' },
    19: { code: 19, category: 'FTTH CTC', model: 'AN5006-03C', type: 'EPON' },
    61: { code: 61, category: 'FTTH CTC', model: 'AN5121-4E', type: 'EPON' },
    62: { code: 62, category: 'FTTH CTC', model: 'AN5121-4EP', type: 'EPON' },
    20: { code: 20, category: 'FTTH CTC', model: 'AN5006-04C', type: 'EPON' },
    22: { code: 22, category: 'FTTH CTC', model: 'AN5006-05C', type: 'EPON' },
    36: { code: 36, category: 'FTTH CTC', model: 'AN5006-01-A', type: 'EPON' },
    39: { code: 39, category: 'FTTH CTC', model: 'AN5006-01-B', type: 'EPON' },
    44: { code: 44, category: 'FTTH CTC', model: 'AN5200-04A', type: 'EPON' },
    46: { code: 46, category: 'FTTH CTC', model: 'AN5006-03-AK', type: 'EPON' },
    90: { code: 90, category: 'FTTH CTC', model: 'AN5006-04F1', type: 'EPON' },
    57: { code: 57, category: 'FTTH CTC', model: 'AN5006-04-E', type: 'EPON' },

    /* Category: FTTB beoutside CTC */
    7: { code: 7, category: 'FTTB beoutside CTC', model: 'AN5006-06A', type: 'EPON' },
    8: { code: 8, category: 'FTTB beoutside CTC', model: 'AN5006-06B', type: 'EPON' },
    10: { code: 10, category: 'FTTB beoutside CTC', model: 'AN5006-06D', type: 'EPON' },
    30: { code: 30, category: 'FTTB beoutside CTC', model: 'AN5006-06A-A', type: 'EPON' },
    11: { code: 11, category: 'FTTB beoutside CTC', model: 'AN5006-07A', type: 'EPON' },
    12: { code: 12, category: 'FTTB beoutside CTC', model: 'AN5006-07B', type: 'EPON' },
    23: { code: 23, category: 'FTTB beoutside CTC', model: 'AN5006-09A', type: 'EPON' },
    24: { code: 24, category: 'FTTB beoutside CTC', model: 'AN5006-09B', type: 'EPON' },
    47: { code: 47, category: 'FTTB beoutside CTC', model: 'AN5006-09-AK', type: 'EPON' },
    25: { code: 25, category: 'FTTB beoutside CTC', model: 'AN5006-10', type: 'EPON' },
    31: { code: 31, category: 'FTTB beoutside CTC', model: 'AN5006-10B', type: 'EPON' },
    48: { code: 48, category: 'FTTB beoutside CTC', model: 'AN5006-07-AK', type: 'EPON' },
    49: { code: 49, category: 'FTTB beoutside CTC', model: 'AN5006-10-AK', type: 'EPON' },
    63: { code: 63, category: 'FTTB beoutside CTC', model: 'AN5121-8ER', type: 'EPON' },

    /* Category: FTTB CTC */
    52: { code: 52, category: 'FTTB CTC', model: 'AN5200-07A', type: 'EPON' },
    53: { code: 53, category: 'FTTB CTC', model: 'AN5200-07B', type: 'EPON' },
    55: { code: 55, category: 'FTTB CTC', model: 'AN5200-09A', type: 'EPON' },
    54: { code: 54, category: 'FTTB CTC', model: 'AN5200-09B', type: 'EPON' },
    42: { code: 42, category: 'FTTB CTC', model: 'AN5200-10A', type: 'EPON' },
    43: { code: 43, category: 'FTTB CTC', model: 'AN5200-10B', type: 'EPON' },
    9: { code: 9, category: 'FTTB CTC', model: 'AN5006-06C', type: 'EPON' },
    28: { code: 28, category: 'FTTB CTC', model: 'AN5006-07C', type: 'EPON' },

    /* Category: HG */
    33: { code: 33, category: 'HG', model: 'HG220', type: 'EPON' },
    45: { code: 45, category: 'HG', model: 'HG226', type: 'EPON' },

    /* Category: MDU */
    27: { code: 27, category: 'MDU', model: 'AN5006-15', type: 'EPON' },
    29: { code: 29, category: 'MDU', model: 'AN5006-16', type: 'EPON' },
    32: { code: 32, category: 'MDU', model: 'AN5006-20', type: 'EPON' },
    26: { code: 26, category: 'MDU', model: 'AN5006-12', type: 'EPON' },
    50: { code: 50, category: 'MDU', model: 'AN5006-12', type: 'EPON' },
    56: { code: 56, category: 'MDU', model: 'AN5006-30', type: 'EPON' },


    /*************/
    /* UNDEFINED */
    /*************/
    13: { code: 13, category: 'undefined', model: 'AN5006-08A', type: 'undefined' },
    35: { code: 35, category: 'undefined', model: 'AN5006-01-B1', type: 'undefined' },
    38: { code: 38, category: 'undefined', model: 'AN5006-11', type: 'undefined' },
    40: { code: 40, category: 'undefined', model: 'AN5006-20C', type: 'undefined' },
    41: { code: 41, category: 'undefined', model: 'AN5006-20B', type: 'undefined' },
    331: { code: 331, category: 'undefined', model: 'OTHER', type: 'undefined' },
    0xFF: { code: 0xFF, category: 'undefined', model: 'OTHER', type: 'undefined' },
}

const onuStatus_5116 = {
    0: 'offline',   // or fiber cut
    1: 'online',
    2: 'power cut'
}

const onuStatus_5516 = {
    0: 'fiber cut',
    1: 'online',
    2: 'power cut',
    3: 'offline'
}

const onuStatus_5516_NGPON = {
    0: 'offline',   //  or fiber cut or power cut
    1: 'online'
}

const oltModels = {
    '1.3.6.1.4.1.5875.800.1001.1': 'An5116-02',
    '1.3.6.1.4.1.5875.800.1001.2': 'An5116-06',
    '1.3.6.1.4.1.5875.800.1001.11': 'An5516-01',
    '1.3.6.1.4.1.5875.800.1001.14': 'GT5116-06B'
}

const subrackType = {
    1: 'An5116-02',
    2: 'An5116-06',
    11: 'An5516-01',
    6: 'An5516-06',
    12: 'An5516-04'
}


module.exports = {
    cardTypeCode,
    portTypeCode,
    ONUType,
    oltModels,
    onuStatus_5116,
    onuStatus_5516,
    onuStatus_5516_NGPON,
    subrackType
}
