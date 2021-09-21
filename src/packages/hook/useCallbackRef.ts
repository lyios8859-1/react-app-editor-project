import { useState, useRef, useCallback } from "react";

// 需要得到一个不变的函数引用，但是这个不变的函数执行的时候，执行的是传递的最新的函数
// export function useCallbackRef1<Cb extends (...args: any[]) => void>(cb: Cb): Cb {
//     const refCb = useRef(cb);
//     refCb.current = cb;
//     const [staticCb] = useState(() => {
//         return ((...args: any) => refCb.current(...args)) as Cb;
//     })
//     return staticCb;
// }
// 这函数的作用 和 useCallbackRef1 的作用一样的
export function useCallbackRef<Cb extends (...args: any[]) => void>(cb: Cb): Cb {
    const refCb = useRef(cb);
    refCb.current = cb;
    return useCallback(((...args: any[]) => refCb.current(...args)) as Cb, []);
}