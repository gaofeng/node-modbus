import assert from 'node:assert/strict'
import * as sinon from 'sinon'
import TCPRequestHandler from '../src/tcp-client-request-handler'
import ReadCoilsRequest from '../src/request/read-coils'
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

describe('TCP Modbus Request Tests', () => {
  let socket: DuplexStreamMock
  let socketMock: sinon.SinonMock

  beforeEach(() => {
    socket = new DuplexStreamMock()
    socketMock = sinon.mock(socket)
  })

  /* we are using the read coils request function to test tcp-requests. */
  it('should write a tcp request.', () => {
    const handler = new TCPRequestHandler(socket, 3)
    const readCoilsRequest = new ReadCoilsRequest(0xa0fa, 0x0120)
    //trasaction id 1, protocol id 0, length 6, unit id 3, function code 1(read coils), 
    // address 0xa0fa, quantity 0x0120
    const requestBuffer = Buffer.from([
      0x00, 0x01, 0x00, 0x00, 0x00, 0x06, 0x03, 0x01, 0xa0, 0xfa, 0x01, 0x20
    ])

    socket.emit('connect')

    socketMock.expects('write').once().withArgs(requestBuffer).yields()

    /* should flush the request right away */
    const promise = handler.register(readCoilsRequest)

    assert.ok(promise instanceof Promise)

    socketMock.verify()
  })
})

process.on('unhandledRejection', (err: Error) => {
  console.error(err)
})
