import Debug from './debug-help';
const debug = Debug('modbus-server-request-handler')
import { Buffer } from 'buffer';
import ModbusAbstractRequest, { ModbusAbstractRequestFromBuffer } from './abstract-request'
import ModbusRTURequest from './rtu-request'
import ModbusTCPRequest from './tcp-request';
import { isFunctionCode } from './codes'
import { LIMITS } from './constants'

export default class ModbusServerRequestHandler<FB extends ModbusAbstractRequestFromBuffer<any>> {
  public _fromBuffer: FB
  public _requests: ModbusAbstractRequest[]
  public _buffer: Buffer
  public _isRtu: boolean

  constructor (fromBufferMethod: FB) {
    this._fromBuffer = fromBufferMethod
    this._requests = []
    this._buffer = Buffer.alloc(0)
    this._isRtu = fromBufferMethod === ModbusRTURequest.fromBuffer
  }

  public shift () {
    return this._requests.shift()
  }

  // Append incoming data to the internal buffer and parse out as many
  // requests as possible. Valid requests are unshifted into the queue,
  // while corrupted ones are skipped; the consumed payload is trimmed from
  // the buffer after each iteration.
  //
  // For RTU, leading interference/garbage bytes can desynchronise the stream
  // (fromBuffer returns null because the byte at the function-code position is
  // not a legal code). We recover by sliding a one-byte window until a real
  // frame aligns: when fromBuffer returns null and buffer[1] is not a
  // recognised function code, the front byte is garbage and is dropped. While
  // such resyncing is active, a "corrupted" parse is treated as garbage too
  // (drop one byte instead of byteCount), so a garbage byte immediately before
  // a real frame does not cause us to overshoot and consume the genuine frame.
  public handle (data: Buffer) {
    this._buffer = Buffer.concat([this._buffer, data])
    debug('this._buffer', this._buffer)

    let resyncing = false
    for (;;) {
      const request = this._fromBuffer(this._buffer)
      if (!request) {
        // TCP keeps the original behaviour: wait for more data.
        if (!this._isRtu) {
          break
        }
        // RTU resync: decide between an incomplete valid frame and garbage.
        const plausibleFrameStart =
          this._buffer.length >= 2 &&
          isFunctionCode(this._buffer.readUInt8(1)) &&
          this._buffer.length <= LIMITS.MAX_RTU_ADU_SIZE
        if (plausibleFrameStart || this._buffer.length === 0) {
          break // incomplete frame; wait for more data
        }
        debug('dropping leading garbage byte from RTU buffer')
        this._buffer = this._buffer.subarray(1)
        resyncing = true
        continue
      }
      if (!(request instanceof ModbusRTURequest || request instanceof ModbusTCPRequest)) {
        break
      }
      debug(request.toString())
      if (request.corrupted) {
        const corruptDataDump = this._buffer.subarray(0, request.byteCount).toString('hex').replace(/(.{2})/g, '$1 ').trim()
        debug(`request message was corrupt: ${corruptDataDump}`)
        if (resyncing) {
          // Sliding past interference: a corrupted parse here is most likely
          // garbage that aligns to a valid function code (e.g. a real frame's
          // address byte that happens to be a legal code), not a genuine
          // frame. Drop a single byte and keep sliding so we don't overshoot
          // the real frame waiting just past the garbage.
          this._buffer = this._buffer.subarray(1)
          continue
        }
      } else {
        this._requests.unshift(request)
        resyncing = false
      }
      // remove the request payload from the buffer
      this._buffer = this._buffer.subarray(request.byteCount)
    }
  }
}
