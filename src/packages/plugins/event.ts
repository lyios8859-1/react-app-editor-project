type CustomEventListener = () => void;

export function createEvent () {
  const listeners: CustomEventListener[] = [];
  return {
    on: (cb: CustomEventListener) => {
      listeners.push(cb);
    },
    off: (cb: CustomEventListener) => {
      const index = listeners.indexOf(cb);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    },
    emit: () => {
      listeners.forEach(c => c());
    }
  }
}

