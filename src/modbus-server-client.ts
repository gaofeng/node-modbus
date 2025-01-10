
import Debug from 'debug';
const debug = Debug('modbus-server-client')
import * as Stream from 'stream'
import { ModbusAbstractRequestFromBuffer } from './abstract-request'
import { ModbusAbstractResponseFromRequest } from './abstract-response'
import ModbusServerRequestHandler from './modbus-server-request-handler'
import ModbusServerResponseHandler from './modbus-server-response-handler'
import ModbusServer from './modbus-server'
import { Buffer } from 'buffer';

export default class ModbusServerClient<
  S extends Stream.Duplex,
  ReqFromBufferMethod extends ModbusAbstractRequestFromBuffer,
  ResFromRequestMethod extends ModbusAbstractResponseFromRequest> {
  public _server: ModbusServer
  public _socket: S
  public _requestHandler: ModbusServerRequestHandler<ReqFromBufferMethod>
  public _responseHandler: ModbusServerResponseHandler<ResFromRequestMethod>

  constructor (
    server: ModbusServer,
    socket: S,
    fromBufferMethod: ReqFromBufferMethod,
    fromRequestMethod: ResFromRequestMethod
  ) {
    this._server = server
    this._socket = socket

    this._requestHandler = new ModbusServerRequestHandler(fromBufferMethod)
    this._responseHandler = new ModbusServerResponseHandler(this._server, fromRequestMethod)

    this._socket.on('data', this._onData.bind(this))
  }

  get socket () {
    return this._socket
  }

  get server () {
    return this._server
  }

  public _onData (data: Buffer) {
    debug('new data coming in')
    this._requestHandler.handle(data)

    do {
      const request = this._requestHandler.shift()

      if (!request) {
        debug('no request to process')
        /* TODO: close client connection */
        break
      }

      this._responseHandler.handle(request, (response) => {
        this._socket.write(response, () => {
          debug('response flushed', response)
        })
      })
    } while (1)
  }
}
