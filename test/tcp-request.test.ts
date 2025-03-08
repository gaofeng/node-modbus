import assert from 'node:assert/strict'
import TCPRequest from '../src/tcp-request'
import { WriteMultipleCoilsRequestBody } from '../src/request'

describe('TCP Request Tests', function () {
  it('should return a valid TCPRequest object for function 15', function () {
    const requestBuffer = Buffer.from([
      0x00, 0x01, // transaction id
      0x00, 0x00, // protocol
      0x00, 0x09, // byte count
      0x02, // unit id
      0x0F, // function code
      0x00, 0x00, // address
      0x00, 0x08, // quantity
      0x02, // byte count
      0x55, 0x55 // values
    ])

    const request = TCPRequest.fromBuffer(requestBuffer)
    assert.ok(request)
    assert.equal(request.id, 0x0001)
    assert.equal(request.protocol, 0x0000)
    assert.equal(request.length, 0x0009)
    assert.equal(request.unitId, 0x02)
    const body = request.body as WriteMultipleCoilsRequestBody
    assert.equal(body.fc, 0x0F)
    assert.equal(body.address, 0x0000)
    assert.deepEqual(body.valuesAsArray, [true, false, true, false, true, false, true, false])
    assert.deepEqual(body.valuesAsBuffer, Buffer.from([0x55, 0x55]))
  })
})