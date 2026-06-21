import React, { useContext, useEffect, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";

// Components
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import NavigationTabs from "../../components/dashboard/NavigationTabs";
import BrowseRequestsContent from "../../components/requests/BrowseRequestsContent";
import TabContent from "../../components/dashboard/TabContent";
import QuickStats from "../../components/dashboard/QuickStats";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import DashboardModals from "../../components/dashboard/DashboardModals";
import AnimationStyles from "../../components/ui/AnimationStyles";

// Hooks
import { useDashboardData } from "../../hooks/useDashboardData";
import { useDashboardState } from "../../hooks/useDashboardState";
import { useGSAPAnimations } from "../../hooks/useGSAPAnimations";

const Dashboard = () => {
  const { user, logout, refreshUserData } = useContext(AuthContext);

  // Custom hooks for data and state management
  const {
    requests,
    myRequests,
    myOffers,
    acceptedOffers,
    loading,
    requestsWithOffers,
    fetchData,
    handleOfferSent,
    handleAcceptOffer,
  } = useDashboardData();

  const {
    location,
    selectedRequest,
    showOfferModal,
    setShowOfferModal,
    showShortcutsModal,
    setShowShortcutsModal,
    showChatModal,
    setShowChatModal,
    selectedChatRequest,
    activeTab,
    setActiveTab,
    showMapView,
    setShowMapView,
    handleOpenChat,
    useKeyboardShortcuts,
  } = useDashboardState();

  // GSAP animations - keeping only tab transitions
  const {
    animateTabTransition,
    animateRibbonTabChange,
    animateCards,
    addCardHoverEffects,
  } = useGSAPAnimations();

  // Refs for animations - cleaned up
  const cardsRef = useRef([]);
  const tabsRef = useRef(null);
  const ribbonRef = useRef(null);
  const mainContentRef = useRef(null);

  // Calculate available requests count for badge
  const availableRequestsCount = requests.filter(
    (req) =>
      !requestsWithOffers.has(req._id) && req.requester?._id !== user?._id
  ).length;

  // Enhanced tab transition with animations
  const handleTabTransition = (newTab) => {
    animateTabTransition(
      newTab,
      mainContentRef,
      setActiveTab,
      (tab) => animateRibbonTabChange(tab, tabsRef),
      cardsRef,
      () => animateCards(cardsRef),
      () => addCardHoverEffects(cardsRef)
    );
  };



  // Setup keyboard shortcuts
  useKeyboardShortcuts(
    setActiveTab,
    setShowShortcutsModal,
    setShowOfferModal,
    setShowChatModal,
    (path) => (window.location.href = path)
  );

  // Initialize data and animations
  useEffect(() => {
    fetchData();

    // Handle success messages from navigation state
    if (location.state?.message) {
      toast.success(location.state.message);
      if (location.state.activeTab) {
        setActiveTab(location.state.activeTab);
      }
      // Clear the state to prevent showing message on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, fetchData, setActiveTab]);

  // Entrance animations - REMOVED GSAP animations for better performance
  useEffect(() => {
    // Removed GSAP entrance animations

    // Add ribbon hover effects after page load
    setTimeout(() => {
      if (ribbonRef.current) {
        const tabButtons = ribbonRef.current.querySelectorAll("button");
        tabButtons.forEach((button) => {
          button.addEventListener("mouseenter", () => {
            if (!button.classList.contains("active")) {
              // Enhanced hover effect for non-active tabs
            }
          });
        });
      }
    }, 100); // Reduced timeout since no animation needed

    // No cleanup needed since no floating elements created
  }, []);

  // Cards animation on tab change
  useEffect(() => {
    setTimeout(() => {
      animateCards(cardsRef);
      addCardHoverEffects(cardsRef);
    }, 100);
  }, [activeTab, animateCards, addCardHoverEffects]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Dynamic Background */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background: `
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.2) 0%, transparent 50%),
            linear-gradient(135deg, #667eea 0%, #764ba2 100%)
          `,
          backgroundSize: "100% 100%, 100% 100%, 100% 100%, 100% 100%",
          backgroundPosition: "0% 0%, 100% 100%, 50% 50%, 0% 0%",
          animation: "pulseGradient 15s ease-in-out infinite",
        }}
      />

      {/* Animation Styles */}
      <AnimationStyles />

      {/* Header */}
      <div>
        <DashboardHeader
          user={user}
          logout={logout}
          refreshUserData={refreshUserData}
          setShowShortcutsModal={setShowShortcutsModal}
        />
      </div>

      {/* Navigation Tabs */}
      <div ref={ribbonRef}>
        <NavigationTabs
          activeTab={activeTab}
          animateTabTransition={handleTabTransition}
          tabsRef={tabsRef}
          ribbonRef={ribbonRef}
          availableRequestsCount={availableRequestsCount}
        />
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <QuickStats
          requests={requests}
          myRequests={myRequests}
          myOffers={myOffers}
          acceptedOffers={acceptedOffers}
        />
      </div>

      {/* Main Content */}
      <div
        ref={mainContentRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8"
      >
        <div className="space-y-6">
          {/* Browse Requests Content */}
          {activeTab === "browse" && (
            <BrowseRequestsContent
              requests={requests}
              requestsWithOffers={requestsWithOffers}
              user={user}
              showMapView={showMapView}
              setShowMapView={setShowMapView}
              handleSendOffer={handleSendOffer}
              handleOpenChat={handleOpenChat}
            />
          )}

          {/* Other Tab Content */}
          <TabContent
            activeTab={activeTab}
            myRequests={myRequests}
            myOffers={myOffers}
            acceptedOffers={acceptedOffers}
            handleAcceptOffer={handleAcceptOffer}
            handleOpenChat={handleOpenChat}
          />
        </div>
      </div>

      {/* Modals */}
      <DashboardModals
        showOfferModal={showOfferModal}
        setShowOfferModal={setShowOfferModal}
        selectedRequest={selectedRequest}
        handleOfferSent={handleOfferSent}
        showChatModal={showChatModal}
        setShowChatModal={setShowChatModal}
        selectedChatRequest={selectedChatRequest}
        showShortcutsModal={showShortcutsModal}
        setShowShortcutsModal={setShowShortcutsModal}
        user={user}
      />
    </div>
  );
};

export default Dashboard;
