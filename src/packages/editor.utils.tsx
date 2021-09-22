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
    container: { // 画布容器
        height: number,
        width: number,
    },
    blocks: VisualEditorBlock[]
}