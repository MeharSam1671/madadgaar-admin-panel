import React, { useEffect, useRef, useState } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const mapContainerStyle = { width: "100%", height: "500px" };
const defaultCenter = { lat: 32.204640, lng: 74.177438 }; 

const LiveTracking = () => {
    const mapRef = useRef(null);
    const [location, setLocation] = useState(null);

    useEffect(() => {
        if (navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const newLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    setLocation(newLocation);

                    if (mapRef.current) {
                        mapRef.current.panTo(newLocation);
                    }
                },
                (error) => {
                    console.error("Error getting location: ", error);
                },
                { enableHighAccuracy: true, maximumAge: 0 } 
            );

            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, []);

    return (
        <LoadScript googleMapsApiKey="AIzaSyBJFyPYOmsQVttUAXsj8Wa5qQ29oUcGJhg">
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={location || defaultCenter} 
                zoom={15}
                onLoad={(map) => {
                    mapRef.current = map;
                }}
            >
                {location && (
                    <Marker position={defaultCenter} ></Marker>
                )}
            </GoogleMap>
        </LoadScript>
    );
};

export default LiveTracking;
