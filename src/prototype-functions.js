function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n)
}

String.prototype.replaceAll = function (search, replacement) {
    var target = this
    return target.split(search).join(replacement)
}

String.prototype.strToHex = function () {
    var hex, i
    var result = ""
    for (i = 0; i < this.length; i++) {
        hex = this.charCodeAt(i).toString(16)
        result += ("00" + hex).slice(-2) + ' '
    }
    return result
}

String.prototype.toHex = function (fieldLength) {
    if (isNumeric(this)) {
        if (fieldLength && fieldLength > 0)
            return (new Array(fieldLength).fill('0').toString().replaceAll(',', '') + (parseInt(this)).toString(16)).slice((-1) * fieldLength)
        return (parseInt(this)).toString(16)
    }
    return '?'
}

String.prototype.hexToStr = function () {
    var j
    var hexes = this.match(/.{1,4}/g) || []
    var back = ""
    for (j = 0; j < hexes.length; j++) {
        back += String.fromCharCode(parseInt(hexes[j], 16))
    }
    return back
}

Array.prototype.formatField = function (initialPosition, content, toFill, _length) {
    var str = ''
    if (content)
        content.split('').forEach(e => {
            str += (e.charCodeAt().toString(16) + ' ')
        })
    else
        str = '00'

    str = str.trim().padEnd((1 + toFill.length) * _length, ' ' + toFill).trim()
    str = str.split(' ')
    for (var i = 0; i < _length; ++i)
        this[initialPosition + i] = str[i]

    return this
}

Number.prototype.toHex = String.prototype.toHex