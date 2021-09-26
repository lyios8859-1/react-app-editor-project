import { Button, Input } from "antd";
import { createVisualConfig } from "./editor.utils";

export const visualConfig = createVisualConfig();

visualConfig.registryComponent('text', {
    label: '文本',
    preview: () => <span>预览文本</span>,
    render: () => <span>渲染文本</span>
});

visualConfig.registryComponent('button', {
    label: '按钮',
    preview: () => <Button type="primary">预览按钮</Button>,
    render: () => <Button type="primary">渲染按钮</Button>
});

visualConfig.registryComponent('input', {
    label: '输入框',
    preview: () => <Input placeholder="预览输入框" />,
    render: () => <Input placeholder="渲染输入框" />
});