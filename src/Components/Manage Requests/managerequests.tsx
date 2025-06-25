import React, { useState, useEffect } from "react";
import { HelpRequest } from "../../schemas/requests";
import ReviewRequestMap from "./ReviewRequestMap";
import { apiSocket, apiSocketAuthUserId } from "../../api/apiController";
import apiController from "../../api/apiController";

export default function ManageRequests() {
  const [pendingRequests, setPendingRequests] = useState<HelpRequest[]>([]);
  const [allRequests, setAllRequests] = useState<HelpRequest[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(
    null
  );
  const [count, setCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [reviewTimers, setReviewTimers] = useState<{ [id: string]: number }>(
    {}
  );
  const [reviewDisabled, setReviewDisabled] = useState<{
    [id: string]: boolean;
  }>({});

  // Fetch pending and all emergencies from API on mount
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const [pendingRes, allRes] = await Promise.all([
          apiController.get("/emergency/pending"),
          apiController.get("/emergency/all"),
        ]);
        console.log("Pending:", pendingRes.data);
        console.log("All:", allRes.data);

        setPendingRequests(
          (pendingRes.data.data || []).map(
            (item: {
              id: string;
              reporter: { firstName: string; lastName: string };
              ambulance: {
                driver: { name: string; id: string; phone: string };
                type: string;
              } | null;
              reportLatitude: number;
              reportLongitude: number;
              requestReceivedAt: string;
              locationName: string;
              ApprovalCounterExpiredAt: string | null;
              distance: string;
            }) =>
              ({
                ...item,
                id: item.id, // ensure id exists
                patient:
                  `${item.reporter?.firstName} ${item?.reporter?.lastName}` ||
                  "Unknown",
                driver: item.ambulance?.driver?.name || "Unknown",
                driverId: item.ambulance?.driver?.id || "Unknown",
                driverContact: item.ambulance?.driver?.phone || "Unknown",
                lat: item.reportLatitude,
                lng: item.reportLongitude,
                reportedAt: new Date(item.requestReceivedAt),
                location: item.locationName || "Unknown",
                type: item.ambulance?.type || "Unknown",
                approvalCounterExpiresAt: new Date(
                  item?.ApprovalCounterExpiredAt || 0
                ),
                distance: item.distance || "Unknown",
                status: "Pending", // ensure status exists
              } as HelpRequest)
          )
        );

        setAllRequests(
          allRes.data.data?.map(
            (item: {
              id: string;
              locationName: string;
              reporter: { firstName: string; lastName: string };
              ambulance: {
                type: string;
                driver: { name: string; id: number; phone: string };
              };
              distance: string;
              reportLatitude: number;
              reportLongitude: number;
              requestReceivedAt: string | number | Date;
              ApprovalCounterExpiredAt: string;
              status: string;
            }) =>
              ({
                id: item.id,
                location: item.locationName || "Unknown",
                patient:
                  `${item.reporter?.firstName} ${item?.reporter?.lastName}` ||
                  "Unknown",
                type: item.ambulance?.type || "Unknown",
                driver: item.ambulance?.driver?.name || "Unknown",
                driverId: item.ambulance?.driver?.id || "Unknown",
                driverContact: item.ambulance?.driver?.phone || "Unknown",
                distance: item.distance || "Unknown",
                lat: item.reportLatitude,
                lng: item.reportLongitude,
                reportedAt: new Date(item.requestReceivedAt),
                approvalCounterExpiresAt: new Date(
                  item?.ApprovalCounterExpiredAt || 0
                ),
                status: item.status || "Pending", // ensure status exists
              } as HelpRequest)
          ) || []
        );
      } catch (error) {
        console.error("Error fetching emergencies:", error);
      }
    };
    fetchRequests();
  }, []);

  useEffect(() => {
    const handleNewRequest = (newRequest: any) => {
      console.log("New request received:", newRequest);
      const formattedRequest: HelpRequest = {
        id: newRequest?.emergency?.id,
        location: newRequest?.emergency?.locationName,
        patient: newRequest?.emergency?.reporter?.firstName,
        ambulanceId: newRequest?.emergency?.ambulance?.id,
        type: newRequest?.emergency?.ambulance?.type,
        driver: newRequest?.emergency?.ambulance?.driver?.name,
        driverId: newRequest?.emergency?.ambulance?.driver?.id,
        driverContact: newRequest?.emergency?.ambulance?.driver?.phone,
        distance: newRequest?.emergency?.distance,
        lat: newRequest?.emergency?.reportLatitude,
        lng: newRequest?.emergency?.reportLongitude,
        reportedAt: new Date(newRequest?.emergency?.requestReceivedAt),
        approvalCounterExpiresAt: new Date(
          newRequest?.emergency?.requestApprovalCounterExpiresAt
        ),
        status: "Pending",
      };
      setPendingRequests((prev) => [...prev, formattedRequest]);
      setAllRequests((prev) => [...prev, formattedRequest]);
    };

    const handleRequestPickedUp = (requestId: string) => {
      setPendingRequests((prev) => prev.filter((req) => req.id !== requestId));
      setAllRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: "Under Review" } : req
        )
      );
    };

    const socket = apiSocket.connect();
    socket.on("emergencyReported", handleNewRequest);
    socket.on("newAmbulanceSuggestion", handleNewRequest);
    socket.on("requestPickedUp", handleRequestPickedUp);

    return () => {
      socket.off("emergencyReported", handleNewRequest);
      socket.off("newAmbulanceSuggestion", handleNewRequest);
      socket.off("requestPickedUp", handleRequestPickedUp);
      socket.disconnect?.(); // Only if your socket supports disconnect
    };
  }, []);

  useEffect(() => {
    setCount(pendingRequests.filter((req) => req.status === "Pending").length);
  }, [pendingRequests]);

  useEffect(() => {
    const timers: { [id: string]: number } = {};
    const disabled: { [id: string]: boolean } = {};

    pendingRequests.forEach((req) => {
      if (req.status === "Pending") {
        if (
          req.approvalCounterExpiresAt instanceof Date &&
          !isNaN(req.approvalCounterExpiresAt.getTime())
        ) {
          const now = new Date();
          const diff = Math.max(
            0,
            Math.floor(
              (req.approvalCounterExpiresAt.getTime() - now.getTime()) / 1000
            )
          );
          timers[req.id] = diff;
          disabled[req.id] = diff <= 0;
        } else {
          timers[req.id] = 0;
          disabled[req.id] = true;
        }
      }
    });

    setReviewTimers(timers);
    setReviewDisabled(disabled);
  }, [pendingRequests]);

  useEffect(() => {
    const interval = setInterval(() => {
      setReviewTimers((prev) => {
        const updated: { [id: string]: number } = {};
        Object.entries(prev).forEach(([id, time]) => {
          updated[id] = Math.max(0, time - 1);
        });
        return updated;
      });
      setReviewDisabled((prev) => {
        const updated: { [id: string]: boolean } = {};
        Object.entries(reviewTimers).forEach(([id, time]) => {
          updated[id] = time <= 1;
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [reviewTimers]);

  const handleAccept = (id: number) => {
    setPendingRequests((prevRequests) =>
      prevRequests.map((req) =>
        req.id === id ? { ...req, status: "Completed" } : req
      )
    );
  };

  const handleReview = (req: HelpRequest) => {
    setSelectedRequest(req);
    setShowReview(true);

    // Emit socket event for review using existing connection
    const socket = apiSocket.connect();
    socket.emit("requestUnderReview", {
      requestId: req.id,
      reviewedAt: new Date().toISOString(),
    });

    console.log("Review event emitted for request:", req.id);
  };

  const filteredAllRequests = allRequests.filter(
    (req) =>
      req.patient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4">
      <h1>Manage Requests</h1>
      <hr />
      <div className="container mt-4">
        <h2 className="text-center mb-3">🚑 Pending Requests</h2>
        <div className="table-responsive mx-auto" style={{ maxWidth: "800px" }}>
          <table className="table table-bordered table-striped shadow-sm rounded">
            <thead className="table-dark text-center">
              <tr>
                <th>Reporter Name</th>
                <th>Suggested Ambulance</th>
                <th>Location</th>
                <th>Distance</th>
                {/* <th>Status</th> */}
                <th>Choose</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.filter((req) => req.status === "Pending")
                .length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="text-center text-muted py-4">
                      <span style={{ fontSize: "2rem" }}>🟢</span>
                      <div>No pending requests at the moment.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                pendingRequests
                  .filter((req) => req.status === "Pending")
                  .slice(0, 5)
                  .map((req) => (
                    <tr key={req?.id} className="align-middle text-center">
                      <td className="fw-bold">{req?.patient}</td>
                      <td className="text-muted">
                        {req?.type
                          .split("_")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() +
                              word.slice(1).toLowerCase()
                          )
                          .join(" ") + " "}
                        {req?.driver && req?.driverContact && (
                          <>
                            {" - "}
                            <a href={`tel:${req?.driverContact}`}>
                              {req?.driver} - {req?.driverContact}
                            </a>
                          </>
                        )}
                      </td>
                      <td className="text-muted">{req?.location}</td>
                      <td>{req?.distance}</td>
                      {/* <td
                      className={`fw-bold ${
                        req.status === "Pending"
                          ? "text-warning"
                          : req.status === "Completed"
                          ? "text-success"
                          : "text-primary"
                      }`}
                    >
                      {req.status === "Pending"
                        ? "⏳ Pending"
                        : req.status === "Completed"
                        ? "✅ Completed"
                        : req.status}
                    </td> */}

                      <td>
                        {req?.status === "Pending" ? (
                          <div style={{ position: "relative", width: "110px" }}>
                            <button
                              type="button"
                              className={`btn fw-bold px-3 py-1 shadow-sm me-2 ${
                                reviewDisabled[req.id]
                                  ? "btn-secondary"
                                  : "btn-primary"
                              }`}
                              onClick={() => {
                                handleReview(req);
                                setPendingRequests((prev) =>
                                  prev.map((r) =>
                                    r.id === req.id
                                      ? { ...r, status: "Completed" }
                                      : r
                                  )
                                );
                              }}
                              disabled={reviewDisabled[req.id]}
                              style={{
                                width: "100%",
                                position: "relative",
                                zIndex: 1,
                                cursor: reviewDisabled[req.id]
                                  ? "not-allowed"
                                  : "pointer",
                                opacity: reviewDisabled[req.id] ? 0.7 : 1,
                              }}
                            >
                              📝 Review
                              {/* No timer text here */}
                            </button>
                            {/* Progress bar at bottom */}
                            {typeof reviewTimers[req.id] === "number" && (
                              <div
                                style={{
                                  position: "absolute",
                                  left: 0,
                                  bottom: 0,
                                  height: "4px",
                                  width: `${
                                    req.approvalCounterExpiresAt instanceof
                                      Date && req.reportedAt instanceof Date
                                      ? (reviewTimers[req.id] /
                                          Math.max(
                                            1,
                                            Math.floor(
                                              (req.approvalCounterExpiresAt.getTime() -
                                                req.reportedAt.getTime()) /
                                                1000
                                            )
                                          )) *
                                        100
                                      : 0
                                  }%`,
                                  background: reviewDisabled[req.id]
                                    ? "#ccc"
                                    : "#0d6efd",
                                  transition: "width 1s linear",
                                  borderRadius: "0 0 4px 4px",
                                  zIndex: 2,
                                }}
                              />
                            )}
                          </div>
                        ) : (
                          <span className="text-success fw-bold">
                            ✔ Accepted
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <h2 className="text-center mt-4">🚑 All Requests </h2>

      <div className="table-responsive mx-auto" style={{ maxWidth: "800px" }}>
        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Search by name, type, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <table className="table table-bordered table-striped shadow-sm rounded">
          <thead className="table-dark">
            <tr>
              <th>Reporter Name</th>
              <th>Ambulance Type</th>
              <th>City</th>
              <th>Distance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredAllRequests.map((req) => (
              <tr key={req.id} className="align-middle text-center">
                <td className="fw-bold">{req.patient}</td>
                <td className="text-muted">
                  {req?.type
                    .split("_")
                    .map(
                      (word) =>
                        word.charAt(0).toUpperCase() +
                        word.slice(1).toLowerCase()
                    )
                    .join(" ") + " "}
                </td>
                <td className="text-muted">{req.location}</td>
                <td>{req.distance ? req.distance : "-"}</td>
                <td
                  className={`fw-bold ${
                    req.status === "Pending" ? "text-warning" : "text-success"
                  }`}
                >
                  {req.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Review Popup */}
      {showReview && selectedRequest && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            background: "rgba(0,0,0,0.5)",
            zIndex: 2000,
          }}
        >
          <div
            className="bg-white rounded shadow p-3"
            style={{ minWidth: 350, minHeight: 400, maxWidth: 600 }}
          >
            <h5 className="mb-3">Request Review</h5>
            <ReviewRequestMap
              request={selectedRequest}
              showPopup={setShowReview}
            />
            {/* <div className="text-end mt-3">
              <button
                className="btn btn-secondary"
                onClick={() => setShowReview(false)}
              >
                Close
              </button>
            </div> */}
          </div>
        </div>
      )}
    </div>
  );
}
