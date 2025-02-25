import { EventEmitter } from 'eventemitter3';
import { DuplexStream } from './DuplexStream';

// Listen 方法的可选参数
interface ListenOptions {
  port: number;
  host: string | null;
}

export class DuplexServer extends EventEmitter {
  protected options: ListenOptions;
  protected listening: boolean;

  constructor() {
    super();
    this.options = { port: 0, host: null };
    this.listening = false;
  }
  public on (event: string | symbol, listener: (...args: any[]) => void): this {
    return super.on(event, listener)
  }

  // 模拟 net.Server 的 listen 方法
  public listen(
    host?: string,
    port?: number,
    listeningCallback?: () => void
  ): this {
    if (port) {
      this.options.port = port;
    }
    if (host) {
      this.options.host = host;
    }
    return this._startListening(listeningCallback);
  }

  // 抽象方法，子类必须实现
  protected _startListening(listeningCallback?: () => void): this {
    throw new Error('Method "_startListening" must be implemented by subclass');
  }

  // 模拟 net.Server 的 close 方法
  public close(callback?: () => void): this {
    if (!this.listening) {
      if (callback) callback();
      return this;
    }
    return this._stopListening(callback);
  }

  // 抽象方法，子类必须实现
  protected _stopListening(callback?: () => void): this {
    throw new Error('Method "_stopListening" must be implemented by subclass');
  }

  // 模拟 net.Server 的 address 方法
  public address(): { port: number; family: string; address: string } | null {
    if (!this.listening) return null;
    return { port: this.options.port, family: 'IPv4', address: this.options.host ?? '0.0.0.0' };
  }

  // 触发事件的方法，类型安全
  protected emitConnection(connection: DuplexStream): void {
    this.emit('connection', connection);
  }

  protected emitListening(): void {
    this.listening = true;
    this.emit('listening');
  }

  protected emitClose(): void {
    this.listening = false;
    this.emit('close');
  }

  protected emitError(error: NodeJS.ErrnoException): void {
    this.emit('error', error);
  }
}
