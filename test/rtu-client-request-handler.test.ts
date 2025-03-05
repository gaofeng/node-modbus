import assert from 'node:assert/strict'
import * as sinon from 'sinon'
import ReadCoilsRequest from '../src/request/read-holding-registers'
import ReadHoldingRegistersResponseBody from '../src/response/read-holding-registers'
import ReadHoldingRegistersRequestBody from '../src/request/read-holding-registers'
import ModbusRTUResponse from '../src/rtu-response'
import ExceptionResponse from '../src/response/exception'
import ModbusRTUClientRequestHandler from '../src/rtu-client-request-handler'
import * as Modbus from '../src/modbus'
import { DuplexStream } from '../src/modbus'

class DuplexStreamMock extends DuplexStream {
  open(): void {
    console.log('open')
  }
  close(): void {
    console.log('close')
  }
  write(chunk: Buffer, callback?: (error?: Error | null) => void): boolean {
    return true
  }
}

describe('Modbus/RTU Client Request Tests', () => {
  let socket: DuplexStreamMock
  let socketMock: sinon.SinonMock

  beforeEach(() => {
    socket = new DuplexStreamMock()
    socketMock = sinon.mock(socket)
  })

  afterEach(() => {
    // Restore the default sandbox here
    sinon.restore()
  })

  describe('Register Test.', () => {
    it('should register an rtu request', () => {
      const handler = new ModbusRTUClientRequestHandler(socket, 4, 2000)
      const readCoilsRequest = new ReadCoilsRequest(0x4321, 0x0120)

      socket.emit('open')

      socketMock.expects('write').once()

      const promise = handler.register(readCoilsRequest)

      assert.ok(promise instanceof Promise)

      socketMock.verify()
    })
  })

  describe('Handle Data Tests.', () => {
    it('should register an rtu request and handle a response', (done) => {
      const handler = new ModbusRTUClientRequestHandler(socket, 1)
      const request = new ReadHoldingRegistersRequestBody(0, 1)
      const response = new ReadHoldingRegistersResponseBody(1, Buffer.from([0x00, 0x32]))
      const rtuResponse = new ModbusRTUResponse(1, 0x91c9, response)

      socket.emit('open')

      socketMock.expects('write').once()

      handler
        .register(request)
        .then((resp: any) => {
          assert.ok(true)
          socketMock.verify()

          done()
        })
        .catch(() => {
          assert.ok(false)
          done()
        })

      handler.handle(rtuResponse)
    })

    it('should register an rtu request and handle a exception response', (done) => {
      const handler = new ModbusRTUClientRequestHandler(socket, 4)
      const request = new ReadCoilsRequest(0x0000, 0x0008)
      const response = new ExceptionResponse(0x01, 0x01)
      const rtuResponse = new ModbusRTUResponse(4, 37265, response)

      socket.emit('open')

      socketMock.expects('write').once()

      handler
        .register(request)
        .then((resp: any) => {
          assert.ok(false)
          done()
        })
        .catch((err: any) => {
          // Exception type should be ModbusException not crcMismatch or any other
          assert.equal(err.err, 'ModbusException')
          assert.equal(err.request instanceof Modbus.ModbusRTURequest, true)
          assert.equal(err.request.body, request)
          socketMock.verify()

          done()
        })

      handler.handle(rtuResponse)
    })

    it('should calculate exception response crc correctly', (done) => {
      const handler = new ModbusRTUClientRequestHandler(socket, 1)
      const request = new ReadHoldingRegistersRequestBody(0x4000, 0x0002)
      const responseBuffer = Buffer.from([
        0x01, // address
        0x83, // fc
        0x02, // error code
        0xc0,
        0xf1 // crc
      ])
      const rtuResponse = ModbusRTUResponse.fromBuffer(responseBuffer)

      socket.emit('open')

      socketMock.expects('write').once()

      handler
        .register(request)
        .then((resp: any) => {
          assert.ok(false)
          done()
        })
        .catch((err: any) => {
          // Exception type should be ModbusException not crcMismatch or any other
          assert.equal(err.err, 'ModbusException')
          assert.equal(err.request instanceof Modbus.ModbusRTURequest, true)
          assert.equal(err.request.body, request)
          socketMock.verify()

          done()
        })

      if (rtuResponse) {
        handler.handle(rtuResponse)
      }
    })
  })
})
