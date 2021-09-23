
import { useEffect, useMemo, useRef } from 'react';
import { VisualEditorBlockData, VisualEditorConfig } from './editor.utils';
import { useUpdate } from './hook/useUpdate';

import styles from './style/VisualEditorBlock.module.scss';

export const VisualEditorBlock: React.FC<{
    block: VisualEditorBlockData,
    config: VisualEditorConfig,
    editing: boolean
}> = (props) => {
    // 强制更新一次
    const { froceUpdate } = useUpdate();

    const style = useMemo(() => {
        return {
            top: `${props.block.top}px`,
            left: `${props.block.left}px`,
        }
    }, [props.block.top, props.block.left]);

    const component = props.config.componentMap[props.block.componentKey];

    let render: any;
    if (!!component) {
        render = component.render({} as any);
    }

    const elRef = useRef({} as HTMLDivElement);
    useEffect(() => {
        if (props.block.adjustPosition) {
            // 设置是首次拖到容器中是否调整位置居于鼠标点
            const { top, left } = props.block;
            const blockCom = elRef.current;
            const { width, height } = blockCom.getBoundingClientRect();
            props.block.adjustPosition = false;
            props.block.left = left - width / 2;
            props.block.top = top - height / 2;
    
            // 记录 block 组件的高度和宽度
            props.block.width = blockCom.offsetWidth;
            props.block.height = blockCom.offsetHeight;
    
            froceUpdate(); // 需要引用一次才可以更新视图
        }
    }, []);

    return (() => {
        const mask = props.editing ? 'mask': '';
        return (
            <div
                className={`${styles['visual-editor__block']} ${mask}`.trim()}
                style={style}
                ref={elRef}
            >
                {render}
            </div>
        )
    })()
}