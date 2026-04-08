import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, MapPin } from 'lucide-react';

interface GeoTaggedImage {
  id: string;
  file: File;
  preview: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  watermarkedPreview?: string;
}

interface ImageCaptureProps {
  onCapture: (image: GeoTaggedImage) => void;
  label?: string;
  show?: boolean;
}

export default function ImageCapture({
  onCapture,
  label = 'Capture Image',
  show = true,
}: ImageCaptureProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [gpsData, setGpsData] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [capturing, setCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please check permissions.');
      setCapturing(false);
    }
  };

  useEffect(() => {
    if (capturing) {
      initializeCamera();
    }
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capturing]);

  const captureGPS = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 10000 },
      );
    });
  };

  const createWatermarkedImage = (
    originalPreview: string,
    lat: number,
    lng: number,
    timestamp: string,
  ): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        ctx?.drawImage(img, 0, 0);

        const logo = new Image();
        logo.onload = () => {
          const logoWidth = 120;
          const logoHeight = (logo.height / logo.width) * logoWidth;
          ctx!.drawImage(
            logo,
            canvas.width - logoWidth - 20,
            20,
            logoWidth,
            logoHeight,
          );

          ctx!.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx!.fillRect(0, canvas.height - 80, canvas.width, 80);

          ctx!.fillStyle = '#ffffff';
          ctx!.font = 'bold 24px Arial';
          ctx!.fillText(
            `Lat: ${lat.toFixed(6)}, Long: ${lng.toFixed(6)}`,
            20,
            canvas.height - 45,
          );

          ctx!.font = '20px Arial';
          ctx!.fillText(timestamp, 20, canvas.height - 15);

          resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        logo.onerror = () => {
          ctx!.fillStyle = '#ffffff';
          ctx!.font = 'bold 24px Arial';
          ctx!.fillText('TRICAD', canvas.width - 100, 45);

          ctx!.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx!.fillRect(0, canvas.height - 80, canvas.width, 80);

          ctx!.fillStyle = '#ffffff';
          ctx!.font = 'bold 24px Arial';
          ctx!.fillText(
            `Lat: ${lat.toFixed(6)}, Long: ${lng.toFixed(6)}`,
            20,
            canvas.height - 45,
          );

          ctx!.font = '20px Arial';
          ctx!.fillText(timestamp, 20, canvas.height - 15);

          resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        logo.src = '/src/images/logo/Tricad.png';
      };

      img.src = originalPreview;
    });
  };

  const handleOpenCamera = async () => {
    setCapturing(true);
  };

  const handleCapturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg');
    setCapturedImage(dataUrl);
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], `capture_${Date.now()}.jpg`, {
      type: 'image/jpeg',
    });
    setCapturedFile(file);
    const stream = video.srcObject as MediaStream;
    stream?.getTracks().forEach((track) => track.stop());
    setCapturing(false);

    try {
      const gps = await captureGPS();
      setGpsData(gps);
    } catch (error) {
      console.error('Error getting GPS:', error);
      alert('Could not get GPS location. Please try again.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      setCapturedImage(reader.result as string);
      setCapturedFile(file);

      try {
        const gps = await captureGPS();
        setGpsData(gps);
      } catch (error) {
        console.error('Error getting GPS:', error);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!capturedImage || !capturedFile || !gpsData) return;

    const timestamp = new Date().toLocaleString();
    const watermarked = await createWatermarkedImage(
      capturedImage,
      gpsData.lat,
      gpsData.lng,
      timestamp,
    );

    const geoImage: GeoTaggedImage = {
      id: Date.now().toString(),
      file: capturedFile,
      preview: capturedImage,
      latitude: gpsData.lat,
      longitude: gpsData.lng,
      timestamp,
      watermarkedPreview: watermarked,
    };

    onCapture(geoImage);
    handleClose();
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setCapturedImage(null);
    setCapturedFile(null);
    setGpsData(null);
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach((track) => track.stop());
  };

  return (
    <>
      {show && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Camera className="w-4 h-4 inline mr-2" />
          {label}
        </button>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Capture Image</h3>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {!capturedImage && !capturing && (
                <div className="flex gap-4">
                  <button
                    onClick={handleOpenCamera}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Camera className="w-5 h-5" />
                    Open Camera
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    <Upload className="w-5 h-5" />
                    Upload
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
              )}

              {capturing && (
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    onLoadedMetadata={() => videoRef.current?.play()}
                    className="w-full rounded-lg"
                  />
                  <button
                    onClick={handleCapturePhoto}
                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-2 bg-blue-600 text-white rounded-full font-medium"
                  >
                    Capture
                  </button>
                </div>
              )}

              {capturedImage && (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={capturedImage}
                      alt="Captured"
                      className="w-full rounded-lg"
                    />
                    {gpsData && (
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {gpsData.lat.toFixed(6)}, {gpsData.lng.toFixed(6)}
                      </div>
                    )}
                  </div>

                  {gpsData ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-700 font-medium">
                        GPS Captured Successfully
                      </p>
                      <p className="text-xs text-green-600">
                        Lat: {gpsData.lat.toFixed(6)}, Long:{' '}
                        {gpsData.lng.toFixed(6)}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-700">
                        Capturing GPS...
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleSave}
                    disabled={!gpsData}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Image
                  </button>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}
    </>
  );
}
