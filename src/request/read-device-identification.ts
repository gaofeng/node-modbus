import { FC } from '../codes'

import ModbusRequestBody from './request-body'

export const READ_DEVICE_ID_MEI_TYPE = 0x0E

export type ReadDeviceIdentificationCode = 0x01 | 0x02 | 0x03 | 0x04

export function isReadDeviceIdentificationCode (x: number): x is ReadDeviceIdentificationCode {
  switch (x) {
    case 0x01:
    case 0x02:
    case 0x03:
    case 0x04:
      return true
    default:
      return false
  }
}

/** Read Device Identification Request Body (Function Code 0x2B / MEI 0x0E)
 * @extends ModbusRequestBody
 */
export default class ReadDeviceIdentificationRequestBody extends ModbusRequestBody {
  get address(): number {
    throw new Error('Method not implemented.')
  }
  get meiType () {
    return this._meiType
  }

  get readDeviceIdCode () {
    return this._readDeviceIdCode
  }

  get objectId () {
    return this._objectId
  }

  get count () {
    return 1
  }

  get name () {
    return 'ReadDeviceIdentification' as const
  }

  get byteCount () {
    return 4
  }

  public static fromBuffer (buffer: Buffer) {
    try {
      const fc = buffer.readUInt8(0)

      if (fc !== FC.READ_DEVICE_IDENTIFICATION) {
        return null
      }

      const meiType = buffer.readUInt8(1)
      const readDeviceIdCode = buffer.readUInt8(2)
      const objectId = buffer.readUInt8(3)

      return new ReadDeviceIdentificationRequestBody(readDeviceIdCode, objectId, meiType, false)
    } catch (e) {
      return null
    }
  }

  private _meiType: number
  private _readDeviceIdCode: number
  private _objectId: number

  /** Create a new Read Device Identification Request Body.
   * @param {number} [readDeviceIdCode=0x01] 0x01 basic, 0x02 regular, 0x03 extended, 0x04 single object.
   * @param {number} [objectId=0x00] Object identifier to start with.
   * @param {number} [meiType=0x0E] Encapsulated Interface MEI type.
   * @param {boolean} [validateReadDeviceIdCode=true] Validate readDeviceIdCode against the specification values.
   */
  constructor (
    readDeviceIdCode: number = 0x01,
    objectId: number = 0x00,
    meiType: number = READ_DEVICE_ID_MEI_TYPE,
    validateReadDeviceIdCode: boolean = true
  ) {
    super(FC.READ_DEVICE_IDENTIFICATION)

    if (meiType > 0xFF || meiType < 0x00) {
      throw new Error('InvalidMeiType')
    }

    if (objectId > 0xFF || objectId < 0x00) {
      throw new Error('InvalidObjectId')
    }

    if (readDeviceIdCode > 0xFF || readDeviceIdCode < 0x00) {
      throw new Error('InvalidReadDeviceIdCode')
    }

    if (validateReadDeviceIdCode && !isReadDeviceIdentificationCode(readDeviceIdCode)) {
      throw new Error('InvalidReadDeviceIdCode')
    }

    this._meiType = meiType
    this._readDeviceIdCode = readDeviceIdCode
    this._objectId = objectId
  }

  public createPayload () {
    const payload = Buffer.alloc(4)

    payload.writeUInt8(this._fc, 0)
    payload.writeUInt8(this._meiType, 1)
    payload.writeUInt8(this._readDeviceIdCode, 2)
    payload.writeUInt8(this._objectId, 3)

    return payload
  }
}

export function isReadDeviceIdentificationRequestBody (x: any): x is ReadDeviceIdentificationRequestBody {
  if (x instanceof ReadDeviceIdentificationRequestBody) {
    return true
  } else {
    return false
  }
}
