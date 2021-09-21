import { useEffect, useMemo, useRef } from "react";
import { useUpdate } from "./hook/useUpdate";
import { VisualEditorConfig, VisualEditorBlock } from "./VisualEditor.utils";
import classNames from "classnames";

export const VisualEditorBlockCom: React.FC<{
  block: VisualEditorBlock,
  config: VisualEditorConfig,
  onMousedown?: (e: React.MouseEvent<HTMLDivElement>) => void,
  onContextMenu?: (e: React.MouseEvent<HTMLDivElement>) => void,
  formData: Record<string, any>,
  onFormDataChange: (formData: Record<string, any>) => void,
  customProps?: Record<string, Record<string, any>>,// 自定义的行为
  editorChildren: never[] | Record<string, undefined | (() => any)>, // 插槽
}> = (props) => {
  const { froceUpdate } = useUpdate();
  const elRef = useRef({} as HTMLDivElement); //  等价于 useRef<HTMLDivElement>(null);

  const styles = useMemo(() => {
    return {
      top: `${props.block.top}px`,
      left: `${props.block.left}px`,
      zIndex: props.block.zIndex,
      opacity: props.block.adjustPosition ? 0 : "", // 解决调整拖拽结束时居中时组件闪动 BUG
    };
  }, [
    props.block.top,
    props.block.left,
    props.block.zIndex,
    props.block.adjustPosition,
  ]);

  const classes = useMemo(
    () =>
      classNames([
        "visual-editor-container__block",
        {
          "visual-editor-container__block__focus": props.block.focus,
        },
      ]),
    [props.block.focus]
  );

  const component = props.config.componentMap[props.block.componentKey];
  let render: any;

  if (props.block.slotName && props.editorChildren && (props.editorChildren as any)[props.block.slotName]) {
    // 自定义插槽的视图
    render = (props.editorChildren as any)[props.block.slotName]();
  } else {
    if (component) {
      render = component.render({
        block: props.block,
        custom:
          !props.block.slotName || !props.customProps
            ? {}
            : props.customProps[props.block.slotName] || [],
        size:
          props.block.hasReasize && component.resize
            ? (() => {
                const styles = {
                  width: undefined as undefined | string,
                  height: undefined as undefined | string,
                };
                component.resize.width &&
                  (styles.width = `${props.block.width}px`);
                component.resize.height &&
                  (styles.height = `${props.block.height}px`);
                return styles;
              })()
            : {},
        props: props.block.props || {},
        model: Object.entries(component.model || {}).reduce((prev, item) => {
          const [modelProp] = item;
          const model = props.block.model;
          prev[modelProp] = {
            value:
              model && model[modelProp]
                ? props.formData[model[modelProp]]
                : null,
            onChange: (ev: Event) => {
              if (model && model[modelProp]) {
                let val: any;
                if (!ev) {
                  val = ev;
                } else {
                  val =
                    typeof ev === "object" && "target" in ev
                      ? (ev.target as any).value
                      : ev;
                }
                props.onFormDataChange({
                  ...props.formData,
                  [model[modelProp]]: val,
                });
              }
            },
          };
          return prev;
        }, {} as Record<string, { value: any; onChange: (val: any) => void }>),
      });
    }
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

  return (
    <div
      className={classes}
      style={styles}
      onMouseDown={props.onMousedown}
      onContextMenu={props.onContextMenu}
      ref={elRef}
    >
      {render}
      {props.children}
    </div>
  );
};
