# RTU Server CRC 完整性测试用例详解

对应文件：[rtu-server.test.ts](./rtu-server.test.ts)
重点用例：`describe('Request data integrity checking')`（第 32 行起）

## 测试目的

这是一个**负向 / 防御性测试**，验证 RTU 服务端会校验请求帧末尾的 CRC16：**如果 CRC 不匹配，就直接丢弃该帧、不做任何应答**。

CRC 是 Modbus RTU 帧定界与完整性的唯一手段。损坏帧必须被静默丢弃，否则可能：

- 对一个“看起来合法”的请求回复错误数据；
- 破坏 RTU 的帧定界（RTU 没有显式分隔符，靠 3.5 字符间隔 + CRC 来识别帧边界）。

## 测试环境准备（beforeEach）

每次测试前（[rtu-server.test.ts:22-30](./rtu-server.test.ts#L22-L30)）：

1. 创建 `DuplexStreamMock`（[第 6-16 行](./rtu-server.test.ts#L6-L16)）—— 一个假的“双工流”，代替真实串口/socket。
   - 重写了 `open` / `close` / `write`，本身不真正收发数据；
   - 但保留 EventEmitter 能力，可用 `emit('data', ...)` 模拟“收到数据”。
2. 用该 mock 流实例化 RTU 服务端：从机地址 `id: 2`，并初始化 holding（12 字节）和 coils（`0x55 0x55 0x55`）缓冲区。

> 关键点：服务端构造时会监听 socket 的 `data` 事件（内部 `socket.on('data', ...)`），所以后续 `socket.emit('data', request)` 即可模拟“从总线收到一帧”。

## 构造一个 CRC 错误的请求帧

[第 34-42 行](./rtu-server.test.ts#L34-L42) 构造的报文按 Modbus RTU 帧格式解读：

| 字节        | 含义                                      |
| ----------- | ----------------------------------------- |
| `0x02`      | 从机地址（与 `id:2` 匹配）                |
| `0x0F`      | 功能码 15 = Write Multiple Coils          |
| `0x00 0x00` | 起始线圈地址 0                            |
| `0x00 0x04` | 线圈数量 4                                |
| `0x01`      | 字节计数 1                                |
| `0x0F`      | 数据值                                    |
| `0xFF 0xFF` | **CRC** ← 故意写错                        |

这帧结构完全合法，唯独末尾两字节 CRC 是随便填的，并非真正的 CRC16。

> 对比：相同的报文在 [第 96 行那组测试](./rtu-server.test.ts#L96) 中使用的是正确 CRC `0x3E 0x87`。两者一正一反，共同覆盖 CRC 校验分支。

## 拦截写操作 + 触发数据接收

```js
socket.write = (_response: Buffer) => {
  // No response expected
  assert(false)   // 服务端若试图回复，立刻让测试失败
}

socket.emit('data', request)  // 模拟串口收到一帧数据
```

逻辑说明：

- 把 mock 的 `write` 替换为“一旦被调用就抛错”的函数。
- 正常流程下，服务端处理完请求一定会调用 `socket.write()` 把响应写回去。
  - **`assert(false)` 没被触发** → `write` 从未被调用 → 服务端没回复 → 它在校验阶段就把帧丢弃了 → 符合预期，测试通过。
  - **`write` 被调用** → `assert(false)` 立即抛 `AssertionError`，测试失败。
- 该用例**没有用 `done` 回调**：`socket.emit('data', request)` 同步执行完毕且 `write` 未被调用，`it` 自然结束即判定通过。本质上是“验证某个动作（回复）不会发生”。

## 背后的源码调用链

```
socket.emit('data', request)                         ← 测试模拟“收到一帧”
  → ModbusServerClient._onData                       [src/modbus-server-client.ts:44]
      → requestHandler.handle(data)                  [src/modbus-server-request-handler.ts:23]
          → ModbusRTURequest.fromBuffer(buffer)      [src/rtu-request.ts:56]
              ├─ 解析 address / body
              ├─ 计算 expectedCrc = crc16modbus(地址 + body)
              ├─ 读取 actualCrc = 帧末尾两字节
              └─ corrupted = (expected !== actual)   ← 本用例此处为 true（0xFF 0xFF 错的）
          → if (corrupted) 仅打 debug 日志，不入队    ← ★帧被丢弃★
      → requestHandler.shift() 返回 null
      → if (request) 不成立 → 不调用 _responseHandler
      → socket.write() 永远不被调用
  → socket.write 里的 assert(false) 不触发 → 测试通过
```

### 关键源码位置

- **CRC 计算**：[src/rtu-request.ts:75-82](../src/rtu-request.ts#L75-L82)

  ```js
  const expectedCrc = CRC.crc16modbus(buffer.subarray(0, payloadLength))
  const actualCrc = buffer.readUInt16LE(payloadLength)
  const corrupted = (expectedCrc !== actualCrc)
  ...
  return new ModbusRTURequest(address, body, corrupted)  // 标记但不直接丢弃
  ```

- **丢弃决策**：[src/modbus-server-request-handler.ts:33-40](../src/modbus-server-request-handler.ts#L33-L40)

  ```js
  if (request.corrupted) {
    // 只打 debug 日志，不放入待处理队列
    debug(`request message was corrupt: ${corruptDataDump}`)
  } else {
    this._requests.unshift(request)  // 只有校验通过的才入队
  }
  // 无论对错，都把这帧从缓冲区移走
  this._buffer = this._buffer.subarray(request.byteCount)
  ```

## 总结

| 维度       | 说明                                                                |
| ---------- | ------------------------------------------------------------------- |
| 用例性质   | 负向 / 防御性测试                                                   |
| 验证目标   | CRC 错误的帧被静默丢弃，不产生应答                                  |
| 判定方式   | “`write` 不被调用” → 无 `done`，同步执行结束即通过                  |
| 配对用例   | [第 97 行测试](./rtu-server.test.ts#L97) 用正确 CRC 验证正常写入    |
| 协议意义   | 保证总线噪声 / 传输错误下不误应答，维持 RTU 帧定界与完整性          |
