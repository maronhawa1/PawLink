import { useEffect, useMemo, useState } from "react";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { Link } from "react-router-dom";
import {
  useGetReportsQuery,
  type AnimalReport,
  type ReportType,
} from "../api/reportsApi";
import { getErrorMessage } from "../api/getErrorMessage";
import "leaflet/dist/leaflet.css";
import "../styles/reports-map.css";

const DEFAULT_CENTER: LatLngExpression = [
  32.0853,
  34.7818,
];

const reportLabels: Record<ReportType, string> = {
  INJURED: "Injured",
  LOST: "Lost",
  FOUND: "Found",
  NEEDS_RESCUE: "Needs rescue",
};

const reportColors: Record<ReportType, string> = {
  INJURED: "#e94f4f",
  LOST: "#2878e3",
  FOUND: "#18966b",
  NEEDS_RESCUE: "#7b3fd1",
};

type MapPosition = {
  latitude: number;
  longitude: number;
};

const DEFAULT_RADIUS_KM = 10;

const RADIUS_OPTIONS = [2, 5, 10, 25, 50];

function calculateDistanceKm(
  from: MapPosition,
  to: MapPosition
): number {
  const earthRadiusKm = 6371;

  const toRadians = (degrees: number) =>
    (degrees * Math.PI) / 180;

  const latitudeDifference = toRadians(
    to.latitude - from.latitude
  );

  const longitudeDifference = toRadians(
    to.longitude - from.longitude
  );

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(longitudeDifference / 2) ** 2;

  const c =
    2 * Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadiusKm * c;
}

