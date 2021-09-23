
import { useMemo } from 'react';
import { VisualEditorBlockData, VisualEditorConfig } from './editor.utils';
import styles from './style/VisualEditorBlock.module.scss';

export const VisualEditorBlock: React.FC<{
    block: VisualEditorBlockData,
    config: VisualEditorConfig,
    editing: boolean
}> = (props) => {
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

    return (() => {
        const mask = props.editing ? 'mask': '';
        return (
            <div className={`${styles['visual-editor__block']} ${mask}`.trim()} style={style}>
                {render}
            </div>
        )
    })()
}