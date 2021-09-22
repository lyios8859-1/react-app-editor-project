import { useState } from "react";
import { VisualEditor } from "./packages/VisualEditor";
import data from './mock.json';

export default () => {
  const [moduleValue, setModuleValue] = useState(data);
  return (
    <div className="visual-editor" style={{ width: "100vw", height: "100vh" }}>
      <VisualEditor value={moduleValue} />
    </div>
  );
};