function MapController({
  position,
  userPosition,
  radiusKm,
}: {
  position: MapPosition | null;
  userPosition: MapPosition | null;
  radiusKm: number | "ALL";
}) {
  const map = useMap();

  useEffect(() => {
    if (!position) return;

    if (
      userPosition &&
      radiusKm !== "ALL" &&
      position.latitude === userPosition.latitude &&
      position.longitude === userPosition.longitude
    ) {
      const latitudeOffset = radiusKm / 111.32;

      const longitudeOffset =
        radiusKm /
        (111.32 * Math.cos((userPosition.latitude * Math.PI) / 180));

      const bounds: [[number, number], [number, number]] = [
        [
          userPosition.latitude - latitudeOffset,
          userPosition.longitude - longitudeOffset,
        ],
        [
          userPosition.latitude + latitudeOffset,
          userPosition.longitude + longitudeOffset,
        ],
      ];

      map.flyToBounds(bounds, {
        padding: [30, 30],
        duration: 1.2,
      });

      return;
    }

    map.flyTo(
      [position.latitude, position.longitude],
      16,
      { duration: 1.2 }
    );
  }, [map, position, userPosition, radiusKm]);

  return null;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ReportsMapPage() {
  const {
    data: reports = [],
    isLoading,
    error: loadError,
  } = useGetReportsQuery();

  const error = loadError
    ? getErrorMessage(loadError, "Unable to load reports")
    : "";

  const [selectedType, setSelectedType] = useState<
    ReportType | "ALL"
  >("ALL");

  const [userPosition, setUserPosition] =
    useState<MapPosition | null>(null);

  const [mapPosition, setMapPosition] =
    useState<MapPosition | null>(null);

  const [selectedReportId, setSelectedReportId] =
    useState<number | null>(null);

  const [radiusKm, setRadiusKm] = useState<number | "ALL">(
    DEFAULT_RADIUS_KM
  );

  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  const visibleReports = useMemo(() => {
    return reports
      .filter((report) => {
        const hasLocation =
          typeof report.latitude === "number" &&
          typeof report.longitude === "number";

        const matchesType =
          selectedType === "ALL" ||
          report.type === selectedType;

        if (!hasLocation || !matchesType) {
          return false;
        }

        // Show all matching reports if location is unavailable
        // or the user selected "All distances".
        if (!userPosition || radiusKm === "ALL") {
          return true;
        }

        const distance = calculateDistanceKm(userPosition, {
          latitude: report.latitude as number,
          longitude: report.longitude as number,
        });

        return distance <= radiusKm;
      })
      .sort((a, b) => {
        if (!userPosition) {
          return 0;
        }

        const distanceA = calculateDistanceKm(userPosition, {
          latitude: a.latitude as number,
          longitude: a.longitude as number,
        });

        const distanceB = calculateDistanceKm(userPosition, {
          latitude: b.latitude as number,
          longitude: b.longitude as number,
        });

        return distanceA - distanceB;
      });
  }, [reports, selectedType, userPosition, radiusKm]);

  function focusOnReport(report: AnimalReport) {
    if (
      typeof report.latitude !== "number" ||
      typeof report.longitude !== "number"
    ) {
      return;
    }

    setSelectedReportId(report.id);

    setMapPosition({
      latitude: report.latitude,
      longitude: report.longitude,
    });
  }

  function handleUseMyLocation() {
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError(
        "Location is not supported by this browser"
      );
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setUserPosition(currentPosition);
        setMapPosition(currentPosition);
        setSelectedReportId(null);
        setIsLocating(false);
      },
      (positionError) => {
        if (positionError.code === 1) {
          setLocationError(
            "Location permission was denied"
          );
        } else if (positionError.code === 2) {
          setLocationError(
            "Your location is currently unavailable"
          );
        } else {
          setLocationError(
            "Finding your location took too long"
          );
        }

        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }

  useEffect(() => {
    handleUseMyLocation();
  }, []);

  return (
    <main className="reports-map-page">
      <section className="reports-map-heading">
        <div>
          <h1>Animal reports map</h1>
          <p>
            Find animals that need help in your area.
          </p>
        </div>
      </section>

     <div className="reports-controls"> 
      <section className="reports-toolbar">
        <button
          className="location-button"
          type="button"
          onClick={handleUseMyLocation}
          disabled={isLocating}
        >
          {isLocating
            ? "Finding location..."
            : userPosition
              ? "Recenter on me"
              : "Use my location"}
        </button>

        <div
          className="distance-options"
          role="group"
          aria-label="Search distance"
        >
          {RADIUS_OPTIONS.map((radius) => (
            <button
              key={radius}
              type="button"
              className={`distance-option ${
                radiusKm === radius ? "distance-option-active" : ""
              }`}
              disabled={!userPosition}
              aria-pressed={radiusKm === radius}
              onClick={() => {
                setRadiusKm(radius);
                setSelectedReportId(null);
              }}
            >
              {radius} km
            </button>
          ))}

          <button
            type="button"
            className={`distance-option ${
              radiusKm === "ALL" ? "distance-option-active" : ""
            }`}
            disabled={!userPosition}
            aria-pressed={radiusKm === "ALL"}
            onClick={() => {
              setRadiusKm("ALL");
              setSelectedReportId(null);
            }}
          >
            All
          </button>
        </div>

        <label htmlFor="report-type">Report type</label>

        <select
          id="report-type"
          value={selectedType}
          onChange={(event) => {
            setSelectedType(event.target.value as ReportType | "ALL");
            setSelectedReportId(null);
          }}
        >
          <option value="ALL">All reports</option>
          <option value="INJURED">Injured</option>
          <option value="LOST">Lost</option>
          <option value="FOUND">Found</option>
          <option value="NEEDS_RESCUE">Needs rescue</option>
        </select>
      </section>
      <div className="reports-create-action">
                <Link
                  className="report-animal-button"
                  to="/reports/new"
                >
                  + Report an animal
                </Link>
      </div>
    </div>
     
      


      {locationError && (
        <p
          className="reports-message reports-error"
          role="alert"
        >
          {locationError}
        </p>
      )}

      {isLoading && (
        <p className="reports-message">
          Loading reports...
        </p>
      )}

      {error && (
        <p
          className="reports-message reports-error"
          role="alert"
        >
          {error}
        </p>
      )}

      {!isLoading && !error && (
        <section className="reports-map-layout">
          <div className="map-wrapper">
            <MapContainer
              center={DEFAULT_CENTER}
              zoom={13}
              scrollWheelZoom
              className="reports-map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapController
                position={mapPosition}
                userPosition={userPosition}
                radiusKm={radiusKm}
              />

              {userPosition && radiusKm !== "ALL" && (
                <Circle
                  center={[
                    userPosition.latitude,
                    userPosition.longitude,
                  ]}
                  radius={radiusKm * 1000}
                  pathOptions={{
                    color: "#238f73",
                    weight: 2,
                    opacity: 0.7,
                    fillColor: "#238f73",
                    fillOpacity: 0.07,
                  }}
                  interactive={false}
                />
              )}

              {userPosition && (
                <CircleMarker
                  center={[
                    userPosition.latitude,
                    userPosition.longitude,
                  ]}
                  radius={10}
                  pathOptions={{
                    color: "#ffffff",
                    weight: 3,
                    fillColor: "#0e2a5a",
                    fillOpacity: 1,
                  }}
                >
                  <Popup>
                    Your current location
                  </Popup>
                </CircleMarker>
              )}

              {visibleReports.map((report) => (
                <CircleMarker
                  key={report.id}
                  center={[
                    report.latitude as number,
                    report.longitude as number,
                  ]}
                  radius={
                    selectedReportId === report.id
                      ? 17
                      : 12
                  }
                  pathOptions={{
                    color: "#ffffff",
                    weight:
                      selectedReportId === report.id
                        ? 5
                        : 3,
                    fillColor:
                      reportColors[report.type],
                    fillOpacity: 1,
                  }}
                  eventHandlers={{
                    click: () => {
                      focusOnReport(report);
                    },
                  }}
                >
                  <Popup>
                      <article className="map-popup">
                        <div className="map-popup-heading">
                          <span
                            className={`report-type report-type-${report.type.toLowerCase()}`}
                          >
                            {reportLabels[report.type]}
                          </span>

                          <h2>{report.title}</h2>
                        </div>

                        <Link
                          className="map-popup-link"
                          to={`/reports/${report.id}`}
                        >
                          View details →
                        </Link>
                      </article>
                    </Popup>
                </CircleMarker>
              ))}
            </MapContainer>

            <div className="map-legend">
              {Object.entries(reportLabels).map(
                ([type, label]) => (
                  <span key={type}>
                    <i
                      style={{
                        backgroundColor:
                          reportColors[
                            type as ReportType
                          ],
                      }}
                    />

                    {label}
                  </span>
                )
              )}
            </div>
          </div>

          <aside className="reports-sidebar">
            <div className="reports-sidebar-heading">
              <h2>Nearby reports</h2>
              <span>{visibleReports.length}</span>
            </div>

            {visibleReports.length === 0 ? (
              <p className="empty-reports">
                No reports were found in this area.
              </p>
            ) : (
              <div className="reports-list">
                {visibleReports.map((report) => (
                    <article
                      className={`report-card ${
                        selectedReportId === report.id
                          ? "report-card-selected"
                          : ""
                      }`}
                      key={report.id}
                    >
                      <div className="report-card-top">
                          <div className="report-card-title-group">
                            <span
                              className={`report-type report-type-${report.type.toLowerCase()}`}
                            >
                              {reportLabels[report.type]}
                            </span>
                            <h3>{report.title}</h3>

                          </div>

                          <span className="report-status">
                            {report.status.replace("_", " ")}
                          </span>
                      </div>
                     

                      <p>{report.description}</p>

                      {report.locationText && (
                        <p className="report-card-location">
                          {report.locationText}
                        </p>
                      )}

                      {userPosition && (
                        <p className="report-distance">
                          📍{" "}
                          {calculateDistanceKm(userPosition, {
                            latitude: report.latitude as number,
                            longitude: report.longitude as number,
                          }).toFixed(1)}{" "}
                          km away
                        </p>
                      )}

                      <div className="report-card-footer">
                        <time dateTime={report.createdAt}>
                          {formatDate(report.createdAt)}
                        </time>

                        <div className="report-card-actions">
                          <button
                            type="button"
                            className="report-focus-button"
                            onClick={() => focusOnReport(report)}
                          >
                            Show on map
                          </button>

                          <Link
                            className="report-details-link"
                            to={`/reports/${report.id}`}
                          >
                            View details →
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
              </div>
            )}
          </aside>
        </section>
      )}
    </main>
  );
}