import { useState } from "react";

import { VisualEditor } from "./packages/VisualEditor";


import data from './mock.json';
import { visualConfig } from "./packages/visual.config";

export default () => {
  
  const [moduleValue, setModuleValue] = useState(data);
  return (
    <div className="container" style={{ width: "100vw", height: "100vh" }}>
      {/* <h1 style={{textAlign: "center"}}>可视化编辑器</h1> */}
      <VisualEditor value={moduleValue} config={visualConfig}/>
      {/* <div style={{textAlign: "center"}}>{JSON.stringify(data)}</div> */}
    </div>
  );
};
