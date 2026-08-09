import assert from 'assert'
import ReadDeviceIdentificationRequest from '../src/request/read-device-identification'
import ReadDeviceIdentificationResponse from '../src/response/read-device-identification'
import ResponseFactory from '../src/response/response-factory'
import ExceptionResponseBody from '../src/response/exception'

function hex (value: string): Buffer {
  return Buffer.from(value, 'ascii')
}

describe('ReadDeviceIdentification Tests.', function () {
  describe('ReadDeviceIdentification Request', function () {
    it('should create a request payload', function () {
      const request = new ReadDeviceIdentificationRequest(0x01, 0x00)
      const payload = request.createPayload()
      const expected = Buffer.from([0x2b, 0x0e, 0x01, 0x00])

      assert.deepEqual(payload, expected)
    })

    it('should parse a request payload from buffer', function () {
      const buffer = Buffer.from([0x2b, 0x0e, 0x03, 0x02])
      const request = ReadDeviceIdentificationRequest.fromBuffer(buffer)

      assert.ok(request !== null)
      assert.equal(0x2b, request!.fc)
      assert.equal(0x0e, request!.meiType)
      assert.equal(0x03, request!.readDeviceIdCode)
      assert.equal(0x02, request!.objectId)
    })

    it('should throw when read device identification code is invalid for user-created requests', function () {
      assert.throws(function () {
        return new ReadDeviceIdentificationRequest(0x05, 0x00)
      }, /InvalidReadDeviceIdCode/)
    })

    it('should parse invalid read-device-id-code from wire for server-side validation', function () {
      const request = ReadDeviceIdentificationRequest.fromBuffer(Buffer.from([0x2b, 0x0e, 0x05, 0x00]))

      assert.ok(request !== null)
      assert.equal(0x05, request!.readDeviceIdCode)
    })
  })

  describe('ReadDeviceIdentification Response', function () {
    it('should create and parse a response payload with two objects', function () {
      const response = new ReadDeviceIdentificationResponse(
        0x01,
        0x01,
        0x00,
        0x00,
        [
          { id: 0x00, value: hex('Acme') },
          { id: 0x01, value: hex('X100') }
        ]
      )

      const payload = response.createPayload()
      const parsed = ReadDeviceIdentificationResponse.fromBuffer(payload)

      assert.ok(parsed !== null)
      assert.equal(0x2b, parsed!.fc)
      assert.equal(0x0e, parsed!.meiType)
      assert.equal(0x01, parsed!.readDeviceIdCode)
      assert.equal(0x01, parsed!.conformityLevel)
      assert.equal(0x00, parsed!.moreFollows)
      assert.equal(0x00, parsed!.nextObjectId)
      assert.equal(2, parsed!.numberOfObjects)
      assert.equal('Acme', parsed!.objects[0].value.toString('ascii'))
      assert.equal('X100', parsed!.objects[1].value.toString('ascii'))
    })

    it('should return null for malformed object value length', function () {
      const malformed = Buffer.from([
        0x2b, 0x0e, 0x01, 0x01, 0x00, 0x00,
        0x01, // number of objects
        0x00, 0x04, // object id + claimed length
        0x41, 0x42 // only 2 bytes of value present
      ])

      const parsed = ReadDeviceIdentificationResponse.fromBuffer(malformed)
      assert.equal(parsed, null)
    })
  })

  describe('ReadDeviceIdentification Exceptions', function () {
    it('should parse MEI-specific exception payload', function () {
      const exceptionPayload = Buffer.from([0xab, 0x0e, 0x03])
      const response = ResponseFactory.fromBuffer(exceptionPayload)

      assert.ok(response instanceof ExceptionResponseBody)
      assert.equal(true, response.isException)
      assert.equal(0x2b, response.fc)
      assert.equal(0x0e, response.meiType)
      assert.equal(0x03, response.code)
    })

    it('should parse legacy two-byte exception payload', function () {
      const exceptionPayload = Buffer.from([0xab, 0x01])
      const response = ResponseFactory.fromBuffer(exceptionPayload)

      assert.ok(response instanceof ExceptionResponseBody)
      assert.equal(true, response.isException)
      assert.equal(0x2b, response.fc)
      assert.equal(undefined, response.meiType)
      assert.equal(0x01, response.code)
    })
  })
})
