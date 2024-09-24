figma.showUI(__html__, { height: 420, width: 500, themeColors: true });

let startFrame: FrameNode | null = null;
let endFrame: FrameNode | null = null;

figma.on("selectionchange", () => {
  const selection = figma.currentPage.selection;
  if (selection.length === 2 && selection.every((node) => node.type === "FRAME")) {
    startFrame = selection[0] as FrameNode;
    endFrame = selection[1] as FrameNode;
    updateUI();
  } else {
    startFrame = null;
    endFrame = null;
    updateUI();
  }
});

async function updateUI() {
  if (startFrame && endFrame) {
    const startThumbnail = await startFrame.exportAsync({ format: "PNG", constraint: { type: "SCALE", value: 2 } });
    const endThumbnail = await endFrame.exportAsync({ format: "PNG", constraint: { type: "SCALE", value: 2 } });

    figma.ui.postMessage({
      type: "update-frames",
      startFrameId: `data:image/png;base64,${figma.base64Encode(startThumbnail)}`,
      endFrameId: `data:image/png;base64,${figma.base64Encode(endThumbnail)}`,
      startFrameName: startFrame.name,
      endFrameName: endFrame.name,
    });
  } else {
    figma.ui.postMessage({
      type: "update-frames",
      startFrameId: null,
      endFrameId: null,
      startFrameName: "",
      endFrameName: "",
    });
  }
}

type ReactionTrigger =
  | { type: "ON_CLICK" | "ON_DRAG" | "ON_HOVER" | "ON_PRESS" }
  | { type: "AFTER_TIMEOUT"; timeout: number }
  | { type: "MOUSE_DOWN" | "MOUSE_UP"; delay: number }
  | { type: "MOUSE_ENTER" | "MOUSE_LEAVE" }
  | {
      type: "ON_KEY_DOWN";
      device: "KEYBOARD" | "XBOX_ONE" | "PS4" | "SWITCH_PRO" | "UNKNOWN_CONTROLLER";
      keyCodes: number[];
    };

function createReaction(triggerType: string): { trigger: ReactionTrigger; actions: ReadonlyArray<Action> } {
  const baseAction: Action = {
    type: "NODE",
    destinationId: endFrame!.id,
    navigation: "NAVIGATE",
    transition: {
      type: "SMART_ANIMATE",
      easing: { type: "EASE_OUT" },
      duration: 300,
    },
  };

  switch (triggerType) {
    case "Click":
      return { trigger: { type: "ON_CLICK" }, actions: [baseAction] };
    case "Drag":
      return { trigger: { type: "ON_DRAG" }, actions: [baseAction] };
    case "Hovering":
      return { trigger: { type: "ON_HOVER" }, actions: [baseAction] };
    case "Pressing":
      return { trigger: { type: "ON_PRESS" }, actions: [baseAction] };
    case "Key":
      return { trigger: { type: "ON_KEY_DOWN", device: "KEYBOARD", keyCodes: [] }, actions: [baseAction] };
    case "Mouse enter":
      return { trigger: { type: "MOUSE_ENTER" }, actions: [baseAction] };
    case "Mouse leave":
      return { trigger: { type: "MOUSE_LEAVE" }, actions: [baseAction] };
    case "Mouse down":
      return { trigger: { type: "MOUSE_DOWN", delay: 0 }, actions: [baseAction] };
    case "Mouse up":
      return { trigger: { type: "MOUSE_UP", delay: 0 }, actions: [baseAction] };
    case "Delay":
      return { trigger: { type: "AFTER_TIMEOUT", timeout: 1000 }, actions: [baseAction] };
    default:
      return { trigger: { type: "ON_CLICK" }, actions: [baseAction] };
  }
}

figma.ui.onmessage = async (msg: { type: string; trigger?: string }) => {
  if (msg.type === "create-interaction" && msg.trigger) {
    if (startFrame && endFrame) {
      const reaction = createReaction(msg.trigger);
      await startFrame.setReactionsAsync([reaction as Reaction]);
      figma.notify("Interaction created successfully!");
    } else {
      figma.notify("Please select two frames before creating an interaction.");
    }
  } else if (msg.type === "switch-frames") {
    if (startFrame && endFrame) {
      [startFrame, endFrame] = [endFrame, startFrame];
      updateUI();
    }
  }
};
