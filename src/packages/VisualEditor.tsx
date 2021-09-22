import './style/VisualEditor.scss';

import { VisualEditorValue } from './editor.utils';

export const VisualEditor: React.FC<{
  value: VisualEditorValue
}> = (props) => {
  console.log(props.value);
  return (<>
    VisualEditorValue
  </>);
};