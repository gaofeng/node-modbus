import { Buffer } from 'buffer';
import { EventEmitter } from 'eventemitter3';

/**
 * 定义一个抽象类 DuplexStream，write 方法接受 Buffer 类型的 chunk。
 * 使用write发送数据。接收到数据时触发data事件，发生错误时触发error事件。
 * a socket object that implements the event emitter
 * interface and fires a 'data' event with a buffer as a parameter. It also needs to
 * implement the 'write' method to send data to the socket.
 */
export abstract class DuplexStream extends EventEmitter {
  public isOpen: boolean = false;

  abstract open(): void;
  abstract close(): void;
  abstract write(chunk: Buffer, callback?: (error?: Error | null) => void): boolean;
}
