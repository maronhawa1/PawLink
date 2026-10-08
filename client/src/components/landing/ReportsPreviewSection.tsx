import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import {
  getReports,
  type AnimalReport,
  type ReportType,
} from "../../services/reports.service";
import "leaflet/dist/leaflet.css";

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

export default function ReportsPreviewSection() {
  const [reports, setReports] = useState<AnimalReport[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    async function loadReports() {
      try {
        const data = await getReports();
        setReports(data);
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }

    void loadReports();
  }, []);

  const previewReports = useMemo(() => {
    return reports
      .filter(
        (report) =>
          typeof report.latitude === "number" &&
          typeof report.longitude === "number"
      )
      .slice(0, 3);
  }, [reports]);

  const mapCenter: LatLngExpression =
    previewReports.length > 0
      ? [
          previewReports[0].latitude as number,
          previewReports[0].longitude as number,
        ]
      : DEFAULT_CENTER;

  return (
    <section className="landing-reports">
      <div className="landing-reports-heading">
        <div>
          <span>Community reports</span>
          <h2>See where animals need help</h2>
          <p>
            Explore recent animal reports and discover
            where support is needed nearby.
          </p>
        </div>

        <a href="/reports/map">
          View full map
          <span aria-hidden="true">→</span>
        </a>
      </div>

      <div className="landing-reports-content">
        <div className="landing-reports-list">
          {isLoading && (
            <p className="landing-reports-message">
              Loading recent reports...
            </p>
          )}

          {hasError && (
            <p className="landing-reports-message">
              Recent reports are currently unavailable.
            </p>
          )}

          {!isLoading &&
            !hasError &&
            previewReports.length === 0 && (
              <p className="landing-reports-message">
                No nearby reports are currently available.
              </p>
            )}

          {previewReports.map((report) => (
            <article
              className="landing-report-card"
              key={report.id}
            >
              <div className="landing-report-card-top">
                <span
                  className={`landing-report-type landing-report-${report.type.toLowerCase()}`}
                >
                  {reportLabels[report.type]}
                </span>

                <span className="landing-report-status">
                  {report.status.replace("_", " ")}
                </span>
              </div>

              <h3>{report.title}</h3>

              <p>{report.description}</p>

              {report.locationText && (
                <span className="landing-report-location">
                  {report.locationText}
                </span>
              )}
            </article>
          ))}
        </div>

        <div className="landing-map-preview">
          <MapContainer
            center={mapCenter}
            zoom={13}
            scrollWheelZoom={false}
            dragging={false}
            doubleClickZoom={false}
            zoomControl={false}
            className="landing-map"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {previewReports.map((report) => (
              <CircleMarker
                key={report.id}
                center={[
                  report.latitude as number,
                  report.longitude as number,
                ]}
                radius={11}
                pathOptions={{
                  color: "#ffffff",
                  weight: 3,
                  fillColor: reportColors[report.type],
                  fillOpacity: 1,
                }}
              >
                <Popup>
                  <strong>{report.title}</strong>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          <a
            className="landing-map-button"
            href="/reports/map"
          >
            Open interactive map
          </a>
        </div>
      </div>
    </section>
  );
}