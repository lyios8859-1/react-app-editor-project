import { VisualEditorComponent } from '../../VisualEditor.utils';
import './VisualEditorBlockResize.scss';

export enum VisualBlockResizeDirection {
  start = 'start',
  center = 'center',
  end = 'end',
}

export const VisualBlockResize: React.FC<{
  component: VisualEditorComponent,
  onMouseDown?: (e: React.MouseEvent<HTMLDivElement>, direction: {
    horizotal: VisualBlockResizeDirection,
    vertical: VisualBlockResizeDirection
  }) => void
}> = (props) => {

  const h: JSX.Element[] = [];
  const resize = props.component.resize;
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>, direction: {
    horizotal: VisualBlockResizeDirection,
    vertical: VisualBlockResizeDirection
  }) => {
    props.onMouseDown && props.onMouseDown(e, direction);
  }
  // 由于使用了数组存放 jsx 编译后虚拟DOM，因此添加一个 key
  if (resize?.height) {
    h.push(<div className="visual-block__resize block-resize__top" key="resize__top" onMouseDown={e => onMouseDown(e, {
      horizotal: VisualBlockResizeDirection.center,
      vertical: VisualBlockResizeDirection.start
    })}></div>);
    h.push(<div className="visual-block__resize block-resize__bottom" key="resize__bottom" onMouseDown={e => onMouseDown(e, {
      horizotal: VisualBlockResizeDirection.center,
      vertical: VisualBlockResizeDirection.end
    })}></div>);
  }
  if (resize?.width) {
    h.push(<div className="visual-block__resize block-resize__left" key="resize__left" onMouseDown={e => onMouseDown(e, {
      horizotal: VisualBlockResizeDirection.start,
      vertical: VisualBlockResizeDirection.center
    })}></div>);
    h.push(<div className="visual-block__resize block-resize__right" key="resize__right" onMouseDown={e => onMouseDown(e, {
      horizotal: VisualBlockResizeDirection.end,
      vertical: VisualBlockResizeDirection.center
    })}></div>);
  }
  if (resize?.width && resize.height) {
    h.push(<div className="visual-block__resize block-resize__top__left" key="resize__top__left" onMouseDown={e => onMouseDown(e, {
      horizotal: VisualBlockResizeDirection.start,
      vertical: VisualBlockResizeDirection.start
    })}></div>);
    h.push(<div className="visual-block__resize block-resize__top__right" key="resize__top__right" onMouseDown={e => onMouseDown(e, {
      horizotal: VisualBlockResizeDirection.end,
      vertical: VisualBlockResizeDirection.start
    })}></div>);
    h.push(<div className="visual-block__resize block-resize__bottom__left" key="resize__bottom__left" onMouseDown={e => onMouseDown(e, {
      horizotal: VisualBlockResizeDirection.start,
      vertical: VisualBlockResizeDirection.end
    })}></div>);
    h.push(<div className="visual-block__resize block-resize__bottom__right" key="resize__bottom__right" onMouseDown={e => onMouseDown(e, {
      horizotal: VisualBlockResizeDirection.end,
      vertical: VisualBlockResizeDirection.end
    })}></div>);
  }
  return (<>{h}</>);
  // return (<>
  //   {/* <div className="visual-block__resize block-resize__top__left"></div> */}
  //   {/* <div className="visual-block__resize block-resize__top"></div> */}
  //   {/* <div className="visual-block__resize block-resize__top__right"></div> */}

  //   {/* <div className="visual-block__resize block-resize__left"></div> */}
  //   {/* <div className="visual-block__resize block-resize__right"></div> */}

  //   {/* <div className="visual-block__resize block-resize__bottom__left"></div> */}
  //   {/* <div className="visual-block__resize block-resize__bottom"></div> */}
  //   {/* <div className="visual-block__resize block-resize__bottom__right"></div> */}
  // </>)
};