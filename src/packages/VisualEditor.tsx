import { notification, Tooltip } from 'antd';
import { UnorderedListOutlined } from '@ant-design/icons'
import classNames from 'classnames';
import deepcopy from 'deepcopy';
import { useMemo, useRef, useState } from 'react';
import { VisualBlockResize, VisualBlockResizeDirection } from './components/block-resize/VisualEditorBlockResize';
import { useCallbackRef } from './hook/useCallbackRef';
import { createEvent } from './plugins/event';
import { $$dialog } from './service/dialog/$$dialog';
import { $$dropdown, DropdownOption } from './service/dropdown/$$dropdown';
import { useVisualCommand } from './VisualEditor.command';
import './VisualEditor.scss';
import { createVisualBlock, VisualEditorBlock, VisualEditorComponent, VisualEditorConfig, VisualEditorValue } from './VisualEditor.utils';
import { VisualEditorBlockCom } from './VisualEditorBlockCom';
import { VisualEditorOperator } from './VisualEditorOperator';

export const VisualEditor: React.FC<{
  value: VisualEditorValue,
  onChange: (val: VisualEditorValue) => void,
  config: VisualEditorConfig,
  formData: Record<string, any>
  onFormDataChange: (formData: Record<string, any>) => void,
  customProps?: Record<string, Record<string, any>>, // 自定义的行为
  children: never[] | Record<string, undefined | (() => any)> // 插槽
}> = (props) => {
  // 由于已经渲染了所以直接断言为 HTMLDivElement， 一般都是 useRef(null as null | HTMLDivElement);
  // const containerRef = useRef({} as HTMLDivElement);
  const containerRef = useRef(null as null | HTMLDivElement);

  // 产生滚动条的容器 DOM 对象
  const barRef = useRef({} as HTMLDivElement);

  // 当前是否处于预览状态
  const [preview, setPreview] = useState(false);
  // 当前是否处于编辑状态
  const [editing, setEditing] = useState(false);
  // 当前选中 block 组件元素的索引
  const [selectIndex, setSelectIndex] = useState(-1); // 默认 -1 没选中

  const [dragstart] = useState(() => createEvent());
  const [dragend] = useState(() => createEvent());
  const selectBlock = useMemo(() => props.value.blocks[selectIndex] as VisualEditorBlock | undefined, [props.value.blocks, selectIndex]);

  const methods = {
    /**
     * 清空选中的数据
     */
    clearFocus: (external?: VisualEditorBlock) => {
      let blocks = [...props.value.blocks];
      if (blocks.length === 0) return;
      if (external) {
        blocks = blocks.filter(item => item !== external);
      }
      blocks.forEach(block => block.focus = false);
      methods.updateBlocks(props.value.blocks);
    },
    /**
     * 更新 block 数据，触发视图重新渲染
     * @param blocks 
     */
    updateBlocks: (blocks: VisualEditorBlock[]) => {
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
    showBlockData: (block: VisualEditorBlock) => {
      $$dialog.textarea(JSON.stringify(block), {editReadonly: true, title: '导出的JSON数据'});
    },
    /**
     * 导入数据
     * @param block 
     */
    importBlockData: async (block: VisualEditorBlock) => {
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
    }
  };

  /**
   * 存储数据中选中状态和未选中状态的数据
   */
  const focusData = useMemo(() => {
    const focus: VisualEditorBlock[] = [];
    const unFocus: VisualEditorBlock[] = [];
    props.value.blocks.forEach(block => {
      (block.focus ? focus : unFocus).push(block);
    });
    return {
      focus,
      unFocus
    }
  }, [props.value.blocks]);
  
  /**
   * 容器样式
   */
  const containerStyle = useMemo(() => {
    return {
      height: `${props.value.container.height}px`,
      width: `${props.value.container.width}px`
    }
  }, [props.value.container.width, props.value.container.height]);

  const classes = useMemo(() => classNames([
    'visual-editor__container',
    {
      'visual-editor__container__preview': preview
    }
  ]), [preview]);


  //#region 组件从左侧菜单 menu 拖拽到容器操作
  /**
   * 左侧菜单组件的拖动到容器区域
   */
  const menuDraggier = (() => {

    const dragData = useRef({
      dragComponent: null as null | VisualEditorComponent
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
        // props.onChange({
        //   ...props.value,
        //   blocks: [
        //     ...props.value.blocks,
        //     createVisualBlock({
        //       top: e.offsetY,
        //       left: e.offsetX,
        //       component: dragData.current.dragComponent!
        //     })
        //   ]
        // });
        methods.updateBlocks([
          ...props.value.blocks,
          createVisualBlock({
            top: e.offsetY,
            left: e.offsetX,
            component: dragData.current.dragComponent!
          })
        ]);
        // 需要延时一下，否则拖拽过来渲染不上
        setTimeout(dragend.emit, 0)
      }),
    };
    const block = {
      dragstart: useCallbackRef((e: React.DragEvent<HTMLDivElement>, dragComponent: VisualEditorComponent) => {
        containerRef.current?.addEventListener('dragenter', container.dragenter);
        containerRef.current?.addEventListener('dragover', container.dragover);
        containerRef.current?.addEventListener('dragleave', container.dragleave);
        containerRef.current?.addEventListener('drop', container.drop);
        dragData.current.dragComponent = dragComponent;
        dragstart.emit();
      }),
      dragend: useCallbackRef(() => {
        containerRef.current?.removeEventListener('dragenter', container.dragenter);
        containerRef.current?.removeEventListener('dragover', container.dragover);
        containerRef.current?.removeEventListener('dragleave', container.dragleave);
        containerRef.current?.removeEventListener('drop', container.drop);
      })
    };
    return block;
  })();
  //#endregion

  //#region 选中可拖拽操作
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
        dragstart.emit();
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

    const mousemove = useCallbackRef((ev: MouseEvent) => {

      /*
      // console.log('mousemove');

      if (!dragData.current.dragging) {
        dragData.current.dragging = true;
        dragstart.emit();
      }
      
      const { startX, startY, startPosArray, startLeft, startTop, markLines } = dragData.current;
      let { clientX: moveX, clientY: moveY } = ev;
      // 移动时, 同时按住 shift 键，只在一个方向移动
      if (ev.shiftKey) {
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

      */

      dragData.current.moveX = ev.clientX;
      dragData.current.moveY = ev.clientY;
      moveHandler();

    });

    const mouseup = useCallbackRef((ev: MouseEvent) => {
      // console.log('mouseup');
      document.removeEventListener('mousemove', mousemove);
      document.removeEventListener('mouseup', mouseup);
      barRef.current.removeEventListener('scroll', scrollHandler);
      // 取消参考辅助线
      setMark({x: null, y: null})
      if (dragData.current.dragging) {
        dragData.current.dragging = false;
        dragend.emit();
      }
    });

    const mousedown = useCallbackRef((ev: React.MouseEvent<HTMLDivElement>, block: VisualEditorBlock) => {
      // console.log('mousedown');
      document.addEventListener('mousemove', mousemove);
      document.addEventListener('mouseup', mouseup);
      barRef.current.addEventListener('scroll', scrollHandler);
      dragData.current = {
        startX: ev.clientX,
        startY: ev.clientY,
        startLeft: block.left,
        startTop: block.top,
        startPosArray: focusData.focus.map(({ top, left }) => ({ top, left })),
        moveX: ev.clientX,
        moveY: ev.clientY,
        shiftKey: ev.shiftKey,
        containerBar: {
          startScrollTop: barRef.current.scrollTop,
          moveScrollTop: barRef.current.scrollTop,
        },
        dragging: false,
        markLines: (() => {
          const x: {left: number, showLeft: number}[] = [];
          const y: {top: number, showTop: number}[] = [];

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

          return {
            x, y
          }
        })()
      }
    });
    return {
      mousedown,
      mark
    }
  })();
  //#endregion

  //#region 组件选中状态操作
  /**
   * 组件选中状态
   */
  const focusHandler = (() => {
    const mousedownContanier = (ev: React.MouseEvent<HTMLDivElement>) => {
      if (preview) return;
      if (ev.button === 1) {
        // 右键不作任何处理
        return;
      };
      // 判断不是点击了容器就返回
      if (ev.target !== ev.currentTarget) return;
      // console.log('点击了 Contanier');
      if (!ev.shiftKey) {
        // 点击空白出清空所有的选中的 block
        methods.clearFocus();
        setSelectIndex(-1);
      }
    };
    const mousedownBlock = (ev: React.MouseEvent<HTMLDivElement>, block: VisualEditorBlock, index: number) => {
      // console.log('点击了 Block');
      if (preview) return;
      if (ev.shiftKey) {
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
        blockDraggier.mousedown(ev, block);
      });
    };

    return {
      block: mousedownBlock,
      container: mousedownContanier
    }
  })();
  //#endregion

  //#region block 组件元素的拖拽缩放改变大小
  const resizeDraggier = (() => {
    const dragData = useRef({
      block: {} as VisualEditorBlock,
      startX: 0, // 拖拽开始的时候, 鼠标的 left 值
      startY: 0, // 拖拽开始的时候, 鼠标的 top 值
      direction: {  // 拖拽开始的时候，标识那个方向的拖动， 拖动时需要对值取反
        horizotal: VisualBlockResizeDirection.start,
        vertical: VisualBlockResizeDirection.start
      },
      startBlock: {
        top: 0, // 拖拽开始的时候, block 组件的 top 值
        left: 0, // 拖拽开始的时候, block 组件的 left 值
        width: 0, // 拖拽开始的时候, block 组件的宽度
        height: 0, // 拖拽开始的时候, block 组件的高度
      },
      dragging: false // 首次移动才区派发 dragstart 事件
    });

    const mousemove = useCallbackRef((ev: MouseEvent) => {
      if (!dragData.current.dragging) {
        dragData.current.dragging = true;
        dragstart.emit();
      }
      let { clientX: moveX, clientY: moveY } = ev;
      const { startX, startY, startBlock, direction, dragging, block } = dragData.current;

      // 如果在水平方向，只有左右缩放
      if (direction.horizotal === VisualBlockResizeDirection.center) {
        moveX = startX;
      }
      // 如果在垂直方向，只有上下缩放
      if (direction.vertical === VisualBlockResizeDirection.center) {
        moveY = startY;
      }
      
      let durX = moveX - startX;
      let durY = moveY - startY;

      // 如果是四个方位角，垂直和水平都有缩放
      if (direction.vertical === VisualBlockResizeDirection.start) {
        durY = -durY;
        block.top = startBlock.top - durY;
      }
      if (direction.horizotal === VisualBlockResizeDirection.start) {
        durX = -durX;
        block.left = startBlock.left - durX;
      }

      const width = startBlock.width + durX;
      const height = startBlock.height + durY;
      block.width = width;
      block.height = height;
      block.hasReasize = true;
      methods.updateBlocks(props.value.blocks);

    });

    const mouseup = useCallbackRef(() => {
      document.removeEventListener('mousemove', mousemove);
      document.removeEventListener('mouseup', mouseup);
      if (dragData.current.dragging) {
        dragend.emit();
      }
    });

    const mousedown = useCallbackRef((ev: React.MouseEvent<HTMLDivElement>, direction: {
      horizotal: VisualBlockResizeDirection,
      vertical: VisualBlockResizeDirection
    }, block: VisualEditorBlock) => {
      ev.stopPropagation();
      document.addEventListener('mousemove', mousemove);
      document.addEventListener('mouseup', mouseup);
      dragData.current = {
        block,
        startX: ev.clientX,
        startY: ev.clientY,
        direction,
        startBlock: {
          ...deepcopy(block)
        },
        dragging: false
      };
      
    });

    return {
      mousedown
    }
  })();
  //#endregion

  // 命令管理对象
  const commander = useVisualCommand({
    value: props.value,
    focusData,
    updateBlocks: methods.updateBlocks,
    updateValue: methods.updateValue,
    dragstart,
    dragend
  });

  const handler = {
    onContextMenuBlock: (ev: React.MouseEvent<HTMLDivElement>, block: VisualEditorBlock) => {
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
          commander.undo();
        },
        tip: 'ctrl+z'
      },
      {
        label: '重做',
        icon: 'icon-forward',
        handler: () => {
          commander.redo();
        },
        tip: 'ctrl+y, ctrl+shift+z'
      },
      {
        label: () => preview ? '编辑' : '预览',
        icon: () => preview ? 'icon-edit' : 'icon-browse',
        handler: () => {
          if (!preview) {
            methods.clearFocus();
          }
          setPreview(!preview);
        },
      },
      {
        label: '导入',
        icon: 'icon-import',
        handler: async () => {
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
          $$dialog.textarea(JSON.stringify(props.value), {editReadonly: true, title: '导出的JSON数据'});
        }
      },
      {
        label: '置顶',
        icon: 'icon-place-top',
        handler: () => {
          commander.placeTop();
        },
        tip: 'ctrl+up'
      },
      {
        label: '置底',
        icon: 'icon-place-bottom',
        handler: () => {
          commander.placeBottom();
        },
        tip: 'ctrl+down'
      },
      {
        label: '删除',
        icon: 'icon-delete',
        handler: () => {
          commander.delete();
        }, tip: 'ctrl+d, backspace, delete'
      },
      {
        label: '清空',
        icon: 'icon-reset',
        handler: () => {
          commander.clear();
        }
      },
      {
        label: '关闭',
        icon: 'icon-close',
        handler: () => {
          methods.clearFocus();
          setEditing(false);
        }
      }
    ]
  //#endregion

  return (<>
  <div className="visual-editor__body__container"
    style={containerStyle}
  >
    {
      props.value.blocks.map((block, index) => {
        const com = props.config.componentMap[block.componentKey];
        return (
          <VisualEditorBlockCom
            key={index}
            block={block}
            config={props.config}
            formData={props.formData}
            onFormDataChange={props.onFormDataChange}
            customProps={props.customProps}
            editorChildren={props.children}
          >
            {/*可拖拽的点*/}
            {
              block.focus  &&
              (com && com.resize && (com.resize?.width || com.resize?.height)) &&
              <VisualBlockResize component={com} />}
          </VisualEditorBlockCom>
        )
      })
    }
    <div className="react-visual-container__edit-button" onClick={() => setEditing(true)}>
      <i className="iconfont icon-edit"/>
      <span>编辑组件</span>
    </div>
  </div>
  {editing && (
    <div className={classes}>
      <div className="visual-editor__menu">
        <div className="editor-menu-title">
          <div><UnorderedListOutlined /></div>
          <p>组件列表</p>
        </div>
        {
          props.config.componentArray.map((component, index) => (
            <div className='visual-editor-menu__item'
              key={index}
              draggable
              onDragStart={(e) => menuDraggier.dragstart(e, component)}
              onDragEnd={menuDraggier.dragend}
            >
              {component.prievew()}
              <div className="visual-editor-menu__item__name">
                {component.name}
              </div>
            </div>
          ))
        }
      </div>
      <div className="visual-editor__head">
        {
          buttons.map((btn, index) => {
            const label = typeof btn.label === "function" ? btn.label() : btn.label
            const icon = typeof btn.icon === "function" ? btn.icon() : btn.icon
            const content = (<div key={index} className="visual-editor-head__button" onClick={btn.handler}>
              <i className={`iconfont ${icon}`} />
              <span>{label}</span>
            </div>)
            return !btn.tip ? content : <Tooltip title={btn.tip} placement="bottom" key={index}>
              {content}
            </Tooltip>
          })
        }
      </div>
      <div className="visual-editor__operator">
        <VisualEditorOperator
          selectBlock={selectBlock}
          value={props.value}
          config={props.config}
          updateValue={commander.updateValue}
          updateBlock={commander.updateBlock}
        />
      </div>
      <div className="visual-editor__body" ref={barRef}>
        <div className="visual-editor__body__container"
          style={containerStyle}
          onMouseDown={focusHandler.container}
          ref={containerRef}>
          {
            props.value.blocks.map((block, index) => {
              const com = props.config.componentMap[block.componentKey];
              return (
                <VisualEditorBlockCom
                  key={index}
                  block={block}
                  config={props.config}
                  onMousedown={e => focusHandler.block(e, block, index)}
                  onContextMenu={e => handler.onContextMenuBlock(e, block)}
                  formData={props.formData}
                  onFormDataChange={props.onFormDataChange}
                  customProps={props.customProps}
                  editorChildren={props.children}
                >
                  {/*可拖拽的点*/}
                  {
                    block.focus  &&
                    (com && com.resize && (com.resize?.width || com.resize?.height)) &&
                    <VisualBlockResize component={com} onMouseDown={(e, direction) => resizeDraggier.mousedown(e, direction, block)} />}
                </VisualEditorBlockCom>
              )
            })
          }
          {/*参考辅助线 start*/}
          {blockDraggier.mark.x !== null && <div className="visual-editor-mark-x" style={{left: `${blockDraggier.mark.x}px`}}></div>}
          {blockDraggier.mark.y !== null && <div className="visual-editor-mark-y" style={{top: `${blockDraggier.mark.y}px`}}></div>}
          {/*参考辅助线 end*/}
        </div>
      </div>
    </div>)}
  </>);
};