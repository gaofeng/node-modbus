
import ModbusServerClient from './modbus-server-client'
import ModbusServer, { IModbusServerOptions } from './modbus-server'
import ModbusRTURequest from './rtu-request'
import ModbusRTUResponse from './rtu-response'

import {SerialPort} from 'serialport'

export default class ModbusRTUServer extends ModbusServer {
  public _socket: any
  public emit: any

  constructor (socket: SerialPort, options?: Partial<IModbusServerOptions>) {
    super(options)
    this._socket = socket

    const fromBuffer = ModbusRTURequest.fromBuffer
    const fromRequest = ModbusRTUResponse.fromRequest as any
    const client = new ModbusServerClient(this, socket, fromBuffer, fromRequest)
    this.emit('connection', client)
  }
}
