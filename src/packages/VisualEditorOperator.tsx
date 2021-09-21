import { Alert, Button, Form, Input, InputNumber, Select } from "antd";
import { FormOutlined, SettingFilled } from '@ant-design/icons';
import deepcopy from "deepcopy";
import { useEffect, useState } from "react";
import { SketchPicker } from "react-color";
import { VisualEditorTablePropCom } from "./components/table-prop/VisualEditorTableProp";
import { getHookState } from "./hook/getHookState";
import { VisualEditorProps, VisualEditorPropsType } from "./VisualEditor.props";
import {
  VisualEditorBlock,
  VisualEditorConfig,
  VisualEditorValue,
} from "./VisualEditor.utils";
import "./VisualEditorOperator.scss";

export const VisualEditorOperator: React.FC<{
  selectBlock?: VisualEditorBlock;
  value: VisualEditorValue;
  config: VisualEditorConfig;
  updateBlock: (
    newBlock: VisualEditorBlock,
    oldBlock: VisualEditorBlock
  ) => void;
  updateValue: (val: VisualEditorValue) => void;
}> = (props) => {
  const [editData, setEditData] = useState({} as any);
  const [form] = Form.useForm();

  const methods = {
    onFormValuesChange: (valuesChange: any, values: any) => {
      setEditData({
        ...editData,
        ...values,
      });
    },
    apply: () => {
      if (!props.selectBlock) {
        // 更新整个容器的 value 数据
        props.updateValue({
          ...props.value,
          container: editData,
        });
      } else {
        // 更新组件的 block 数据
        props.updateBlock(deepcopy(editData), props.selectBlock);
      }
    },

    // 自动触发应用保存数据事件
    autoApply: async () => {
      // 这样操作是为了能在编辑数据时，可以自动更新数据
      const dataEditor: any = await getHookState(setEditData);
      if (!props.selectBlock) {
        // 更新整个容器的 value 数据
        props.updateValue({
          ...props.value,
          container: dataEditor,
        });
      } else {
        // 更新组件的 block 数据
        props.updateBlock(deepcopy(dataEditor), props.selectBlock);
      }
    },
    reset: () => {
      let data: any;
      if (!props.selectBlock) {
        data = deepcopy(props.value.container);
      } else {
        data = deepcopy(props.selectBlock);
      }
      setEditData(data);
      form.resetFields();
      form.setFieldsValue(data);
    },
  };

  useEffect(() => {
    methods.reset();
  }, [props.selectBlock]);

  const renderEditor = (
    propsName: string,
    propsConfig: VisualEditorProps,
    index: number,
    apply: () => void
  ) => {
    switch (propsConfig.type) {
      case VisualEditorPropsType.text:
        return (
          <Form.Item
            label={propsConfig.name}
            name={["props", propsName]}
            key={`propsName_${index}`}
          >
            <Input />
          </Form.Item>
        );
      case VisualEditorPropsType.select:
        return (
          <Form.Item
            label={propsConfig.name}
            name={["props", propsName]}
            key={`propsName_${index}`}
          >
            <Select>
              {propsConfig.options!.map((opt, i) => (
                <Select.Option value={opt.value} key={i}>
                  {opt.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        );
      case VisualEditorPropsType.color:
        return (
          <Form.Item
            label={propsConfig.name}
            name={["props", propsName]}
            key={`propsName_${index}`}
          >
            <SketchPicker />
          </Form.Item>
        );
      case VisualEditorPropsType.table:
        return (
          <Form.Item
            label={propsConfig.name}
            name={["props", propsName]}
            key={`propsName_${index}`}
          >
            {/* 
              编辑数据后需要手动点击"应用"事件才会更新数据
              <VisualEditorTablePropCom
                config={propsConfig}
              />
            */}
            {/* 编辑数据自动触发点击"应用"事件自动更新数据 */}
            <VisualEditorTablePropCom
              config={propsConfig}
              onChange={() => setTimeout(methods.autoApply)}
            />
          </Form.Item>
        );
      default:
        return (
          <Alert
            message="propsConfig.type is not exist!"
            type="error"
            showIcon
            key="error"
          />
        );
    }
  };
  const render = (() => {
    const content: JSX.Element[] = [];
    if (!props.selectBlock) {
      // 编辑容器属性
      content.push(
        <Form.Item label="容器宽度" name="width" key="container-width">
          <InputNumber step={100} min={0} precision={0} />
        </Form.Item>
      );
      content.push(
        <Form.Item label="容器高度" name="height" key="container-height">
          <InputNumber step={100} precision={0} />
        </Form.Item>
      );
    } else {
      // 编辑 block 属性
      const component =
        props.config.componentMap[props.selectBlock.componentKey];

      if (component) {
        content.push(
          <Form.Item label="组件标识" name="slotName" key="slotName">
            <Input />
          </Form.Item>
        );
        content.push(
          ...Object.entries(component.props || {}).map(
            ([propsName, propsConfig], index) => {
              return renderEditor(
                propsName,
                propsConfig,
                index,
                methods.apply
              )!;
            }
          )
        );
        content.push(
          ...Object.entries(component.model || {}).map(([modelProp, modelName], index) => {
            return (
              <Form.Item label={modelName} name={['model', modelProp]} key={`model_${index}`}>
                <Input />
              </Form.Item>
            );
          })
        );
      }
    }
    return content;
  })();

  return (
    <>
      <div className="visual-editor__operator_content">
        <div className="visual-editor__operator_content-title">
          <span><FormOutlined /> {props.selectBlock ? "编辑元素" : "编辑容器"}</span>
          <span><SettingFilled /> 动画</span>
        </div>
        <Form
          layout="vertical"
          form={form}
          onValuesChange={methods.onFormValuesChange}
        >
          {render}
          <Form.Item key="operator">
            <Button
              type="primary"
              onClick={methods.apply}
              style={{ marginRight: "8px" }}
            >
              应用
            </Button>
            <Button onClick={methods.reset}>重置</Button>
          </Form.Item>
        </Form>
      </div>
    </>
  );
};
