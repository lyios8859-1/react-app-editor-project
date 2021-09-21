export enum VisualEditorPropsType {
  text = 'text',
  select = 'select',
  color = 'color',
  input = 'input',
  table = 'table',
}

interface VisualEditorTextProp {
  name: string,
  type: VisualEditorPropsType.text
}

interface VisualEditorSelectProp {
  name: string,
  type: VisualEditorPropsType.select,
  options: { label: string, value: string }[]
}

interface VisualEditorColorProp {
  name: string,
  type: VisualEditorPropsType.color,
}

export interface VisualEditorTableProp {
  name: string,
  type: VisualEditorPropsType.table,
  showField: string, // 标识数组容器中需要显示的字段
  columns: {
    name: string, // 字段提示名, 表头
    field: string // 绑定的字段
  }[]
}

export type VisualEditorProps =
  VisualEditorTextProp |
  VisualEditorSelectProp |
  VisualEditorColorProp |
  VisualEditorTableProp;

export function createTextProp(name: string): VisualEditorTextProp {
  return {
    name,
    type: VisualEditorPropsType.text
  }
}

export function createSelectProp(name: string, options: { label: string, value: string }[]): VisualEditorSelectProp {
  return {
    name,
    options,
    type: VisualEditorPropsType.select
  }
}

export function createColorProp(name: string): VisualEditorColorProp {
  return {
    name,
    type: VisualEditorPropsType.color
  }
}
/**
 * @param name 
 * @param showField 这个参数和第三个数组参数 columns 中 filed 的值是对应的
 * @param columns 
 * @returns 
 */
export function createTableProp(
  name: string,
  showField: string, // 标识下拉框里需要显示数组容器中需要显示的字段对应的值
  columns: {
    name: string, // 字段提示名, 表头
    field: string // 绑定的字段
  }[]): VisualEditorTableProp {
  return {
    name,
    columns,
    showField,
    type: VisualEditorPropsType.table,
  }
}
