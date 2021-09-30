import { useState } from "react";
import { Button, Input, Modal } from "antd";
import ReactDOM from "react-dom";
import deepcopy from 'deepcopy';
import { defer } from "../../utils/defer";

export enum DialogEdit {
  input = 'input',
  textarea = 'textarea',
}

interface DialogOption {
  title?: string,
  message?: string | (() => any),
  confirmButton?: boolean
  cancelButton?: boolean
  editType?: DialogEdit,
  editValue?: string,
  editReadonly?: boolean
  width?: string,
  onConfirm?: (editValue?: string) => void,
  onCancel?: () => void,
}

interface DialogInstance {
  show: (option?: DialogOption) => void,
  close: () => void,
}

const DialogComponent: React.FC<{ option?: DialogOption, onRef?: (ins: DialogInstance) => void }> = (props) => {

  let [option, setOption] = useState(props.option || {});
  const [showFlag, setShowFlag] = useState(false);
  const [editValue, setEditValue] = useState(option ? option.editValue : '');

  const methods = {
    show: (option?: DialogOption) => {
      setOption(deepcopy(option || {}));
      setEditValue(!option ? '' : (option.editValue || ''));
      setShowFlag(true);
    },
    close: () => setShowFlag(false),
  }

  props.onRef && props.onRef(methods);

  const handler = {
    onConfirm: () => {
      option.onConfirm && option.onConfirm(editValue)
      methods.close()
    },
    onCancel: () => {
      option.onCancel && option.onCancel()
      methods.close()
    },
  };

  const inputProps = {
    value: editValue,
    onChange: (e: React.ChangeEvent<any>) => setEditValue(e.target.value),
    readOnly: option.editReadonly === true,
  };

  return (
    <Modal
      maskClosable={true}
      closable={true}
      title={option.title || '系统提示'}
      visible={showFlag}
      onCancel={handler.onCancel}
      footer={(option.confirmButton || option.cancelButton) ? (
        <>
          {option.cancelButton && <Button onClick={handler.onCancel}>取消</Button>}
          {option.confirmButton && <Button type="primary" onClick={handler.onConfirm}>确定</Button>}
        </>
      ) : null}
    >
      {option.message}
      {option.editType === DialogEdit.input && (
        <Input {...inputProps} />
      )}
      {option.editType === DialogEdit.textarea && (
        <Input.TextArea {...inputProps} rows={15} />
      )}
    </Modal>
  )

}

const getInstance = (() => {
  let ins: null | DialogInstance = null;
  return (option?: DialogOption) => {
    if (!ins) {
      const el = document.createElement('div');
      document.body.appendChild(el);
      ReactDOM.render(<DialogComponent option={option} onRef={val => ins = val} />, el);
    }
    return ins!;
  }
})();

const DialogService = (option?: DialogOption) => {
  const ins = getInstance(option);
  ins.show(option);
}

export const $$dialog = Object.assign(DialogService, {
  textarea: (val?: string, option?: DialogOption) => {
    const dfd = defer<string | undefined>();
    option = option || {};
    option.editType = DialogEdit.textarea;
    option.editValue = val;
    if (option.editReadonly !== true) {
      option.confirmButton = true;
      option.cancelButton = true;
      option.onConfirm = dfd.resolve;
    }
    DialogService(option);
    return dfd.promise;
  },
  input: (val?: string, option?: DialogOption) => {
    // TODO
    console.log(val, option)
  },
})