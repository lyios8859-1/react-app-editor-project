import './$$dropdown.scss';
import ReactDOM from "react-dom";
import { MouseEvent, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useCallbackRef } from '../../hook/useCallbackRef';

type Reference = { x: number, y: number } | MouseEvent | HTMLElement;
type Render = JSX.Element | JSX.Element[] | React.ReactFragment;

interface DropdownOption {
  reference: Reference,
  render: () => Render,
}

const DropdownContext = React.createContext<{onClick: () => void}>({} as any);

const DropdownComponent: React.FC<{
  option: DropdownOption,
  onRef: (ins: { show: (opt: DropdownOption) => void, close: () => void }) => void
}> = (props) => {

  const elRef = useRef({} as HTMLDivElement);
  
  const [option, setOption] = useState(props.option);
  const [showFlag, setShowFlag] = useState(false);

  const styles = useMemo(() => {
    let x = 0, y = 0;
    const reference = option.reference
    if ('target' in reference) {
      x = reference.clientX - 20;
      y = reference.clientY - 20;
    } else if ('addEventListener' in reference) {
      const { top, left, height } = reference.getBoundingClientRect();
      x = left;
      y = top + height;
    } else {
      x = reference.x;
      y = reference.y;
    }
    return {
      left: `${x + 20}px`,
      top: `${y + 20}px`,
      display: showFlag ? 'inline-block' : 'none'
    }
  }, [option?.reference, showFlag]);

  const methods = {
    show: (opt: DropdownOption) => {
      setOption(opt);
      setShowFlag(true);
    },
    close: () => {
      setShowFlag(false);
    }
  };

  const handler = {
    onClickBody: useCallbackRef((ev: MouseEvent) => {
      if (elRef.current.contains(ev.target as Node)) {
        /*点击了dropdown content*/
        return;
      } else {
        methods.close();
      }
    }),
    onClickDropItem: useCallbackRef(() => {
      methods.close();
    })
  };

  props.onRef!(methods);

  useEffect(() => {
    document.body.addEventListener('click', handler.onClickBody as any);
    return () => {
      document.body.removeEventListener('click', handler.onClickBody as any);
    }
}, [])

  return (<>
  <DropdownContext.Provider value={{onClick: handler.onClickDropItem}}>
    <div className="dropdown-service" style={styles} ref={elRef}>
      {option?.render()}
    </div>
  </DropdownContext.Provider>
  </>);
}

export const DropdownOption: React.FC<{
  onClick?: (ev: React.MouseEvent<HTMLDivElement>) => void
  icon?: string,
  label?: string
}> = (props) => {

  const dropdown = useContext(DropdownContext);
  const handler = {
    onClick: (e: React.MouseEvent<HTMLDivElement>) => {
      dropdown.onClick();
      props.onClick && props.onClick(e);
    }
  };

  return (<div className="dropdown-item" onClick={handler.onClick}>
    {props.icon && <i className={`iconfont ${props.icon}`}/>}
    {props.label && <span>{props.label}</span>}
    {/* {props.children} 这个时元素默认的标签内的内容*/}
  </div>);
}

export const $$dropdown = (() => {

  let ins: any;
  return (options: DropdownOption) => {
    if (!ins) {
      const el = document.createElement('div');
      document.body.appendChild(el);
      ReactDOM.render(<DropdownComponent option={options} onRef={val => ins = val} />, el);
    }

    ins.show(options);
  }
})();

