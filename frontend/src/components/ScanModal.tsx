import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Camera,
  X,
  MapPin,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Plus,
  RefreshCw,
  SwitchCamera,
  Layers,
  Eye,
} from 'lucide-react';
import { uploadScan } from '../services/api';
import type { CropScanResult, ApiError } from '../types/api';

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanCompleted: (result: CropScanResult) => void;
}

interface QueuedFile {
  id: string;
  file: File;
  previewUrl: string;
}

export const ScanModal: React.FC<ScanModalProps> = ({ isOpen, onClose, onScanCompleted }) => {
  const [activeMode, setActiveMode] = useState<'upload' | 'camera'>('upload');
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);

  // Location fields
  const [country, setCountry] = useState('India');
  const [state, setState] = useState('Maharashtra');
  const [district, setDistrict] = useState('Pune');
  const [latitude, setLatitude] = useState<string>('18.5204');
  const [longitude, setLongitude] = useState<string>('73.8567');

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Status & Progress
  const [loading, setLoading] = useState(false);
  const [currentProgress, setCurrentProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completedResults, setCompletedResults] = useState<CropScanResult[]>([]);

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Stop camera stream utility
  const stopCameraStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Cleanup camera on close or mode switch
  useEffect(() => {
    if (!isOpen || activeMode !== 'camera') {
      stopCameraStream();
    }
  }, [isOpen, activeMode]);

  // Handle stream initialization
  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    setCameraError(null);
    stopCameraStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        'Unable to access camera. Please check camera permissions or upload an image file instead.'
      );
      setIsCameraActive(false);
    }
  };

  const handleToggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    if (isCameraActive) {
      startCamera(nextFacing);
    }
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `camera_crop_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const newQueued: QueuedFile = {
          id: Math.random().toString(36).substring(2, 9),
          file,
          previewUrl: URL.createObjectURL(file),
        };
        setQueuedFiles((prev) => [...prev, newQueued]);
        setError(null);
      },
      'image/jpeg',
      0.92
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: QueuedFile[] = Array.from(e.target.files).map((file) => ({
        id: Math.random().toString(36).substring(2, 9),
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      setQueuedFiles((prev) => [...prev, ...newFiles]);
      setError(null);
    }
  };

  const handleRemoveFile = (id: string) => {
    setQueuedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handleResetForAnotherCrop = () => {
    setQueuedFiles([]);
    setCompletedResults([]);
    setError(null);
    setCurrentProgress(null);
    if (activeMode === 'camera' && !isCameraActive) {
      startCamera();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (queuedFiles.length === 0) {
      setError('Please capture or select at least one crop image.');
      return;
    }

    setLoading(true);
    setError(null);
    stopCameraStream();

    const locationObj = {
      country: country.trim() || undefined,
      state: state.trim() || undefined,
      district: district.trim() || undefined,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
    };

    const results: CropScanResult[] = [];

    try {
      for (let i = 0; i < queuedFiles.length; i++) {
        setCurrentProgress({ current: i + 1, total: queuedFiles.length });
        const res = await uploadScan(queuedFiles[i].file, locationObj);
        results.push(res);
      }

      setCompletedResults(results);
      setLoading(false);
      setCurrentProgress(null);

      // Trigger completion callback with the most recent scan
      if (results.length > 0) {
        onScanCompleted(results[results.length - 1]);
      }
    } catch (err: any) {
      setLoading(false);
      setCurrentProgress(null);
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Scan request failed. Please try again.');
    }
  };

  const handleCloseModal = () => {
    stopCameraStream();
    setQueuedFiles([]);
    setCompletedResults([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(23, 36, 24, 0.6)',
        backdropFilter: 'blur(8px)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
    >
      <div
        className="card-surface animate-fade-in"
        style={{
          maxWidth: '620px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '2rem',
          position: 'relative',
          borderRadius: '24px',
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleCloseModal}
          disabled={loading}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            padding: '0.45rem',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-primary)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <X size={20} color="var(--text-secondary)" />
        </button>

        {/* Header */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span
              style={{
                backgroundColor: 'var(--bg-sage-light)',
                color: 'var(--primary-sage)',
                padding: '0.25rem 0.6rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Smart AI Scanner
            </span>
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-deep)' }}>
            Crop Disease & Advisory Diagnosis
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Capture live photo or upload foliage images for deep learning disease analysis.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--status-diseased-bg)',
              color: 'var(--status-diseased-text)',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem',
            }}
          >
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        {/* Completion View (Multi-scan finished) */}
        {completedResults.length > 0 && !loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '1.5rem',
              backgroundColor: 'var(--bg-sage-light)',
              borderRadius: '16px',
              border: '1px solid var(--border-light)',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-sage)',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <CheckCircle size={32} />
            </div>

            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-deep)', marginBottom: '0.5rem' }}>
              {completedResults.length === 1 ? 'Diagnosis Complete!' : `${completedResults.length} Crops Analyzed Successfully!`}
            </h4>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              AI models classified the crop status and generated agricultural management recommendations.
            </p>

            {/* Results Summary List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem', textAlign: 'left' }}>
              {completedResults.map((res, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary-deep)' }}>
                      {res.prediction?.crop || 'Crop Scan'} — {res.prediction?.disease || 'Healthy'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Confidence: {(res.prediction?.confidence ? res.prediction.confidence * 100 : 95).toFixed(1)}% | Status: {res.prediction?.status || 'healthy'}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.25rem 0.6rem',
                      borderRadius: '20px',
                      backgroundColor:
                        res.prediction?.status === 'healthy'
                          ? 'var(--status-healthy-bg)'
                          : 'var(--status-diseased-bg)',
                      color:
                        res.prediction?.status === 'healthy'
                          ? 'var(--status-healthy-text)'
                          : 'var(--status-diseased-text)',
                    }}
                  >
                    {(res.prediction?.status || 'healthy').toUpperCase()}
                  </span>
                </div>
              ))}
            </div>

            {/* Action Buttons for Reset / Scan Next */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleResetForAnotherCrop}
                className="btn-primary"
                style={{ flex: 1, minWidth: '180px', justifyContent: 'center', padding: '0.85rem' }}
              >
                <RefreshCw size={18} />
                <span>Scan Another Crop</span>
              </button>

              <button
                type="button"
                onClick={handleCloseModal}
                style={{
                  flex: 1,
                  minWidth: '160px',
                  padding: '0.85rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)',
                  backgroundColor: '#ffffff',
                  color: 'var(--primary-deep)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <Eye size={18} />
                <span>View Dashboard</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Mode Switcher Tabs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                backgroundColor: 'var(--bg-sage-light)',
                padding: '0.3rem',
                borderRadius: '14px',
                gap: '0.3rem',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setActiveMode('upload');
                  stopCameraStream();
                }}
                style={{
                  padding: '0.6rem',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: activeMode === 'upload' ? '#ffffff' : 'transparent',
                  color: activeMode === 'upload' ? 'var(--primary-deep)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  boxShadow: activeMode === 'upload' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <Upload size={16} />
                <span>Upload Images</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveMode('camera');
                  startCamera();
                }}
                style={{
                  padding: '0.6rem',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: activeMode === 'camera' ? '#ffffff' : 'transparent',
                  color: activeMode === 'camera' ? 'var(--primary-deep)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  boxShadow: activeMode === 'camera' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <Camera size={16} />
                <span>Live Camera</span>
              </button>
            </div>

            {/* LIVE CAMERA MODE VIEW */}
            {activeMode === 'camera' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '240px',
                    backgroundColor: '#1a241b',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: isCameraActive ? 'block' : 'none',
                    }}
                  />

                  {!isCameraActive && (
                    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', padding: '1rem' }}>
                      {cameraError ? (
                        <p style={{ fontSize: '0.85rem', color: '#ff8a8a', maxWidth: '300px' }}>{cameraError}</p>
                      ) : (
                        <p style={{ fontSize: '0.85rem' }}>Initializing live camera stream...</p>
                      )}
                      <button
                        type="button"
                        onClick={() => startCamera()}
                        style={{
                          marginTop: '0.75rem',
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: 'var(--primary-sage)',
                          color: '#fff',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Start Camera
                      </button>
                    </div>
                  )}

                  {/* Camera Controls Overlay */}
                  {isCameraActive && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '0.75rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                      }}
                    >
                      {/* Snap Button */}
                      <button
                        type="button"
                        onClick={handleCapturePhoto}
                        title="Snap Photo"
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '50%',
                          backgroundColor: '#ffffff',
                          border: '4px solid var(--primary-sage)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                          transition: 'transform 0.1s ease',
                        }}
                      >
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--primary-deep)',
                          }}
                        />
                      </button>

                      {/* Flip Camera */}
                      <button
                        type="button"
                        onClick={handleToggleCameraFacing}
                        title="Switch Camera"
                        style={{
                          padding: '0.5rem',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          color: '#ffffff',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <SwitchCamera size={18} />
                      </button>
                    </div>
                  )}
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  Point camera directly at diseased plant leaves and tap the snap button to capture.
                </p>
              </div>
            )}

            {/* UPLOAD MODE VIEW */}
            {activeMode === 'upload' && (
              <div
                style={{
                  border: '2px dashed var(--primary-accent)',
                  backgroundColor: 'var(--bg-sage-light)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  id="file-input-multi"
                  style={{ display: 'none' }}
                />
                <label htmlFor="file-input-multi" style={{ cursor: 'pointer', display: 'block' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      color: 'var(--primary-sage)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '0.75rem',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <Upload size={22} />
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--primary-deep)' }}>
                    Click or drag multiple crop images here
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Select single or multiple photos (JPEG, PNG, WEBP)
                  </p>
                </label>
              </div>
            )}

            {/* QUEUED PHOTOS PREVIEW GALLERY */}
            {queuedFiles.length > 0 && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                  }}
                >
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-deep)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Layers size={16} color="var(--primary-sage)" /> Selected Images ({queuedFiles.length})
                  </label>
                  <label
                    htmlFor="file-input-add"
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--primary-sage)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <Plus size={14} /> Add More
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    id="file-input-add"
                    style={{ display: 'none' }}
                  />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                    gap: '0.6rem',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    padding: '0.4rem',
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  {queuedFiles.map((item, index) => (
                    <div
                      key={item.id}
                      style={{
                        position: 'relative',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        aspectRatio: '1',
                        border: '1px solid var(--border-light)',
                      }}
                    >
                      <img
                        src={item.previewUrl}
                        alt={`Crop ${index + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          top: '4px',
                          left: '4px',
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          color: '#fff',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: '4px',
                        }}
                      >
                        #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(item.id)}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          backgroundColor: 'rgba(239, 68, 68, 0.9)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location Context (Optional) */}
            <div>
              <label
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  marginBottom: '0.5rem',
                }}
              >
                <MapPin size={15} color="var(--primary-sage)" /> Field Location Context (Optional)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <input
                  type="text"
                  placeholder="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  style={{
                    padding: '0.55rem 0.75rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.82rem',
                  }}
                />
                <input
                  type="text"
                  placeholder="State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  style={{
                    padding: '0.55rem 0.75rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.82rem',
                  }}
                />
                <input
                  type="text"
                  placeholder="District"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  style={{
                    padding: '0.55rem 0.75rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.82rem',
                  }}
                />
                <input
                  type="text"
                  placeholder="Lat / Lon"
                  value={latitude && longitude ? `${latitude}, ${longitude}` : ''}
                  onChange={(e) => {
                    const parts = e.target.value.split(',');
                    if (parts[0]) setLatitude(parts[0].trim());
                    if (parts[1]) setLongitude(parts[1].trim());
                  }}
                  style={{
                    padding: '0.55rem 0.75rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.82rem',
                  }}
                />
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading || queuedFiles.length === 0}
              className="btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '0.85rem',
                opacity: loading || queuedFiles.length === 0 ? 0.65 : 1,
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>
                    {currentProgress
                      ? `Analyzing image ${currentProgress.current} of ${currentProgress.total}...`
                      : 'Running AI Model Inference...'}
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  <span>
                    {queuedFiles.length <= 1
                      ? 'Analyze Crop & Fetch Advisory'
                      : `Analyze All ${queuedFiles.length} Crop Images`}
                  </span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
