import assert from 'node:assert/strict'
import ModbusTCPClientResponseHandler from '../src/tcp-client-response-handler'
import { ExceptionResponseBody, ReadCoilsResponseBody, ReadDeviceIdentificationResponseBody } from '../src/response'

describe('Modbus/TCP Client Response Handler Tests', function () {
  let handler: ModbusTCPClientResponseHandler

  beforeEach(function () {
    handler = new ModbusTCPClientResponseHandler()
  })

  /* we are using the read coils function to test the modbus/tcp specifics */

  it('should handle a valid read coils response', function () {
    const responseBuffer = Buffer.from([
      0x00, 0x01, // transaction id
      0x00, 0x00, // protocol
      0x00, 0x05, // byte count
      0x03,       // unit id
      0x01,       // function code
      0x02,       // byte count
      0xdd,       // coils
      0x00
    ])

    handler.handleData(responseBuffer)

    const response = handler.shift()

    assert.ok(response !== undefined)
    assert.equal(1, response.id)
    assert.equal(0, response.protocol)
    assert.equal(5, response.bodyLength)
    assert.equal(11, response.byteCount)
    assert.equal(3, response.unitId)
    const body = response.body as ReadCoilsResponseBody
    assert.equal(1, body.fc)
    assert.deepEqual([true, false, true, true, true, false, true, true, false, false, false, false, false, false, false, false], body.valuesAsArray)
  })
  it('should handle a valid FC43/14 read device identification response', function () {
    const responseBuffer = Buffer.from([
      0x00, 0x01, // transaction id
      0x00, 0x00, // protocol
      0x00, 0x0E, // byte count
      0x03,       // unit id
      0x2B,       // function code
      0x0E,       // MEI type
      0x01,       // read device id code
      0x01,       // conformity level
      0x00,       // more follows
      0x00,       // next object id
      0x01,       // number of objects
      0x00,       // object id
      0x04,       // object value length
      0x41, 0x43, 0x4D, 0x45 // object value: ACME
    ])

    handler.handleData(responseBuffer)

    const response = handler.shift()

    assert.ok(response !== undefined)
    assert.equal(0x01, response.id)
    assert.equal(0x00, response.protocol)
    assert.equal(0x0E, response.bodyLength)
    assert.equal(0x14, response.byteCount)
    assert.equal(0x03, response.unitId)
    const body = response.body as ReadDeviceIdentificationResponseBody
    assert.equal(0x2B, body.fc)
    assert.equal(0x0E, body.meiType)
    assert.equal(0x01, body.readDeviceIdCode)
    assert.equal(0x01, body.conformityLevel)
    assert.equal(0x01, body.numberOfObjects)
    assert.equal('ACME', body.objects[0].value.toString('ascii'))
  })
  it('should handle a exception', function () {
    const responseBuffer = Buffer.from([
      0x00, 0x01, // transaction id
      0x00, 0x00, // protocol
      0x00, 0x03, // byte count
      0x03,       // unit id
      0x81,       // exception code for fc 0x01
      0x01        // exception code ILLEGAL FUNCTION
    ])

    handler.handleData(responseBuffer)

    const response = handler.shift()

    assert.ok(response !== undefined)
    assert.equal(0x01, response.id)
    assert.equal(0x00, response.protocol)
    assert.equal(0x03, response.bodyLength)
    assert.equal(0x09, response.byteCount)
    assert.equal(0x03, response.unitId)
    const body = response.body as ExceptionResponseBody
    assert.equal(0x01, body.fc)
    assert.equal(0x01, body.code)
    assert.equal('ILLEGAL FUNCTION', body.message)
  })
  it('should handle a FC43/14 exception with explicit MEI type', function () {
    const responseBuffer = Buffer.from([
      0x00, 0x01, // transaction id
      0x00, 0x00, // protocol
      0x00, 0x04, // byte count
      0x03,       // unit id
      0xAB,       // exception code for fc 0x2B
      0x0E,       // MEI type
      0x03        // exception code ILLEGAL DATA VALUE
    ])

    handler.handleData(responseBuffer)

    const response = handler.shift()

    assert.ok(response !== undefined)
    assert.equal(0x01, response.id)
    assert.equal(0x00, response.protocol)
    assert.equal(0x04, response.bodyLength)
    assert.equal(0x0A, response.byteCount)
    assert.equal(0x03, response.unitId)
    const body = response.body as ExceptionResponseBody
    assert.equal(0x2B, body.fc)
    assert.equal(0x0E, body.meiType)
    assert.equal(0x03, body.code)
    assert.equal('ILLEGAL DATA VALUE', body.message)
  })
  it('should handle a FC43 exception without MEI type', function () {
    const responseBuffer = Buffer.from([
      0x00, 0x01, // transaction id
      0x00, 0x00, // protocol
      0x00, 0x03, // byte count
      0x03,       // unit id
      0xAB,       // exception code for fc 0x2B
      0x01        // exception code ILLEGAL FUNCTION
    ])

    handler.handleData(responseBuffer)

    const response = handler.shift()

    assert.ok(response !== undefined)
    assert.equal(0x01, response.id)
    assert.equal(0x00, response.protocol)
    assert.equal(0x03, response.bodyLength)
    assert.equal(0x09, response.byteCount)
    assert.equal(0x03, response.unitId)
    const body = response.body as ExceptionResponseBody
    assert.equal(0x2B, body.fc)
    assert.equal(undefined, body.meiType)
    assert.equal(0x01, body.code)
    assert.equal('ILLEGAL FUNCTION', body.message)
  })
  it('should handle a chopped response', function () {
    const responseBufferA = Buffer.from([
      0x00, 0x01, // transaction id
      0x00, 0x00, // protocol
      0x00, 0x05  // byte count
    ])
    const responseBufferB = Buffer.from([
      0x03,       // unit id
      0x01,       // function code
      0x02,       // byte count
      0xdd,       // coils
      0x00
    ])

      /* deliver first part */
    handler.handleData(responseBufferA)

    let response = handler.shift()

    assert.ok(response === undefined)

      /* deliver second part */
    handler.handleData(responseBufferB)

    response = handler.shift()

    assert.ok(response !== undefined)
    assert.equal(1, response.id)
    assert.equal(0, response.protocol)
    assert.equal(5, response.bodyLength)
    assert.equal(11, response.byteCount)
    assert.equal(3, response.unitId)
    const body = response.body as ReadCoilsResponseBody
    assert.equal(1, body.fc)
    assert.deepEqual([true, false, true, true, true, false, true, true, false, false, false, false, false, false, false, false], body.valuesAsArray)
  })
})
