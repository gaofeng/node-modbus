import assert from 'node:assert/strict'
import bufferUtils from '../src/buffer-utils'

describe('Buffer and status conversions.', function () {
  it('should convert 10 coils status to buffer 2 bytes', function () {
    const input = [false, false, false, false, true, false, true, false, true, false]
    const expected = Buffer.from([0x50, 0x01])
    const result = bufferUtils.arrayStatusToBuffer(input)

    assert.deepEqual(expected, result)
  })

  it('should convert a buffer with hex to coils/discrete array status', function () {
    const input = Buffer.from([0x50, 0x01])
    const expected = [false, false, false, false, true, false, true, false, true, false, false, false, false, false, false, false]
    const result = bufferUtils.bufferToArrayStatus(input)

    assert.deepEqual(expected, result)
  })

  it('should convert a buffer with bin to coils/discrete array status', function () {
    const input = Buffer.from([0b01010000, 0b00000001])
    const expected = [false, false, false, false, true, false, true, false, true, false, false, false, false, false, false, false]
    const result = bufferUtils.bufferToArrayStatus(input)

    assert.deepEqual(expected, result)
  })
})

describe('Buffer manipulation tests', function () {
  /* we are using the read coils function to test the modbus/tcp specifics */

  it('should return a short buffer', function () {
    const startAddress = 3
    const endAddress = 7
    const buffer = Buffer.from([0b00010001])
    const expectedBuffer = Buffer.from([0b01000100])
    const buf = bufferUtils.bufferShift(startAddress, endAddress, buffer)

    assert(expectedBuffer.equals(buf))
  })

  it('should return a longer buffer', function () {
    const startAddress = 8
    const endAddress = 17
    const buffer = Buffer.from([0b11111111, 0b00000011])
    const expectedBuffer = Buffer.from([0b10000000, 0b11111111, 0b00000001])
    const buf = bufferUtils.bufferShift(startAddress, endAddress, buffer)

    assert(expectedBuffer.equals(buf))
  })

  it('should return a correct only byte', function () {
    const startAddress = 3
    const endAddress = 7
    const buffer = Buffer.from([0b00010001])
    const buf = bufferUtils.bufferShift(startAddress, endAddress, buffer)
    const originalBuffer = Buffer.from([0b10101010])
    let expectedByte = 0b01000110

    const firstByte = bufferUtils.firstByte(startAddress, originalBuffer[0], buf[0])

    assert.equal(firstByte, expectedByte)

    expectedByte = 0b11000110
    const lastByte = bufferUtils.lastByte(endAddress, originalBuffer[0], firstByte)

    assert.equal(lastByte, expectedByte)
  })

  it('should return a correct buffer', function () {
    const startAddress = 10
    const endAddress = 27
    const buffer = Buffer.from([0b10011001, 0b10011001, 0b00000001])
    const buf = bufferUtils.bufferShift(startAddress, endAddress, buffer)

    const originalBuffer = Buffer.from([0b10101010, 0b10101010, 0b10101010, 0b10101010, 0b10101010])
    const expectedBuffer = Buffer.from([0b10101010, 0b00110010, 0b00110011, 0b10101011, 0b10101010])

    const startByte = Math.floor(startAddress / 8)
    const firstByte = bufferUtils.firstByte(startAddress, originalBuffer[startByte], buf[0])
    let expectedByte = 0b00110010
    assert.equal(firstByte, expectedByte)

    buf[0] = firstByte

    const lb = Math.floor(endAddress / 8)
    const lastByte = bufferUtils.lastByte(
      endAddress,
      originalBuffer[originalBuffer.length - 1],
      buf[buf.length - 1]
    )
    expectedByte = 0b10101011
    assert.equal(lastByte, expectedByte)

    buf[buf.length - 1] = lastByte

    originalBuffer.fill(buf, startByte, lb + 1)

    assert(originalBuffer.equals(expectedBuffer))
  })

  it('should return another correct buffer', function () {
    const startAddress = 13
    const endAddress = 20
    const buffer = Buffer.from([0b11111111])
    const buf = bufferUtils.bufferShift(startAddress, endAddress, buffer)

    const originalBuffer = Buffer.from([0b00000000, 0b00000000, 0b00000000, 0b00000000])
    const expectedBuffer = Buffer.from([0b00000000, 0b11110000, 0b00001111, 0b00000000])

    const startByte = Math.floor(startAddress / 8)
    const firstByte = bufferUtils.firstByte(startAddress, originalBuffer[startByte], buf[0])
    let expectedByte = 0b11110000
    assert.equal(firstByte, expectedByte)

    buf[0] = firstByte

    const lb = Math.floor(endAddress / 8)
    const lastByte = bufferUtils.lastByte(
      endAddress,
      originalBuffer[originalBuffer.length - 1],
      buf[buf.length - 1]
    )
    expectedByte = 0b00001111
    assert.equal(lastByte, expectedByte)

    buf[buf.length - 1] = lastByte

    originalBuffer.fill(buf, startByte, lb + 1)

    assert(originalBuffer.equals(expectedBuffer))
  })
})
