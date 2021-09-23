import { useMemo, useState } from 'react';
import { Button } from 'antd';
import { MenuUnfoldOutlined } from '@ant-design/icons'

import './style/common.scss';

import styles from  './style/VisualEditor.module.scss';
import { VisualEditorConfig, VisualEditorValue } from './editor.utils';
import { VisualEditorBlock } from './EditorBlock';

export const VisualEditor: React.FC<{
  value: VisualEditorValue,
  config: VisualEditorConfig
}> = (props) => {
  // 当前是否处于编辑状态
  const [editing, setEditing] = useState(true);
  const methods = {
    toggleEditing () {
      setEditing(!editing);
    }
  }

  const containerStyles = useMemo(() => {
    return {
      width: `${props.value.container.width}px`,
      height: `${props.value.container.height}px`,
    }
  }, [props.value.container.height, props.value.container.width]);
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
                    <div key={component.key + '_' + index} className={styles['editor-menu__item']}>
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
              <div className={`${styles['editor-body_container']} ${'editor-block__mask'}`} style={containerStyles}>
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

// import { useRef, useState } from 'react'
// import { useCallbackRef } from './hook/useCallbackRef';

// export const VisualEditor = () => {
//   const [pos, setPos] = useState({
//     top: 0,
//     left: 0
//   });

//   const dragData = useRef({
//     startTop: 0,   // 拖拽开始时，block 的 top 值
//     startLeft: 0, // 拖拽开始时，block 的 left 值
//     startX: 0,  // 拖拽开始时，鼠标的 left 值
//     startY: 0  // 拖拽开始时，鼠标的 top 值
//   });
//   // 在拖拽开始的时候再去绑定相关的事件，这样比一开始就绑定这些事件好
//   const moveDraggier = (()=> {
//     const mouseMove = useCallbackRef((e: MouseEvent) => {
//       const { startX, startY, startLeft, startTop } = dragData.current;
//       const durX = e.clientX - startX;
//       const durY = e.clientY - startY;
//       setPos({
//         top: startTop + durY,
//         left: startLeft + durX
//       });
//       // console.log('使用自定义的 Hooks useCallbackRef 包裹，保证每次获取都是更新后的位置坐标', pos.left, pos.top);// 如果不使用自定义的的 Hooks useCallbackRef 包裹函数，这样移动过程中打印出的永远都没有更新鼠标位置，只拿到了鼠标按下时的位置坐标，有问题，因此使用自定义的的 Hooks useCallbackRef 包裹
//     });    
//     const mouseUp = useCallbackRef((e: MouseEvent) => {
//       document.removeEventListener('mousemove', mouseMove);
//       document.removeEventListener('mouseup', mouseUp);
//     });    
//     const mouseDown = useCallbackRef((e: React.MouseEvent<HTMLDivElement>) => {
//       document.addEventListener('mousemove', mouseMove);
//       document.addEventListener('mouseup', mouseUp);
//       dragData.current = {
//         startTop: pos.top,
//         startLeft: pos.left,
//         startX: e.clientX,
//         startY: e.clientY
//       }
//     });
//     return {
//       mouseDown
//     } 
//   })();
//   return (
//     <div className="visual-editor__container">
//       <div style={{
//           height: '100px',
//           width: '100px',
//           background: 'red',
//           display: 'inline-block',
//           position: 'relative',
//           top: `${pos.top}px`,
//           left: `${pos.left}px`
//         }}
//         onMouseDown={moveDraggier.mouseDown}
//       >

//       </div>
//     </div>
//   )
// }