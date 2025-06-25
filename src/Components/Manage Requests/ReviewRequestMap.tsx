import React, { useCallback, useEffect, useState, useRef } from "react";
import { HelpRequest } from "../../schemas/requests";
import apiController, { apiSocket } from "../../api/apiController";
import { Ambulance } from "../../schemas/ambulance";
import { LocationUpdateSocketResponse } from "../../schemas/sockets";

// Function to calculate distance between two points in kilometers using the Haversine formula
const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

// Function to get appropriate marker icon based on vehicle type and status
const getVehicleIcon = (
  type: string,
  status: string,
  isHighlighted: boolean = false,
  isOnline: boolean = false
): google.maps.Icon => {
  // Get color based on status or if it's highlighted
  let colorName;
  let colorShortName; // Short name for color

  if (isHighlighted) {
    colorName = "green"; // Highlighted ambulance (the one in the request)
    colorShortName = "grn";
  } else if (isOnline) {
    colorName = "pink";
    colorShortName = "pink";
  } else {
    switch (status.toUpperCase()) {
      case "AVAILABLE":
        colorName = "green"; // Available
        colorShortName = "grn";
        break;
      case "UNAVAILABLE_TEMPORARILY":
        colorName = "yellow"; // Temporarily unavailable
        colorShortName = "ylw";
        break;
      case "DISPATCHED":
        colorName = "blue"; // On service/dispatched
        colorShortName = "blue";
        break;
      case "UNDER_MAINTENANCE":
        colorName = "orange"; // Under maintenance
        colorShortName = "org";
        break;
      case "OUT_OF_SERVICE":
        colorName = "red"; // Out of service
        colorShortName = "red";
        break;
      default:
        colorName = "purple"; // Unknown status
        colorShortName = "pur";
    }
  }

  // Get icon style based on vehicle type
  let iconUrl;
  switch (type.toUpperCase()) {
    case "FIRST_RESPONDER":
      // Bike/motorcycle
      iconUrl = `https://maps.google.com/mapfiles/ms/icons/${colorName}-dot.png`;
      break;
    case "FIRE_TRUCK":
      // Fire truck
      iconUrl = `https://maps.google.com/mapfiles/ms/icons/${colorShortName}-pushpin.png`;
      break;
    case "AMBULANCE":
      // Standard ambulance
      iconUrl = `https://maps.google.com/mapfiles/ms/icons/${colorName}.png`;
      break;
    case "OTHER":
    default:
      // Default for other types
      iconUrl = `https://maps.google.com/mapfiles/ms/icons/${colorName}-dot.png`;
  }

  return { url: iconUrl };
};

const defaultLatLng = { lat: 32.1877, lng: 74.1945 };

