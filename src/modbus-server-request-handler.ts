import { Buffer } from 'buffer';
import ModbusAbstractRequest, { ModbusAbstractRequestFromBuffer } from './abstract-request'
import ModbusRTURequest from './rtu-request'

import Debug from 'debug'; 
const debug = Debug('modbus-server-request-handler')

export default class ModbusServerRequestHandler<FB extends ModbusAbstractRequestFromBuffer<any>> {
  public _fromBuffer: FB
  public _requests: ModbusAbstractRequest[]
  public _buffer: Buffer

  constructor (fromBufferMethod: FB) {
    this._fromBuffer = fromBufferMethod
    this._requests = []
    this._buffer = Buffer.alloc(0)
  }

  public shift () {
    return this._requests.shift()
  }

  public handle (data: Buffer) {
    this._buffer = Buffer.concat([this._buffer, data])
    debug('this._buffer', this._buffer)

    let request: ModbusAbstractRequest | null = null
    do {
      request = this._fromBuffer(this._buffer)
      if (request) {
        if (request instanceof ModbusRTURequest) {
          debug(request.toString())
          if (request.corrupted) {
            const corruptDataDump = this._buffer.subarray(0, request.byteCount).toString('hex').replace(/(.{2})/g, '$1 ').trim()
            debug(`request message was corrupt: ${corruptDataDump}`)
          } else {
            this._requests.unshift(request)
          }
          // remove the request payload from the buffer
          this._buffer = this._buffer.subarray(request.byteCount)
        }
      }
    } while (request != null)
  }
}
