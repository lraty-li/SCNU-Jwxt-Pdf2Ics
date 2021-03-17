require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],3:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"base64-js":2,"buffer":3,"ieee754":4}],4:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],5:[function(require,module,exports){
!function(t,s){"object"==typeof exports&&"undefined"!=typeof module?module.exports=s():"function"==typeof define&&define.amd?define(s):t.dayjs_plugin_duration=s()}(this,function(){"use strict";var t,s,n=/\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g,i=/^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/,e={years:31536e6,months:2592e6,days:864e5,hours:36e5,minutes:6e4,seconds:1e3,milliseconds:1,weeks:6048e5},r=function(t){return t instanceof c},o=function(t,s,n){return new c(t,n,s.$l)},u=function(t){return s.p(t)+"s"},h=function(t){return t<0},a=function(t){return h(t)?Math.ceil(t):Math.floor(t)},d=function(t,s){return t?h(t)?{negative:!0,format:""+function(t){return Math.abs(t)}(t)+s}:{negative:!1,format:""+t+s}:{negative:!1,format:""}},c=function(){function h(t,s,n){var r=this;if(this.$d={},this.$l=n,s)return o(t*e[u(s)],this);if("number"==typeof t)return this.$ms=t,this.parseFromMilliseconds(),this;if("object"==typeof t)return Object.keys(t).forEach(function(s){r.$d[u(s)]=t[s]}),this.calMilliseconds(),this;if("string"==typeof t){var h=t.match(i);if(h)return this.$d.years=h[2],this.$d.months=h[3],this.$d.weeks=h[4],this.$d.days=h[5],this.$d.hours=h[6],this.$d.minutes=h[7],this.$d.seconds=h[8],this.calMilliseconds(),this}return this}var c=h.prototype;return c.calMilliseconds=function(){var t=this;this.$ms=Object.keys(this.$d).reduce(function(s,n){return s+(t.$d[n]||0)*e[n]},0)},c.parseFromMilliseconds=function(){var t=this.$ms;this.$d.years=a(t/31536e6),t%=31536e6,this.$d.months=a(t/2592e6),t%=2592e6,this.$d.days=a(t/864e5),t%=864e5,this.$d.hours=a(t/36e5),t%=36e5,this.$d.minutes=a(t/6e4),t%=6e4,this.$d.seconds=a(t/1e3),t%=1e3,this.$d.milliseconds=t},c.toISOString=function(){var t=d(this.$d.years,"Y"),s=d(this.$d.months,"M"),n=+this.$d.days||0;this.$d.weeks&&(n+=7*this.$d.weeks);var i=d(n,"D"),e=d(this.$d.hours,"H"),r=d(this.$d.minutes,"M"),o=this.$d.seconds||0;this.$d.milliseconds&&(o+=this.$d.milliseconds/1e3);var u=d(o,"S"),h=t.negative||s.negative||i.negative||e.negative||r.negative||u.negative,a=e.format||r.format||u.format?"T":"",c=(h?"-":"")+"P"+t.format+s.format+i.format+a+e.format+r.format+u.format;return"P"===c||"-P"===c?"P0D":c},c.toJSON=function(){return this.toISOString()},c.format=function(t){var i=t||"YYYY-MM-DDTHH:mm:ss",e={Y:this.$d.years,YY:s.s(this.$d.years,2,"0"),YYYY:s.s(this.$d.years,4,"0"),M:this.$d.months,MM:s.s(this.$d.months,2,"0"),D:this.$d.days,DD:s.s(this.$d.days,2,"0"),H:this.$d.hours,HH:s.s(this.$d.hours,2,"0"),m:this.$d.minutes,mm:s.s(this.$d.minutes,2,"0"),s:this.$d.seconds,ss:s.s(this.$d.seconds,2,"0"),SSS:s.s(this.$d.milliseconds,3,"0")};return i.replace(n,function(t,s){return s||String(e[t])})},c.as=function(t){return this.$ms/e[u(t)]},c.get=function(t){var s=this.$ms,n=u(t);return"milliseconds"===n?s%=1e3:s="weeks"===n?a(s/e[n]):this.$d[n],0===s?0:s},c.add=function(t,s,n){var i;return i=s?t*e[u(s)]:r(t)?t.$ms:o(t,this).$ms,o(this.$ms+i*(n?-1:1),this)},c.subtract=function(t,s){return this.add(t,s,!0)},c.locale=function(t){var s=this.clone();return s.$l=t,s},c.clone=function(){return o(this.$ms,this)},c.humanize=function(s){return t().add(this.$ms,"ms").locale(this.$l).fromNow(!s)},c.milliseconds=function(){return this.get("milliseconds")},c.asMilliseconds=function(){return this.as("milliseconds")},c.seconds=function(){return this.get("seconds")},c.asSeconds=function(){return this.as("seconds")},c.minutes=function(){return this.get("minutes")},c.asMinutes=function(){return this.as("minutes")},c.hours=function(){return this.get("hours")},c.asHours=function(){return this.as("hours")},c.days=function(){return this.get("days")},c.asDays=function(){return this.as("days")},c.weeks=function(){return this.get("weeks")},c.asWeeks=function(){return this.as("weeks")},c.months=function(){return this.get("months")},c.asMonths=function(){return this.as("months")},c.years=function(){return this.get("years")},c.asYears=function(){return this.as("years")},h}();return function(n,i,e){t=e,s=e().$utils(),e.duration=function(t,s){var n=e.locale();return o(t,{$l:n},s)},e.isDuration=r;var u=i.prototype.add,h=i.prototype.subtract;i.prototype.add=function(t,s){return r(t)&&(t=t.asMilliseconds()),u.bind(this)(t,s)},i.prototype.subtract=function(t,s){return r(t)&&(t=t.asMilliseconds()),h.bind(this)(t,s)}}});

},{}],6:[function(require,module,exports){
!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):t.dayjs_plugin_timezone=e()}(this,function(){"use strict";var t={year:0,month:1,day:2,hour:3,minute:4,second:5},e={};return function(n,i,r){var o,u=r().utcOffset(),a=function(t,n,i){void 0===i&&(i={});var r=new Date(t);return function(t,n){void 0===n&&(n={});var i=n.timeZoneName||"short",r=t+"|"+i,o=e[r];return o||(o=new Intl.DateTimeFormat("en-US",{hour12:!1,timeZone:t,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",timeZoneName:i}),e[r]=o),o}(n,i).formatToParts(r)},f=function(e,n){for(var i=a(e,n),o=[],u=0;u<i.length;u+=1){var f=i[u],s=f.type,m=f.value,c=t[s];c>=0&&(o[c]=parseInt(m,10))}var d=o[3],v=24===d?0:d,h=o[0]+"-"+o[1]+"-"+o[2]+" "+v+":"+o[4]+":"+o[5]+":000",l=+e;return(r.utc(h).valueOf()-(l-=l%1e3))/6e4},s=i.prototype;s.tz=function(t,e){void 0===t&&(t=o);var n=this.utcOffset(),i=this.toDate().toLocaleString("en-US",{timeZone:t}),a=Math.round((this.toDate()-new Date(i))/1e3/60),f=r(i).$set("millisecond",this.$ms).utcOffset(u-a,!0);if(e){var s=f.utcOffset();f=f.add(n-s,"minute")}return f.$x.$timezone=t,f},s.offsetName=function(t){var e=this.$x.$timezone||r.tz.guess(),n=a(this.valueOf(),e,{timeZoneName:t}).find(function(t){return"timezonename"===t.type.toLowerCase()});return n&&n.value};var m=s.startOf;s.startOf=function(t,e){if(!this.$x||!this.$x.$timezone)return m.call(this,t,e);var n=r(this.format("YYYY-MM-DD HH:mm:ss:SSS"));return m.call(n,t,e).tz(this.$x.$timezone,!0)},r.tz=function(t,e,n){var i=n&&e,u=n||e||o,a=f(+r(),u);if("string"!=typeof t)return r(t).tz(u);var s=function(t,e,n){var i=t-60*e*1e3,r=f(i,n);if(e===r)return[i,e];var o=f(i-=60*(r-e)*1e3,n);return r===o?[i,r]:[t-60*Math.min(r,o)*1e3,Math.max(r,o)]}(r.utc(t,i).valueOf(),a,u),m=s[0],c=s[1],d=r(m).utcOffset(c);return d.$x.$timezone=u,d},r.tz.guess=function(){return Intl.DateTimeFormat().resolvedOptions().timeZone},r.tz.setDefault=function(t){o=t}}});

},{}],7:[function(require,module,exports){
!function(t,i){"object"==typeof exports&&"undefined"!=typeof module?module.exports=i():"function"==typeof define&&define.amd?define(i):t.dayjs_plugin_utc=i()}(this,function(){"use strict";return function(t,i,e){var s=i.prototype;e.utc=function(t){return new i({date:t,utc:!0,args:arguments})},s.utc=function(t){var i=e(this.toDate(),{locale:this.$L,utc:!0});return t?i.add(this.utcOffset(),"minute"):i},s.local=function(){return e(this.toDate(),{locale:this.$L,utc:!1})};var f=s.parse;s.parse=function(t){t.utc&&(this.$u=!0),this.$utils().u(t.$offset)||(this.$offset=t.$offset),f.call(this,t)};var n=s.init;s.init=function(){if(this.$u){var t=this.$d;this.$y=t.getUTCFullYear(),this.$M=t.getUTCMonth(),this.$D=t.getUTCDate(),this.$W=t.getUTCDay(),this.$H=t.getUTCHours(),this.$m=t.getUTCMinutes(),this.$s=t.getUTCSeconds(),this.$ms=t.getUTCMilliseconds()}else n.call(this)};var u=s.utcOffset;s.utcOffset=function(t,i){var e=this.$utils().u;if(e(t))return this.$u?0:e(this.$offset)?u.call(this):this.$offset;var s=Math.abs(t)<=16?60*t:t,f=this;if(i)return f.$offset=s,f.$u=0===t,f;if(0!==t){var n=this.$u?this.toDate().getTimezoneOffset():-1*this.utcOffset();(f=this.local().add(s+n,"minute")).$offset=s,f.$x.$localOffset=n}else f=this.utc();return f};var o=s.format;s.format=function(t){var i=t||(this.$u?"YYYY-MM-DDTHH:mm:ss[Z]":"");return o.call(this,i)},s.valueOf=function(){var t=this.$utils().u(this.$offset)?0:this.$offset+(this.$x.$localOffset||(new Date).getTimezoneOffset());return this.$d.valueOf()-6e4*t},s.isUTC=function(){return!!this.$u},s.toISOString=function(){return this.toDate().toISOString()},s.toString=function(){return this.toDate().toUTCString()};var r=s.toDate;s.toDate=function(t){return"s"===t&&this.$offset?e(this.format("YYYY-MM-DD HH:mm:ss:SSS")).toDate():r.call(this)};var a=s.diff;s.diff=function(t,i,s){if(t&&this.$u===t.$u)return a.call(this,t,i,s);var f=this.local(),n=e(t).local();return a.call(f,n,i,s)}}});

},{}],"ICalAlarm":[function(require,module,exports){
'use strict';


const moment = require('./dayjs.min.js');
const ICalTools = require('./_tools');
const utc = require("./node_modules/dayjs/plugin/utc");
const duration = require("./node_modules/dayjs/plugin/duration");
moment.extend(utc);
moment.extend(duration);

/**
 * @author Sebastian Pekarek
 * @module ical-generator
 * @class ICalAlarm
 */
class ICalAlarm {
    constructor(data, event) {
        this._data = {
            type: null,
            trigger: null,
            repeat: null,
            repeatInterval: null,
            attach: null,
            description: null,
            x: []
        };
        this._attributes = [
            'type',
            'trigger',
            'triggerBefore',
            'triggerAfter',
            'repeat',
            'interval',
            'attach',
            'description'
        ];
        this._vars = {
            types: ['display', 'audio']
        };

        this._event = event;
        if (!event) {
            throw new Error('`event` option required!');
        }

        for (let i in data) {
            if (this._attributes.indexOf(i) > -1) {
                this[i](data[i]);
            }
        }
    }


    /**
     * Set/Get the alarm type
     *
     * @param type Type
     * @since 0.2.1
     * @returns {ICalAlarm|String}
     */
    type(type) {
        if (type === undefined) {
            return this._data.type;
        }
        if (!type) {
            this._data.type = null;
            return this;
        }

        if (this._vars.types.indexOf(type) === -1) {
            throw new Error('`type` is not correct, must be either `display` or `audio`!');
        }

        this._data.type = type;
        return this;
    }


    /**
     * Set/Get seconds before event to trigger alarm
     *
     * @param {Number|moment|Date} [trigger] Seconds before alarm triggeres
     * @since 0.2.1
     * @returns {ICalAlarm|Number|moment}
     */
    trigger(trigger) {
        if (trigger === undefined && moment.isDayjs(this._data.trigger)) {
            return this._data.trigger;
        }
        if (trigger === undefined && this._data.trigger) {
            return -1 * this._data.trigger;
        }
        if (trigger === undefined) {
            return null;
        }


        if (!trigger) {
            this._data.trigger = null;
            return this;
        }
        if (trigger instanceof Date) {
            this._data.trigger = moment(trigger);
            return this;
        }

        //isDayjs -> isDayjs
        // if (moment.isDayjs(trigger)) {
        if (moment.isDayjs(trigger)) {
            this._data.trigger = trigger;
            return this;
        }
        if (moment.isDuration(trigger)) {
            this._data.trigger = -1 * trigger.as('seconds');
            return this;
        }
        if (typeof trigger === 'number' && isFinite(trigger)) {
            this._data.trigger = -1 * trigger;
            return this;
        }

        throw new Error('`trigger` is not correct, must be a `Number`, `Date` or `moment` or a `moment.duration`!');
    }


    /**
     * Set/Get seconds after event to trigger alarm
     *
     * @param {Number|moment|Date} [trigger] Seconds after alarm triggeres
     * @since 0.2.1
     * @returns {ICalAlarm|Number|moment}
     */
    triggerAfter(trigger) {
        if (trigger === undefined) {
            return this._data.trigger;
        }
        if (moment.isDuration(trigger)) {
            this._data.trigger = -1 * trigger.as('seconds');
            return this;
        }

        return this.trigger(typeof trigger === 'number' ? -1 * trigger : trigger);
    }


    /**
     * Set/Get seconds before event to trigger alarm
     *
     * @param {Number|moment|Date} [trigger] Seconds before alarm triggeres
     * @since 0.2.1
     * @returns {ICalAlarm|Number|moment}
     */
    triggerBefore(trigger) {
        return this.trigger(trigger);
    }


    /**
     * Set/Get Alarm Repetitions
     *
     * @param {Number} [repeat] Number of repetitions
     * @since 0.2.1
     * @returns {ICalAlarm|Number}
     */
    repeat(repeat) {
        if (repeat === undefined) {
            return this._data.repeat;
        }
        if (!repeat) {
            this._data.repeat = null;
            return this;
        }

        if (typeof repeat !== 'number' || !isFinite(repeat)) {
            throw new Error('`repeat` is not correct, must be numeric!');
        }

        this._data.repeat = repeat;
        return this;
    }


    /**
     * Set/Get Repeat Interval
     *
     * @param {Number} [interval] Interval in seconds
     * @since 0.2.1
     * @returns {ICalAlarm|Number|Null}
     */
    interval(interval) {
        if (interval === undefined) {
            return this._data.interval;
        }
        if (!interval) {
            this._data.interval = null;
            return this;
        }

        if (typeof interval !== 'number' || !isFinite(interval)) {
            throw new Error('`interval` is not correct, must be numeric!');
        }

        this._data.interval = interval;
        return this;
    }


    /**
     * Set/Get Attachment
     *
     * @param {Object|String} [attach] File-URI or Object
     * @param {String} [attach.uri]
     * @param {String} [attach.mime]
     * @since 0.2.1
     * @returns {ICalAlarm|Object}
     */
    attach(attach) {
        if (attach === undefined) {
            return this._data.attach;
        }
        if (!attach) {
            this._data.attach = null;
            return this;
        }

        let _attach = null;
        if (typeof attach === 'string') {
            _attach = {
                uri: attach,
                mime: null
            };
        } else if (typeof attach === 'object') {
            _attach = {
                uri: attach.uri,
                mime: attach.mime || null
            };
        } else {
            throw new Error(
                '`attach` needs to be a valid formed string or an object. See https://github.com/sebbo2002/ical-' +
                'generator#attachstringobject-attach'
            );
        }

        if (!_attach.uri) {
            throw new Error('`attach.uri` is empty!');
        }

        this._data.attach = {
            uri: _attach.uri,
            mime: _attach.mime
        };
        return this;
    }


    /**
     * Set/Get the alarm description
     *
     * @param {String|null} [description] Description
     * @since 0.2.1
     * @returns {ICalAlarm|String}
     */
    description(description) {
        if (description === undefined) {
            return this._data.description;
        }
        if (!description) {
            this._data.description = null;
            return this;
        }

        this._data.description = description;
        return this;
    }


    /**
     * Get/Set X-* attributes. Woun't filter double attributes,
     * which are also added by another method (e.g. busystatus),
     * so these attributes may be inserted twice.
     *
     * @param {Array<Object<{key: String, value: String}>>|String} [key]
     * @param {String} [value]
     * @since 1.9.0
     * @returns {ICalEvent|Array<Object<{key: String, value: String}>>}
     */
    x(keyOrArray, value) {
        return ICalTools.addOrGetCustomAttributes(this, keyOrArray, value);
    }


    /**
     * Export calender as JSON Object to use it later…
     *
     * @since 0.2.4
     * @returns {Object}
     */
    toJSON() {
        return ICalTools.toJSON(this, this._attributes, {
            ignoreAttributes: ['triggerAfter', 'triggerBefore']
        });
    }


    /**
     * Export Event to iCal
     *
     * @since 0.2.0
     * @returns {String}
     */
    _generate() {
        let g = 'BEGIN:VALARM\r\n';

        if (!this._data.type) {
            throw new Error('No value for `type` in ICalAlarm given!');
        }
        if (!this._data.trigger) {
            throw new Error('No value for `trigger` in ICalAlarm given!');
        }

        // ACTION
        g += 'ACTION:' + this._data.type.toUpperCase() + '\r\n';

        if (moment.isDayjs(this._data.trigger)) {
            g += 'TRIGGER;VALUE=DATE-TIME:' + ICalTools.formatDate(this._event._calendar.timezone(), this._data.trigger) + '\r\n';
        } else if (this._data.trigger > 0) {
            g += 'TRIGGER;RELATED=END:' + moment.duration(this._data.trigger, 's').toISOString() + '\r\n';
        } else {
            g += 'TRIGGER:' + moment.duration(this._data.trigger, 's').toISOString() + '\r\n';
        }

        // REPEAT
        if (this._data.repeat && !this._data.interval) {
            throw new Error('No value for `interval` in ICalAlarm given, but required for `repeat`!');
        }
        if (this._data.repeat) {
            g += 'REPEAT:' + this._data.repeat + '\r\n';
        }

        // INTERVAL
        if (this._data.interval && !this._data.repeat) {
            throw new Error('No value for `repeat` in ICalAlarm given, but required for `interval`!');
        }
        if (this._data.interval) {
            g += 'DURATION:' + moment.duration(this._data.interval, 's').toISOString() + '\r\n';
        }

        // ATTACH
        if (this._data.type === 'audio' && this._data.attach && this._data.attach.mime) {
            g += 'ATTACH;FMTTYPE=' + this._data.attach.mime + ':' + this._data.attach.uri + '\r\n';
        } else if (this._data.type === 'audio' && this._data.attach) {
            g += 'ATTACH;VALUE=URI:' + this._data.attach.uri + '\r\n';
        } else if (this._data.type === 'audio') {
            g += 'ATTACH;VALUE=URI:Basso\r\n';
        }

        // DESCRIPTION
        if (this._data.type === 'display' && this._data.description) {
            g += 'DESCRIPTION:' + ICalTools.escape(this._data.description) + '\r\n';
        } else if (this._data.type === 'display') {
            g += 'DESCRIPTION:' + ICalTools.escape(this._event.summary()) + '\r\n';
        }

        // CUSTOM X ATTRIBUTES
        g += ICalTools.generateCustomAttributes(this);

        g += 'END:VALARM\r\n';
        return g;
    }
}

module.exports = ICalAlarm;
},{"./_tools":"ICalTools","./dayjs.min.js":"moment","./node_modules/dayjs/plugin/duration":5,"./node_modules/dayjs/plugin/utc":7}],"ICalAttendee":[function(require,module,exports){
'use strict';


const ICalTools = require('./_tools');


/**
 * @author Sebastian Pekarek
 * @module ical-generator
 * @class ICalAttendee
 */
class ICalAttendee {
    constructor (data, event) {
        this._data = {
            name: null,
            email: null,
            mailto: null,
            status: null,
            role: 'REQ-PARTICIPANT',
            rsvp: null,
            type: null,
            delegatedTo: null,
            delegatedFrom: null
        };
        this._attributes = [
            'name',
            'email',
            'mailto',
            'role',
            'rsvp',
            'status',
            'type',
            'delegatedTo',
            'delegatedFrom',
            'delegatesFrom',
            'delegatesTo'
        ];
        this._vars = {
            allowed: {
                role: ['CHAIR', 'REQ-PARTICIPANT', 'OPT-PARTICIPANT', 'NON-PARTICIPANT'],
                rsvp: ['TRUE', 'FALSE'],
                status: ['ACCEPTED', 'TENTATIVE', 'DECLINED', 'DELEGATED', 'NEEDS-ACTION'],
                type: ['INDIVIDUAL', 'GROUP', 'RESOURCE', 'ROOM', 'UNKNOWN'] // ref: https://tools.ietf.org/html/rfc2445#section-4.2.3
            }
        };

        this._event = event;
        if (!event) {
            throw new Error('`event` option required!');
        }

        for (let i in data) {
            if (this._attributes.indexOf(i) > -1) {
                this[i](data[i]);
            }
        }
    }

    /**
     * Checks if the given string `str` is a valid one for category `type`
     *
     * @param {String} type
     * @param {String} str
     * @returns {string}
     * @private
     */
    _getAllowedStringFor (type, str) {
        if (!str || typeof (str) !== 'string') {
            throw new Error('Input for `' + type + '` must be a non-empty string. You gave ' + str);
        }

        str = str.toUpperCase();

        if (this._vars.allowed[type].indexOf(str) === -1) {
            throw new Error('`' + type + '` must be one of the following: ' + this._vars.allowed[type].join(', ') + '!');
        }

        return str;
    }


    /**
     * Set/Get the attendee's name
     *
     * @param {String} [name] Name
     * @since 0.2.0
     * @returns {ICalAttendee|String}
     */
    name (name) {
        if (name === undefined) {
            return this._data.name;
        }

        this._data.name = name || null;
        return this;
    }


    /**
     * Set/Get the attendee's email address
     *
     * @param {String} [email] Email address
     * @since 0.2.0
     * @returns {ICalAttendee|String}
     */
    email (email) {
        if (!email) {
            return this._data.email;
        }

        this._data.email = email;
        return this;
    }

    /**
     * Set/Get the attendee's email address
     *
     * @param {String} [mailto] Email address
     * @since 1.3.0 TODO: set correct version number
     * @returns {ICalAttendee|String}
     */
    mailto (mailto) {
        if (mailto === undefined) {
            return this._data.mailto;
        }

        this._data.mailto = mailto || null;
        return this;
    }


    /**
     * Set/Get attendee's role
     *
     * @param {String} role
     * @since 0.2.0
     * @returns {ICalAttendee|String}
     */
    role (role) {
        if (role === undefined) {
            return this._data.role;
        }

        this._data.role = this._getAllowedStringFor('role', role);
        return this;
    }


    /**
     * Set/Get attendee's RSVP expectation
     *
     * @param {String} rsvp
     * @since 0.2.1
     * @returns {ICalAttendee|String}
     */
    rsvp (rsvp) {
        if (rsvp === undefined) {
            return this._data.rsvp;
        }
        if (rsvp === null) {
            this._data.rsvp = null;
            return this;
        }

        if (rsvp === true) {
            rsvp = 'true';
        }
        if (rsvp === false) {
            rsvp = 'false';
        }

        this._data.rsvp = this._getAllowedStringFor('rsvp', rsvp);
        return this;
    }


    /**
     * Set/Get attendee's status
     *
     * @param {String} [status]
     * @since 0.2.0
     * @returns {ICalAttendee|String}
     */
    status (status) {
        if (status === undefined) {
            return this._data.status;
        }
        if (!status) {
            this._data.status = null;
            return this;
        }

        this._data.status = this._getAllowedStringFor('status', status);
        return this;
    }


    /**
     * Set/Get attendee's type (a.k.a. CUTYPE)
     *
     * @param {String} [type]
     * @since 0.2.3
     * @returns {ICalAttendee|String}
     */
    type (type) {
        if (type === undefined) {
            return this._data.type;
        }
        if (!type) {
            this._data.type = null;
            return this;
        }

        this._data.type = this._getAllowedStringFor('type', type);
        return this;
    }


    /**
     * Set/Get the attendee's delegated-to field
     *
     * @param {String} [delegatedTo] Email address
     * @since 0.2.0
     * @returns {ICalAttendee|String}
     */
    delegatedTo (delegatedTo) {
        if (delegatedTo === undefined) {
            return this._data.delegatedTo;
        }
        if (!delegatedTo) {
            this._data.delegatedTo = null;
            if (this._data.status === 'DELEGATED') {
                this._data.status = null;
            }
            return this;
        }

        this._data.delegatedTo = delegatedTo;
        this._data.status = 'DELEGATED';
        return this;
    }


    /**
     * Set/Get the attendee's delegated-from field
     *
     * @param {String} [delegatedFrom] Email address
     * @since 0.2.0
     * @returns {ICalAttendee|String}
     */
    delegatedFrom (delegatedFrom) {
        if (delegatedFrom === undefined) {
            return this._data.delegatedFrom;
        }

        this._data.delegatedFrom = delegatedFrom || null;
        return this;
    }


    /**
     * Create a new attendee this attendee delegates to
     * and returns this new attendee
     *
     * @param {String|Object|ICalAttendee} Attendee options
     * @see ICalEvent.createAttendee
     * @since 0.2.0
     * @returns {ICalAttendee}
     */
    delegatesTo (options) {
        const a = this._event.createAttendee(options);
        this.delegatedTo(a);
        a.delegatedFrom(this);
        return a;
    }


    /**
     * Create a new attendee this attendee delegates from
     * and returns this new attendee
     *
     * @param {String|Object|ICalAttendee} Attendee options
     * @see ICalEvent.createAttendee
     * @since 0.2.0
     * @returns {ICalAttendee}
     */
    delegatesFrom (options) {
        const a = this._event.createAttendee(options);
        this.delegatedFrom(a);
        a.delegatedTo(this);
        return a;
    }


    /**
     * Export calender as JSON Object to use it later…
     *
     * @since 0.2.4
     * @returns {Object} Calendar
     */
    toJSON () {
        return ICalTools.toJSON(this, this._attributes, {
            ignoreAttributes: ['delegatesTo', 'delegatesFrom'],
            hooks: {
                delegatedTo: value => value instanceof ICalAttendee ? value.email() : value,
                delegatedFrom: value => value instanceof ICalAttendee ? value.email() : value
            }
        });
    }


    /**
     * Export Event to iCal
     *
     * @since 0.2.0
     * @returns {String}
     */
    _generate () {
        let g = 'ATTENDEE';

        if (!this._data.email) {
            throw new Error('No value for `email` in ICalAttendee given!');
        }

        // ROLE
        g += ';ROLE=' + this._data.role;

        // TYPE
        if (this._data.type) {
            g += ';CUTYPE=' + this._data.type;
        }

        // PARTSTAT
        if (this._data.status) {
            g += ';PARTSTAT=' + this._data.status;
        }

        // RSVP
        if (this._data.rsvp) {
            g += ';RSVP=' + this._data.rsvp;
        }

        // DELEGATED-TO
        if (this._data.delegatedTo) {
            g += ';DELEGATED-TO="' + (this._data.delegatedTo instanceof ICalAttendee ? this._data.delegatedTo.email() : this._data.delegatedTo) + '"';
        }

        // DELEGATED-FROM
        if (this._data.delegatedFrom) {
            g += ';DELEGATED-FROM="' + (this._data.delegatedFrom instanceof ICalAttendee ? this._data.delegatedFrom.email() : this._data.delegatedFrom) + '"';
        }

        // CN / Name
        if (this._data.name) {
            g += ';CN="' + ICalTools.escape(this._data.name) + '"';
        }

        // EMAIL
        if (this._data.email && this._data.mailto) {
            g += ';EMAIL=' + ICalTools.escape(this._data.email);
        }

        g += ':MAILTO:' + ICalTools.escape(this._data.mailto || this._data.email) + '\r\n';
        return g;
    }
}

module.exports = ICalAttendee;
},{"./_tools":"ICalTools"}],"ICalCalendar":[function(require,module,exports){
'use strict';

const moment = require('./dayjs.min.js');
const ICalTools = require('./_tools');
const ICalEvent = require('./event');

const utc = require("./node_modules/dayjs/plugin/utc");
moment.extend(utc);
/**
 * @author Sebastian Pekarek
 * @module ical-generator
 * @class ICalCalendar
 */
class ICalCalendar {
    constructor(data) {
        this._data = {};
        this._attributes = ['domain', 'prodId', 'method', 'name', 'description', 'timezone', 'ttl', 'url', 'scale', 'events'];
        this._vars = {
            allowedMethods: ['PUBLISH', 'REQUEST', 'REPLY', 'ADD', 'CANCEL', 'REFRESH', 'COUNTER', 'DECLINECOUNTER']
        };

        if (typeof data === 'string') {
            data = JSON.parse(data);
        }

        this.clear();

        for (let i in data) {
            if (this._attributes.indexOf(i) > -1) {
                this[i](data[i]);
            }
        }
    }


    /**
     * Set/Get your feed's domain…
     *
     * @param {string} [domain] Domain
     * @since 0.2.0
     * @deprecated 0.3.0
     * @returns {ICalCalendar|String}
     */
    domain(domain) {
        if (!domain) {
            return this._data.domain;
        }

        this._data.domain = domain.toString();
        return this;
    }


    /**
     * Set/Get your feed's prodid. `prodid` can be either a
     * string like "//sebbo.net//ical-generator//EN" or an
     * object like
     * {
     *   "company": "sebbo.net",
     *   "product": "ical-generator"
     *   "language": "EN"
     * }
     *
     * `language` is optional and defaults to `EN`.
     *
     * @param {string} [prodid] ProdID
     * @since 0.2.0
     * @returns {ICalCalendar}
     */
    prodId(prodid) {
        if (!prodid) {
            return this._data.prodid;
        }

        const prodIdRegEx = /^\/\/(.+)\/\/(.+)\/\/([A-Z]{1,4})$/;
        let language;

        if (typeof prodid === 'string' && prodIdRegEx.test(prodid)) {
            this._data.prodid = prodid;
            return this;
        }
        if (typeof prodid === 'string') {
            throw new Error(
                '`prodid` isn\'t formated correctly. See https://github.com/sebbo2002/ical-generator#' +
                'prodidstringobject-prodid'
            );
        }

        if (typeof prodid !== 'object') {
            throw new Error('`prodid` needs to be a valid formed string or an object!');
        }

        if (!prodid.company) {
            throw new Error('`prodid.company` is a mandatory item!');
        }
        if (!prodid.product) {
            throw new Error('`prodid.product` is a mandatory item!');
        }

        language = (prodid.language || 'EN').toUpperCase();
        this._data.prodid = '//' + prodid.company + '//' + prodid.product + '//' + language;
        return this;
    }


    /**
     * Set/Get your feed's method
     *
     * @param {string} method
     * @since 0.2.8
     * @returns {ICalCalendar|String}
     */
    method(method) {
        if (method === undefined) {
            return this._data.method;
        }
        if (!method) {
            this._data.method = null;
            return this;
        }

        if (this._vars.allowedMethods.indexOf(method.toUpperCase()) === -1) {
            throw new Error('`method` must be one of the following: ' + this._vars.allowedMethods.join(', ') + '!');
        }

        this._data.method = method.toUpperCase();
        return this;
    }


    /**
     * Set/Get your feed's name…
     *
     * @param {string} [name] Name
     * @since 0.2.0
     * @returns {ICalCalendar|String}
     */
    name(name) {
        if (name === undefined) {
            return this._data.name;
        }

        this._data.name = name ? name.toString() : null;
        return this;
    }


    /**
     * Set/Get your feed's description…
     *
     * @param [description] Description
     * @since 0.2.7
     * @returns {ICalCalendar|String}
     */
    description(description) {
        if (description === undefined) {
            return this._data.description;
        }

        this._data.description = description ? description.toString() : null;
        return this;
    }


    /**
     * Set/Get your feed's timezone.
     * Used to set `X-WR-TIMEZONE`.
     *
     * @param {string} [timezone] Timezone
     * @example cal.timezone('America/New_York');
     * @since 0.2.0
     * @returns {ICalCalendar|String}
     */
    timezone(timezone) {
        if (timezone === undefined) {
            return this._data.timezone;
        }

        this._data.timezone = timezone ? timezone.toString() : null;
        return this;
    }


    /**
     * Set/Get your feed's URL
     *
     * @param {string} [url] URL
     * @example cal.url('http://example.com/my/feed.ical');
     * @since 0.2.5
     * @returns {ICalCalendar|String}
     */
    url(url) {
        if (url === undefined) {
            return this._data.url;
        }

        this._data.url = url || null;
        return this;
    }


    /**
     * Set/Get your feed's CALSCALE
     *
     * @param {string} [scale] CALSCALE
     * @example cal.scale('gregorian');
     * @since 1.8.0
     * @returns {ICalCalendar|String}
     */
    scale(scale) {
        if (scale === undefined) {
            return this._data.scale;
        }

        if (scale === null) {
            this._data.scale = null;
        } else {
            this._data.scale = scale.toUpperCase();
        }

        return this;
    }


    /**
     * Set/Get your feed's TTL.
     * Used to set `X-PUBLISHED-TTL` and `REFRESH-INTERVAL`.
     *
     * @param {Number} [ttl] TTL
     * @example cal.ttl(60 * 60 * 24); // 1 day
     * @since 0.2.5
     * @returns {ICalCalendar|Number}
     */
    ttl(ttl) {
        if (ttl === undefined) {
            return this._data.ttl;
        }

        if (moment.isDuration(ttl)) {
            this._data.ttl = ttl;
        } else if (parseInt(ttl, 10) > 0) {
            this._data.ttl = moment.duration(parseInt(ttl, 10), 'seconds');
        } else {
            this._data.ttl = null;
        }

        return this;
    }


    /**
     * Create a new Event and return the event object…
     *
     * @param {object} [eventData] Event eventData
     * @since 0.2.0
     * @returns {ICalEvent}
     */
    createEvent(eventData) {
        const event = new ICalEvent(eventData, this);
        this._data.events.push(event);
        return event;
    }


    /**
     * Get all events or add multiple events…
     *
     * @since 0.2.0
     * @returns {ICalEvent[]|ICalCalendar}
     */
    events(events) {
        if (!events) {
            return this._data.events;
        }

        const calendar = this;
        events.forEach(function (e) {
            calendar.createEvent(e);
        });

        return calendar;
    }


    /**
     * Save ical file with `fs.save`. Only works in node.js environments.
     *
     * @param {String} path Filepath
     * @param [cb] Callback
     * @returns {ICalCalendar}
     */
    save(path, cb) {
        require('fs').writeFile(path, this._generate(), cb);
        return this;
    }


    /**
     * Save ical file with `fs.saveSync`. Only works in node.js environments.
     *
     * @param {String} path Filepath
     * @returns {Number} Number of Bytes written
     */
    saveSync(path) {
        return require('fs').writeFileSync(path, this._generate());
    }


    /**
     * Save ical file with `fs.saveSync`
     *
     * @param {http.ServerResponse} response Response
     * @param {String} [filename = 'calendar.ics'] Filename
     * @returns {Number} Number of Bytes written
     */
    serve(response, filename) {
        response.writeHead(200, {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': 'attachment; filename="' + (filename || 'calendar.ics') + '"'
        });
        response.end(this._generate());

        return this;
    }


    /**
     * Returns a Blob which you can use to download or to create an url
     * so it's only working on modern browsers supporting the Blob API.
     *
     * Unfortunately, because node.js has no Blob implementation (they have Buffer
     * instead), this can't be tested right now. Sorry Dave…
     *
     * @since 1.9.0
     * @returns {Blob}
     */
    toBlob() {
        return new Blob([this._generate()], {type: 'text/calendar'});
    }


    /**
     * Returns a URL to download the ical file. Uses the Blob object internally,
     * so it's only working on modern browsers supporting this API.
     *
     * Unfortunately, because node.js has no Blob implementation (they have Buffer
     * instead), this can't be tested right now. Sorry Dave…
     *
     * @returns {String}
     */
    toURL() {
        const blob = this.toBlob();
        return URL.createObjectURL(blob);
    }


    /**
     * Return ical as string…
     *
     * @returns String ical
     */
    toString() {
        return this._generate();
    }


    /**
     * Get/Set X-* attributes. Woun't filter double attributes,
     * which are also added by another method (e.g. busystatus),
     * so these attributes may be inserted twice.
     *
     * @param {Array<Object<{key: String, value: String}>>|String} [key]
     * @param {String} [value]
     * @since 1.9.0
     * @returns {ICalEvent|Array<Object<{key: String, value: String}>>}
     */
    x (keyOrArray, value) {
        return ICalTools.addOrGetCustomAttributes (this, keyOrArray, value);
    }


    /**
     * Export calender as JSON Object to use it later…
     *
     * @since 0.2.4
     * @returns {Object} Calendar
     */
    toJSON() {
        return ICalTools.toJSON(this, this._attributes);
    }


    /**
     * Get number of events in calendar…
     *
     * @returns {Number} Number of events in calendar
     */
    length() {
        return this._data.events.length;
    }


    /**
     * Reset calendar to default state…
     *
     * @returns {ICalCalendar}
     */
    clear() {
        this._data.prodid = '//sebbo.net//ical-generator//EN';
        this._data.method = null;
        this._data.name = null;
        this._data.description = null;
        this._data.timezone = null;
        this._data.url = null;
        this._data.scale = null;
        this._data.ttl = null;
        this._data.events = [];
        this._data.x = [];
        return this;
    }


    /**
     * Method internally used to generate calendar ical string
     *
     * @returns {string}
     * @private
     */
    _generate() {
        let g = '';

        // VCALENDAR and VERSION
        g = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\n';

        // PRODID
        g += 'PRODID:-' + this._data.prodid + '\r\n';

        // URL
        if (this._data.url) {
            g += 'URL:' + this._data.url + '\r\n';
        }

        // CALSCALE
        if (this._data.scale) {
            g += 'CALSCALE:' + this._data.scale + '\r\n';
        }

        // METHOD
        if (this._data.method) {
            g += 'METHOD:' + this._data.method + '\r\n';
        }

        // NAME
        if (this._data.name) {
            g += 'NAME:' + this._data.name + '\r\n';
            g += 'X-WR-CALNAME:' + this._data.name + '\r\n';
        }

        // Description
        if (this._data.description) {
            g += 'X-WR-CALDESC:' + this._data.description + '\r\n';
        }

        // Timezone
        if (this._data.timezone) {
            g += 'TIMEZONE-ID:' + this._data.timezone + '\r\n';
            g += 'X-WR-TIMEZONE:' + this._data.timezone + '\r\n';
        }

        // TTL
        if (this._data.ttl) {
            g += 'REFRESH-INTERVAL;VALUE=DURATION:' + this._data.ttl.toISOString() + '\r\n';
            g += 'X-PUBLISHED-TTL:' + this._data.ttl.toISOString() + '\r\n';
        }

        // Events
        this._data.events.forEach(function (event) {
            g += event._generate();
        });

        // CUSTOM X ATTRIBUTES
        g += ICalTools.generateCustomAttributes(this);

        g += 'END:VCALENDAR';

        g = ICalTools.foldLines(g);
        return g;
    }
}

module.exports = ICalCalendar;

},{"./_tools":"ICalTools","./dayjs.min.js":"moment","./event":"ICalEvent","./node_modules/dayjs/plugin/utc":7,"fs":1}],"ICalCategory":[function(require,module,exports){
'use strict';


const ICalTools = require('./_tools');


/**
 * @author Sebastian Pekarek
 * @module ical-generator
 * @class ICalCategory
 */
class ICalCategory {
    constructor (data, event) {
        this._data = {
            name: null
        };
        this._attributes = [
            'name'
        ];

        this._event = event;
        if (!event) {
            throw new Error('`event` option required!');
        }

        for (let i in data) {
            if (this._attributes.indexOf(i) > -1) {
                this[i](data[i]);
            }
        }
    }


    /**
     * Set/Get the category name
     *
     * @param name Name
     * @since 0.3.0
     * @returns {ICalCategory|String}
     */
    name (name) {
        if (name === undefined) {
            return this._data.name;
        }
        if (!name) {
            this._data.name = null;
            return this;
        }

        this._data.name = name;
        return this;
    }


    /**
     * Export calender as JSON Object to use it later…
     *
     * @since 0.2.4
     * @returns {Object}
     */
    toJSON () {
        return ICalTools.toJSON(this, this._attributes);
    }


    /**
     * Export Event to iCal
     *
     * @since 0.2.0
     * @returns {String}
     */
    _generate () {

        // CN / Name
        if (!this._data.name) {
            throw new Error('No value for `name` in ICalCategory given!');
        }

        return ICalTools.escape(this._data.name);
    }
}

module.exports = ICalCategory;

},{"./_tools":"ICalTools"}],"ICalEvent":[function(require,module,exports){
'use strict';


const moment = require('./dayjs.min.js');
const ICalTools = require('./_tools');
const ICalAttendee = require('./attendee');
const ICalAlarm = require('./alarm');
const ICalCategory = require('./category');

const utc = require("./node_modules/dayjs/plugin/utc");
const timezone = require('./node_modules/dayjs/plugin/timezone');
moment.extend(utc);
moment.extend(timezone)
/**
 * @author Sebastian Pekarek
 * @class ICalEvent
 */
class ICalEvent {
    constructor (data, _calendar) {
        this._data = {
            id: ('0000000000' + Math.floor(Math.random() * Math.pow(36, 10) << 0).toString(36)).substr(-10),
            sequence: 0,
            start: null,
            end: null,
            timezone: undefined,
            stamp: moment(),
            allDay: false,
            floating: false,
            repeating: null,
            summary: '',
            location: null,
            appleLocation: null,
            geo: null,
            description: null,
            htmlDescription: null,
            organizer: null,
            attendees: [],
            alarms: [],
            categories: [],
            status: null,
            busystatus: null,
            url: null,
            transparency: null,
            created: null,
            lastModified: null,
            x: []
        };
        this._attributes = [
            'id',
            'uid',
            'sequence',
            'start',
            'end',
            'timezone',
            'stamp',
            'timestamp',
            'allDay',
            'floating',
            'repeating',
            'summary',
            'location',
            'appleLocation',
            'geo',
            'description',
            'htmlDescription',
            'organizer',
            'attendees',
            'alarms',
            'categories',
            'status',
            'busystatus',
            'url',
            'transparency',
            'created',
            'lastModified',
            'recurrenceId',
            'x'
        ];
        this._vars = {
            allowedRepeatingFreq: ['SECONDLY', 'MINUTELY', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'],
            allowedStatuses: ['CONFIRMED', 'TENTATIVE', 'CANCELLED'],
            allowedBusyStatuses: ['FREE', 'TENTATIVE', 'BUSY', 'OOF'],
            allowedTranspValues: ['TRANSPARENT', 'OPAQUE']
        };

        this._calendar = _calendar;
        if (!_calendar) {
            throw new Error('`calendar` option required!');
        }

        if (typeof data === 'string') {
            this._data = JSON.parse(data);
        }

        for (let i in data) {
            if (this._attributes.indexOf(i) > -1) {
                this[i](data[i]);
            }
        }
    }

    /**
     * Set/Get the event's ID
     *
     * @param id ID
     * @since 0.2.0
     * @param {string|number} [id]
     * @returns {ICalEvent|string|number}
     */
    id (id) {
        if (!id) {
            return this._data.id;
        }

        this._data.id = id;
        return this;
    }

    /**
     * Set/Get the event's ID
     *
     * @param id ID
     * @since 0.2.0
     * @alias id
     * @param {string|number} [id]
     * @returns {ICalEvent|string|number}
     */
    uid (id) {
        return this.id(id);
    }

    /**
     * Set/Get the event's SEQUENCE number
     *
     * @param {Number} sequence
     * @since 0.2.6
     * @returns {ICalEvent|Number}
     */
    sequence (sequence) {
        if (sequence === undefined) {
            return this._data.sequence;
        }

        const s = parseInt(sequence, 10);
        if (isNaN(s)) {
            throw new Error('`sequence` must be a number!');
        }

        this._data.sequence = s;
        return this;
    }

    /**
     * Set/Get the event's start date
     *
     * @since 0.2.0
     * @param {Date|moment|String} [start] Start date as moment.js object
     * @returns {ICalEvent|Date}
     */
    start (start) {
        if (start === undefined) {
            return this._data.start;
        }


        if (typeof start === 'string') {
            start = moment(start).utc();
        }
        else if (start instanceof Date) {
            start = moment(start).utc();
        }
        else if (!moment.isMoment(start)) {
            throw new Error('`start` must be a Date or a moment object!');
        }

        if (!start.isValid()) {
            throw new Error('`start` has to be a valid date!');
        }
        this._data.start = start;

        if (this._data.start && this._data.end && this._data.start.isAfter(this._data.end)) {
            const t = this._data.start;
            this._data.start = this._data.end;
            this._data.end = t;
        }

        return this;
    }

    /**
     * Set/Get the event's end date
     *
     * @since 0.2.0
     * @param {Date|moment|String|null} [end] End date as moment.js object
     * @returns {ICalEvent|Date}
     */
    end (end) {
        if (end === undefined) {
            return this._data.end;
        }

        if (end === null) {
            this._data.end = null;
            return this;
        }

        if (typeof end === 'string') {
            end = moment(end);
        }
        else if (end instanceof Date) {
            end = moment(end);
        }
        else if (!moment.isMoment(end)) {
            throw new Error('`end` must be a Date or a moment object!');
        }

        if (!end.isValid()) {
            throw new Error('`end` has to be a valid date!');
        }
        this._data.end = end;

        if (this._data.start && this._data.end && this._data.start.isAfter(this._data.end)) {
            const t = this._data.start;
            this._data.start = this._data.end;
            this._data.end = t;
        }

        return this;
    }

    /**
     * Set/Get the event's recurrence id
     *
     * @since 0.2.0
     * @param {Date|moment|String|null} [recurrenceId] Recurrence date as moment.js object
     * @returns {ICalEvent|Date}
     */
    recurrenceId (recurrenceId) {
        if (recurrenceId === undefined) {
            return this._data.recurrenceId;
        }

        if (typeof recurrenceId === 'string') {
            recurrenceId = moment(recurrenceId);
        }
        else if (recurrenceId instanceof Date) {
            recurrenceId = moment(recurrenceId);
        }
        else if (!moment.isMoment(recurrenceId)) {
            throw new Error('`recurrenceId` must be a Date or a moment object!');
        }

        if (!recurrenceId.isValid()) {
            throw new Error('`recurrenceId` has to be a valid date!');
        }

        this._data.recurrenceId = recurrenceId;
        return this;
    }

    /**
     * Set/Get the event's timezone.  This unsets the event's floating flag.
     * Used on date properties
     *
     * @param {string} [timezone] Timezone
     * @example event.timezone('America/New_York');
     * @since 0.2.6
     * @returns {ICalEvent|String}
     */
    timezone (timezone) {
        if (timezone === undefined && this._data.timezone !== undefined) {
            return this._data.timezone;
        }
        if (timezone === undefined) {
            return this._calendar._data.timezone;
        }

        this._data.timezone = timezone ? timezone.toString() : null;
        if (this._data.timezone) {
            this._data.floating = false;
        }

        return this;
    }

    /**
     * Set/Get the event's timestamp
     *
     * @param {Date|moment|String} [stamp]
     * @since 0.2.0
     * @returns {ICalEvent|moment}
     */
    stamp (stamp) {
        if (stamp === undefined) {
            return this._data.stamp;
        }

        if (typeof stamp === 'string') {
            stamp = moment(stamp);
        }
        else if (stamp instanceof Date) {
            stamp = moment(stamp);
        }
        else if (!moment.isMoment(stamp)) {
            throw new Error('`stamp` must be a Date or a moment object!');
        }

        if (!stamp.isValid()) {
            throw new Error('`stamp` has to be a valid date!');
        }

        this._data.stamp = stamp;
        return this;
    }

    /**
     * Set/Get the event's timestamp
     *
     * @param {Date|moment|String} [stamp]
     * @since 0.2.0
     * @alias stamp
     * @returns {ICalEvent|moment}
     */
    timestamp (stamp) {
        return this.stamp(stamp);
    }

    /**
     * Set/Get the event's allDay flag
     *
     * @param {Boolean} [allDay]
     * @since 0.2.0
     * @returns {ICalEvent|Boolean}
     */
    allDay (allDay) {
        if (allDay === undefined) {
            return this._data.allDay;
        }

        this._data.allDay = !!allDay;
        return this;
    }

    /**
     * Set/Get the event's floating flag.  This unsets the event's timezone.
     * See https://tools.ietf.org/html/rfc5545#section-3.3.12
     *
     * @param {Boolean} floating
     * @since 0.2.0
     * @returns {ICalEvent|Boolean}
     */
    floating (floating) {
        if (floating === undefined) {
            return this._data.floating;
        }

        this._data.floating = !!floating;
        if (this._data.floating) {
            this._data.timezone = null;
        }
        return this;
    }

    /**
     * Set/Get the event's repeating stuff
     *
     * @param {object} [repeating]
     * @param {String} [repeating.freq]
     * @param {Number} [repeating.count]
     * @param {Number} [repeating.interval]
     * @param {Date|moment|String} [repeating.until]
     * @param {String} [repeating.byDay]
     * @param {Number} [repeating.byMonth]
     * @param {Number} [repeating.byMonthDay]
     * @param {Array<Date|moment|String>} [repeating.excluded]
     * @since 0.2.0
     * @returns {ICalEvent|Object}
     */
    repeating (repeating) {
        const c = this;

        if (repeating === undefined) {
            return c._data.repeating;
        }
        if (!repeating) {
            c._data.repeating = null;
            return c;
        }

        if (!repeating.freq || c._vars.allowedRepeatingFreq.indexOf(repeating.freq.toUpperCase()) === -1) {
            throw new Error(
                '`repeating.freq` is a mandatory item, and must be one of the following: ' +
                c._vars.allowedRepeatingFreq.join(', ') + '!'
            );
        }
        c._data.repeating = {
            freq: repeating.freq.toUpperCase()
        };

        if (repeating.count) {
            if (!isFinite(repeating.count)) {
                throw new Error('`repeating.count` must be a Number!');
            }

            c._data.repeating.count = repeating.count;
        }

        if (repeating.interval) {
            if (!isFinite(repeating.interval)) {
                throw new Error('`repeating.interval` must be a Number!');
            }

            c._data.repeating.interval = repeating.interval;
        }

        if (repeating.until !== undefined) {
            let {until} = repeating;

            if (typeof until === 'string') {
                until = moment(repeating.until);
            }
            else if (until instanceof Date) {
                until = moment(repeating.until);
            }
            else if (!moment.isMoment(until)) {
                throw new Error('`repeating.until` must be a Date or a moment object!');
            }

            if (!until.isValid()) {
                throw new Error('`repeating.until` has to be a valid date!');
            }

            c._data.repeating.until = until;
        }

        if (repeating.byDay) {
            let {byDay} = repeating;

            if (!Array.isArray(byDay)) {
                byDay = [byDay];
            }

            c._data.repeating.byDay = [];
            byDay.forEach(function (symbol) {
                const s = symbol.toString().toUpperCase().match(/^(\d*||-\d+)(\w+)$/);
                if (['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].indexOf(s[2]) === -1) {
                    throw new Error('`repeating.byDay` contains invalid value `' + s[2] + '`!');
                }

                c._data.repeating.byDay.push(s[1] + s[2]);
            });
        }

        if (repeating.byMonth) {
            let {byMonth} = repeating;

            if (!Array.isArray(byMonth)) {
                byMonth = [byMonth];
            }

            c._data.repeating.byMonth = [];
            byMonth.forEach(function (month) {
                if (typeof month !== 'number' || month < 1 || month > 12) {
                    throw new Error('`repeating.byMonth` contains invalid value `' + month + '`!');
                }

                c._data.repeating.byMonth.push(month);
            });
        }

        if (repeating.byMonthDay) {
            let {byMonthDay} = repeating;

            if (!Array.isArray(byMonthDay)) {
                byMonthDay = [byMonthDay];
            }

            c._data.repeating.byMonthDay = [];
            byMonthDay.forEach(function (monthDay) {
                if (typeof monthDay !== 'number' || monthDay < 1 || monthDay > 31) {
                    throw new Error('`repeating.byMonthDay` contains invalid value `' + monthDay + '`!');
                }

                c._data.repeating.byMonthDay.push(monthDay);
            });
        }

        if (repeating.bySetPos) {
            if (!repeating.byDay) {
                throw '`repeating.bySetPos` must be used along with `repeating.byDay`!';
            }
            if (typeof repeating.bySetPos !== 'number' || repeating.bySetPos < -1 || repeating.bySetPos > 4) {
                throw '`repeating.bySetPos` contains invalid value `' + repeating.bySetPos + '`!';
            }

            c._data.repeating.byDay.splice(1);
            c._data.repeating.bySetPos = repeating.bySetPos;
        }

        if (repeating.exclude) {
            let {exclude} = repeating;

            if (!Array.isArray(exclude)) {
                exclude = [exclude];
            }

            c._data.repeating.exclude = [];
            exclude.forEach(function (excludedDate, i) {
                if (typeof excludedDate === 'string') {
                    let timezone = repeating.excludeTimezone || c._calendar._data.timezone;
                    if (timezone) {
                        excludedDate = moment.tz(excludedDate, timezone);
                    }
                    else {
                        excludedDate = moment(excludedDate);
                    }
                }
                else if (excludedDate instanceof Date) {
                    excludedDate = moment(excludedDate);
                }
                else if (!moment.isMoment(excludedDate)) {
                    throw new Error('`repeating.exclude[' + i + ']` must be a Date or a moment object!');
                }

                if (!excludedDate.isValid()) {
                    throw new Error('`repeating.exclude[' + i + ']` has to be a valid date!');
                }

                c._data.repeating.exclude.push(excludedDate);
            });
        }

        if (repeating.excludeTimezone) {
            if (!c._data.repeating.exclude) {
                throw '`repeating.excludeTimezone` must be used along with `repeating.exclude`!';
            }

            c._data.repeating.excludeTimezone = repeating.excludeTimezone;
        }

        if (repeating.wkst) {
            let {wkst} = repeating;
            if (['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].indexOf(wkst) === -1) {
                throw new Error('`repeating.wkst` contains invalid value `' + wkst + '`!');
            }
            c._data.repeating.wkst = wkst;
        }

        return c;
    }

    /**
     * Set/Get the event's summary
     *
     * @param {String} [summary]
     * @since 0.2.0
     * @returns {ICalEvent|String}
     */
    summary (summary) {
        if (summary === undefined) {
            return this._data.summary;
        }

        this._data.summary = summary ? summary.toString() : '';
        return this;
    }


    /**
     * Set/Get the event's location
     *
     * @param {String} [location]
     * @since 0.2.0
     * @returns {ICalEvent|String}
     */
    location (location) {
        if (location === undefined) {
            return this._data.location;
        }
        if (this._data.appleLocation && location) {
            this._data.appleLocation = null;
        }

        this._data.location = location ? location.toString() : null;
        return this;
    }

    /**
     * Set/Get the Apple event's location
     *
     * @param {object|null} [appleLocation]
     * @param {string} [appleLocation.title]
     * @param {string} [appleLocation.address]
     * @param {number} [appleLocation.radius]
     * @param {object} [appleLocation.geo]
     * @param {string|number} [appleLocation.lat]
     * @param {string|number} [appleLocation.lon]
     * @since 1.10.0
     * @returns {ICalEvent|String}
     */
    appleLocation (appleLocation) {
        if (appleLocation === undefined) {
            return this._data.appleLocation;
        }
        if (appleLocation === null) {
            this._data.location = null;
            return this;
        }

        if (!appleLocation.title || !appleLocation.address || !appleLocation.radius || !appleLocation.geo || !appleLocation.geo.lat || !appleLocation.geo.lon) {
            throw new Error('`appleLocation` isn\'t formatted correctly. See https://github.com/sebbo2002/ical-generator#applelocationobject-applelocation');
        }

        this._data.appleLocation = appleLocation;
        this._data.location = this._data.appleLocation.title + '\n' + this._data.appleLocation.address;
        return this;
    }

    /**
     * Set/Get the event's geo
     *
     * @param {String|object} [geo]
     * @since 1.5.0
     * @returns {ICalEvent|String}
     */
    geo (geo) {
        if (geo === undefined) {
            if (!this._data.geo) {
                return null;
            }
            else {
                return this._data.geo.lat + ';' + this._data.geo.lon;
            }
        }

        let geoStruct = {};
        if (typeof geo === 'string') {
            const geoParts = geo.split(';');
            geoStruct.lat = parseFloat(geoParts[0]);
            geoStruct.lon = parseFloat(geoParts[1]);
        }
        else {
            geoStruct = geo;
        }

        if (geoStruct !== null && (!geoStruct || !isFinite(geoStruct.lat) || !isFinite(geoStruct.lon))) {
            throw new Error('`geo` isn\'t formated correctly. See https://github.com/sebbo2002/ical-generator#geostringobject-geo');
        }
        else {
            this._data.geo = geoStruct;
        }

        return this;
    }


    /**
     * Set/Get the event's description
     *
     * @param {String} [description]
     * @since 0.2.0
     * @returns {ICalEvent|String}
     */
    description (description) {
        if (description === undefined) {
            return this._data.description;
        }

        this._data.description = description ? description.toString() : null;
        return this;
    }

    /**
     * Set/Get the event's HTML description
     *
     * @param {String} [description]
     * @since 0.2.8
     * @returns {ICalEvent|String}
     */
    htmlDescription (htmlDescription) {
        if (htmlDescription === undefined) {
            return this._data.htmlDescription;
        }

        this._data.htmlDescription = htmlDescription ? htmlDescription.toString() : null;
        return this;
    }


    /**
     * Set/Get the event's organizer
     *
     * @param {String|Object} [organizer]
     * @param {String} [organizer.name]
     * @param {String} [organizer.email]
     * @param {String} [organizer.mailto]
     * @since 0.2.0
     * @returns {ICalEvent|Object}
     */
    organizer (_organizer) {
        if (_organizer === undefined) {
            return this._data.organizer;
        }
        if (_organizer === null) {
            this._data.organizer = null;
            return this;
        }

        let organizer = null;
        const organizerRegEx = /^(.+) ?<([^>]+)>$/;

        if (typeof _organizer === 'string') {
            const organizerRegExMatch = _organizer.match(organizerRegEx);
            if (organizerRegExMatch) {
                organizer = {
                    name: organizerRegExMatch[1].trim(),
                    email: organizerRegExMatch[2]
                };
            }
        }
        else if (typeof _organizer === 'object') {
            organizer = {
                name: _organizer.name,
                email: _organizer.email,
                mailto: _organizer.mailto
            };
        }

        if (!organizer && typeof _organizer === 'string') {
            throw new Error(
                '`organizer` isn\'t formated correctly. See https://github.com/sebbo2002/ical-generator#organizer' +
                'stringobject-organizer'
            );
        }
        else if (!organizer) {
            throw new Error(
                '`organizer` needs to be a valid formed string or an object. See https://github.com/sebbo2002/ical-' +
                'generator#organizerstringobject-organizer'
            );
        }

        if (!organizer.name) {
            throw new Error('`organizer.name` is empty!');
        }
        if (!organizer.email) {
            throw new Error('`organizer.email` is empty!');
        }

        this._data.organizer = {
            name: organizer.name,
            email: organizer.email
        };

        if (organizer.mailto) {
            this._data.organizer.mailto = organizer.mailto;
        }

        return this;
    }


    /**
     * Create a new Attendee and return the attendee object…
     *
     * @param {String|Object|ICalAttendee} [attendeeData] Attendee options
     * @param {String} [attendeeData.name]
     * @param {String} [attendeeData.email]
     * @since 0.2.0
     * @returns {ICalAttendee}
     */
    createAttendee (_attendeeData) {
        const attendeeRegEx = /^(.+) ?<([^>]+)>$/;
        let attendee;

        if (_attendeeData instanceof ICalAttendee) {
            this._data.attendees.push(_attendeeData);
            return _attendeeData;
        }

        if (typeof _attendeeData === 'string') {
            const attendeeRegexMatch = _attendeeData.match(attendeeRegEx);
            if (attendeeRegexMatch) {
                attendee = new ICalAttendee({
                    name: attendeeRegexMatch[1].trim(),
                    email: attendeeRegexMatch[2]
                }, this);

                this._data.attendees.push(attendee);
                return attendee;
            }
        }
        if (typeof _attendeeData === 'string') {
            throw new Error(
                '`attendee` isn\'t formated correctly. See https://github.com/sebbo2002/ical-generator#create' +
                'attendeeobject-options'
            );
        }

        attendee = new ICalAttendee(_attendeeData, this);
        this._data.attendees.push(attendee);
        return attendee;
    }


    /**
     * Get all attendees or add attendees…
     *
     * @since 0.2.0
     * @param {Array<String|Object>} [attendees]
     * @returns {ICalAttendees[]|ICalEvent}
     */
    attendees (attendees) {
        if (!attendees) {
            return this._data.attendees;
        }

        const cal = this;
        attendees.forEach(function (e) {
            cal.createAttendee(e);
        });

        return cal;
    }


    /**
     * Create a new Alarm and return the alarm object…
     *
     * @param {object} [alarmData] Alarm-Options
     * @since 0.2.1
     * @returns {ICalAlarm}
     */
    createAlarm (alarmData) {
        const alarm = new ICalAlarm(alarmData, this);

        this._data.alarms.push(alarm);
        return alarm;
    }


    /**
     * Get all alarms or add alarms…
     *
     * @param {Array<Object>} [alarms]
     * @since 0.2.0
     * @returns {ICalAlarms[]|ICalEvent}
     */
    alarms (alarms) {
        if (!alarms) {
            return this._data.alarms;
        }

        const cal = this;
        alarms.forEach(function (e) {
            cal.createAlarm(e);
        });

        return cal;
    }


    /**
     * Create a new categorie and return the category object…
     *
     * @param {object} [categoryData] Category-Options
     * @since 0.3.0
     * @returns {ICalCategory}
     */
    createCategory (categoryData) {
        const category = new ICalCategory(categoryData, this);

        this._data.categories.push(category);
        return category;
    }


    /**
     * Get all categories or add categories…
     *
     * @param {Array<Object>} [categorie]
     * @since 0.3.0
     * @returns {ICalCategories[]|ICalEvent}
     */
    categories (categories) {
        if (!categories) {
            return this._data.categories;
        }

        const cal = this;
        categories.forEach(function (e) {
            cal.createCategory(e);
        });

        return cal;
    }


    /**
     * Set/Get the event's status
     *
     * @param {String} [status]
     * @since 0.2.0
     * @returns {ICalEvent|String}
     */
    status (status) {
        if (status === undefined) {
            return this._data.status;
        }
        if (status === null) {
            this._data.status = null;
            return this;
        }

        if (this._vars.allowedStatuses.indexOf(status.toString().toUpperCase()) === -1) {
            throw new Error('`status` must be one of the following: ' + this._vars.allowedStatuses.join(', ') + '!');
        }

        this._data.status = status.toString().toUpperCase();
        return this;
    }


    /**
     * Set/Get the event's busy status on Microsoft param
     *
     * @param {String} [busystatus]
     * @since 1.0.2
     * @returns {ICalEvent|String}
     */
    busystatus (busystatus) {
        if (busystatus === undefined) {
            return this._data.busystatus;
        }
        if (busystatus === null) {
            this._data.busystatus = null;
            return this;
        }

        if (this._vars.allowedBusyStatuses.indexOf(busystatus.toString().toUpperCase()) === -1) {
            throw new Error('`busystatus` must be one of the following: ' + this._vars.allowedBusyStatuses.join(', ') + '!');
        }

        this._data.busystatus = busystatus.toString().toUpperCase();
        return this;
    }


    /**
     * Set/Get the event's URL
     *
     * @param {String} [url] URL
     * @since 0.2.0
     * @returns {ICalEvent|String}
     */
    url (url) {
        if (url === undefined) {
            return this._data.url;
        }

        this._data.url = url ? url.toString() : null;
        return this;
    }

    /**
     * Set/Get the event's transparency
     *
     * @param {String} transparency
     * @since 1.7.3
     * @returns {ICalEvent|String}
     */
    transparency (transparency) {
        if (transparency === undefined) {
            return this._data.transparency;
        }
        if (!transparency) {
            this._data.transparency = null;
            return this;
        }

        if (this._vars.allowedTranspValues.indexOf(transparency.toString().toUpperCase()) === -1) {
            throw new Error('`transparency` must be one of the following: ' + this._vars.allowedTranspValues.join(', ') + '!');
        }

        this._data.transparency = transparency.toUpperCase();
        return this;
    }


    /**
     * Set/Get the event's creation date
     *
     * @param {moment|Date|String|Number} created
     * @since 0.3.0
     * @returns {ICalEvent|moment}
     */
    created (created) {
        if (created === undefined) {
            return this._data.created;
        }

        if (typeof created === 'string' || typeof created === 'number' || created instanceof Date) {
            created = moment(created);
        }
        if (!moment.isMoment(created) || !created.isValid()) {
            throw new Error('Invalid `created` date!');
        }

        this._data.created = created;
        return this;
    }


    /**
     * Set/Get the event's last modification date
     *
     * @param {moment|Date|String|Number} lastModified
     * @since 0.3.0
     * @returns {ICalEvent|moment}
     */
    lastModified (lastModified) {
        if (lastModified === undefined) {
            return this._data.lastModified;
        }

        if (typeof lastModified === 'string' || typeof lastModified === 'number' || lastModified instanceof Date) {
            lastModified = moment(lastModified);
        }
        if (!moment.isMoment(lastModified) || !lastModified.isValid()) {
            throw new Error('Invalid `lastModified` date!');
        }

        this._data.lastModified = lastModified;
        return this;
    }


    /**
     * Get/Set X-* attributes. Woun't filter double attributes,
     * which are also added by another method (e.g. busystatus),
     * so these attributes may be inserted twice.
     *
     * @param {Array<Object<{key: String, value: String}>>|String} [key]
     * @param {String} [value]
     * @since 1.9.0
     * @returns {ICalEvent|Array<Object<{key: String, value: String}>>}
     */
    x (keyOrArray, value) {
        return ICalTools.addOrGetCustomAttributes(this, keyOrArray, value);
    }


    /**
     * Export calender as JSON Object to use it later…
     *
     * @since 0.2.4
     * @returns {Object} Calendar
     */
    toJSON () {
        return ICalTools.toJSON(this, this._attributes);
    }


    /**
     * Export Event to iCal
     *
     * @param {ICalCalendar}
     * @since 0.2.0
     * @returns {String}
     */
    _generate () {
        let g = '';

        if (!this._data.start) {
            throw new Error('No value for `start` in ICalEvent #' + this._data.id + ' given!');
        }

        // DATE & TIME
        g += 'BEGIN:VEVENT\r\n';
        let domain = this._calendar.domain();
        if (domain) {
            g += 'UID:' + this._data.id + '@' + domain + '\r\n';
        }
        else {
            g += 'UID:' + this._data.id + '\r\n';
        }

        // SEQUENCE
        g += 'SEQUENCE:' + this._data.sequence + '\r\n';

        g += 'DTSTAMP:' + ICalTools.formatDate(this._calendar.timezone(), this._data.stamp) + '\r\n';
        if (this._data.allDay) {
            g += 'DTSTART;VALUE=DATE:' + ICalTools.formatDate(this._calendar.timezone(), this._data.start, true) + '\r\n';
            if (this._data.end) {
                g += 'DTEND;VALUE=DATE:' + ICalTools.formatDate(this._calendar.timezone(), this._data.end, true) + '\r\n';
            }

            g += 'X-MICROSOFT-CDO-ALLDAYEVENT:TRUE\r\n';
            g += 'X-MICROSOFT-MSNCALENDAR-ALLDAYEVENT:TRUE\r\n';
        }
        else {
            g += ICalTools.formatDateTZ(this.timezone(), 'DTSTART', this._data.start, this._data) + '\r\n';
            if (this._data.end) {
                g += ICalTools.formatDateTZ(this.timezone(), 'DTEND', this._data.end, this._data) + '\r\n';
            }
        }

        // REPEATING
        if (this._data.repeating) {
            g += 'RRULE:FREQ=' + this._data.repeating.freq;

            if (this._data.repeating.count) {
                g += ';COUNT=' + this._data.repeating.count;
            }

            if (this._data.repeating.interval) {
                g += ';INTERVAL=' + this._data.repeating.interval;
            }

            if (this._data.repeating.until) {
                g += ';UNTIL=' + ICalTools.formatDate(this._calendar.timezone(), this._data.repeating.until);
            }

            if (this._data.repeating.byDay) {
                g += ';BYDAY=' + this._data.repeating.byDay.join(',');
            }

            if (this._data.repeating.byMonth) {
                g += ';BYMONTH=' + this._data.repeating.byMonth.join(',');
            }

            if (this._data.repeating.byMonthDay) {
                g += ';BYMONTHDAY=' + this._data.repeating.byMonthDay.join(',');
            }

            if (this._data.repeating.bySetPos) {
                g += ';BYSETPOS=' + this._data.repeating.bySetPos;
            }

            if (this._data.repeating.wkst) {
                g += ';WKST=' + this._data.repeating.wkst;
            }

            g += '\r\n';

            // REPEATING EXCLUSION
            if (this._data.repeating.exclude) {
                if (this._data.allDay) {
                    g += 'EXDATE;VALUE=DATE:' + this._data.repeating.exclude.map(excludedDate => {
                        return ICalTools.formatDate(this._calendar.timezone(), excludedDate, true);
                    }).join(',') + '\r\n';
                }
                else {
                    g += 'EXDATE';
                    if (this._data.repeating.excludeTimezone) {
                        g += ';TZID=' + this._data.repeating.excludeTimezone + ':' + this._data.repeating.exclude.map(excludedDate => {
                            // This isn't a 'floating' event because it has a timezone;
                            // but we use it to omit the 'Z' UTC specifier in formatDate()
                            return ICalTools.formatDate(this._data.repeating.excludeTimezone, excludedDate, false, true);
                        }).join(',') + '\r\n';
                    }
                    else {
                        g += ':' + this._data.repeating.exclude.map(excludedDate => {
                            return ICalTools.formatDate(this._calendar.timezone(), excludedDate);
                        }).join(',') + '\r\n';
                    }
                }
            }
        }

        // RECURRENCE
        if (this._data.recurrenceId) {
            g += ICalTools.formatDateTZ(this.timezone(), 'RECURRENCE-ID', this._data.recurrenceId, this._data) + '\r\n';
        }

        // SUMMARY
        g += 'SUMMARY:' + ICalTools.escape(this._data.summary) + '\r\n';

        // TRANSPARENCY
        if (this._data.transparency) {
            g += 'TRANSP:' + ICalTools.escape(this._data.transparency) + '\r\n';
        }

        // LOCATION
        if (this._data.location) {
            g += 'LOCATION:' + ICalTools.escape(this._data.location) + '\r\n';
        }

        // APPLE LOCATION
        if (this._data.appleLocation) {
            g += 'X-APPLE-STRUCTURED-LOCATION;VALUE=URI;X-ADDRESS=' + ICalTools.escape(this._data.appleLocation.address) + ';X-APPLE-RADIUS=' + ICalTools.escape(this._data.appleLocation.radius) + ';X-TITLE=' + ICalTools.escape(this._data.appleLocation.title) +
                ':geo:' + ICalTools.escape(this._data.appleLocation.geo.lat) + ',' + ICalTools.escape(this._data.appleLocation.geo.lon) + '\r\n';
        }

        // GEO
        if (this._data.geo) {
            g += 'GEO:' + ICalTools.escape(this._data.geo.lat) + ';' + ICalTools.escape(this._data.geo.lon) + '\r\n';
        }

        // DESCRIPTION
        if (this._data.description) {
            g += 'DESCRIPTION:' + ICalTools.escape(this._data.description) + '\r\n';
        }

        // HTML DESCRIPTION
        if (this._data.htmlDescription) {
            g += 'X-ALT-DESC;FMTTYPE=text/html:' + ICalTools.escape(this._data.htmlDescription) + '\r\n';
        }

        // ORGANIZER
        if (this._data.organizer) {
            g += 'ORGANIZER;CN="' + ICalTools.escape(this._data.organizer.name) + '"';
            if (this._data.organizer.email && this._data.organizer.mailto) {
                g += ';EMAIL=' + ICalTools.escape(this._data.organizer.email);
            }
            g += ':mailto:' + ICalTools.escape(this._data.organizer.mailto || this._data.organizer.email) + '\r\n';
        }

        // ATTENDEES
        this._data.attendees.forEach(function (attendee) {
            g += attendee._generate();
        });

        // ALARMS
        this._data.alarms.forEach(function (alarm) {
            g += alarm._generate();
        });

        // CATEGORIES
        if (this._data.categories.length > 0) {
            g += 'CATEGORIES:' + this._data.categories.map(function (category) {
                return category._generate();
            }).join() + '\r\n';
        }

        // URL
        if (this._data.url) {
            g += 'URL;VALUE=URI:' + ICalTools.escape(this._data.url) + '\r\n';
        }

        // STATUS
        if (this._data.status) {
            g += 'STATUS:' + this._data.status.toUpperCase() + '\r\n';
        }

        // BUSYSTATUS
        if (this._data.busystatus) {
            g += 'X-MICROSOFT-CDO-BUSYSTATUS:' + this._data.busystatus.toUpperCase() + '\r\n';
        }

        // CUSTOM X ATTRIBUTES
        g += ICalTools.generateCustomAttributes(this);

        // CREATED
        if (this._data.created) {
            g += 'CREATED:' + ICalTools.formatDate(this._calendar.timezone(), this._data.created) + '\r\n';
        }

        // LAST-MODIFIED
        if (this._data.lastModified) {
            g += 'LAST-MODIFIED:' + ICalTools.formatDate(this._calendar.timezone(), this._data.lastModified) + '\r\n';
        }

        g += 'END:VEVENT\r\n';
        return g;
    }
}

module.exports = ICalEvent;

},{"./_tools":"ICalTools","./alarm":"ICalAlarm","./attendee":"ICalAttendee","./category":"ICalCategory","./dayjs.min.js":"moment","./node_modules/dayjs/plugin/timezone":6,"./node_modules/dayjs/plugin/utc":7}],"ICalTools":[function(require,module,exports){
(function (Buffer){(function (){
'use strict';

const moment = require('./dayjs.min.js');
const utc = require("./node_modules/dayjs/plugin/utc");
const timezone = require('./node_modules/dayjs/plugin/timezone');
moment.extend(utc);
moment.extend(timezone)
/**
 * @author Sebastian Pekarek
 * @module ical-generator
 * @class ICalTools
 */
class ICalTools {
    static formatDate (timezone, d, dateonly, floating) {
        let m = timezone ? moment(d).tz(timezone) : moment(d).utc();
        if (!dateonly && !floating) {
            m = moment(d).utc();
        }

        let s = m.format('YYYYMMDD');
        if (!dateonly) {
            s += 'T';
            s += m.format('HHmmss');

            if (!floating) {
                s += 'Z';
            }
        }

        return s;
    }

    // For information about this format, see RFC 5545, section 3.3.5
    // https://tools.ietf.org/html/rfc5545#section-3.3.5
    static formatDateTZ (timezone, property, date, eventData) {
        let tzParam = '';
        let floating = eventData.floating;

        if (eventData.timezone) {
            tzParam = ';TZID=' + eventData.timezone;

            // This isn't a 'floating' event because it has a timezone;
            // but we use it to omit the 'Z' UTC specifier in formatDate()
            floating = true;
        }

        return property + tzParam + ':' + module.exports.formatDate(timezone, date, false, floating);
    }

    static escape (str) {
        return String(str).replace(/[\\;,"]/g, function (match) {
            return '\\' + match;
        }).replace(/(?:\r\n|\r|\n)/g, '\\n');
    }

    static toJSON (object, attributes, options) {
        const result = {};
        options = options || {};
        options.ignoreAttributes = options.ignoreAttributes || [];
        options.hooks = options.hooks || {};

        attributes.forEach(function (attribute) {
            if (options.ignoreAttributes.indexOf(attribute) !== -1) {
                return;
            }

            let value = object[attribute](),
                newObj;

            if (moment.isMoment(value)) {
                value = value.toJSON();
            }
            if (options.hooks[attribute]) {
                value = options.hooks[attribute](value);
            }
            if (!value) {
                return;
            }

            result[attribute] = value;

            if (Array.isArray(result[attribute])) {
                newObj = [];
                result[attribute].forEach(function (object) {
                    ('toJSON' in object) ? newObj.push(object.toJSON()) : newObj.push(object);
                });
                result[attribute] = newObj;
            }
        });

        return result;
    }

    static foldLines (input) {
        return input.split('\r\n').map(function (line) {
            let result = '';
            let c = 0;
            for (let i = 0; i < line.length; i++) {
                let ch = line.charAt(i);

                // surrogate pair, see https://mathiasbynens.be/notes/javascript-encoding#surrogate-pairs
                if (ch >= '\ud800' && ch <= '\udbff') {
                    ch += line.charAt(++i);
                }

                const charsize = Buffer.from(ch).length;
                c += charsize;
                if (c > 74) {
                    result += '\r\n ';
                    c = charsize;
                }

                result += ch;
            }
            return result;
        }).join('\r\n');
    }

    static addOrGetCustomAttributes (instance, keyOrArray, value) {
        if (Array.isArray(keyOrArray)) {
            instance._data.x = keyOrArray.map(o => {
                if (typeof o.key !== 'string' || typeof o.value !== 'string') {
                    throw new Error('Either key or value is not a string!');
                }
                if (o.key.substr(0, 2) !== 'X-') {
                    throw new Error('Key has to start with `X-`!');
                }

                return [o.key, o.value];
            });
        }
        else if (typeof keyOrArray === 'object') {
            instance._data.x = Object.entries(keyOrArray).map(([key, value]) => {
                if (typeof key !== 'string' || typeof value !== 'string') {
                    throw new Error('Either key or value is not a string!');
                }
                if (key.substr(0, 2) !== 'X-') {
                    throw new Error('Key has to start with `X-`!');
                }

                return [key, value];
            });
        }
        else if (typeof keyOrArray === 'string' && typeof value === 'string') {
            if (keyOrArray.substr(0, 2) !== 'X-') {
                throw new Error('Key has to start with `X-`!');
            }

            instance._data.x.push([keyOrArray, value]);
        }
        else if (keyOrArray !== undefined || value !== undefined) {
            throw new Error('Either key or value is not a string!');
        }
        else {
            return instance._data.x.map(a => ({
                key: a[0],
                value: a[1]
            }));
        }

        return instance;
    }

    static generateCustomAttributes (instance) {
        const str = instance._data.x
            .map(([key, value]) => key.toUpperCase() + ':' + ICalTools.escape(value))
            .join('\r\n');
        return str.length ? str + '\r\n' : '';
    }
}

module.exports = ICalTools;

}).call(this)}).call(this,require("buffer").Buffer)
},{"./dayjs.min.js":"moment","./node_modules/dayjs/plugin/timezone":6,"./node_modules/dayjs/plugin/utc":7,"buffer":3}],"moment":[function(require,module,exports){
!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):t.dayjs=e()}(this,function(){"use strict";var t="millisecond",e="second",n="minute",r="hour",i="day",s="week",u="month",a="quarter",o="year",f="date",h=/^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[^0-9]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/,c=/\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g,d={name:"en",weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_")},$=function(t,e,n){var r=String(t);return!r||r.length>=e?t:""+Array(e+1-r.length).join(n)+t},l={s:$,z:function(t){var e=-t.utcOffset(),n=Math.abs(e),r=Math.floor(n/60),i=n%60;return(e<=0?"+":"-")+$(r,2,"0")+":"+$(i,2,"0")},m:function t(e,n){if(e.date()<n.date())return-t(n,e);var r=12*(n.year()-e.year())+(n.month()-e.month()),i=e.clone().add(r,u),s=n-i<0,a=e.clone().add(r+(s?-1:1),u);return+(-(r+(n-i)/(s?i-a:a-i))||0)},a:function(t){return t<0?Math.ceil(t)||0:Math.floor(t)},p:function(h){return{M:u,y:o,w:s,d:i,D:f,h:r,m:n,s:e,ms:t,Q:a}[h]||String(h||"").toLowerCase().replace(/s$/,"")},u:function(t){return void 0===t}},y="en",M={};M[y]=d;var m=function(t){return t instanceof S},D=function(t,e,n){var r;if(!t)return y;if("string"==typeof t)M[t]&&(r=t),e&&(M[t]=e,r=t);else{var i=t.name;M[i]=t,r=i}return!n&&r&&(y=r),r||!n&&y},v=function(t,e){if(m(t))return t.clone();var n="object"==typeof e?e:{};return n.date=t,n.args=arguments,new S(n)},g=l;g.l=D,g.i=m,g.w=function(t,e){return v(t,{locale:e.$L,utc:e.$u,x:e.$x,$offset:e.$offset})};var S=function(){function d(t){this.$L=D(t.locale,null,!0),this.parse(t)}var $=d.prototype;return $.parse=function(t){this.$d=function(t){var e=t.date,n=t.utc;if(null===e)return new Date(NaN);if(g.u(e))return new Date;if(e instanceof Date)return new Date(e);if("string"==typeof e&&!/Z$/i.test(e)){var r=e.match(h);if(r){var i=r[2]-1||0,s=(r[7]||"0").substring(0,3);return n?new Date(Date.UTC(r[1],i,r[3]||1,r[4]||0,r[5]||0,r[6]||0,s)):new Date(r[1],i,r[3]||1,r[4]||0,r[5]||0,r[6]||0,s)}}return new Date(e)}(t),this.$x=t.x||{},this.init()},$.init=function(){var t=this.$d;this.$y=t.getFullYear(),this.$M=t.getMonth(),this.$D=t.getDate(),this.$W=t.getDay(),this.$H=t.getHours(),this.$m=t.getMinutes(),this.$s=t.getSeconds(),this.$ms=t.getMilliseconds()},$.$utils=function(){return g},$.isValid=function(){return!("Invalid Date"===this.$d.toString())},$.isSame=function(t,e){var n=v(t);return this.startOf(e)<=n&&n<=this.endOf(e)},$.isAfter=function(t,e){return v(t)<this.startOf(e)},$.isBefore=function(t,e){return this.endOf(e)<v(t)},$.$g=function(t,e,n){return g.u(t)?this[e]:this.set(n,t)},$.unix=function(){return Math.floor(this.valueOf()/1e3)},$.valueOf=function(){return this.$d.getTime()},$.startOf=function(t,a){var h=this,c=!!g.u(a)||a,d=g.p(t),$=function(t,e){var n=g.w(h.$u?Date.UTC(h.$y,e,t):new Date(h.$y,e,t),h);return c?n:n.endOf(i)},l=function(t,e){return g.w(h.toDate()[t].apply(h.toDate("s"),(c?[0,0,0,0]:[23,59,59,999]).slice(e)),h)},y=this.$W,M=this.$M,m=this.$D,D="set"+(this.$u?"UTC":"");switch(d){case o:return c?$(1,0):$(31,11);case u:return c?$(1,M):$(0,M+1);case s:var v=this.$locale().weekStart||0,S=(y<v?y+7:y)-v;return $(c?m-S:m+(6-S),M);case i:case f:return l(D+"Hours",0);case r:return l(D+"Minutes",1);case n:return l(D+"Seconds",2);case e:return l(D+"Milliseconds",3);default:return this.clone()}},$.endOf=function(t){return this.startOf(t,!1)},$.$set=function(s,a){var h,c=g.p(s),d="set"+(this.$u?"UTC":""),$=(h={},h[i]=d+"Date",h[f]=d+"Date",h[u]=d+"Month",h[o]=d+"FullYear",h[r]=d+"Hours",h[n]=d+"Minutes",h[e]=d+"Seconds",h[t]=d+"Milliseconds",h)[c],l=c===i?this.$D+(a-this.$W):a;if(c===u||c===o){var y=this.clone().set(f,1);y.$d[$](l),y.init(),this.$d=y.set(f,Math.min(this.$D,y.daysInMonth())).$d}else $&&this.$d[$](l);return this.init(),this},$.set=function(t,e){return this.clone().$set(t,e)},$.get=function(t){return this[g.p(t)]()},$.add=function(t,a){var f,h=this;t=Number(t);var c=g.p(a),d=function(e){var n=v(h);return g.w(n.date(n.date()+Math.round(e*t)),h)};if(c===u)return this.set(u,this.$M+t);if(c===o)return this.set(o,this.$y+t);if(c===i)return d(1);if(c===s)return d(7);var $=(f={},f[n]=6e4,f[r]=36e5,f[e]=1e3,f)[c]||1,l=this.$d.getTime()+t*$;return g.w(l,this)},$.subtract=function(t,e){return this.add(-1*t,e)},$.format=function(t){var e=this;if(!this.isValid())return"Invalid Date";var n=t||"YYYY-MM-DDTHH:mm:ssZ",r=g.z(this),i=this.$locale(),s=this.$H,u=this.$m,a=this.$M,o=i.weekdays,f=i.months,h=function(t,r,i,s){return t&&(t[r]||t(e,n))||i[r].substr(0,s)},d=function(t){return g.s(s%12||12,t,"0")},$=i.meridiem||function(t,e,n){var r=t<12?"AM":"PM";return n?r.toLowerCase():r},l={YY:String(this.$y).slice(-2),YYYY:this.$y,M:a+1,MM:g.s(a+1,2,"0"),MMM:h(i.monthsShort,a,f,3),MMMM:h(f,a),D:this.$D,DD:g.s(this.$D,2,"0"),d:String(this.$W),dd:h(i.weekdaysMin,this.$W,o,2),ddd:h(i.weekdaysShort,this.$W,o,3),dddd:o[this.$W],H:String(s),HH:g.s(s,2,"0"),h:d(1),hh:d(2),a:$(s,u,!0),A:$(s,u,!1),m:String(u),mm:g.s(u,2,"0"),s:String(this.$s),ss:g.s(this.$s,2,"0"),SSS:g.s(this.$ms,3,"0"),Z:r};return n.replace(c,function(t,e){return e||l[t]||r.replace(":","")})},$.utcOffset=function(){return 15*-Math.round(this.$d.getTimezoneOffset()/15)},$.diff=function(t,f,h){var c,d=g.p(f),$=v(t),l=6e4*($.utcOffset()-this.utcOffset()),y=this-$,M=g.m(this,$);return M=(c={},c[o]=M/12,c[u]=M,c[a]=M/3,c[s]=(y-l)/6048e5,c[i]=(y-l)/864e5,c[r]=y/36e5,c[n]=y/6e4,c[e]=y/1e3,c)[d]||y,h?M:g.a(M)},$.daysInMonth=function(){return this.endOf(u).$D},$.$locale=function(){return M[this.$L]},$.locale=function(t,e){if(!t)return this.$L;var n=this.clone(),r=D(t,e,!0);return r&&(n.$L=r),n},$.clone=function(){return g.w(this.$d,this)},$.toDate=function(){return new Date(this.valueOf())},$.toJSON=function(){return this.isValid()?this.toISOString():null},$.toISOString=function(){return this.$d.toISOString()},$.toString=function(){return this.$d.toUTCString()},d}(),p=S.prototype;return v.prototype=p,[["$ms",t],["$s",e],["$m",n],["$H",r],["$W",i],["$M",u],["$y",o],["$D",f]].forEach(function(t){p[t[1]]=function(e){return this.$g(e,t[0],t[1])}}),v.extend=function(t,e){return t.$i||(t(e,S,v),t.$i=!0),v},v.locale=D,v.isDayjs=m,v.unix=function(t){return v(1e3*t)},v.en=M[y],v.Ls=M,v.p={},v});

},{}]},{},[]);
