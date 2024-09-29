figma.showUI(__html__, { height: 850, width: 420, themeColors: true });

let startFrame: FrameNode | null = null;
let endFrame: FrameNode | null = null;

figma.on("selectionchange", () => {
  updateFrameSelection();
});

function updateFrameSelection() {
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
}

async function updateUI() {
  try {
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
  } catch (error) {
    console.error("Error updating UI:", error);
    figma.notify("Error updating UI. Check the console for details.");
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

type Curve =
  | {
      type: "spring";
      stiffness: number;
      damping: number;
      mass: number;
      initialVelocity: number; // Make this required
    }
  | {
      type: "bezier";
      values: [number, number, number, number];
    };

function createReaction(
  triggerType: string,
  curve: Curve,
  duration: number,
): { trigger: ReactionTrigger; actions: ReadonlyArray<Action> } {
  console.log("Creating reaction:", { triggerType, curve, duration });

  if (!endFrame) {
    throw new Error("End frame is not selected");
  }

  let easing: Easing;

  if (curve.type === "spring") {
    easing = {
      type: "CUSTOM_SPRING",
      // @ts-ignore: Figma API doesn't accept initialVelocity, but it works without it
      easingFunctionSpring: {
        mass: curve.mass,
        stiffness: curve.stiffness,
        damping: curve.damping,
        // initialVelocity: 0.0
      },
    };
  } else {
    easing = {
      type: "CUSTOM_CUBIC_BEZIER",
      easingFunctionCubicBezier: {
        x1: curve.values[0],
        y1: curve.values[1],
        x2: curve.values[2],
        y2: curve.values[3],
      },
    };
  }

  const baseAction: Action = {
    type: "NODE",
    destinationId: endFrame.id,
    navigation: "NAVIGATE",
    transition: {
      type: "SMART_ANIMATE",
      easing: easing,

      duration: duration,
    },
  };

  let trigger: ReactionTrigger;
  switch (triggerType) {
    case "Click":
      trigger = { type: "ON_CLICK" };
      break;
    case "Drag":
      trigger = { type: "ON_DRAG" };
      break;
    case "Hover":
      trigger = { type: "ON_HOVER" };
      break;
    case "Press":
      trigger = { type: "ON_PRESS" };
      break;
    case "Key":
      trigger = { type: "ON_KEY_DOWN", device: "KEYBOARD", keyCodes: [] };
      break;
    case "Mouse enter":
      trigger = { type: "MOUSE_ENTER" };
      break;
    case "Mouse leave":
      trigger = { type: "MOUSE_LEAVE" };
      break;
    case "Mouse down":
      trigger = { type: "MOUSE_DOWN", delay: 0 };
      break;
    case "Mouse up":
      trigger = { type: "MOUSE_UP", delay: 0 };
      break;
    case "Delay":
      trigger = { type: "AFTER_TIMEOUT", timeout: duration };
      break;
    default:
      trigger = { type: "ON_CLICK" };
  }

  return { trigger, actions: [baseAction] };
}

figma.ui.onmessage = async (msg: { type: string; trigger?: string; curve?: Curve; duration?: number }) => {
  console.log("Received message:", msg);

  if (msg.type === "create-interaction" && msg.trigger && msg.curve && msg.duration) {
    try {
      if (!startFrame || !endFrame) {
        throw new Error("Please select two frames before creating an interaction.");
      }

      const reaction = createReaction(msg.trigger, msg.curve, msg.duration);
      console.log("Created reaction:", reaction);

      await startFrame.setReactionsAsync([reaction as Reaction]);
      figma.notify("Interaction created successfully!");
    } catch (error) {
      console.error("Error creating interaction:", error);
      figma.notify("Error creating interaction. Check the console for details.");
    }
  } else if (msg.type === "switch-frames") {
    if (startFrame && endFrame) {
      [startFrame, endFrame] = [endFrame, startFrame];
      updateUI();
    }
  } else {
    console.warn("Unknown message type:", msg.type);
  }
};

// Initial update
updateFrameSelection();
