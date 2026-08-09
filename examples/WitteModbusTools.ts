// https://www.52pojie.cn/thread-2009694-1-1.html


// pnpm exec ts-node examples/WitteModbusTools.ts

/**
 * 
 * name: 注册名(可自行修改):使用ASCII可打印字符,长度不小于12。
 */
/**
 * Generate a WIT product registration code.
 * @param userName Registration name, ASCII printable characters, length at least 12
 * @param keyStr 8-character key string used for XOR encryption
 * @param productName Product prefix such as "mbslave" or "mbpoll"
 * @returns Generated hexadecimal code string including checksum
 */
function makeCode(userName: string, keyStr: string, productName: string): string {
  // WIT字符串后面得跟两个0~9数字字符,两个数字字符合并成整数XX后须满足 19<XX<100
  // 两个数字字符作用是避开 '可以将sub_47F4A0()函数的赋值1语句改为赋0' sub_47F4A0()函数的执行,其它作用不知道
  // VB: s = "mbpoll" & name & Chr(10) & "# WIT99"
  const s = productName + userName + "\n# WIT99";

  let checksum = s.charCodeAt(0);

  // VB: c = c Xor Asc(...)
  for (let i = 1; i < s.length; i++) {
    checksum ^= s.charCodeAt(i);
  }

  let r = "";

  // VB:
  // h = Hex(Asc(char) Xor Asc(key))
  for (let i = 0; i < s.length; i++) {
    const data = s.charCodeAt(i);

    // ((i) Mod 8)+1 对应 VB 的 (((i-1) Mod 8)+1)
    const keyCode = keyStr.charCodeAt(i % 8);
    const h = (data ^ keyCode).toString(16).toUpperCase().padStart(2, "0");
    r += h;
  }

  // 追加校验
  r += checksum.toString(16).toUpperCase().padStart(2, "0");

  return r;
}

/**
 * Generate a slave product registration code using the predefined slave key.
 * @param userName Registration name, ASCII printable characters, length at least 12
 * @returns Generated slave hexadecimal code string
 */
function makeSlaveCode(userName: string): string {
  const keyStr = "97280132";
  return makeCode(userName, keyStr, "mbslave");
}

/**
 * Generate a poll product registration code using the predefined poll key.
 * @param userName Registration name, ASCII printable characters, length at least 12
 * @returns Generated poll hexadecimal code string
 */
function makePollCode(userName: string): string {
  const keyStr = "75280139";
  return makeCode(userName, keyStr, "mbpoll");
}

const userName = "gaofeng|xuehua";
// 测试
console.log("Slave Code:\n" + makeSlaveCode(userName));
console.log("Poll Code:\n" + makePollCode(userName));