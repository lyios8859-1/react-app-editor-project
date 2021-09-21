import { defer } from "../utils/defer"

/**
 * 异步处理函数
 * @param setter 函数
 * @returns 
 */
export function getHookState<Setter extends (val: (current: any) => any) => void>(setter: Setter) {
  // 会自动根据传递的返回返回对应的类型
  const dfd = defer<Parameters<Parameters<typeof setter>[0]>[0]>();
  setter((current) => {
    dfd.resolve(current);
    return current;
  })
  return dfd.promise;
}

