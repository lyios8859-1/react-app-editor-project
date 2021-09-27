import { useEffect, useMemo, useRef } from 'react';
import classNames from 'classnames';

import { VisualEditorBlockData, VisualEditorConfig } from './editor.utils';
import { useUpdate } from './hook/useUpdate';

import classModule from './style/VisualEditorBlock.module.scss';

export const VisualEditorBlock: React.FC<{
    block: VisualEditorBlockData,
    config: VisualEditorConfig,
    onMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void,
    editing?: boolean,
    preview?: boolean,
}> = (props) => {
    // 强制更新一次
    const { froceUpdate } = useUpdate();
    const elRef = useRef({} as HTMLDivElement);

    const style = useMemo(() => {
        return {
            top: `${props.block.top}px`,
            left: `${props.block.left}px`,
            zIndex: props.block.zIndex,
            opacity: props.block.adjustPosition ? 0 : "", // 解决调整拖拽结束时居中时组件闪动 BUG
        }
    }, [props.block.top, props.block.left, props.block.zIndex]);

    const classes = useMemo(() => classNames([
        classModule['visual-editor__block'],
        { [classModule['editor-block__mask']]: props.preview ? false : props.editing },
        { [classModule['editor-block__active']]: props.preview ? false : (props.editing ? props.block.focus : false) }])
    , [props.block.focus, props.editing, props.preview])

    const component = props.config.componentMap[props.block.componentKey];

    let render: any;
    if (!!component) {
        render = component.render({} as any);
    }

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
        
        return (
            <div
                className={classes}
                style={style}
                ref={elRef}
                onMouseDown={props.onMouseDown}
            >
                {render}
            </div>
        )
    })()
}