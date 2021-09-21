import ReactDOM from 'react-dom';
import App from './App';
import 'antd/dist/antd.css';
import { Button, Input } from 'antd';

// const App = () => {
//   let text = '22';
//   const logText = () => {
//     // 这是一个受控组件，输入框输入时不会触发视图更新
//     console.log(text)
//   }
//   return (
//     <div>
//       <div style={{width: '400px'}}>
//         <Input value={text} onChange={ev => text = ev.target.value}></Input>
//         <Button onClick={logText}>打印数据</Button>
//       </div>
//     </div>
//   );
// }

ReactDOM.render(
  <App />,
  document.querySelector('#app')
)
