import "../styles/add-report-form.css";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import {
  useCreateReportMutation,
  useUploadReportImageMutation,
  type AnimalType,
  type ReportType,
} from "../api/reportsApi";
import { getErrorMessage } from "../api/getErrorMessage";
import "leaflet/dist/leaflet.css";

type Position = {
  latitude: number;
  longitude: number;
};

const DEFAULT_CENTER: LatLngExpression = [32.0853, 34.7818];

function LocationPicker({
  position,
  onSelect,
}: {
  position: Position | null;
  onSelect: (position: Position) => void;
}) {
  useMapEvents({
    click(event) {
      onSelect({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return position ? (
    <CircleMarker
      center={[position.latitude, position.longitude]}
      radius={10}
      pathOptions={{
        color: "#ffffff",
        weight: 3,
        fillColor: "#238f73",
        fillOpacity: 1,
      }}
    />
  ) : null;
}

function LocationController({
  currentLocation,
}: {
  currentLocation: Position | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (currentLocation) {
      map.flyTo(
        [currentLocation.latitude, currentLocation.longitude],
        16,
      );
    }
  }, [map, currentLocation]);

  return null;
}

export default function NewReportPage() {
  const navigate = useNavigate();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ReportType | "">("");
  const [animalType, setAnimalType] = useState<AnimalType | "">("");
  const [locationText, setLocationText] = useState("");
  const [position, setPosition] = useState<Position | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Position | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  const [uploadImage, { isLoading: isUploading }] =
    useUploadReportImageMutation();
  const [createReport, { isLoading: isSaving }] =
    useCreateReportMutation();

  const isSubmitting = isUploading || isSaving;

  useEffect(() => {
    if (!photo) {
      setPhotoPreview(null);
      return;
    }

    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function clearPhoto() {
    setPhoto(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  function handleUseMyLocation() {
    setFormError("");

    if (!navigator.geolocation) {
      setFormError("Location is not supported by this browser.");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (result) => {
        const location = {
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
        };
        setPosition(location);
        setCurrentLocation(location);
        setIsLocating(false);
      },
      (error) => {
        const message =
          error.code === 1
            ? "Location permission was denied. Select a point on the map instead."
            : error.code === 2
              ? "Your current location is unavailable. Select a point on the map."
              : "Finding your location took too long. Select a point on the map.";
        setFormError(message);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setFormError("");

    if (!type) {
      setFormError("Please select a report type.");
      return;
    }

    if (!title.trim() || !description.trim()) {
      setFormError("Please enter a title and description.");
      return;
    }

    if (!position) {
      setFormError(
        "Please select a location on the map or use your current location.",
      );
      return;
    }

    try {
      let photoUrl: string | undefined;

      if (photo) {
        const uploaded = await uploadImage(photo).unwrap();
        photoUrl = uploaded.url;
      }

      const report = await createReport({
        title: title.trim(),
        description: description.trim(),
        type,
        animalType: animalType || undefined,
        locationText: locationText.trim() || undefined,
        latitude: position.latitude,
        longitude: position.longitude,
        photoUrl,
      }).unwrap();

      navigate(`/reports/${report.id}`);
    } catch (error) {
      setFormError(
        getErrorMessage(
          error as Parameters<typeof getErrorMessage>[0],
          "Failed to create report",
        ),
      );
    }
  }

  return (
    <main className="new-report-page">
      <Link to="/reports/map" className="new-report-back">
        ← Back to Reports Map
      </Link>

      <div className="new-report-card">
        <div className="new-report-heading">
          <h1>Report an animal</h1>
          <p>Share a few details and mark where the animal was seen.</p>
        </div>

        <form onSubmit={handleSubmit} className="new-report-form">
          <div className="new-report-details">
            <label>
              <span className="new-report-label-text">Report type <span className="new-report-required" aria-hidden="true">*</span></span>
              <select
                value={type}
                className={type === "" ? "new-report-select-placeholder" : ""}
                required
                onChange={(event) =>
                  setType(event.target.value as ReportType | "")
                }
              >
                <option value="" disabled>Select report type</option>
                <option value="INJURED">Injured</option>
                <option value="LOST">Lost</option>
                <option value="FOUND">Found</option>
                <option value="NEEDS_RESCUE">Needs rescue</option>
              </select>
            </label>

            <label>
              <span className="new-report-label-text">Animal type</span>
              <select
                value={animalType}
                className={animalType === "" ? "new-report-select-placeholder" : ""}
                onChange={(event) =>
                  setAnimalType(event.target.value as AnimalType | "")
                }
              >
                <option value="">Select animal type</option>
                <option value="DOG">Dog</option>
                <option value="CAT">Cat</option>
                <option value="OTHER">Other</option>
              </select>
            </label>

            <label className="new-report-full">
              <span className="new-report-label-text">Report title <span className="new-report-required" aria-hidden="true">*</span></span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={120}
                placeholder="e.g. Lost cat"
                required
              />
            </label>

            <label className="new-report-full">
              <span className="new-report-label-text">Description <span className="new-report-required" aria-hidden="true">*</span></span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={5000}
                rows={3}
                placeholder="What happened? Tell us briefly..."
                required
              />
            </label>

            <div className="new-report-photo-field">
              <span className="new-report-field-label">Animal photo</span>
              <div className="new-report-photo-row">
                <div className="new-report-photo-preview">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Selected animal preview" />
                  ) : (
                    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 4h-5L7.7 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.7L14.5 4Z" />
                      <circle cx="12" cy="13" r="3.5" />
                    </svg>
                  )}
                </div>

                <div className="new-report-photo-actions">
                  <label
                    htmlFor="new-report-photo"
                    className="new-report-photo-button"
                  >
                    {photo ? "Change photo" : "Choose a photo"}
                  </label>
                  <input
                    id="new-report-photo"
                    ref={photoInputRef}
                    className="new-report-file-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={isSubmitting}
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      if (file && file.size > 5 * 1024 * 1024) {
                        setFormError("Photo must be 5 MB or smaller.");
                        clearPhoto();
                        return;
                      }
                      setFormError("");
                      setPhoto(file);
                    }}
                  />
                  <span className="new-report-photo-hint" title={photo?.name}>
                    {photo ? photo.name : "JPG, PNG or WebP · Max 5 MB"}
                  </span>
                </div>

                {photo && (
                  <button
                    type="button"
                    className="new-report-remove-photo"
                    onClick={clearPhoto}
                    disabled={isSubmitting}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <label className="new-report-full">
              <span className="new-report-label-text">Nearby landmark or street</span>
              <input
                type="text"
                value={locationText}
                onChange={(event) => setLocationText(event.target.value)}
                maxLength={300}
                placeholder="e.g. Near the park entrance"
              />
            </label>
          </div>

          <section className="new-report-location" aria-labelledby="report-location-heading">
            <div className="new-report-location-heading">
              <h2 id="report-location-heading">Animal location <span className="new-report-required" aria-hidden="true">*</span></h2>
              <p>Click the map to place or move the marker.</p>
            </div>

            <button
              type="button"
              className="new-report-location-button"
              onClick={handleUseMyLocation}
              disabled={isLocating || isSubmitting}
            >
              {isLocating ? "Finding location..." : "⌖ Use my current location"}
            </button>

            <div className="new-report-map">
              <MapContainer
                center={DEFAULT_CENTER}
                zoom={13}
                scrollWheelZoom
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationPicker position={position} onSelect={setPosition} />
                <LocationController currentLocation={currentLocation} />
              </MapContainer>
            </div>

            {position ? (
              <div className="new-report-location-selected">
                <span className="new-report-coordinates" role="status">
                  ✓ Location selected
                </span>
                <button
                  type="button"
                  className="new-report-clear-button"
                  onClick={() => {
                    setPosition(null);
                    setCurrentLocation(null);
                  }}
                  disabled={isSubmitting}
                >
                  Clear location
                </button>
              </div>
            ) : (
              <p className="new-report-location-hint">Select a point to continue.</p>
            )}

          </section>

          <div className="new-report-footer">
            {formError && (
              <p role="alert" className="new-report-error">{formError}</p>
            )}
            <button
              type="submit"
              className="new-report-submit"
              disabled={isSubmitting || isLocating}
            >
              {isUploading
                ? "Uploading photo..."
                : isSaving
                  ? "Submitting report..."
                  : "Submit report →"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
