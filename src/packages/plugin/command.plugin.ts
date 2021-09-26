import { useCallback, useRef, useState } from "react";

// command 的 execute 执行完之后，需要返回 undo、redo。execute 执行后会立即返回 redo，后续撤销的时候会执行 undo，重做的时候会执行 redo
interface CommandExecute {
    redo: () => void, // 默认执行，重做会调用
    undo?: () => void, // 撤销会调用
}

interface Command {
    name: string, // 命令的唯一标识
    execute: (...args: any[]) => CommandExecute, // 命令执行时候，所处理的内容
    keyboard?: string | string[], // 命令监听的快捷键
    followQueue?: boolean, // 命令执行之后，是否需要将命令执行得到的 undo，redo 存入命令队列（像全选、撤销、重做这中命令不需要存入命令队列的）
    init?: () => ((() => void) | undefined), // 命令初始化函数，如果返回的，则是一个销毁命令函数
    data?: any // 命令缓存所需的数据信息
}

export function useCommander() {
    const [state] = useState(() => ({
        current: -1, // 当前命令队列中，最后执行的命令返回的 CommandExecute 对象
        queue: [] as CommandExecute[], // 命令队列容器
        commandList: [] as { current: Command }[], // 预定义命令的容器
        commands: {} as Record<string, (...args: any[]) => void>, // 通过 command name 执行 command 动作的一个包装对象
        destroyList: [] as ((() => void) | undefined)[] // 所有命令在组件销毁之前，需要执行的消除副作用的函数容器
    }));

    /**
     * 注册命令
     */
    const useRegistry = useCallback((command: Command) => {
        const commandRef = useRef<Command>(command);
        commandRef.current = command;
        useState(() => {
            // 判断命令是否存在
            if (state.commands[command.name]) {
                const existIndex = state.commandList.findIndex(item => item.current.name === command.name);
                state.commandList.splice(existIndex, 1);
            }
            state.commandList.push(commandRef);
            // 对应命令的方法 AAAAAAA
            state.commands[command.name] = (...args: any[]) => {
                const { redo, undo } = commandRef.current.execute(...args);
                // 默认执行重做
                redo();
                // 如果命令执行后，不需要进入命令队列，就直接结束
                if (commandRef.current.followQueue === false) {
                    return;
                }
                // 否则，将命令队列中剩余的命令都删除，保留 current 及其之前的命令
                let { queue, current } = state;
                if (queue.length > 0) {
                    queue = queue.slice(0, current + 1);
                    state.queue = queue;
                }
                // 将命令队列中最后一个命令为i当前执行的命令
                queue.push({ undo, redo });
                // 索引加 1， 指向队列中的最有一个命令
                state.current = current + 1;
            }
            /**
             * commands 结构类型
             * {
             *   undo: () => {},
             *   redo: () => {}，
             *   delete: () => {},
             *   clear: () => {},
             *   placeTop: () => {},
             *   placeBottom: () => {}
             * }
             */

        });
    }, []);


    const useInit = useCallback(() => {

    }, []);

    return {
        state,
        useInit,
        useRegistry
    }
}