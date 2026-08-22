import * as Modbus from '../../../src/modbus'
import { handleErrors } from './handle-errors';
import { SerialStream } from './SerialStream';

// pnpm exec ts-node examples/typescript/serial/ReadHoldingRegisters.ts

async function main() {
  const socket = new SerialStream('COM1', 115200, 'even');

  const deviceId = 0x01;
  const client = new Modbus.client.RTU(socket, deviceId, 1000)

  const readStartAddr = 100
  const readCount = 2

  try {
    await socket.open()
    const result = await client.readHoldingRegisters(readStartAddr, readCount)
    console.log('Transfer Time: ' + result.metrics.transferTime)
    console.log('Response Body Payload: ' + result.response.body.valuesAsArray)
    console.log('Response Body Payload As Buffer: ' + result.response.body.values.toString('hex'))
  } catch (error) {
    handleErrors(error)
  }
  finally {
    if (socket.isOpen) {
      socket.close()
    }
  }
}

main().catch(console.error)
