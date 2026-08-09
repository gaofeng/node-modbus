import * as Modbus from '../../../src/modbus'
import { SerialStream } from './SerialStream';
import { handleErrors } from './handle-errors';

// pnpm exec ts-node examples/typescript/serial/ReadInputRegister.ts

const socket = new SerialStream('COM1', 19200, 'none');

const address = 0x01;
const client = new Modbus.client.RTU(socket, address, 1000)

const readStart = 0;
const readCount = 12;

socket.on('close', function () {
  console.log('closed')
})

socket.on('open', async function () {

  console.log('event open')
  try {
    const { metrics, response } = await client.readInputRegisters(readStart, readCount)
    console.log('Transfer Time: ' + metrics.transferTime)
    console.log('Response Body Payload: ' + response.body.valuesAsArray)
    console.log('Response Body Payload As Buffer: ' + response.body.values.toString('hex'))
  } catch (err) {
    handleErrors(err)
  } finally {
    socket.close()
  }

})

socket.on('data', function (data: Buffer) {
  console.log('data:', data)
})

socket.on('error', console.error)

// 手动打开串口
socket.open()
