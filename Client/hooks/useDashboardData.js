import { useState, useCallback, useEffect } from "react";
import api from "../api/api.js";
import { toast } from "react-toastify";
import { getSocket } from "../utils/socket.js";

export const useDashboardData = () => {
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [acceptedOffers, setAcceptedOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestsWithOffers, setRequestsWithOffers] = useState(new Set());

  // ─── Individual fetchers ───────────────────────────────────────────────────

  const fetchRequests = useCallback(async () => {
    try {
      const res = await api.get("/request/all");
      setRequests(res.data.requests);
    } catch (err) {
      console.error("Error fetching requests", err);
    }
  }, []);

  const fetchMyRequests = useCallback(async () => {
    try {
      const res = await api.get("/request/my-requests");
      setMyRequests(res.data.requests);
    } catch (err) {
      console.error("Error fetching my requests", err);
    }
  }, []);

  const fetchMyOffers = useCallback(async () => {
    try {
      const res = await api.get("/offer/my-offers");
      console.log(
        "Trace: API response for my-offers:",
        res.data.offers?.length,
        res.data.offers
      );
      setMyOffers(res.data.offers);

      const offeredRequestIds = new Set(
        res.data.offers.map((offer) => offer.bloodRequest?._id).filter(Boolean)
      );
      setRequestsWithOffers(offeredRequestIds);
    } catch (err) {
      console.error("Error fetching my offers", err);
    }
  }, []);

  const fetchAcceptedOffers = useCallback(async () => {
    try {
      const res = await api.get("/offer/accepted");
      setAcceptedOffers(res.data.acceptedOffers);
    } catch (err) {
      console.error("Error fetching accepted offers", err);
    }
  }, []);

  // ─── Full refresh ──────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchRequests(),
        fetchMyRequests(),
        fetchMyOffers(),
        fetchAcceptedOffers(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchRequests, fetchMyRequests, fetchMyOffers, fetchAcceptedOffers]);

  // ─── Socket.IO real-time listeners ────────────────────────────────────────

  useEffect(() => {
    const socket = getSocket();

    // A new blood request was created by anyone — update the browse list
    socket.on("request:created", (newRequest) => {
      console.log("📡 socket: request:created", newRequest._id);
      setRequests((prev) => {
        // Avoid duplicates
        if (prev.some((r) => r._id === newRequest._id)) return prev;
        return [newRequest, ...prev];
      });
    });

    // MY new request was created — add it to myRequests immediately
    socket.on("my-request:created", (newRequest) => {
      console.log("📡 socket: my-request:created", newRequest._id);
      setMyRequests((prev) => {
        if (prev.some((r) => r._id === newRequest._id)) return prev;
        return [newRequest, ...prev];
      });
    });

    // Someone sent an offer on one of my requests — refresh my-requests so the
    // pending offer shows up inside the request card
    socket.on("request:offer-received", ({ requestId }) => {
      console.log("📡 socket: request:offer-received for", requestId);
      fetchMyRequests();
    });

    // An offer I sent was accepted — refresh accepted offers & my offers
    socket.on("offer:accepted", ({ offerId, requestId }) => {
      console.log("📡 socket: offer:accepted", offerId);
      // Update myOffers status optimistically
      setMyOffers((prev) =>
        prev.map((o) =>
          o._id === offerId ? { ...o, status: "accepted" } : o
        )
      );
      // Full refresh of accepted offers and my requests to get populated data
      fetchAcceptedOffers();
      fetchMyRequests();
      // Remove from browse list since it's now fulfilled
      setRequests((prev) => prev.filter((r) => r._id !== requestId));
    });

    // A request I made was fulfilled (I accepted someone's offer) — update myRequests
    socket.on("request:fulfilled", ({ requestId }) => {
      console.log("📡 socket: request:fulfilled", requestId);
      setMyRequests((prev) =>
        prev.map((r) =>
          r._id === requestId ? { ...r, fulfilled: true } : r
        )
      );
      // Remove from browse list
      setRequests((prev) => prev.filter((r) => r._id !== requestId));
      fetchAcceptedOffers();
    });

    return () => {
      socket.off("request:created");
      socket.off("my-request:created");
      socket.off("request:offer-received");
      socket.off("offer:accepted");
      socket.off("request:fulfilled");
    };
  }, [fetchMyRequests, fetchAcceptedOffers]);

  // ─── Action handlers ───────────────────────────────────────────────────────

  /**
   * Called after the SendOfferModal successfully POSTs to /offer/send.
   * `sentOffer` is the offer object returned by the server.
   */
  const handleOfferSent = useCallback(
    (sentOffer) => {
      // Optimistically add the offer's requestId to the "already offered" set
      if (sentOffer?.bloodRequest) {
        const reqId =
          typeof sentOffer.bloodRequest === "string"
            ? sentOffer.bloodRequest
            : sentOffer.bloodRequest._id;
        setRequestsWithOffers((prev) => new Set([...prev, reqId]));
      }
      // Refresh the data from server for consistency
      fetchMyOffers();
      fetchAcceptedOffers();
      fetchRequests();
    },
    [fetchMyOffers, fetchAcceptedOffers, fetchRequests]
  );

  /**
   * Called when a requester clicks "Accept Offer" on a pending offer card.
   */
  const handleAcceptOffer = useCallback(
    async (offerId) => {
      try {
        const res = await api.post(`/offer/accept/${offerId}`);
        const { bloodRequest: updatedRequest, offer: acceptedOffer } = res.data;

        // Optimistic update — mark the request as fulfilled in myRequests
        if (updatedRequest?._id) {
          setMyRequests((prev) =>
            prev.map((r) =>
              r._id === updatedRequest._id
                ? { ...r, fulfilled: true, acceptedOffer: offerId }
                : r
            )
          );
          // Remove from browse list
          setRequests((prev) =>
            prev.filter((r) => r._id !== updatedRequest._id)
          );
        }

        // Refresh accepted offers from server (to get fully populated object)
        await fetchAcceptedOffers();
        // Also refresh myRequests to get the latest server state
        fetchMyRequests();

        toast.success(
          "🎉 Offer accepted successfully! The donor has been notified and will contact you soon."
        );
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to accept offer");
        // Revert by doing a fresh fetch
        fetchMyRequests();
        fetchAcceptedOffers();
      }
    },
    [fetchAcceptedOffers, fetchMyRequests]
  );

  return {
    requests,
    myRequests,
    myOffers,
    acceptedOffers,
    loading,
    requestsWithOffers,
    fetchData,
    fetchRequests,
    fetchMyRequests,
    fetchMyOffers,
    fetchAcceptedOffers,
    handleOfferSent,
    handleAcceptOffer,
    // Expose setters for components that want to push optimistic updates
    setRequests,
    setMyRequests,
    setMyOffers,
    setAcceptedOffers,
  };
};
