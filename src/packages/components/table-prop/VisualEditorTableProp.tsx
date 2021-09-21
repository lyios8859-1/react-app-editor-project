import ReactDOM from 'react-dom';
import { Button, Modal, Tag, Table, Input } from 'antd';
import { PlusSquareOutlined, PlusOutlined } from "@ant-design/icons";
import { VisualEditorTableProp } from '../../VisualEditor.props';
import './VisualEditorTableProp.scss';
import { defer } from '../../utils/defer';
import { useState } from 'react';
import deepcopy from 'deepcopy';

export const VisualEditorTablePropCom: React.FC<{
  config: VisualEditorTableProp,
  value?: any[],
  onChange?: (val?: any[]) => void,
}> = (props) => {

  const methods = {
    openEdit: async () => {
      const newVal = await TablePropEditService({
        config: props.config,
        value: props.value!
      });
      props.onChange && props.onChange(newVal)
    }
  };

  let render: any;

  if (!props.value || props.value.length === 0) {
    render  = (
      <Button onClick={methods.openEdit}>
        <PlusOutlined/>
        <span>编辑</span>
      </Button>
    );
  } else {

    render = props.value.map((item, index) => {
      return (
        <Tag key={index} onClick={methods.openEdit}>
          {
            item[props.config.showField]
          }
        </Tag>
      );
    });
  }
  return (
    <div className="visual-editor-table__props">
      {render}
    </div>
  );
}

interface TablePropEditServiceOption {
  config: VisualEditorTableProp,
  value?: any[],
  onConfirm?: (val?: any[]) => void
}
const nextKey = (() => {
  let index = 0;
  const start = Date.now()
  return () => start + '_' + index++
})();

const TablePropEditModal: React.FC<{option: TablePropEditServiceOption, onRef: (ins: {show: (opt: TablePropEditServiceOption) => void}) => void}> = (props) => {

  let [option, setOption] = useState(props.option || {});
  let [showFlag, setShowFlag] = useState(false);
  let [editData, setEditDatas] = useState([] as any[]);

  // 二次处理数据
  const setEditData = (val: any[]) => {
    // 如果数组中没有 key 属性，再次处理生成 key 属性，否则报错
    return setEditDatas(val.map(d => {
      !d.key && (d.key = nextKey());
      return d;
    }));
  };

  const methods = {
    show: (opt: TablePropEditServiceOption) => {
      setOption(opt);
      setEditData(deepcopy(opt.value || []));
      setShowFlag(true);
    },
    close: () => {
      setShowFlag(false);
    },
    save: () => {
      option.onConfirm && option.onConfirm(editData);
      methods.close();
    },
    add: () => {
      setEditData([
        {},
        ...editData
      ]);
    },
    reset: () => {
      setEditData(option.value || []);
    }
  };
  props?.onRef(methods);// 挂载方法
  return (
    <Modal
      visible={showFlag}
      footer={(<>
        <Button onClick={methods.close}>取消</Button>
        <Button type="primary" onClick={methods.save}>保存</Button>
      </>)}
      onCancel={methods.close}
      width="800px"
    >
      <div className="table-prop-editor__dialog-buttons">
        <Button onClick={methods.add} type="primary" style={{marginRight: '8px'}}>添加</Button>
        <Button onClick={methods.reset}>重置</Button>
      </div>
      <div className="table-prop-editor__dialog-list">
        <Table dataSource={editData}>
          <Table.Column
            dataIndex={''}
            title={"#"}
            render={(_1, _2, index) => {
              return index + 1;
            }}/>
            {(option.config.columns || []).map((col, index) => (
              <Table.Column
                title={col.name}
                dataIndex={col.field}
                key={index}
                render={(_1, row: any, index) => {
                  return (
                    <Input
                      value={row[col.field]}
                      onChange={e => {
                        row = {...row, [col.field]: e.target.value}
                        editData[index] = row
                        setEditData([...editData])
                      }}
                    />
                  )
                }}
              />
            ))}
            <Table.Column
              title="操作栏"
              render={(_1, _2, index) => {
                return (
                  <Button onClick={() => {
                        editData.splice(index, 1);
                        setEditData(editData);
                      }
                    }
                    type={"text"}
                  >
                    删除
                  </Button>
                )
              }}
            />
        </Table>
      </div>
    </Modal>
  );
}

export const TablePropEditService = (() => {
  let ins: any;
  return (options: Omit<TablePropEditServiceOption, 'onConfirm'>): Promise<undefined | any[]> => {
    const dfd = defer<undefined | any[]>();
    options = {
      ...options,
      onConfirm: dfd.resolve
    } as TablePropEditServiceOption;
    if (!ins) {
      const el = document.createElement('div');
      document.body.appendChild(el);
      ReactDOM.render(<TablePropEditModal option={options} onRef={v => ins = v}/>, el);
    }
    ins.show(options);
    return dfd.promise;
  }
})();