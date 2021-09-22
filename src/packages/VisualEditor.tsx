import './style/VisualEditor.scss';

import { VisualEditorValue } from './editor.utils';

export const VisualEditor: React.FC<{
  value: VisualEditorValue
}> = (props) => {
  console.log(props.value);
  return (<>
    <div className="visual-editor__container">
      <div className="visual-editor__menu">menu</div>
      <div className="visual-editor__head">header</div>
      <div className="visual-editor__operator">operator</div>
      <div className="visual-editor__body">body</div>
    </div>
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