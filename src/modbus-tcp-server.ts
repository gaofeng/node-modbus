import Debug from 'debug'; const debug = Debug('modbus tcp server')
import ModbusServer, { IModbusServerOptions } from './modbus-server'
import ModbusServerClient from './modbus-server-client'
import ModbusTCPRequest from './tcp-request'
import ModbusTCPResponse from './tcp-response'
import { DuplexStream } from './DuplexStream';

export default class ModbusTCPServer extends ModbusServer {
  public _server: ModbusServer

  constructor (server: ModbusServer, options?: Partial<IModbusServerOptions>) {
    super(options)
    this._server = server

    server.on('connection', this._onConnection.bind(this))
  }

  public _onConnection (socket: DuplexStream) {
    debug('new connection coming in')

    const Request = ModbusTCPRequest.fromBuffer
    const Response = ModbusTCPResponse.fromRequest as any

    const client = new ModbusServerClient(this, socket, Request, Response)

    this.emit('connection', client)
  }
}
