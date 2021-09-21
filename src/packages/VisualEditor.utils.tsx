import { VisualEditorProps } from "./VisualEditor.props";

/**
 * 容器中每个元素的的数据类型
 */
export interface VisualEditorBlock {
  componentKey: string, // component 对象的的 key，通过该值找到 visual config 中的对应的 component
  top: number, // block 在容器中的 top 位置
  left: number, // block 在容器中的 left 位置
  width: number, // block 组件自身的宽度
  height: number, // block 组件自身的高度
  adjustPosition: boolean, // 添加组件到容器中时是否需要调整位置
  focus: boolean, // 组件是否是选中状态
  zIndex: number,   // block 组件元素的 z-index style 属性
  hasReasize: boolean, // block 组件元素是否曾调整国大小
  props?: Record<string, any> // block 组件元素右侧属性配置信息
  model?: Record<string, any> // 组件元素右侧自定义配置属性信息（绑定值）
  slotName?: string   // 组件标识
}
/**
 * 编辑器编辑的数据类型
 */
export interface VisualEditorValue {
  container: {
    height: number,
    width: number,
  },
  blocks: VisualEditorBlock[]
}

/**
 * 编辑器中自定义组件的类型
 */
export interface VisualEditorComponent {
  key: string, // key 组件唯一标识符
  name: string, // name 组件左侧显示名
  render: (data: { // render 组件渲染函数，拖拽后在容器区与呈现的函数
    block: VisualEditorBlock,
    size: {width?: string, height?: string},
    props: Record<string, any>,
    model: Record<string, any>,
    custom: Record<string, any>
  }) => JSX.Element,
  prievew: () => JSX.Element, // prievew 组件左侧预览函数
  resize?: {
    width?: boolean, // 是否可拖拽宽度
    height?: boolean // 是否可拖拽高度
  },
  props?: {[k: string]: VisualEditorProps}   // block 元素的右侧属性配置信息
  model?: {[k: string]: string} // 组件元素右侧自定义配置属性信息（绑定值）
}
/**
 * 创建一个 block 的组件数据
 */
export function createVisualBlock({
  top,
  left,
  component
}: {
  top: number,
  left: number,
  component: VisualEditorComponent
}): VisualEditorBlock {
  return {
    adjustPosition: true,
    componentKey: component.key,
    top,
    left,
    width: 0,
    height: 0,
    focus: false,
    zIndex: 0,
    hasReasize: false
  }
}

/**
 * 创建编辑器的预设内容
 */
export function createVisualConfig() {
  // 用于 block 数据，通过 componentKey 找到 component 对象，使用 component 对象的 render 属性渲染内容到 container 容器里
  const componentMap: { [k: string]: VisualEditorComponent } = {};
  // 用户在 menu 中预定义的组件列表
  const componentArray: VisualEditorComponent[] = [];

  /**
   * 注册组件
   * @param key 唯一的 key 左侧的预览组件
   * @param option 
   */
  const registryComponent = <
    Props extends {[k: string]: VisualEditorProps} = {},
    Model extends {[k: string]: string}= {}
  >(key: string, option: {
    name: string, // 组件显示名
    render: (data: { // 组件渲染函数
      block: VisualEditorBlock,
      size: {width?: string, height?: string},
      props?: {[k in keyof Props]: any},
      custom: Record<string, any>,
      model: {[k in keyof Model]: {
        value: any,
        onChange: (val: any) => void
      }}
    }) => JSX.Element,
    prievew: () => JSX.Element, // 组件预览函数
    resize?: {
      width?: boolean, // 是否可拖拽宽度
      height?: boolean // 是否可拖拽高度
    },
    props?: Props // 组件右侧的属性配置信息
    model?: Model // 组件元素右侧自定义配置属性信息（绑定值）
  }) => {
    // key 是唯一的
    if (componentMap[key]) {
      const index = componentArray.indexOf(componentMap[key]);
      componentArray.splice(index, 1);
    }
    const newComponent = {
      key,
      ...option
    }
    componentArray.push(newComponent as any);
    componentMap[key] = newComponent as any;
  }
  
  return {
    componentArray,
    componentMap,
    registryComponent
  }
}

export type VisualEditorConfig = ReturnType<typeof createVisualConfig>;