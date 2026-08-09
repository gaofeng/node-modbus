import { Buffer } from 'buffer'
import { DuplexStream } from '../../../src/modbus'
import { SerialPort } from 'serialport'
import Debug from 'debug'

const debug = Debug('serial-stream')

export class SerialStream extends DuplexStream {
  private port: SerialPort
  private _portName: string
  private pollTimer: ReturnType<typeof setInterval> | null = null
  private pollIntervalMs = 10
  constructor(
    portName: string,
    baudRate: number = 9600,
    parity: 'none' | 'even' | 'odd' | 'mark' | 'space' = 'none',
    DataBits: 5 | 6 | 7 | 8 = 8,
    StopBits: 1 | 1.5 | 2 = 1
  ) {
    super()
    this._portName = portName
    // 初始化串口
    this.port = new SerialPort({
      path: portName,
      baudRate,
      autoOpen: false, // 手动控制打开
      parity: parity,
      dataBits: DataBits,
      stopBits: StopBits,
    })

    // 绑定串口事件
    this.port.on('open', () => {
      this.isOpen = true
      this.emit('open', this.port.path)
      if (process.env.SERIAL_POLL_READ) {
        this.startPollingRead()
      }
    })

    this.port.on('data', (data: Buffer) => {
      debug('RX:', data)
      this.emit('data', data) // 发射数据事件给使用者
    })

    this.port.on('error', (err) => {
      debug('Error:', err)
      this.emit('error', err)
    })

    this.port.on('close', () => {
      this.isOpen = false
      debug('Close')
      this.stopPollingRead()
      this.emit('close')
    })
  }
  get portName() {
    return this._portName
  }
  // 实现 open 方法
  public open(callback?: (error?: Error | null) => void): void {
    if (this.isOpen) {
      if (callback) callback(null) // 已打开，直接回调成功
      return
    }
    // if (this.port == null) {
    //   if (callback) callback(new Error('串口关闭后无法再次打开'))
    //   return
    // }

    this.port.open((err) => {
      if (err) {
        this.emit('error', err)
        if (callback) callback(err)
        return
      }
      // isOpen 会在 'open' 事件中更新，无需在这里设置
      if (callback) callback(null)
    })
  }

  // 实现 update 方法
  public update(options: { baudRate: number }, callback?: (error?: Error | null) => void): void {
    if (!this.isOpen) {
      const error = new Error('Serial port must be open to update')
      if (callback) callback(error)
      this.emit('error', error)
      return
    }

    this.port.update(options, (err) => {
      if (err) {
        this.emit('error', err)
        if (callback) callback(err)
        return
      }
      if (callback) callback(null)
    })
  }

  close() {
    this.stopPollingRead()
    this.port.close()
    this.port.removeAllListeners()
    this.isOpen = false
  }

  write(chunk: Buffer, _callback?: (error?: Error | null) => void) {
    if (!Buffer.isBuffer(chunk)) {
      throw new Error('chunk must be a Buffer')
    }
    if (!this.isOpen) {
      const error = new Error('Serial port is not open')
      debug('Write error: port not open')
      if (_callback) _callback(error)
      this.emit('error', error)
      return false
    }
    debug('TX:', chunk)
    this.port.write(chunk, _callback)
    // 返回 true 表示可以继续写入
    return true
  }

  private startPollingRead() {
    if (this.pollTimer) return
    debug('Start polling read...')
    this.pollTimer = setInterval(() => {
      if (!this.isOpen || this.port == null) return
      try {
        for (;;) {
          const buf = this.port.read() as Buffer
          if (!buf || buf.length === 0) break
          debug('RX(poll):', buf)
          this.emit('data', buf)
        }
      } catch (e) {
        // ignore intermittent read errors; SerialPort will emit 'error' if critical
      }
    }, this.pollIntervalMs)
    // allow process to exit naturally
    this.pollTimer.unref?.()
  }

  private stopPollingRead() {
    if (!this.pollTimer) return
    clearInterval(this.pollTimer)
    this.pollTimer = null
  }
}
