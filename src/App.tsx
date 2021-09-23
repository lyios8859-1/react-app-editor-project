import { useState } from "react";

import data from './mock.json';

import { VisualEditor } from "./packages/VisualEditor";
import { visualConfig } from "./packages/visual.config";
import { VisualEditorValue } from "./packages/editor.utils";

export default () => {
  
  const [editorValue, setEditorValue] = useState(() => {
    const val: VisualEditorValue = data;
    return val;
  });
  
  return (
    <div className="container" style={{ width: "100vw", height: "100vh" }}>
      {/* <h1 style={{textAlign: "center"}}>可视化编辑器</h1> */}
      <VisualEditor
        value={editorValue}
        config={visualConfig}
        onChange={setEditorValue}
      />
      {/* <div style={{textAlign: "center"}}>{JSON.stringify(data)}</div> */}
    </div>
  );
};
