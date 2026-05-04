import {
  ErrorCode,
  errorCodeToMessage,
  FC,
  FunctionCode,
  isFunctionCode
} from '../codes'
import ExceptionRequestBody from '../request/exception.js'
import ModbusRequestBody from '../request/request-body.js'
import ModbusResponseBody from './response-body.js'

/** Modbus Excepiton Response Body
 * @extends ModbusResponseBody
 * @class
 */
export default class ExceptionResponseBody extends ModbusResponseBody {

  /** Exception Code */
  get code () {
    return this._code
  }

  /** Exception message */
  get message () {
    return errorCodeToMessage(this._code)
  }

  get meiType () {
    return this._meiType
  }

  get byteCount () {
    if (this._meiType === undefined) {
      return 2
    } else {
      return 3
    }
  }

  get isException (): boolean {
    return true
  }

  /** Create Exception Response from buffer.
   * @param {Buffer} buffer Buffer
   * @returns {ExceptionResponseBody}
   */
  public static fromBuffer (buffer: Buffer) {
    const fc = buffer.readUInt8(0) - 0x80

    if (!isFunctionCode(fc)) {
      throw Error('InvalidFunctionCode')
    }

    if (fc === FC.READ_DEVICE_IDENTIFICATION) {
      // Some devices use the MEI-specific exception layout
      // [fc|0x80, meiType, exceptionCode], while others send
      // standard Modbus exceptions [fc|0x80, exceptionCode].
      if (buffer.length >= 3) {
        const meiType = buffer.readUInt8(1)
        const meiExceptionCode = buffer.readUInt8(2) as ErrorCode
        return new ExceptionResponseBody(fc, meiExceptionCode, meiType)
      }

      if (buffer.length >= 2) {
        const legacyExceptionCode = buffer.readUInt8(1) as ErrorCode
        return new ExceptionResponseBody(fc, legacyExceptionCode)
      }

      throw Error('InvalidBufferLength')
    }

    const defaultExceptionCode = buffer.readUInt8(1) as ErrorCode
    return new ExceptionResponseBody(fc, defaultExceptionCode)
  }

  // TODO: Figure out what type the requestBody is
  public static fromRequest (requestBody: ExceptionRequestBody) {
    return new ExceptionResponseBody(requestBody.fc, requestBody.code)
  }
  private _code: ErrorCode
  private _meiType: number | undefined

  /** Create ExceptionResponseBody
   * @param {FunctionCode} fc Function Code
   * @param {ErrorCode} code Exception Code
   */
  constructor (fc: FunctionCode, code: ErrorCode, meiType?: number) {
    const ignoreInvalidFunctionCode = true
    super(fc, ignoreInvalidFunctionCode)
    this._code = code
    this._meiType = meiType
  }

  public createPayload () {
    const payload = Buffer.alloc(this.byteCount)
    // This is a exception Response
    // Add 0x80 for compatibility (crc check)
    payload.writeUInt8(this._fc + 0x80, 0)

    if (this._meiType !== undefined) {
      payload.writeUInt8(this._meiType, 1)
      payload.writeUInt8(this._code, 2)
    } else {
      payload.writeUInt8(this._code, 1)
    }

    return payload
  }
}

export function isExceptionResponseBody (x: any): x is ExceptionResponseBody {
  if (x instanceof ExceptionResponseBody) {
    return true
  } else {
    return false
  }
}
