import { describe, it } from 'mocha'
import assert from 'node:assert/strict'
import ResponseFactory from '../src/response/response-factory'
import ReadCoilsResponseBody from '../src/response/read-coils'

describe('Modbus Response Tests.', function () {
  /* with the read coils tests we test most of the common errors
   * like modbus exceptions, outOfSync errors, timeouts and so on */
  describe('Read Coils Tests.', function () {
    it('should create respond body from buffer using factory', function () {
      const buffer: Buffer = Buffer.from([
        0x01, // fc
        0x02, // byte count
        0xdd, // coils
        0x00
      ])

      const response = ResponseFactory.fromBuffer(buffer)

      assert.ok(response !== null)
      assert.ok(response instanceof ReadCoilsResponseBody)
      assert.equal(0x01, response.fc)
      assert.equal(0x02, response.numberOfBytes)
      assert.equal(0x04, response.byteCount)
      assert.deepEqual([true, false, true, true, true, false, true, true, false, false, false, false, false, false, false, false], 
        response.valuesAsArray)
    })
    it('should handle invalid buffer content', function () {
      const buffer: Buffer = Buffer.from([
        0x01, // fc
        0x02, // byte count
        0xdd // coils
      ])

      const response = ReadCoilsResponseBody.fromBuffer(buffer)

      assert.ok(response === null)
    })
  })
})
