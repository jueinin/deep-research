
import mitt from "mitt";
import { useEffect } from "react";

type Events = {
  askQuestionsFinished: void;
  searchFinished: void;
};

export const emitter = mitt<Events>();

export const useAutoModeEvent = <E extends keyof Events>(event: E, handler: (event: Events[E]) => void) => {
  useEffect(() => {
    emitter.on(event, handler);
    return () => {
      emitter.off(event, handler);
    };
  }, [event, handler]);
};