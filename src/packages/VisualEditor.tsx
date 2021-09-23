import { useMemo, useRef, useState } from 'react';
import { Button } from 'antd';
import { MenuUnfoldOutlined } from '@ant-design/icons'

import './style/common.scss';

import styles from  './style/VisualEditor.module.scss';
import { createVisualBlock, VisualEditorBlockData, VisualEditorComponent, VisualEditorConfig, VisualEditorValue } from './editor.utils';
import { VisualEditorBlock } from './EditorBlock';
import { useCallbackRef } from './hook/useCallbackRef';

export const VisualEditor: React.FC<{
  value: VisualEditorValue,
  config: VisualEditorConfig,
  onChange: (val: VisualEditorValue) => void, // 数据有变化出发外部函数
}> = (props) => {
  // 当前是否处于编辑状态
  const [editing, setEditing] = useState(true);
  const methods = {
    // 切换编辑和运行状态
    toggleEditing () {
      setEditing(!editing);
    },
    /**
     * 更新 block 数据，触发视图重新渲染
     * @param blocks 
     */
    updateBlocks: (blocks: VisualEditorBlockData[]) => {
      props.onChange({
        ...props.value,
        blocks: [...blocks]
      })
    },
  }

  // 画布容器 DOM
  const containerRef = useRef({} as HTMLDivElement);

  const containerStyles = useMemo(() => {
    return {
      width: `${props.value.container.width}px`,
      height: `${props.value.container.height}px`,
    }
  }, [props.value.container.height, props.value.container.width]);

  //#region 左侧菜单拖拽到画布容器区域内
  const menuDraggier = (() => {

    const dragData = useRef({
      dragComponent: null as null | VisualEditorComponent // 左侧组件列表去拖拽的当前组件
    });

    const container = {
      dragenter: useCallbackRef((e: DragEvent) => {
        e.dataTransfer!.dropEffect = 'move';
      }),
      dragover: useCallbackRef((e: DragEvent) => {
        e.preventDefault();
      }),
      dragleave: useCallbackRef((e: DragEvent) => {
        e.dataTransfer!.dropEffect = 'none';
      }),
      drop: useCallbackRef((e: DragEvent) => {
        // 在容器画布添加组件
        console.log('add')

        methods.updateBlocks([
          ...props.value.blocks,
          createVisualBlock({
            top: e.offsetY,
            left: e.offsetX,
            component: dragData.current.dragComponent!
          })
        ]);

      }),
    };

    const block = {
      dragstart: useCallbackRef((e: React.DragEvent<HTMLDivElement>,  dragComponent: VisualEditorComponent) => {
        
        containerRef.current.addEventListener('dragenter', container.dragenter);
        containerRef.current.addEventListener('dragover', container.dragover);
        containerRef.current.addEventListener('dragleave', container.dragleave);
        containerRef.current.addEventListener('drop', container.drop);

        dragData.current.dragComponent = dragComponent;

      }),
      dragend: useCallbackRef((e: React.DragEvent<HTMLDivElement>) => {

        containerRef.current.removeEventListener('dragenter', container.dragenter);
        containerRef.current.removeEventListener('dragover', container.dragover);
        containerRef.current.removeEventListener('dragleave', container.dragleave);
        containerRef.current.removeEventListener('drop', container.drop);
      })
    };

    return block;
  })();
  //#endregion

  return (<>
      {
        editing ? (
          <div className={styles['visual-editor__container']}>
            <div className={styles['visual-editor__menu']}>
              <div className={styles['visual-editor__menu__title']}>
                <MenuUnfoldOutlined /> <span>组件列表</span>
              </div>
              {
                props.config.componentList.map((component, index) => {
                  return (
                    <div
                      key={component.key + '_' + index}
                      className={styles['editor-menu__item']}
                      draggable
                      onDragStart={e => menuDraggier.dragstart(e, component)}
                      onDragEnd={menuDraggier.dragend}
                    >
                      <span className={styles['menu-item__title']}>{component.label}</span>
                      <div className={styles['menu-item__content']}>
                        {component.prievew()}
                      </div>
                    </div>
                  )
                })
              }
            </div>
            <div className={styles['visual-editor__head']}>header <button onClick={methods.toggleEditing}>运行</button></div>
            <div className={styles['visual-editor__operator']}>operator</div>
            <div className={`${styles['visual-editor__body']} ${styles['custom-bar__style']}`}>
              <div
                className={`${styles['editor-body_container']} ${'editor-block__mask'}`}
                style={containerStyles}
                ref={containerRef}
              >
                {
                  props.value.blocks.map((block, index) => {
                    return <VisualEditorBlock
                            block={block}
                            config={props.config}
                            editing={editing}
                            key={index}
                          />
                  })
                }
              </div>
            </div>
          </div>
        ) : (
          <div className={styles['visual-editor__preview']}>
            <div className={styles['editor-preview__edit']} onClick={methods.toggleEditing}><Button>编辑</Button></div>
            <div className={styles['preview-edit__warpper']}>
              <div className={styles['editor-body_container']} style={containerStyles}>
                {
                  props.value.blocks.map((block, index) => {
                    return <VisualEditorBlock
                            block={block}
                            config={props.config}
                            key={index}
                            editing={editing}
                          />
                  })
                }
              </div>
            </div>
          </div>
        )
      }
  </>);
};