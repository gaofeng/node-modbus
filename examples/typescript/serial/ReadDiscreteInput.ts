import * as Modbus from '../../../src/modbus'
import { SerialStream } from './SerialStream';
import { handleErrors } from './handle-errors';
import Debug from 'debug'

const debug = Debug('example')

function logWithTime(message: string) {
  const now = new Date();
  const timestamp = now.toLocaleTimeString() + '.' + now.getMilliseconds()
  debug(`[${timestamp}] ${message}`)
}

// $env:DEBUG = "mb:*,example"
// pnpm exec ts-node examples/typescript/serial/ReadDiscreteInput.ts

const socket = new SerialStream('COM1', 19200, 'none');

const address = 0x01;
const client = new Modbus.client.RTU(socket, address, 3000)

const readStart = 0;
const readCount = 12;

socket.on('close', function () {
  console.log('closed')
})

socket.on('open', function () {
  console.log('serial port opened')
  logWithTime('start reading discrete inputs')
  client.readDiscreteInputs(readStart, readCount)
    .then(({ metrics, request, response }) => {
      console.log('Transfer Time: ' + metrics.transferTime)
      console.log('Response Body Payload: ' + response.body.valuesAsArray)
      console.log('Response Body Payload As Buffer: ' + response.body.valuesAsBuffer.toString('hex'))
    })
    .catch(handleErrors)
    .finally(() => {
      socket.close()
      logWithTime('serial port closed')
    })

})

socket.on('data', function (data: Buffer) {
  console.log('data:', data)
})

socket.on('error', console.error)

// 手动打开串口
socket.open()
