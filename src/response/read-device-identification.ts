import { FC } from '../codes/index.js'
import ModbusResponseBody from './response-body.js'

export const READ_DEVICE_ID_MEI_TYPE = 0x0E

export interface IReadDeviceIdentificationObject {
  id: number
  value: Buffer
}

/** Read Device Identification ResponseBody (Function Code 0x2B / MEI 0x0E)
 * @extends ModbusResponseBody
 */
export default class ReadDeviceIdentificationResponseBody extends ModbusResponseBody {
  get meiType () {
    return this._meiType
  }

  get readDeviceIdCode () {
    return this._readDeviceIdCode
  }

  get conformityLevel () {
    return this._conformityLevel
  }

  get moreFollows () {
    return this._moreFollows
  }

  get nextObjectId () {
    return this._nextObjectId
  }

  get numberOfObjects () {
    return this._objects.length
  }

  get objects () {
    return this._objects
  }

  get byteCount () {
    const objectsByteLength = this._objects.reduce((sum, object) => sum + 2 + object.value.length, 0)
    return 7 + objectsByteLength
  }

  public static fromBuffer (buffer: Buffer) {
    try {
      const fc = buffer.readUInt8(0)

      if (fc !== FC.READ_DEVICE_IDENTIFICATION) {
        return null
      }

      const meiType = buffer.readUInt8(1)
      const readDeviceIdCode = buffer.readUInt8(2)
      const conformityLevel = buffer.readUInt8(3)
      const moreFollows = buffer.readUInt8(4)
      const nextObjectId = buffer.readUInt8(5)
      const numberOfObjects = buffer.readUInt8(6)

      const objects: IReadDeviceIdentificationObject[] = []

      let offset = 7
      for (let i = 0; i < numberOfObjects; i++) {
        if (offset + 2 > buffer.length) {
          return null
        }

        const id = buffer.readUInt8(offset)
        const length = buffer.readUInt8(offset + 1)
        const objectEnd = offset + 2 + length

        if (objectEnd > buffer.length) {
          return null
        }

        const value = buffer.slice(offset + 2, objectEnd)
        objects.push({ id, value })
        offset = objectEnd
      }

      return new ReadDeviceIdentificationResponseBody(
        readDeviceIdCode,
        conformityLevel,
        moreFollows,
        nextObjectId,
        objects,
        meiType
      )
    } catch (e) {
      return null
    }
  }

  private _meiType: number
  private _readDeviceIdCode: number
  private _conformityLevel: number
  private _moreFollows: number
  private _nextObjectId: number
  private _objects: IReadDeviceIdentificationObject[]

  /** Create new ReadDeviceIdentificationResponseBody.
   */
  constructor (
    readDeviceIdCode: number,
    conformityLevel: number,
    moreFollows: number,
    nextObjectId: number,
    objects: IReadDeviceIdentificationObject[],
    meiType: number = READ_DEVICE_ID_MEI_TYPE
  ) {
    super(FC.READ_DEVICE_IDENTIFICATION)

    if (meiType > 0xFF || meiType < 0x00) {
      throw new Error('InvalidMeiType')
    }

    if (readDeviceIdCode > 0xFF || readDeviceIdCode < 0x00) {
      throw new Error('InvalidReadDeviceIdCode')
    }

    if (conformityLevel > 0xFF || conformityLevel < 0x00) {
      throw new Error('InvalidConformityLevel')
    }

    if (moreFollows > 0xFF || moreFollows < 0x00) {
      throw new Error('InvalidMoreFollows')
    }

    if (nextObjectId > 0xFF || nextObjectId < 0x00) {
      throw new Error('InvalidNextObjectId')
    }

    for (const object of objects) {
      if (object.id > 0xFF || object.id < 0x00) {
        throw new Error('InvalidObjectId')
      }

      if (object.value.length > 0xFF) {
        throw new Error('InvalidObjectValueLength')
      }
    }

    this._meiType = meiType
    this._readDeviceIdCode = readDeviceIdCode
    this._conformityLevel = conformityLevel
    this._moreFollows = moreFollows
    this._nextObjectId = nextObjectId
    this._objects = objects
  }

  public createPayload () {
    const payload = Buffer.alloc(this.byteCount)

    payload.writeUInt8(this._fc, 0)
    payload.writeUInt8(this._meiType, 1)
    payload.writeUInt8(this._readDeviceIdCode, 2)
    payload.writeUInt8(this._conformityLevel, 3)
    payload.writeUInt8(this._moreFollows, 4)
    payload.writeUInt8(this._nextObjectId, 5)
    payload.writeUInt8(this._objects.length, 6)

    let offset = 7
    for (const object of this._objects) {
      payload.writeUInt8(object.id, offset)
      payload.writeUInt8(object.value.length, offset + 1)
      object.value.copy(payload, offset + 2)
      offset += 2 + object.value.length
    }

    return payload
  }
}
