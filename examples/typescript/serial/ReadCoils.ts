import * as Modbus from '../../../src/modbus'
import { SerialStream } from './SerialStream';
import { handleErrors } from './handle-errors';

// pnpm exec ts-node examples/typescript/serial/ReadCoils.ts

const socket = new SerialStream('COM1', 115200, 'even');

const address = 0x01;
const client = new Modbus.client.RTU(socket, address)

const readStart = 0;
const readCount = 5;

socket.on('close', function () {
  console.log('closed')
})

socket.on('open', function () {

  client.readCoils(readStart, readCount)
    .then(({ metrics, request, response }) => {
      console.log('Transfer Time: ' + metrics.transferTime)
      console.log('Response Body Payload: ' + response.body.valuesAsArray)
      console.log('Response Body Payload As Buffer: ' + response.body.valuesAsBuffer.toString('hex'))
    })
    .catch(handleErrors)
    .finally(() => socket.close())

})

socket.on('data', function (data: Buffer) {
  console.log('data:', data)
})

socket.on('error', console.error)

// 手动打开串口
socket.open()
