import assert from 'node:assert/strict'
import WriteSingleCoilRequest from '../src/request/write-single-coil'
import WriteSingleCoilResponseBody from '../src/response/write-single-coil'

describe('WriteSingleCoil Tests.', function () {
  describe('WriteSingleCoil Response', function () {
    it('should create a buffer from a write single coil message, true test', function () {
      const request = new WriteSingleCoilRequest(10, true)
      const buffer = request.createPayload()
      const expected = Buffer.from([0x05, 0x00, 0x0a, 0xff, 0x00])

      assert.deepEqual(expected, buffer)
    })
    it('should create a buffer from a write single coil message, false test', function () {
      const request = new WriteSingleCoilRequest(10, false)
      const buffer = request.createPayload()
      const expected = Buffer.from([0x05, 0x00, 0x0a, 0x00, 0x00])

      assert.deepEqual(expected, buffer)
    })
    it('should provide a response that equals the write request, true test', function () {
      const expected = Buffer.from([0x05, 0x00, 0x0a, 0xff, 0x00])

      const request = new WriteSingleCoilRequest(10, true)
      const requestBuffer = request.createPayload()
      const response = WriteSingleCoilResponseBody.fromBuffer(requestBuffer)
      assert.ok(response!== null)
      const responseBuffer = response.createPayload()

      assert.strictEqual(true, response.value)
      assert.deepEqual(expected, responseBuffer)
    })
    it('should provide a response that equals the write request, false test', function () {
      const expected = Buffer.from([0x05, 0x00, 0x0a, 0x00, 0x00])

      const request = new WriteSingleCoilRequest(10, false)
      const requestBuffer = request.createPayload()
      const response = WriteSingleCoilResponseBody.fromBuffer(requestBuffer)
      assert.ok(response!== null)
      const responseBuffer = response.createPayload()

      assert.strictEqual(false, response.value)
      assert.deepEqual(expected, responseBuffer)
    })
    it('should create a message from a buffer', function () {
      const buffer = Buffer.from([0x05, 0x00, 0x0a, 0xff, 0x00])
      const message = WriteSingleCoilRequest.fromBuffer(buffer)

      assert.ok(message !== null)
      assert.equal(0x05, message.fc)
      assert.equal(10, message.address)
      assert.equal(0xff00, message.value)
    })
    it('should return null on not enough buffer data', function () {
      const buffer = Buffer.from([0x05, 0x00])
      const message = WriteSingleCoilRequest.fromBuffer(buffer)

      assert.ok(message === null)
    })
    it('should return null on wrong function code', function () {
      const buffer = Buffer.from([0x06, 0x00, 0x0a, 0xff, 0x00])
      const message = WriteSingleCoilRequest.fromBuffer(buffer)

      assert.ok(message === null)
    })
  })

  describe('WriteSingleCoil Request', function () {

  })
})