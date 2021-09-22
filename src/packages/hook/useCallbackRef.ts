import { useCallback, useRef } from "react";

/**
 * 需要得到一个不变的函数引用，但是这个不变的函数执行的时候，执行的是传递的最新的函数
 * @param callback 传递最新的函数
 * @returns 返回不变的函数
 */
export function useCallbackRef<T extends (...args: any[]) => void>(callback: T): T {
    const refCallback = useRef(callback);
    refCallback.current = callback;
    return useCallback(((...args: any[]) => refCallback.current(...args)) as T, []);
}