import { useMemo, useRef, useState } from 'react';
import { Button } from 'antd';
import { MenuUnfoldOutlined } from '@ant-design/icons'

import classModule from  './style/VisualEditor.module.scss';

import { createVisualBlock, VisualEditorBlockData, VisualEditorComponent, VisualEditorConfig, VisualEditorValue } from './editor.utils';
import { VisualEditorBlock } from './EditorBlock';
import { useCallbackRef } from './hook/useCallbackRef';

export const VisualEditor: React.FC<{
  value: VisualEditorValue,
  config: VisualEditorConfig,
  onChange: (val: VisualEditorValue) => void, // 数据有变化出发外部函数
}> = (props) => {
  // 当前是否处于编辑状态
  const [editing, setEditing] = useState(true); // true 处于编辑状态
  const [preview, setPreview] = useState(false); // true 处于预览状态

  const innerMethods = {
    // 切换编辑和运行状态
    toggleEditing () {
      setEditing(!editing);
    },
    // 切换编辑和预览状态
    togglePreview () {
      setPreview(!preview);
    },
  }

  // 当前选中 block 组件元素的索引
  const [selectIndex, setSelectIndex] = useState(-1); // 默认 -1 没选中
  const selectBlock = useMemo(() => props.value.blocks[selectIndex], [props.value.blocks, selectIndex]);

  // 对外暴露方法
  const methods = {
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
    /**
     * 清空选中的数据
     */
    clearFocus: (external?: VisualEditorBlockData) => {
      let blocks = [...props.value.blocks];
      if (!blocks.length) return;
      if (external) {
        blocks = blocks.filter(item => item !== external);
      }
      blocks.forEach(block => block.focus = false);
      methods.updateBlocks(props.value.blocks);
    },
  }

  // 画布容器 DOM
  // 能够确保 containerRef 的存在这样书写
  const containerRef = useRef({} as HTMLDivElement);
  // 不能够确保 containerRef 的存在这样书写
  // const containerRef = useRef(null as null | HTMLDivElement);

  const containerStyles = useMemo(() => {
    return {
      width: `${props.value.container.width}px`,
      height: `${props.value.container.height}px`,
    }
  }, [props.value.container.height, props.value.container.width]);

  /**
   * 存储数据中选中状态和未选中状态的数据
   */
  const focusData = useMemo(() => {
    const focus: VisualEditorBlockData[] = [];
    const unFocus: VisualEditorBlockData[] = [];

    props.value.blocks.forEach(block => {
      (block.focus ? focus : unFocus).push(block);
    });

    return {
      focus,
      unFocus
    }
  }, [props.value.blocks]);

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


  //#region 画布容器中 block 组件选中
  const focusHandler = (() => {
    const mousedownBlock = (e: React.MouseEvent<HTMLDivElement>, block: VisualEditorBlockData, index: number) => {
      e.stopPropagation();
      if (preview) return;
      e.preventDefault();

      if (e.shiftKey) {
        // 如果摁住了shift键，如果此时没有选中的 block，就选中该 block，否则使该 block 的数据选中状态取反
        if (focusData.focus.length <= 1) {
          block.focus = true;
        } else {
          block.focus = !block.focus;
        }
        methods.updateBlocks(props.value.blocks);
      } else {
        // 如果点击的这个 block 没有被选中，才清空这个其他选中的 block，否则不做任何事情。放置拖拽多个 block，取消其他 block 的选中状态
        if (!block.focus) {
          block.focus = true;
          methods.clearFocus(block);
        }
      }
      
      setSelectIndex(block.focus ? index : -1);
      // 使用延时器保证，数据时渲染后的正确数据，否则有 BUG
      // setTimeout(() => {
      //   blockDraggier.mousedown(ev, block);
      // });
    };
    const mousedownContainer = (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (preview) return;
      e.preventDefault();

      // 右键不作任何处理
      if (e.button === 1) return;
      // 判断不是点击了 container 容器就返回
      if (e.target !== e.currentTarget) return;

      // console.log('点击了 Contanier');
      if (!e.shiftKey) {
        // 点击空白出清空所有的选中的 block
        methods.clearFocus();
        setSelectIndex(-1);
      }
    };

    return {
      block: mousedownBlock,
      container: mousedownContainer
    }
  })();
  //#endregion

  return (<>
      {
        editing ? (
          <div className={classModule['visual-editor__container']}>
            <div className={classModule['visual-editor__menu']}>
              <div className={classModule['visual-editor__menu__title']}>
                <MenuUnfoldOutlined /> <span>组件列表</span>
              </div>
              {
                props.config.componentList.map((component, index) => {
                  return (
                    <div
                      key={component.key + '_' + index}
                      className={classModule['editor-menu__item']}
                      draggable
                      onDragStart={e => menuDraggier.dragstart(e, component)}
                      onDragEnd={menuDraggier.dragend}
                    >
                      <span className={classModule['menu-item__title']}>{component.label}</span>
                      <div className={classModule['menu-item__content']}>
                        {component.prievew()}
                      </div>
                    </div>
                  )
                })
              }
            </div>
            <div className={classModule['visual-editor__head']}>
              <button onClick={innerMethods.toggleEditing}>运行</button>
              <button onClick={innerMethods.togglePreview}>{preview ? '编辑' : '预览'}</button>
            </div>
            <div className={classModule['visual-editor__operator']}>operator</div>
            <div className={`${classModule['visual-editor__body']} ${classModule['custom-bar__style']}`}>
              <div
                className={classModule['editor-body_container']}
                style={containerStyles}
                ref={containerRef}
                onMouseDown={focusHandler.container}
              >
                {
                  props.value.blocks.map((block, index) => {
                    return <VisualEditorBlock
                            block={block}
                            config={props.config}
                            editing={editing}
                            preview={preview}
                            key={index}
                            onMouseDown={e => focusHandler.block(e, block, index)}
                          />
                  })
                }
              </div>
            </div>
          </div>
        ) : (
          <div className={classModule['visual-editor__preview']}>
            <div className={classModule['editor-preview__edit']} onClick={innerMethods.toggleEditing}><Button>编辑</Button></div>
            <div className={classModule['preview-edit__warpper']}>
              <div className={classModule['editor-body_container']} style={containerStyles}>
                {
                  props.value.blocks.map((block, index) => {
                    return <VisualEditorBlock
                            block={block}
                            config={props.config}
                            key={index}
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