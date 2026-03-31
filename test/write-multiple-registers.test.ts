import assert from 'node:assert/strict'
import { Requests } from '../src/modbus'

describe('WriteMultipleRegisters Tests.', function () {
  describe('WriteMultipleRegisters Response', function () {

  })

  describe('WriteMultipleRegisters Request', function () {
    it('should create a buffer from a write multiple registers message', function () {
      const request = new Requests.WriteMultipleRegistersRequestBody(10, [0x0001, 0x0002, 0x1234, 0x4321])
      const buffer = request.createPayload()
      const expected = Buffer.from([0x10, 0x00, 0x0a, 0x00, 0x04, 0x08, 0x00, 0x01, 0x00, 0x02, 0x12, 0x34, 0x43, 0x21])

      assert.ok(request !== null)
      assert.equal(request.numberOfBytes, 8)

      assert.deepEqual(expected, buffer)
    })
    it('should create a message from a buffer', function () {
      const buffer = Buffer.from([0x10, 0x00, 0x0a, 0x00, 0x04, 0x08, 0x00, 0x01, 0x00, 0x02, 0x12, 0x34, 0x43, 0x21])
      const message = Requests.WriteMultipleRegistersRequestBody.fromBuffer(buffer)

      assert.ok(message !== null)
      assert.equal(0x10, message.fc) // Write Multiple Registers Function Code
      assert.equal(10, message.address) // Starting Address
      assert.equal(0x08, message.numberOfBytes) // Byte Count
      assert.equal(4, message.count, 'register count must be 4') // Count (Quantity of Registers)
      assert.deepEqual([0x0001, 0x0002, 0x1234, 0x4321], message.valuesAsArray) // Values
      assert.deepEqual(Buffer.from([0x00, 0x01, 0x00, 0x02, 0x12, 0x34, 0x43, 0x21]), message.valuesAsBuffer) // Values as Buffer
    })
    it('should return null on not enough buffer data', function () {
      const buffer = Buffer.from([0x0f, 0x00])
      const message = Requests.WriteMultipleRegistersRequestBody.fromBuffer(buffer)

      assert.ok(message === null)
    })
    it('should return null on wrong function code', function () {
      const buffer = Buffer.from([0x11, 0x00, 0x0a, 0xff, 0x00])
      const message = Requests.WriteMultipleRegistersRequestBody.fromBuffer(buffer)

      assert.ok(message === null)
    })
  })
})
