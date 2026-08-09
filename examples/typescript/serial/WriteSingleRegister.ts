import * as Modbus from '../../../src/modbus'
import { SerialStream } from './SerialStream';
import { handleErrors } from './handle-errors';

// pnpm exec ts-node examples/typescript/serial/WriteSingleRegister.ts

const socket = new SerialStream('COM1', 19200, 'none');

const address = 0x01;
const client = new Modbus.client.RTU(socket, address)

const writeAddress = 5;
const writeValue = 123; // either 0, 1, or boolean

socket.on('close', function () {
  console.log('closed')
})

socket.on('open', function () {

  client.writeSingleRegister(writeAddress, writeValue)
    .then(({ metrics, request, response }) => {
      console.log('Transfer Time: ' + metrics.transferTime)
      console.log('Response Function Code: ' + response.body.fc)
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
