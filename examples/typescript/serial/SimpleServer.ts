import { IModbusServerOptions, ModbusRTUServer } from '../../../src/modbus'
import { SerialStream } from './SerialStream'

// pnpm exec ts-node examples/typescript/serial/SimpleServer.ts

const options: IModbusServerOptions = {
  id: 1,
  coils: null,
  discrete: null,
  holding: Buffer.alloc(100),
  input: Buffer.alloc(100)
}

const port = new SerialStream('COM1', 19200, 'none')
const server = new ModbusRTUServer(port, options)
port.open((error) => {
  if (error) {
    console.error('Failed to open serial port:', error)
    return
  }
})
server.on('connection', (client) => {
  console.log('Client connected:', client.socket.portName)
})

