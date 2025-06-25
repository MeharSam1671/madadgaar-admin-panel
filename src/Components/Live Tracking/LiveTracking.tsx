import React, { useEffect, useRef, useState } from "react"
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useJsApiLoader,
} from "@react-google-maps/api";
import apiController, { apiSocket } from "../../api/apiController";
import { Ambulance } from "../../schemas/ambulance";
import { LocationUpdateSocketResponse } from "../../schemas/sockets";

const mapContainerStyle = { width: "100%", height: "500px" }; // Fixed height
const defaultCenter = { lat: 32.20464, lng: 74.177438 };

// Helper function to get appropriate marker icon based on vehicle type and status
const getVehicleIcon = (
  type: string,
  status: string,
  isOnline: boolean
): google.maps.Icon => {
  // Get color based on status
  let colorName;
  let colorShortName; // Short name for color
  if (isOnline) {
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

// Legend component to explain map markers
const MapLegend = () => {
  return (
    <div
      className="map-legend card position-absolute"
      style={{
        bottom: "20px",
        left: "20px",
        maxWidth: "250px",
        zIndex: 1000,
        opacity: 0.9,
      }}
    >
      <div className="card-header py-1 px-2 bg-light">
        <h6 className="mb-0">Map Legend</h6>
      </div>
      <div className="card-body p-2">
        <div className="mb-2">
          <h6 className="mb-1 fw-bold">Vehicle Types:</h6>
          <div className="d-flex align-items-center my-1">
            <img
              src="https://maps.google.com/mapfiles/ms/icons/green.png"
              alt="Ambulance"
              width="20"
            />
            <small className="ms-2">Ambulance</small>
          </div>
          <div className="d-flex align-items-center my-1">
            <img
              src="https://maps.google.com/mapfiles/ms/icons/green-dot.png"
              alt="First Responder"
              width="20"
            />
            <small className="ms-2">First Responder (Bike)</small>
          </div>
          <div className="d-flex align-items-center my-1">
            <img
              src="https://maps.google.com/mapfiles/kml/pushpin/grn-pushpin.png"
              alt="Fire Truck"
              width="20"
            />
            <small className="ms-2">Fire Truck</small>
          </div>
        </div>

        <div>
          <h6 className="mb-1 fw-bold">Status Colors:</h6>
          <div className="d-flex align-items-center my-1">
            <div
              style={{
                width: "16px",
                height: "16px",
                backgroundColor: "#4CAF50",
                borderRadius: "50%",
              }}
            ></div>
            <small className="ms-2">Available</small>
          </div>
          <div className="d-flex align-items-center my-1">
            <div
              style={{
                width: "16px",
                height: "16px",
                backgroundColor: "#FFC107",
                borderRadius: "50%",
              }}
            ></div>
            <small className="ms-2">Temporarily Unavailable</small>
          </div>
          <div className="d-flex align-items-center my-1">
            <div
              style={{
                width: "16px",
                height: "16px",
                backgroundColor: "#2196F3",
                borderRadius: "50%",
              }}
            ></div>
            <small className="ms-2">Dispatched</small>
          </div>
          <div className="d-flex align-items-center my-1">
            <div
              style={{
                width: "16px",
                height: "16px",
                backgroundColor: "#FF9800",
                borderRadius: "50%",
              }}
            ></div>
            <small className="ms-2">Under Maintenance</small>
          </div>
          <div className="d-flex align-items-center my-1">
            <div
              style={{
                width: "16px",
                height: "16px",
                backgroundColor: "#F44336",
                borderRadius: "50%",
              }}
            ></div>
            <small className="ms-2">Out of Service</small>
          </div>
        </div>
      </div>
    </div>
  );
};

const LiveTracking = () => {
  const mapRef = useRef<google.maps.Map | null>(null);

  const [ambulanceLocations, setAmbulanceLocations] = useState<Ambulance[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedAmbulance, setSelectedAmbulance] = useState<Ambulance | null>(
    null
  );

  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env?.VITE_MAPS_API_KEY || "",
  });

  // Handle Google Maps load error
  useEffect(() => {
    if (loadError) {
      console.error("Google Maps API failed to load:", loadError);
      setApiError("Failed to load Google Maps. Please check your API key.");
    }
  }, [loadError]);

  // Fetch ambulance locations from backend
  const fetchAmbulanceLocations = async () => {
    try {
      setIsLoading(true);
      setApiError(null);
      const response = await apiController.get("/admin/vehicles?limit=100");
      const data = response.data;
      const { vehicles } = data;
      if (Array.isArray(vehicles)) {
        // console.log("Fetched ambulance locations");
        setAmbulanceLocations(
          vehicles?.map(
            (vehicle: any) =>
              ({
                id: vehicle.id,
                plateNumber: vehicle.plateNumber,
                model: vehicle.model,
                modelYear: vehicle.modelYear,
                type: vehicle.type,
                status: vehicle.status,
                capacity: vehicle.capacity,
                lat: vehicle.lat,
                lang: vehicle.lang,
                // assignedTo: vehicle.assignedTo,
                driver: vehicle.driver,
              } as Ambulance)
          )
        );
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

  useEffect(() => {
    // console.log("Ambulance locations updated:", ambulanceLocations);
    console.log("API Error:", apiError);
    // console.log("Is Loading:", isLoading);
  }, [ambulanceLocations, apiError, isLoading]);

  useEffect(() => {
    fetchAmbulanceLocations();
  }, []);

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
              // updatedAt: Date(newLocationData.timestamp),
            };
          }
          return vehicle;
        })
      );
      console.log("Updated vehicle GPS:", driverId);
    };

    const updateMatchingVehicle = (driverId: number, isOnline: boolean) => {
      setAmbulanceLocations((prev) =>
        prev.map((vehicle) => {
          if (vehicle?.driver?.id === driverId) {
            return {
              ...vehicle,
              driver: { ...vehicle.driver, isOnline: isOnline },
            };
          }
          return vehicle;
        })
      );
      console.log("Updated vehicle status:", driverId, isOnline);
    };

    const handleSocketError = (error: Error) => {
      setApiError(`Socket error: ${error.message}`);
    };

    const handleSocketConnect = (payload: { userId: number }) => {
      console.log("User connected:", payload);
      const { userId } = payload;
      updateMatchingVehicle(userId, true);
    };

    const handleSocketDisconnect = (payload: { userId: number }) => {
      console.log("User disconnected:", payload);
      const { userId } = payload;
      updateMatchingVehicle(userId, false);
    };

    const handleSocketLocationUpdate = (
      updatedLocation: LocationUpdateSocketResponse
    ) => {
      updateVehicleLocation(updatedLocation.driverId, updatedLocation);
    };

    const socket = apiSocket.connect();
    socket.on("error", handleSocketError);
    socket.on("driverLocationUpdate", handleSocketLocationUpdate);
    socket.on("connected", handleSocketConnect);
    socket.on("disconnected", handleSocketDisconnect);

    return () => {
      socket.off("connected", handleSocketConnect);
      socket.off("disconnected", handleSocketDisconnect);
      socket.off("error", handleSocketError);
      socket.off("driverLocationUpdate", handleSocketLocationUpdate);
      socket.disconnect();
    };
  }, [isLoading]);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      {apiError && (
        <div className="alert alert-danger m-2">
          {apiError}
          <button
            className="btn btn-sm btn-outline-danger ms-3"
            onClick={fetchAmbulanceLocations}
          >
            Retry
          </button>
        </div>
      )}

      {isLoading && (
        <div className="text-center my-2">
          <span
            className="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          ></span>
          Loading ambulance locations...
        </div>
      )}

      {!isLoaded ? (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "400px" }}
        >
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading map...</span>
          </div>
        </div>
      ) : (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={defaultCenter}
          zoom={15}
          options={{
            mapTypeControl: false,
            mapTypeControlOptions: {
              mapTypeIds: ["hybrid"],
            },
          }}
          onLoad={(map) => {
            mapRef.current = map;
            console.log("Google Maps loaded successfully");
          }}
        >
          {Array.isArray(ambulanceLocations) &&
            ambulanceLocations.map((ambulance) => {
              return (
                <Marker
                  key={ambulance.id}
                  position={{ lat: ambulance.lat, lng: ambulance.lang }}
                  icon={getVehicleIcon(
                    ambulance.type,
                    ambulance.status,
                    ambulance?.driver?.isOnline
                  )}
                  title={`${ambulance.type}: ${ambulance.plateNumber} (${ambulance.status})`}
                  onClick={() => setSelectedAmbulance(ambulance)}
                />
              );
            })}

          {selectedAmbulance && (
            <InfoWindow
              position={{
                lat: selectedAmbulance.lat,
                lng: selectedAmbulance.lang,
              }}
              onCloseClick={() => setSelectedAmbulance(null)}
            >
              <div className="ambulance-info-card">
                <h5 className="mb-2">Ambulance Details</h5>
                <p>
                  <strong>ID:</strong> {selectedAmbulance.id}
                </p>
                <p>
                  <strong>Plate Number:</strong> {selectedAmbulance.plateNumber}
                </p>
                <p>
                  <strong>Model:</strong> {selectedAmbulance.model} (
                  {selectedAmbulance.modelYear})
                </p>
                <p>
                  <strong>Type:</strong> {selectedAmbulance.type}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`badge ${
                      selectedAmbulance.status === "Available"
                        ? "bg-success"
                        : "bg-warning"
                    }`}
                  >
                    {selectedAmbulance.status}
                  </span>
                </p>
                <p>
                  <strong>Capacity:</strong> {selectedAmbulance.capacity}
                </p>
                <p>
                  <strong>Driver:</strong>{" "}
                  {selectedAmbulance.driver?.name || "Unassigned"}
                </p>
                <p>
                  <strong>Contact:</strong>{" "}
                  {selectedAmbulance.driver?.phone || "N/A"}
                </p>
              </div>
            </InfoWindow>
          )}

          <MapLegend />
        </GoogleMap>
      )}
    </div>
  );
};

export default LiveTracking