const ReviewRequestMap = ({
  request,
  showPopup,
}: {
  request: HelpRequest;
  showPopup: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [ambulanceLocations, setAmbulanceLocations] = useState<Ambulance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Get reporter location
  const reporterLatLng =
    request?.lat && request?.lng
      ? { lat: Number(request.lat), lng: Number(request.lng) }
      : defaultLatLng;

  // Fetch ambulance locations from backend
  const fetchAmbulanceLocations = async () => {
    try {
      setIsLoading(true);
      setApiError(null);
      const response = await apiController.get("/admin/vehicles?limit=100");
      const data = response.data;
      const { vehicles } = data;
      if (Array.isArray(vehicles)) {
        setAmbulanceLocations(vehicles);
      } else if (data && typeof data === "object") {
        const locationsArray = data.ambulances || data.locations || [];
        setAmbulanceLocations(
          Array.isArray(locationsArray) ? locationsArray : []
        );
      } else {
        setAmbulanceLocations([]);
        setApiError("Received unexpected data format from server");
      }
    } catch (error) {
      setAmbulanceLocations([]);
      setApiError(
        "Failed to fetch ambulance locations. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch initial ambulance data
  useEffect(() => {
    fetchAmbulanceLocations();
  }, []);

  // Listen for real-time location updates
  useEffect(() => {
    if (isLoading) return;

    const updateVehicleLocation = (
      driverId: number,
      newLocationData: { lat: number; lang: number; timestamp: string }
    ) => {
      setAmbulanceLocations((prev) =>
        prev.map((vehicle) => {
          if (vehicle?.driver?.id === driverId) {
            return {
              ...vehicle,
              lat: newLocationData.lat,
              lang: newLocationData.lang,
            };
          }
          return vehicle;
        })
      );
    };

    const socket = apiSocket.connect();
    socket.on("driverLocationUpdate", (data: LocationUpdateSocketResponse) => {
      updateVehicleLocation(data.driverId, data);
    });

    return () => {
      socket.off("driverLocationUpdate");
      socket.disconnect?.();
    };
  }, [isLoading]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || isLoading) return;

    // Load Google Maps API script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${
      import.meta.env.VITE_MAPS_API_KEY
    }&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log("Google Maps API loaded");
      if (!mapRef.current) return;

      // Create map
      const googleMap = new google.maps.Map(mapRef.current, {
        center: reporterLatLng,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      setMap(googleMap);

      // Add reporter marker (red)
      const reporterMarker = new google.maps.Marker({
        position: reporterLatLng,
        map: googleMap,
        title: "Emergency Location",
        icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
      });

      // Filter and sort ambulances by type and distance
      let filteredAmbulances = ambulanceLocations
        // First filter by type if specified in the request
        .filter((ambulance) => {
          // If request has a specific type, filter by it - otherwise include all
          return (
            !request?.type ||
            ambulance.type.toUpperCase() === request.type.toUpperCase()
          );
        })
        // Then add distance property to each ambulance
        .map((ambulance) => {
          const distance = calculateDistance(
            reporterLatLng.lat,
            reporterLatLng.lng,
            ambulance.lat,
            ambulance.lang
          );
          return { ...ambulance, calculatedDistance: distance };
        })
        // Sort by distance from the emergency location
        .sort((a, b) => a.calculatedDistance - b.calculatedDistance);

      // Get ambulances within 5km radius
      let ambulancesToShow = filteredAmbulances.filter(
        (amb) => amb.calculatedDistance <= 5
      );

      // If less than 5 ambulances within 5km, take the 5 closest
      if (ambulancesToShow.length < 5) {
        ambulancesToShow = filteredAmbulances.slice(0, 5);
      }

      // Add ambulance markers
      const ambulanceMarkers = ambulancesToShow.map((ambulance) => {
        // Determine if this ambulance should be highlighted - either it matches the driver ID
        // or it matches the requested vehicle type
        const isHighlighted = Boolean(
          request?.driverId === ambulance.driver?.id ||
            (request?.type &&
              ambulance.type.toUpperCase() === request.type.toUpperCase())
        );

        return new google.maps.Marker({
          position: { lat: ambulance.lat, lng: ambulance.lang },
          map: googleMap,
          title: `${ambulance.type}: ${ambulance.plateNumber} (${
            ambulance.status
          }) - ${ambulance.calculatedDistance.toFixed(2)}km away`,
          icon: getVehicleIcon(
            ambulance.type,
            ambulance.status,
            isHighlighted,
            ambulance?.driver?.isOnline
          ),
        });
      });

      setMarkers([reporterMarker, ...ambulanceMarkers]);

      // Fit bounds to include the reporter and filtered ambulances
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(reporterLatLng);

      // Add each ambulance to bounds
      ambulancesToShow.forEach((amb) => {
        bounds.extend({ lat: amb.lat, lng: amb.lang });
      });

      googleMap.fitBounds(bounds);

      // Check if we need to restrict to 5km radius
      if (ambulancesToShow.length >= 5) {
        // Add a circle to show the 5km radius
        new google.maps.Circle({
          strokeColor: "#FF0000",
          strokeOpacity: 0.8,
          strokeWeight: 1,
          fillColor: "#FF0000",
          fillOpacity: 0.1,
          map: googleMap,
          center: reporterLatLng,
          radius: 5000, // 5km in meters
          zIndex: -1, // Put it behind markers
        });
      }
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      markers.forEach((marker) => marker.setMap(null));
      document.head.removeChild(script);
    };
  }, [ambulanceLocations, isLoading]);

  return (
    <div className="map-container">
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "300px",
          border: "1px solid #ccc",
          borderRadius: "4px",
          position: "relative",
        }}
      >
        {/* Loading overlay */}
        {isLoading && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(255,255,255,0.7)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 10,
            }}
          >
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}

        {apiError && (
          <div
            className="alert alert-danger m-2"
            style={{
              position: "absolute",
              top: 10,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
            }}
          >
            {apiError}
            <button
              className="btn btn-sm btn-outline-danger ms-3"
              onClick={fetchAmbulanceLocations}
            >
              Retry
            </button>
          </div>
        )}
      </div>

      <div className="mt-2 small text-muted">
        {!isLoading && (
          <div>
            <p className="mb-1">
              <strong>Showing:</strong>{" "}
              {
                ambulanceLocations.filter((amb) => {
                  const distance = calculateDistance(
                    reporterLatLng.lat,
                    reporterLatLng.lng,
                    amb.lat,
                    amb.lang
                  );
                  return distance <= 5;
                }).length
              }{" "}
              ambulance
              {ambulanceLocations.filter((amb) => {
                const distance = calculateDistance(
                  reporterLatLng.lat,
                  reporterLatLng.lng,
                  amb.lat,
                  amb.lang
                );
                return distance <= 5;
              }).length !== 1
                ? "s"
                : ""}{" "}
              within 5km
            </p>
            {request?.type && (
              <p className="mb-0">
                <strong>Filtered by type:</strong> {request.type}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="d-flex justify-content-end mt-3">
        <button
          className="btn btn-outline-secondary me-2"
          onClick={() => console.log("Edit clicked")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-pencil-square me-1"
            viewBox="0 0 16 16"
          >
            <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
            <path
              fillRule="evenodd"
              d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"
            />
          </svg>
          Edit
        </button>
        <button
          className="btn btn-primary"
          onClick={() => {
            apiSocket.emit("suggestionApproved", {
              emergencyId: request.id,
              driverId: request.driverId,
              approvedAt: new Date().toISOString(),
            });
            console.log("Accept clicked");
            console.log("Request accepted:", request.id);
            console.log("Driver ID:", request.driverId);
            showPopup(false);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-check-circle me-1"
            viewBox="0 0 16 16"
          >
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
            <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05" />
          </svg>
          Accept
        </button>
      </div>
    </div>
  );
};

export default ReviewRequestMap;



