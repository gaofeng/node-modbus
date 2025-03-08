import assert from 'node:assert/strict'
import WriteSingleRegisterRequestBody from '../src/request/write-single-register'
import WriteSingleRegisterResponseBody from '../src/response/write-single-register'

describe('WriteSingleRegister Tests.', function () {
  describe('WriteSingleRegister Response', function () {
    it('should provide a response that equals the write request', function () {
      const expected = Buffer.from([0x06, 0x00, 0x0a, 0x12, 0x34])

      const request = new WriteSingleRegisterRequestBody(10, 0x1234)
      const requestBuffer = request.createPayload()
      const response = WriteSingleRegisterResponseBody.fromBuffer(requestBuffer)
      assert.ok(response !== null)
      const responseBuffer = response.createPayload()

      assert.strictEqual(0x1234, response.value)
      assert.deepEqual(expected, responseBuffer)
    })

    it('should create a response from request', function () {
      const request = new WriteSingleRegisterRequestBody(10, 0x1234)
      const response = WriteSingleRegisterResponseBody.fromRequest(request)
      
      assert.ok(response !== null)
      assert.equal(10, response.address)
      assert.equal(0x1234, response.value)
    })
  })

  describe('WriteSingleRegister Request', function () {
    it('should create a buffer from a write single register message', function () {
      const request = new WriteSingleRegisterRequestBody(10, 0x1234)
      const buffer = request.createPayload()
      const expected = Buffer.from([0x06, 0x00, 0x0a, 0x12, 0x34])

      assert.deepEqual(expected, buffer)
    })
    
    it('should create a message from a buffer', function () {
      const buffer = Buffer.from([0x06, 0x00, 0x0a, 0x12, 0x34])
      const message = WriteSingleRegisterRequestBody.fromBuffer(buffer)

      assert.ok(message !== null)
      assert.equal(0x06, message.fc)
      assert.equal(10, message.address)
      assert.equal(0x1234, message.value)
    })
    
    it('should return null on not enough buffer data', function () {
      const buffer = Buffer.from([0x05, 0x00])
      const message = WriteSingleRegisterRequestBody.fromBuffer(buffer)

      assert.ok(message === null)
    })
    
    it('should return null on wrong function code', function () {
      const buffer = Buffer.from([0x07, 0x00, 0x0a, 0xff, 0x00])
      const message = WriteSingleRegisterRequestBody.fromBuffer(buffer)

      assert.ok(message === null)
    })
  })
})