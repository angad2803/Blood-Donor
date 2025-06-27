import { useState, useEffect } from "react";

export const useGPSPrompt = (user) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptType, setPromptType] = useState(null); // 'returning' or 'persistent'

  useEffect(() => {
    if (!user) return;

    // Check if user has GPS coordinates set
    const hasGPS =
      user.coordinates &&
      user.coordinates.coordinates &&
      user.coordinates.coordinates[0] !== 0 &&
      user.coordinates.coordinates[1] !== 0;

    if (!hasGPS) {
      // Check if user is new (created within last 24 hours) or returning
      const userCreatedAt = new Date(user.createdAt);
      const now = new Date();
      const hoursOld = (now - userCreatedAt) / (1000 * 60 * 60);

      // Check if we've shown GPS prompt before
      const gpsPromptShown = localStorage.getItem(`gpsPromptShown_${user._id}`);
      const lastPromptTime = localStorage.getItem(`lastGpsPrompt_${user._id}`);

      if (!gpsPromptShown) {
        // First time showing prompt
        if (hoursOld > 24) {
          // Returning user - show gentle prompt after 3 seconds
          setTimeout(() => {
            setPromptType("returning");
            setShowPrompt(true);
          }, 3000);
        }
      } else if (lastPromptTime) {
        // Check if it's been more than 7 days since last prompt
        const daysSinceLastPrompt =
          (now - new Date(parseInt(lastPromptTime))) / (1000 * 60 * 60 * 24);
        if (daysSinceLastPrompt > 7) {
          // Show persistent reminder after 10 seconds
          setTimeout(() => {
            setPromptType("persistent");
            setShowPrompt(true);
          }, 10000);
        }
      }
    }
  }, [user]);

  const dismissPrompt = (rememberChoice = false) => {
    setShowPrompt(false);
    if (rememberChoice && user) {
      localStorage.setItem(`gpsPromptShown_${user._id}`, "true");
      localStorage.setItem(`lastGpsPrompt_${user._id}`, Date.now().toString());
    }
  };

  return {
    showPrompt,
    promptType,
    dismissPrompt,
  };
};

export default useGPSPrompt;
