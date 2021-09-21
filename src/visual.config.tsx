/**
 * 注册组件
 */
import { PictureOutlined } from "@ant-design/icons";
import { Button, Input, Select } from "antd";
import { NumberRange } from "./packages/components/number-range/NumberRange";
import {
  createColorProp,
  createSelectProp,
  createTableProp,
  createTextProp,
} from "./packages/VisualEditor.props";
import { createVisualConfig } from "./packages/VisualEditor.utils";

export const visualConfigFactory = createVisualConfig();

visualConfigFactory.registryComponent("text", {
  name: "文本",
  prievew: () => <span>预览文本</span>,
  render: ({ props }) => (
    <span
      style={{
        color: props?.color ? props.color.hex : "",
        fontSize: props?.size,
      }}
    >
      {props?.text || "渲染文本"}
    </span>
  ),
  props: {
    text: createTextProp("显示文本"),
    color: createColorProp("字体颜色"),
    size: createSelectProp("字体大小", [
      { label: "14px", value: "14px" },
      { label: "18px", value: "18px" },
      { label: "24px", value: "24px" },
    ]),
  },
});

visualConfigFactory.registryComponent("button", {
  name: "按钮",
  prievew: () => <Button type="primary">预览按钮</Button>,
  render: ({ size, props, custom }) => (
    <Button
      type={props?.type || "primary"}
      size={props?.size}
      style={size}
      {...custom}
    >
      {props?.label || "渲染按钮"}
    </Button>
  ),
  resize: {
    width: true, // 可调整宽度
    height: true, // 可调整高度
  },
  props: {
    label: createTextProp("按钮文本"),
    type: createSelectProp("按钮类型", [
      { label: "默认", value: "default" },
      { label: "基础", value: "primary" },
      { label: "线框", value: "ghost" },
      { label: "虚线", value: "dashed" },
      { label: "链接", value: "link" },
      { label: "文本", value: "text" },
    ]),
    size: createSelectProp("大小尺寸", [
      { label: "大", value: "large" },
      { label: "中", value: "middle" },
      { label: "小", value: "small" },
    ]),
  },
});

visualConfigFactory.registryComponent("input", {
  name: "输入框",
  prievew: () => <Input />,
  render: ({ size, model, custom }) => (
    <Input
      style={size}
      value={model.default.value}
      onChange={model.default.onChange}
      {...custom}
    />
  ),
  resize: {
    width: true, // 可调整宽度
  },
  model: {
    default: "绑定字段",
  },
});

visualConfigFactory.registryComponent("select", {
  name: "下拉框",
  prievew: () => (
    <Select placeholder="请选择" style={{ width: "100%" }}>
      <Select.Option value="dog">狗狗</Select.Option>
      <Select.Option value="cat">猫咪</Select.Option>
    </Select>
  ),
  render: ({ props, size, model, custom }) => (
    <Select
      value={model.default.value}
      onChange={model.default.onChange}
      {...custom}
      placeholder="请选择"
      key={(props?.options || [])
        .map(
          ({ label, val }: { label: string; val: string }, index: number) =>
            label + "_" + val + "_" + index
        )
        .join(".")}
      style={{ width: size.width || "100%" }}
    >
      {(props?.options || []).map((opt: any, _index: number) => {
        return (
          <Select.Option value={opt.val} key={`select_${_index}`}>
            {opt.label}
          </Select.Option>
        );
      })}
    </Select>
  ),
  resize: {
    width: true, // 可调整宽度
  },
  props: {
    // createTableProp 函数的第二个参数，和第三个数组参数的对象的 filed 的值是对应的
    options: createTableProp("下拉选项", "label", [
      { name: "选项显示值", field: "label" },
      { name: "选项值", field: "val" },
      { name: "备注", field: "comments" },
    ]),
  },
  model: {
    default: "绑定字段",
  },
});

visualConfigFactory.registryComponent("number-range", {
  name: "绑定多个字段",
  prievew: () => (
    <div style={{ textAlign: "center" }}>
      <NumberRange width="100%" />
    </div>
  ),
  render: ({ model, size, block }) => {
    return (
      <NumberRange
        key={(() => {
          const model = block.model || {};
          return (model.start || "@@start") + "_" + (model.end || "@@end");
        })()}
        width={size.width}
        {...{
          start: model.start.value,
          onStartChange: model.start.onChange,
          end: model.end.value,
          onEndChange: model.end.onChange,
        }}
      />
    );
  },
  resize: {
    width: true,
  },
  model: {
    start: "起始输入框绑定字段",
    end: "结尾输入框绑定字段",
  },
});

visualConfigFactory.registryComponent("image", {
  name: "图片",
  render: ({ props, size }) => {
    return (
      <div
        style={{ height: size.height || "100px", width: size.width || "100px" }}
        className="visual-block-image"
      >
        <img
          src={ props && props.url || './img/default-img.jpg' }
          style={{
            objectFit: "fill",
            display: "block",
            height: "100%",
            width: "100%",
          }}
        />
      </div>
    );
  },
  prievew: () => (
    <div
      style={
        {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100px",
          height: "50px",
          fontSize: "20px",
          color: "#ccc",
          backgroundColor: "#f2f2f2",
        }
      }
    >
      <PictureOutlined />
    </div>
  ),
  resize: {
    width: true,
    height: true,
  },
  props: {
    url: createTextProp("地址"),
  },
});
