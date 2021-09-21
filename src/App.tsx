import { useState } from "react";
import { VisualEditor } from "./packages/VisualEditor";
import { VisualEditorValue } from "./packages/VisualEditor.utils";
import { visualConfigFactory } from "./visual.config";
import data from './mock';
import { notification } from "antd";
export default () => {
  const [editorValue, setEditorValue] = useState(() => {
    const val: VisualEditorValue = data;
    return val;
  });
  const [formData, onFormDataChange] = useState({
    username: 'TOM',
    minLevel: 100,
    maxLevel: 300
  } as any);
  const customProps = {
    inputComponent: {
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log(e)
      }
    },
    buttonComponent: {
      onClick: () => {
        notification.open({
          type: 'info',
          message: '执行提交逻辑，校验表单数据',
          description: JSON.stringify(formData)
        })
      }
    }
  }
  return (
    <div className="visual-editor" style={{ width: "100vw", height: "100vh" }}>
      <VisualEditor
        config={visualConfigFactory}
        value={editorValue}
        onChange={setEditorValue}
        formData={formData}
        onFormDataChange={onFormDataChange}
        customProps={customProps}
      >
        {
          {
            buttonComponent: (formData as any).username.length < 5 ? undefined : () => <button disabled>普通按钮</button>
          }
        }
      </VisualEditor>
      {JSON.stringify(formData)}
    </div>
  );
};
