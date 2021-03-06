import { useMemo, useRef, useState } from 'react';
import { Button, notification, Tooltip } from 'antd';
import { MenuUnfoldOutlined } from '@ant-design/icons'

import '../asset/font/iconfont.css';
import classModule from './style/VisualEditor.module.scss';

import { createVisualBlock, VisualEditorBlockData, VisualEditorComponent, VisualEditorConfig, VisualEditorValue } from './editor.utils';
import { VisualEditorBlock } from './EditorBlock';
import { useCallbackRef } from './hook/useCallbackRef';
import { useVisualCommand } from './editor.command';
import { createEvent } from './plugin/event';
import { $$dialog } from './service/dialog/$$dialog';
import { $$dropdown, DropdownOption } from './service/dropdown/$$dropdown';

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

  // 拖拽开始和结束的事件监听
  const [dragstart] = useState(() => createEvent());
  const [dragend] = useState(() => createEvent());

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
     * 更新整个画布容器的数据（所有 block 数据）
     * @param value 
     */
    updateValue: (value: VisualEditorValue) => {
      props.onChange({...value});
    },
    /**
     * 查看（导出）数据
     * @param block 
     */
    showBlockData: (block: VisualEditorBlockData) => {
      $$dialog.textarea(JSON.stringify(block), {editReadonly: true, title: '导出的JSON数据'});
    },
    /**
     * 导入数据
     * @param block 
     */
    importBlockData: async (block: VisualEditorBlockData) => {
      const text = await $$dialog.textarea('', { title: '请输入需要导入的节点数据JSON字符串' });
      try {
        const data = JSON.parse(text || '');
        commander.updateBlock(data, block);
      } catch (e) {
        console.error(e)
        notification.open({
          type: 'error',
          message: '导入失败！',
          description: '导入的数据格式不正常，请检查！'
        })
      }
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
        // console.log('add')

        methods.updateBlocks([
          ...props.value.blocks,
          createVisualBlock({
            top: e.offsetY,
            left: e.offsetX,
            component: dragData.current.dragComponent!
          })
        ]);

        const t = setTimeout(() => {
          // 拖拽结束后，等页面渲染完毕，才执行，否则拖拽后就不会在页面正常显示
          dragend.emit(); // 触发事件
          clearTimeout(t);
        });
      }),
    };

    const block = {
      dragstart: useCallbackRef((e: React.DragEvent<HTMLDivElement>,  dragComponent: VisualEditorComponent) => {
        
        containerRef.current.addEventListener('dragenter', container.dragenter);
        containerRef.current.addEventListener('dragover', container.dragover);
        containerRef.current.addEventListener('dragleave', container.dragleave);
        containerRef.current.addEventListener('drop', container.drop);

        dragData.current.dragComponent = dragComponent;
        
        dragstart.emit(); // 触发事件

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

      // 右键不作任何处理, 防止右键时还可以拖动
      if (e.button === 2) return;

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
      setTimeout(() => {
        blockDraggier.mousedown(e, block);
      });
    };
    const mousedownContainer = (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (preview) return;
      e.preventDefault();

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

  //#region 画布容器组件的拖拽
  const blockDraggier = (() => {

    const [mark, setMark] = useState({x: null as null | number, y: null as null | number});

    // 存储拖拽时的数据
    const dragData = useRef({
      startX: 0, // 鼠标拖拽开始的，鼠标的横坐标
      startY: 0, // 鼠标拖拽开始的，鼠标的纵坐标
      startLeft: 0, // 鼠标拖拽开始的，拖拽的 block 横坐标
      startTop: 0, // 鼠标拖拽开始的，拖拽的 block 纵坐标
      startPosArray: [] as { top: number, left: number }[], // 鼠标拖拽开始的, 所有选中的 block 元素的横纵坐标值

      shiftKey: false, // 当前是否按住了 shift 键
      moveX: 0, // 拖拽过程中的时候, 鼠标的 left 值
      moveY: 0, // 拖拽过程中的时候, 鼠标的 top 值
      containerBar: {
        startScrollTop: 0, // 拖拽开始的时候, scrollTop 值
        moveScrollTop: 0, // 拖拽过程中的时候, scrollTop 值
      },
      
      dragging: false, // 当前是否属于拖拽状态
      markLines: { // 拖拽元素时，计算当前未选中的数据中，与拖拽元素之间参考辅助线的显示位置
        x: [] as {left: number, showLeft: number}[],
        y: [] as {top: number, showTop: number}[]
      }
    });
    const moveHandler = useCallbackRef(() => {
      if (!dragData.current.dragging) {
        dragData.current.dragging = true;
        dragstart.emit(); // 拖拽过程中派发事件
      }
      
      let {
        startX, 
        startY, 
        startPosArray, 
        moveX,
        moveY,
        containerBar,
        startLeft, 
        startTop, 
        markLines,
        shiftKey
      } = dragData.current;

      moveY = moveY + (containerBar.moveScrollTop - containerBar.startScrollTop);

      // 移动时, 同时按住 shift 键，只在一个方向移动
      if (shiftKey) {
        const n = 12; // 预定差值
        if (Math.abs(moveX - startX) > Math.abs(moveY - startY) + n) {
          moveY = startY;
        } else {
          moveX = startX;
        }
      }

      //#region 参考线处理
      const nowMark = {
        mark: {
          x: null as null | number,
          y: null as null | number
        },
        top: startTop + moveY - startY,
        left: startLeft + moveX - startX
      };

      for (let i = 0; i < markLines.y.length; i++) {
        const { top, showTop } = markLines.y[i];
        if (Math.abs(nowMark.top - top) < 5) {
          moveY = top + startY - startTop;
          nowMark.mark.y = showTop;
        }
      }

      for (let i = 0; i < markLines.x.length; i++) {
        const { left, showLeft } = markLines.x[i];
        if (Math.abs(nowMark.left - left) < 5) {
          moveX = left + startX - startLeft;
          nowMark.mark.x = showLeft;
        }
      }
      //#endregion

      const durX = moveX - startX;
      const durY = moveY - startY;

      focusData.focus.forEach((block, index) => {
        const { left, top } = startPosArray[index];
        block.left = left + durX;
        block.top = top + durY;
      });
      methods.updateBlocks(props.value.blocks);

      // 修正参考线的位置
      setMark(nowMark.mark);
    });

    const scrollHandler = useCallbackRef((e: Event) => {
      dragData.current.containerBar.moveScrollTop = (e.target as HTMLDivElement).scrollTop;
      moveHandler();
    }); 

    const mousemove = useCallbackRef((e: MouseEvent) => {
      dragData.current.moveX = e.clientX;
      dragData.current.moveY = e.clientY;
      moveHandler();
    });
    const mouseup = useCallbackRef((e: MouseEvent) => {
      document.removeEventListener('mousemove', mousemove);
      document.removeEventListener('mouseup', mouseup);
      // 取消参考辅助线
      setMark({x: null, y: null});

      if (dragData.current.dragging) {
        dragData.current.dragging = false;
        dragend.emit(); // 拖拽过程中，鼠标抬起后才派发事件
      }
    });
    const mousedown = useCallbackRef((e: React.MouseEvent<HTMLDivElement>, block: VisualEditorBlockData) => {
      
      document.addEventListener('mousemove', mousemove);
      document.addEventListener('mouseup', mouseup);
      
      dragData.current = {
        startX: e.clientX,
        startY: e.clientY,
        startLeft: block.left,
        startTop: block.top,
        startPosArray: focusData.focus.map(({ top, left }) => ({ top, left })),
        moveX: e.clientX,
        moveY: e.clientY,
        shiftKey: e.shiftKey,
        containerBar: {
          startScrollTop: 0,
          moveScrollTop: 0,
        },
        dragging: false,
        markLines: (() => {
          const x: {left: number, showLeft: number}[] = [];
          const y: {top: number, showTop: number}[] = [];
          // 参考线处理 TODO...

          // 拖动的与未选中的对齐
          const { unFocus } = focusData;
          unFocus.forEach(v => {
            // 水平方向，拖动的顶部对未拖动的顶部
            y.push({ top: v.top, showTop: v.top });
            // 水平方向，拖动的中间对未拖动的中间
            y.push({ top: v.top + v.height / 2 - block.height / 2, showTop: v.top + v.height / 2 });
            // 水平方向，拖动的底部对未拖动的底部
            y.push({ top: v.top + v.height - block.height, showTop: v.top + v.height});
            // 水平方向，拖动的底部对未拖动的顶部
            y.push({ top: v.top - block.height, showTop: v.top });
            // 水平方向，拖动的底部对未拖动的底部
            y.push({ top: v.top + v.height, showTop: v.top + v.height });

            // 垂直方向，拖动的左侧对未拖动的左侧
            x.push({ left: v.left, showLeft: v.left });
            // 垂直方向，拖动的中间对未拖动的中间
            x.push({ left: v.left + v.width / 2 - block.width / 2, showLeft: v.left + v.width / 2 });
            // 垂直方向，拖动的右侧对未拖动的右侧
            x.push({ left: v.left + v.width - block.width, showLeft: v.left + v.width});
            // 垂直方向，拖动的右侧对未拖动的左侧
            x.push({ left: v.left - block.width, showLeft: v.left });
            // 垂直方向，拖动的左侧对未拖动的右侧
            x.push({ left: v.left + v.width, showLeft: v.left + v.width });
          });
          return { x, y }
        })()
      }
    });

    return {
      mousedown,
      mark
    }
  })();
  //#endregion

  // 命令管理对象
  const commander = useVisualCommand({
    value: props.value,
    focusData,
    updateBlocks: methods.updateBlocks,
    dragstart,
    dragend,
    updateValue: methods.updateValue
  });

  const handler = {
    onContextMenuBlock: (ev: React.MouseEvent<HTMLDivElement>, block: VisualEditorBlockData) => {
      ev.preventDefault();
      ev.stopPropagation();


      $$dropdown({
        reference: ev.nativeEvent,
        render: () => {
          return (<>
            <DropdownOption label="置顶节点" icon="icon-place-top" onClick={commander.placeTop}/>
            <DropdownOption label="置底节点" icon="icon-place-bottom" onClick={commander.placeBottom}/>
            <DropdownOption label="删除节点" icon="icon-delete" onClick={commander.delete}/>
            <DropdownOption label="查看数据" icon="icon-browse" {...{onClick: () => methods.showBlockData(block)}}/>
            <DropdownOption label="导入节点" icon="icon-import" {...{onClick: () => methods.importBlockData(block)}}/>
          </>)
        }
      });
    }
  };

  //#region 功能操作栏按钮组
  const buttons: {
    label: string | (() => string),
    icon: string | (() => string),
    tip?: string | (() => string),
    handler: () => void,
  }[] = [
      {
        label: '撤销',
        icon: 'icon-back',
        handler: () => {
          // console.log('撤销')
          commander.undo();
        },
        tip: 'ctrl+z'
      },
      {
        label: '重做',
        icon: 'icon-forward',
        handler: () => {
          // console.log('重做')
          commander.redo();
        },
        tip: 'ctrl+y, ctrl+shift+z'
      },
      {
        label: '清空',
        icon: 'icon-reset',
        handler: () => {
          // console.log('清空')
          commander.clear();
        }
      },
      {
        label: '删除',
        icon: 'icon-delete',
        handler: () => {
          // console.log('删除')
          commander.delete();
        },
        tip: 'ctrl+d, backspace, delete'
      },
      {
        label: '置顶',
        icon: 'icon-place-top',
        handler: () => {
          // console.log('置顶')
          commander.placeTop();
        },
        tip: 'ctrl+up'
      },
      {
        label: '置底',
        icon: 'icon-place-bottom',
        handler: () => {
          // console.log('置底')
          commander.placeBottom();

        },
        tip: 'ctrl+down'
      },
      {
        label: '导入',
        icon: 'icon-import',
        handler: async () => {
          console.log('导入');
          const text = await $$dialog.textarea('', { title: '请输入导入的JSON字符串' });
          try {
            const data = JSON.parse(text || '');
            commander.updateValue(data);
          } catch (e) {
            console.error(e)
            notification.open({
              type: 'error',
              message: '导入失败！',
              description: '导入的数据格式不正常，请检查！'
            })
          }
        }
      },
      {
        label: '导出',
        icon: 'icon-export',
        handler: () => {
          console.log('导出')
          $$dialog.textarea(JSON.stringify(props.value), {editReadonly: true, title: '导出的JSON数据'});
        }
      },
      {
        label: () => preview ? '编辑' : '预览',
        icon: () => preview ? 'icon-edit' : 'icon-browse',
        handler: () => {
          if (!preview && !editing) {
            methods.clearFocus();
          }
          innerMethods.togglePreview();
        },
      },
      {
        label: '关闭',
        icon: 'icon-close',
        handler: () => {
          if (!editing) {
            methods.clearFocus();
          }
          innerMethods.toggleEditing();
        }
      }
    ]
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
                        {component.preview()}
                      </div>
                    </div>
                  )
                })
              }
            </div>
            <div className={classModule['visual-editor__head']}>
              {
                buttons.map((btn, index) => {
                  const label = typeof btn.label === "function" ? btn.label() : btn.label
                  const icon = typeof btn.icon === "function" ? btn.icon() : btn.icon
                  const content = (<div key={index} className={classModule['editor-head__button']} onClick={btn.handler}>
                    <i className={`iconfont ${icon}`} />
                    <span>{label}</span>
                  </div>)
                  return !btn.tip ? content : <Tooltip title={btn.tip} placement="bottom" key={index}>
                    {content}
                  </Tooltip>
                })
              }
            </div>
            <div className={classModule['visual-editor__operator']}>operator</div>
            <div className={`${classModule['visual-editor__body']} ${classModule['custom-bar__style']}`}>
              <div
                className={`${classModule['editor-body_container']} ${editing && !preview && classModule['edit-container__border']}`}
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
                            onContextMenu={e => handler.onContextMenuBlock(e, block)}
                          />
                  })
                }
                {/*参考辅助线 start*/}
                {blockDraggier.mark.x !== null && <div className={classModule['editor-mark-x']} style={{left: `${blockDraggier.mark.x}px`}}></div>}
                {blockDraggier.mark.y !== null && <div className={classModule['editor-mark-y']} style={{top: `${blockDraggier.mark.y}px`}}></div>}
                {/*参考辅助线 end*/}
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