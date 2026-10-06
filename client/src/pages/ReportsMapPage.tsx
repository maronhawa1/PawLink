import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import {
  getReports,
  type AnimalReport,
  type ReportType,
} from "../services/reports.service";
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

function MapController({
  position,
}: {
  position: MapPosition | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!position) {
      return;
    }

    map.flyTo(
      [position.latitude, position.longitude],
      16,
      {
        duration: 1.5,
      }
    );
  }, [map, position]);

  return null;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ReportsMapPage() {
  const [reports, setReports] = useState<AnimalReport[]>(
    []
  );

  const [selectedType, setSelectedType] = useState<
    ReportType | "ALL"
  >("ALL");

  const [userPosition, setUserPosition] =
    useState<MapPosition | null>(null);

  const [mapPosition, setMapPosition] =
    useState<MapPosition | null>(null);

  const [selectedReportId, setSelectedReportId] =
    useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState("");
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    async function loadReports() {
      try {
        setError("");

        const data = await getReports();

        setReports(data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load reports"
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadReports();
  }, []);

  const visibleReports = useMemo(() => {
    return reports.filter((report) => {
      const hasLocation =
        typeof report.latitude === "number" &&
        typeof report.longitude === "number";

      const matchesType =
        selectedType === "ALL" ||
        report.type === selectedType;

      return hasLocation && matchesType;
    });
  }, [reports, selectedType]);

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

  return (
    <main className="reports-map-page">
      <section className="reports-map-heading">
        <div>
          <h1>Animal reports near you</h1>
          <p>
            Find animals that need help in your area.
          </p>
        </div>

        <a
          className="report-animal-button"
          href="/reports/new"
        >
          <span>+</span>
          Report an animal
        </a>
      </section>

      <section className="reports-toolbar">
        <label htmlFor="report-type">
          Report type
        </label>

        <select
          id="report-type"
          value={selectedType}
          onChange={(event) => {
            setSelectedType(
              event.target.value as ReportType | "ALL"
            );

            setSelectedReportId(null);
          }}
        >
          <option value="ALL">All reports</option>
          <option value="INJURED">Injured</option>
          <option value="LOST">Lost</option>
          <option value="FOUND">Found</option>
          <option value="NEEDS_RESCUE">
            Needs rescue
          </option>
        </select>

        <button
          className="location-button"
          type="button"
          onClick={handleUseMyLocation}
          disabled={isLocating}
        >
          {isLocating
            ? "Finding location..."
            : "Use my location"}
        </button>
      </section>

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
              />

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
                      <span
                        className={`report-type report-type-${report.type.toLowerCase()}`}
                      >
                        {reportLabels[report.type]}
                      </span>

                      <h2>{report.title}</h2>

                      <p>{report.description}</p>

                      {report.locationText && (
                        <p className="report-location">
                          {report.locationText}
                        </p>
                      )}

                      <span className="report-status">
                        {report.status.replace(
                          "_",
                          " "
                        )}
                      </span>
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
                  <button
                    type="button"
                    className={`report-card ${
                      selectedReportId === report.id
                        ? "report-card-selected"
                        : ""
                    }`}
                    key={report.id}
                    onClick={() =>
                      focusOnReport(report)
                    }
                  >
                    <div className="report-card-top">
                      <span
                        className={`report-type report-type-${report.type.toLowerCase()}`}
                      >
                        {reportLabels[report.type]}
                      </span>

                      <span className="report-status">
                        {report.status.replace(
                          "_",
                          " "
                        )}
                      </span>
                    </div>

                    <h3>{report.title}</h3>

                    <p>{report.description}</p>

                    {report.locationText && (
                      <p className="report-card-location">
                        {report.locationText}
                      </p>
                    )}

                    <time dateTime={report.createdAt}>
                      {formatDate(
                        report.createdAt
                      )}
                    </time>
                  </button>
                ))}
              </div>
            )}
          </aside>
        </section>
      )}
    </main>
  );
}