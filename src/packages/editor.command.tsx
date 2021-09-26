import deepcopy from "deepcopy";
import { VisualEditorBlockData, VisualEditorValue } from "./editor.utils";
import { useCommander } from "./plugin/command.plugin";


export function useVisualCommand({
    focusData,
    value,
    updateBlocks
}: {
    focusData: {
        focus: VisualEditorBlockData[],
        unFocus: VisualEditorBlockData[]
    },
    value: VisualEditorValue,
    updateBlocks: (blocks: VisualEditorBlockData[]) => void,
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
    })

     // 初始内置的命令 undo，redo
    commander.useInit(); // 在底部调用
    return {
        delete: () => commander.state.commands.delete(),
        clear: () => commander.state.commands.clear(),
        undo: () => commander.state.commands.undo(),
        redo: () => commander.state.commands.redo(),
    }
}