// plugin.tsx
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { motion } from "framer-motion";
import "./plugin.css"; // Ensure Tailwind CSS is included in your build process
//

const App = () => {
  // State variables
  const [selectedTrigger, setSelectedTrigger] = useState<string>("Click");
  const [startFrameData, setStartFrameData] = useState<{
    src: string | null;
    name: string;
  }>({ src: null, name: "" });
  const [endFrameData, setEndFrameData] = useState<{
    src: string | null;
    name: string;
  }>({ src: null, name: "" });
  const [isCreateButtonDisabled, setIsCreateButtonDisabled] = useState<boolean>(true);

  const triggerOptions = [
    { label: "Click", icon: "📱" },
    { label: "Drag", icon: "✋" },
    { label: "Hovering", icon: "🖱️" },
    { label: "Pressing", icon: "👇" },
    { label: "Key", icon: "⌨️" },
    { label: "Mouse enter", icon: "➡️" },
    { label: "Mouse leave", icon: "⬅️" },
    { label: "Mouse down", icon: "⬇️" },
    { label: "Mouse up", icon: "⬆️" },
    { label: "Delay", icon: "⏱️" },
  ];

  // Handle trigger selection
  const handleTriggerSelection = (trigger: string) => {
    setSelectedTrigger(trigger);
  };

  // Handle frame switching
  const handleSwitchFrames = () => {
    parent.postMessage({ pluginMessage: { type: "switch-frames" } }, "*");
  };

  // Handle interaction creation
  const handleCreateInteraction = () => {
    parent.postMessage(
      {
        pluginMessage: {
          type: "create-interaction",
          trigger: selectedTrigger,
        },
      },
      "*",
    );
  };

  // Listen for messages from the plugin
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;
      if (msg.type === "update-frames") {
        if (msg.startFrameId && msg.endFrameId) {
          setStartFrameData({
            src: msg.startFrameId,
            name: msg.startFrameName,
          });
          setEndFrameData({
            src: msg.endFrameId,
            name: msg.endFrameName,
          });
          setIsCreateButtonDisabled(false);
        } else {
          setStartFrameData({ src: null, name: "" });
          setEndFrameData({ src: null, name: "" });
          setIsCreateButtonDisabled(true);
        }
      }
    };

    window.addEventListener("message", onMessage);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, []);

  return (
    <div className="font-sans m-0 p-4 bg-[#2C2C2C] text-white max-w-[420px] mx-auto">
      <h1 className="m-0 mb-4 text-2xl font-bold">Spring</h1>

      {/* Trigger Section */}
      <div className="mb-4">
        <div className="text-sm text-[#888888] mb-2">Trigger</div>
        <div className="text-lg font-bold mb-2">{selectedTrigger}</div>
        <div className="grid grid-cols-5 gap-2">
          {triggerOptions.map((option) => (
            <motion.button
              key={option.label}
              onClick={() => handleTriggerSelection(option.label)}
              className={`rounded-md p-2 flex justify-center items-center h-10 text-white text-xs ${
                selectedTrigger === option.label ? "bg-[#0D99FF]" : "bg-[#3C3C3C]"
              }`}
              whileHover={{ backgroundColor: "#4C4C4C" }}
              whileTap={{ scale: 0.95 }}
            >
              {option.label.length > 6 ? option.label.slice(0, 6) : option.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Frames Section */}
      <div className="mb-4">
        <div className="text-sm text-[#888888] mb-2">Frames</div>
        <div className="flex justify-between items-center bg-[#3C3C3C] rounded-lg p-4">
          {/* Start Frame */}
          <div className="flex flex-col items-center">
            <div className="w-[150px] h-[100px] bg-[#2C2C2C] rounded overflow-hidden">
              {startFrameData.src && (
                <img src={startFrameData.src} alt="Start Frame" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="text-xs mt-2 text-center max-w-[150px] truncate">{startFrameData.name}</div>
          </div>

          {/* Switch Button */}
          <motion.button
            onClick={handleSwitchFrames}
            className="bg-[#4C4C4C] rounded-full w-8 h-8 flex justify-center items-center text-white text-base"
            whileHover={{ backgroundColor: "#5C5C5C" }}
            whileTap={{ scale: 0.95 }}
          >
            ↔
          </motion.button>

          {/* End Frame */}
          <div className="flex flex-col items-center">
            <div className="w-[150px] h-[100px] bg-[#2C2C2C] rounded overflow-hidden">
              {endFrameData.src && (
                <img src={endFrameData.src} alt="End Frame" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="text-xs mt-2 text-center max-w-[150px] truncate">{endFrameData.name}</div>
          </div>
        </div>
      </div>

      {/* Create Interaction Button */}
      <motion.button
        onClick={handleCreateInteraction}
        disabled={isCreateButtonDisabled}
        className={`rounded-md p-3 text-base font-bold w-full text-white ${
          isCreateButtonDisabled ? "bg-[#4C4C4C] cursor-not-allowed" : "bg-[#0D99FF]"
        }`}
        whileHover={!isCreateButtonDisabled ? { backgroundColor: "#0B87E0" } : {}}
        whileTap={!isCreateButtonDisabled ? { scale: 0.98 } : {}}
      >
        Create Interaction
      </motion.button>
    </div>
  );
};

const container = document.getElementById("root")!;
const root = createRoot(container);
root.render(<App />);
