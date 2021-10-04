import deepcopy from "deepcopy";
import { useRef } from "react";
import { VisualEditorBlockData, VisualEditorValue } from "./editor.utils";
import { useCallbackRef } from "./hook/useCallbackRef";
import { useCommander } from "./plugin/command.plugin";


export function useVisualCommand({
    focusData,
    value,
    updateBlocks,
    updateValue,
    dragend,
    dragstart
}: {
    focusData: {
        focus: VisualEditorBlockData[],
        unFocus: VisualEditorBlockData[]
    },
    value: VisualEditorValue,
    updateBlocks: (blocks: VisualEditorBlockData[]) => void,
    updateValue: (value: VisualEditorValue) => void,
    dragstart: {
        on: (cb: () => void) => void,
        off: (cb: () => void) => void
    },
    dragend: {
        on: (cb: () => void) => void,
        off: (cb: () => void) => void
    }
}) {
    const commander = useCommander();

    // 注册一个删除命令操作
    commander.useRegistry({
        name: 'delete',
        keyboard: ['delete', 'ctrl+d', 'backspace'],
        execute: () => {
            const data = {
                before: (() => deepcopy(value.blocks))(),
                after: (() => deepcopy(focusData.unFocus))()
            }
            return {
                redo: () => { // 重做
                    updateBlocks(deepcopy(data.after));
                },
                undo: () => { // 撤销
                    updateBlocks(deepcopy(data.before));
                }
            }
        }
    });

    // 注册一个清空命令操作
    commander.useRegistry({
        name: 'clear',
        execute: () => {
            const data = {
                before: deepcopy(value.blocks),
                after: deepcopy([]),
            }
            return {
                redo: () => {
                    updateBlocks(deepcopy(data.after));
                },
                undo: () => {
                    updateBlocks(deepcopy(data.before));
                },
            }
        }
    });

    {
        const dragData = useRef({ before: null as null | VisualEditorBlockData[] });

        const handler = { // 拖拽开始或结束就会通过已经订阅的事件来触发这个 dragstart、dragend 函数，执行对应的函数逻辑
            dragstart: useCallbackRef(() => dragData.current.before = deepcopy(value.blocks)),
            dragend: useCallbackRef(() => commander.state.commands.drag())
        }
        /**
         * 注册拖拽命令
         * 适用于如下三种情况：
         * 1. 从左侧菜单拖拽组件到容器画布；
         * 2. 在容器中拖拽组件调整位置；
         * 3. 拖动调整组件的高度和宽度。
         */
        commander.useRegistry({
            name: 'drag',
            init: () => {
                dragData.current = { before: null };
                dragstart.on(handler.dragstart);
                dragend.on(handler.dragend);
                return () => {
                    dragstart.off(handler.dragstart);
                    dragend.off(handler.dragend);
                }
            },
            execute: () => {
                const data = {
                    before: deepcopy(dragData.current.before),
                    after: deepcopy(value.blocks)
                };
                return {
                    redo: () => {
                        updateBlocks(deepcopy(data.after));
                    },
                    undo: () => {
                        updateBlocks(deepcopy(data.before) || []);
                    }
                }
            }
        });
    }

    // 注册置顶命令
    commander.useRegistry({
        name: 'placeTop',
        keyboard: 'ctrl+up',
        execute: () => {

            const data = {
                before: (() => deepcopy(value.blocks))(),
                after: (() => deepcopy(() => {
                    const { focus, unFocus } = focusData;
                    // 计算出 focus 选中的最大的 zIndex 值，unFocus 未选中的最小的 zIndex 值，计算它们的差值就是当前元素置顶的 zIndex 值
                    const maxUnFocusIndex = unFocus.reduce((prev, item) => {
                        return Math.max(prev, item.zIndex);
                    }, -Infinity);
                    const minFocusIndex = focus.reduce((prev, item) => {
                        return Math.min(prev, item.zIndex);
                    }, Infinity);
                    let dur = maxUnFocusIndex - minFocusIndex + 1;
                    if (dur >= 0) {
                        dur++;
                        focus.forEach(block => block.zIndex = block.zIndex + dur);
                    }
                    return value.blocks;
                }))()()
            };
            return {
                redo: () => updateBlocks(deepcopy(data.after) || []),
                undo: () => updateBlocks(deepcopy(data.before))
            };
        }
    });

    // 注册全选快捷键命令
    commander.useRegistry({
        name: 'selectAll',
        keyboard: ['ctrl+a'],
        followQueue: false,
        execute: () => {
            return {
                redo: () => {
                    value.blocks.forEach(block => block.focus = true);
                    updateBlocks(value.blocks);
                }
            }
        }
    });

    // 注册置顶命令
    commander.useRegistry({
        name: 'placeBottom',
        keyboard: 'ctrl+down',
        execute: () => {

            const data = {
                before: (() => deepcopy(value.blocks))(),
                after: (() => deepcopy(() => {
                    const { focus, unFocus } = focusData;
                    // 计算出 focus 选中的最大的 zIndex 值，unFocus 未选中的最小的 zIndex 值，计算它们的差值就是当前元素置顶的 zIndex 值
                    const minUnFocusIndex = unFocus.reduce((prev, item) => {
                        return Math.min(prev, item.zIndex);
                    }, Infinity);
                    const maxFocusIndex = focus.reduce((prev, item) => {
                        return Math.max(prev, item.zIndex);
                    }, -Infinity);
                    const minFocusIndex = focus.reduce((prev, item) => {
                        return Math.min(prev, item.zIndex);
                    }, Infinity);
                    let dur = maxFocusIndex - minUnFocusIndex + 1;
                    if (dur >= 0) {
                        dur++;
                        focus.forEach(block => block.zIndex = block.zIndex - dur);
                        if (minFocusIndex - dur < 0) {
                            dur = dur - minFocusIndex;
                            value.blocks.forEach(block => block.zIndex = block.zIndex + dur);
                        }
                    }
                    return value.blocks;
                }))()()
            };

            return {
                redo: () => updateBlocks(deepcopy(data.after)),
                undo: () => updateBlocks(deepcopy(data.before))
            };
        }
    });

    // 注册导入数据时，更新数据命令
    commander.useRegistry({
        name: 'updateValue',
        execute: (newModelValue: VisualEditorValue) => {
            const data = {
                before: deepcopy(value),
                after: deepcopy(newModelValue)
            };
            return {
                redo: () => updateValue(data.after),
                undo: () => updateValue(data.before)
            }
        }
    });

    //  注册导入节点数据时，更新节点数据命令
    commander.useRegistry({
        name: 'updateBlock',
        execute: (newBlock: VisualEditorBlockData, oldBlock: VisualEditorBlockData) => {
            let blocks = deepcopy(value.blocks);
            const data = {
                before: blocks,
                after: (() => {
                    blocks = [...blocks];
                    const index = value.blocks.indexOf(oldBlock);
                    if (index > -1) {
                        blocks.splice(index, 1, newBlock);
                    }
                    return deepcopy(blocks);
                })(),
            }
            return {
                redo: () => {
                    updateBlocks(deepcopy(data.after));
                },
                undo: () => {
                    updateBlocks(deepcopy(data.before));
                },
            }
        },
    })

    // 初始内置的命令 undo，redo
    commander.useInit(); // 在底部调用
    return {
        delete: () => commander.state.commands.delete(),
        clear: () => commander.state.commands.clear(),
        undo: () => commander.state.commands.undo(),
        redo: () => commander.state.commands.redo(),
        placeBottom: () => commander.state.commands.placeBottom(),
        placeTop: () => commander.state.commands.placeTop(),
        updateValue: (newModelValue: VisualEditorValue) => commander.state.commands.updateValue(newModelValue),
        updateBlock: (newModelValue: VisualEditorValue, oldModelValue: VisualEditorBlockData) => commander.state.commands.updateBlock(newModelValue, oldModelValue),
    }
}