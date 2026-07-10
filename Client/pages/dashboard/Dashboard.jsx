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
import useThemeStore from "../../stores/themeStore";
import { getSocket } from "../../utils/socket";

const Dashboard = () => {
  const { user, logout, refreshUserData } = useContext(AuthContext);
  const { isDarkMode } = useThemeStore();

  // Custom hooks for data and state management
  const {
    requests,
    myRequests,
    myOffers,
    acceptedOffers,
    loading,
    requestsWithOffers,
    fetchData,
    fetchMyRequests,
    handleOfferSent,
    handleAcceptOffer,
    handleRejectOffer,
  } = useDashboardData();

  const {
    location,
    selectedRequest,
    showOfferModal,
    setShowOfferModal,
    showShortcutsModal,
    setShowShortcutsModal,
    activeTab,
    setActiveTab,
    showMapView,
    setShowMapView,
    handleSendOffer,
    handleOpenChat,
    useKeyboardShortcuts,
  } = useDashboardState();

  // Refs for navigation
  const mainContentRef = useRef(null);

  // Calculate available requests count for badge
  const availableRequestsCount = requests.filter(
    (req) =>
      !requestsWithOffers.has(req._id) && req.requester?._id !== user?._id
  ).length;

  // Simple tab transition
  const handleTabTransition = (newTab) => {
    setActiveTab(newTab);
  };



  // Join the user's personal socket room for targeted real-time events
  useEffect(() => {
    if (user?._id) {
      const socket = getSocket();
      socket.emit("join-user-room", user._id);
    }
  }, [user?._id]);

  // Setup keyboard shortcuts
  useKeyboardShortcuts(
    setActiveTab,
    setShowShortcutsModal,
    setShowOfferModal,
    (path) => (window.location.href = path)
  );

  // Initialize data and animations
  useEffect(() => {
    fetchData();

    // Handle success messages and refresh triggers from navigation state
    if (location.state?.message) {
      toast.success(location.state.message);
      if (location.state.activeTab) {
        setActiveTab(location.state.activeTab);
      }
      // If navigated from CreateRequest, refresh myRequests to include the new entry
      if (location.state.refresh) {
        fetchMyRequests();
      }
      // Clear the state to prevent showing message on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, fetchData, fetchMyRequests, setActiveTab]);

  // Removed Entrance animations and hover effects


  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
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
      <div>
        <NavigationTabs
          activeTab={activeTab}
          animateTabTransition={handleTabTransition}
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
            handleRejectOffer={handleRejectOffer}
            handleOpenChat={handleOpenChat}
            user={user}
          />
        </div>
      </div>

      {/* Modals */}
      <DashboardModals
        showOfferModal={showOfferModal}
        setShowOfferModal={setShowOfferModal}
        selectedRequest={selectedRequest}
        handleOfferSent={handleOfferSent}
        showShortcutsModal={showShortcutsModal}
        setShowShortcutsModal={setShowShortcutsModal}
        user={user}
      />
    </div>
  );
};

export default Dashboard;
