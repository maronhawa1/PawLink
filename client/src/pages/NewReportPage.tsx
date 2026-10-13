
import { useEffect, useState, type FormEvent } from "react";
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

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ReportType>("INJURED");
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
      <Link to="/reports">← Back to Reports Map</Link>

      <h1>Report an animal</h1>
      <p>Share the details so others in your community can help.</p>

      <form onSubmit={handleSubmit}>
        <label>
          Report type *
          <select
            value={type}
            onChange={(event) =>
              setType(event.target.value as ReportType)
            }
          >
            <option value="INJURED">Injured</option>
            <option value="LOST">Lost</option>
            <option value="FOUND">Found</option>
            <option value="NEEDS_RESCUE">Needs rescue</option>
          </select>
        </label>

        <label>
          Animal type
          <select
            value={animalType}
            onChange={(event) =>
              setAnimalType(event.target.value as AnimalType | "")
            }
          >
            <option value="">Not sure</option>
            <option value="DOG">Dog</option>
            <option value="CAT">Cat</option>
            <option value="OTHER">Other</option>
          </select>
        </label>

        <label>
          Title *
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            placeholder="e.g. Injured dog near the park"
            required
          />
        </label>

        <label>
          Description *
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={5000}
            rows={4}
            placeholder="Describe the animal's condition and what happened."
            required
          />
        </label>

        <label>
          Animal photo (optional)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;

              if (file && file.size > 5 * 1024 * 1024) {
                setFormError("Photo must be 5 MB or smaller.");
                event.target.value = "";
                setPhoto(null);
                return;
              }

              setFormError("");
              setPhoto(file);
            }}
            disabled={isSubmitting}
          />
        </label>

        {photoPreview && (
          <div>
            <img
              src={photoPreview}
              alt="Selected animal"
              style={{
                width: 160,
                height: 120,
                objectFit: "cover",
                borderRadius: 10,
              }}
            />
            <button
              type="button"
              onClick={() => setPhoto(null)}
              disabled={isSubmitting}
            >
              Remove photo
            </button>
          </div>
        )}

        <h2>Animal location *</h2>
        <p>
          Click the map to mark where the animal was seen, or use your
          current location.
        </p>

        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={isLocating || isSubmitting}
        >
          {isLocating ? "Finding location..." : "Use my current location"}
        </button>

        <div style={{ height: 320, margin: "16px 0" }}>
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

        {position && (
          <p role="status">
            Location selected: {position.latitude.toFixed(5)},{" "}
            {position.longitude.toFixed(5)}
          </p>
        )}

        {position && (
            <button
                type="button"
                onClick={() => {
                setPosition(null);
                setCurrentLocation(null);
                }}
                disabled={isSubmitting}
            >
                Clear selected location
            </button>
        )}

        <label>
          Location description (optional)
          <input
            type="text"
            value={locationText}
            onChange={(event) => setLocationText(event.target.value)}
            maxLength={300}
            placeholder="e.g. Near the park entrance"
          />
        </label>

        {formError && (
          <p role="alert" style={{ color: "#b42318" }}>
            {formError}
          </p>
        )}

        <button type="submit" disabled={isSubmitting || isLocating}>
          {isUploading
            ? "Uploading photo..."
            : isSaving
              ? "Submitting report..."
              : "Submit report"}
        </button>
      </form>
    </main>
  );
}
