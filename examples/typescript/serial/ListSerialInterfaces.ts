import { SerialPort } from 'serialport'

//npx ts-node examples/typescript/serial/ListSerialInterfaces.ts
//pnpm exec ts-node examples/typescript/serial/ListSerialInterfaces.ts
async function main() {
  const ports = await SerialPort.list()
  ports.forEach(function (port) {
    console.log(port.path)
  })
}

main().catch(console.error)
