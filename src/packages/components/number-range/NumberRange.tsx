import "./NumberRange.scss";
import { useMemo, useState } from "react";

export const NumberRange: React.FC<{
  start?: string;
  end?: string;
  onStartChange?: (val?: string) => void;
  onEndChange?: (val?: string) => void;
  width?: number | string;
}> = (props) => {
  const [start, setStart] = useState(props.start);
  const [end, setEnd] = useState(props.end);

  const handler = {
    onStartChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setStart(val);
      !!props.onStartChange && props.onStartChange(val);
    },
    onEndChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setEnd(val);
      !!props.onEndChange && props.onEndChange(val);
    },
  };

  const styles = useMemo(() => {
    let width = props.width;
    if (!width) {
      width = "225px";
    }
    if (typeof width === "number") {
      width = `${width}px`;
    }
    return {
      width,
    };
  }, [props.width]);

  return (
    <div className="number-range" style={styles}>
      <input
        type="text"
        defaultValue={start}
        onChange={handler.onStartChange}
      />
      <i>~</i>
      <input type="text" defaultValue={end} onChange={handler.onEndChange} />
    </div>
  );
};
