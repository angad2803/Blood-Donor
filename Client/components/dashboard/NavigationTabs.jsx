import React from "react";
import useThemeStore from "../../stores/themeStore";

const NavigationTabs = ({
  activeTab,
  animateTabTransition,
  tabsRef,
  ribbonRef,
  availableRequestsCount,
}) => {
  const { isDarkMode } = useThemeStore();
  const tabs = [
    {
      id: "browse",
      label: "Browse Requests",
      icon: "🔍",
      badge: availableRequestsCount,
      dataTab: "browse",
    },
    {
      id: "my-requests",
      label: "My Requests",
      icon: "📋",
      dataTab: "my-requests",
    },
    {
      id: "my-offers",
      label: "My Offers",
      icon: "🤝",
      dataTab: "my-offers",
    },
    {
      id: "accepted",
      label: "Accepted Offers",
      icon: "✅",
      dataTab: "accepted",
    },
  ];

  return (
    <div
      className="relative overflow-hidden border-b border-white/30"
      ref={ribbonRef}
      style={{
        background: `
          linear-gradient(135deg, 
            rgba(255, 255, 255, 0.25) 0%, 
            rgba(255, 255, 255, 0.18) 50%, 
            rgba(255, 255, 255, 0.25) 100%
          ),
          linear-gradient(90deg, 
            rgba(59, 130, 246, 0.05) 0%, 
            rgba(99, 102, 241, 0.05) 25%, 
            rgba(139, 92, 246, 0.05) 50%, 
            rgba(99, 102, 241, 0.05) 75%, 
            rgba(59, 130, 246, 0.05) 100%
          )
        `,
        backdropFilter: "blur(20px) saturate(180%)",
        boxShadow: `
          0 8px 32px rgba(59, 130, 246, 0.12),
          inset 0 1px 0 rgba(255, 255, 255, 0.3),
          inset 0 -1px 0 rgba(255, 255, 255, 0.1)
        `,
      }}
    >
      {}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `linear-gradient(90deg, 
            transparent 0%, 
            rgba(255, 255, 255, 0.1) 50%, 
            transparent 100%
          )`,
          backgroundSize: "200% 100%",
          animation: "shimmer 8s ease-in-out infinite",
        }}
      ></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <nav
          className="flex space-x-2 overflow-x-auto scrollbar-hide py-2"
          ref={tabsRef}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              data-tab={tab.dataTab}
              onClick={() => animateTabTransition(tab.id)}
              className={`relative flex items-center space-x-3 px-6 py-3 rounded-2xl font-medium text-sm transition-all duration-300 whitespace-nowrap group overflow-hidden ${
                activeTab === tab.id
                  ? "text-white nav-tab-active"
                  : "text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 nav-tab-text"
              }`}
              style={{
                background:
                  activeTab === tab.id
                    ? `linear-gradient(135deg, 
                        rgba(59, 130, 246, 0.9) 0%, 
                        rgba(99, 102, 241, 0.9) 50%, 
                        rgba(139, 92, 246, 0.9) 100%
                      )`
                    : isDarkMode
                    ? `linear-gradient(135deg, 
                        rgba(31, 41, 55, 0.7) 0%, 
                        rgba(31, 41, 55, 0.5) 100%
                      )`
                    : `linear-gradient(135deg, 
                        rgba(255, 255, 255, 0.7) 0%, 
                        rgba(255, 255, 255, 0.5) 100%
                      )`,
                backdropFilter: "blur(15px) saturate(150%)",
                boxShadow:
                  activeTab === tab.id
                    ? `0 8px 25px rgba(59, 130, 246, 0.25),
                       inset 0 1px 0 rgba(255, 255, 255, 0.3)`
                    : `0 4px 15px rgba(0, 0, 0, 0.08),
                       inset 0 1px 0 rgba(255, 255, 255, 0.3)`,
                border:
                  activeTab === tab.id
                    ? "1px solid rgba(255, 255, 255, 0.3)"
                    : "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              {}
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background: `linear-gradient(135deg, 
                    rgba(255, 255, 255, 0.3) 0%, 
                    transparent 50%, 
                    rgba(255, 255, 255, 0.1) 100%
                  )`,
                }}
              ></div>

              {}
              <span className="text-lg relative z-10">{tab.icon}</span>
              <span className="relative z-10">{tab.label}</span>

              {}
              {tab.badge && tab.badge > 0 && (
                <span
                  className="relative z-10 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg"
                  style={{
                    boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
                  }}
                >
                  {tab.badge}
                </span>
              )}

              {}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(90deg, 
                    transparent 0%, 
                    rgba(255, 255, 255, 0.3) 50%, 
                    transparent 100%
                  )`,
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2s ease-in-out infinite",
                }}
              ></div>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default NavigationTabs;
