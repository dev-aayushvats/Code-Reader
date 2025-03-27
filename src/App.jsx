import { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import './App.css';

function App() {
  const [selectedType, setSelectedType] = useState(null);
  const [result, setResult] = useState('No result yet');
  const [facingMode, setFacingMode] = useState('environment');
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const codeReader = useRef(new BrowserMultiFormatReader());

  const barcodeTypes = [
    'QR Code',
    'PDF417',
    'Data Matrix',
    'Code 128',
    'Aztec Code',
    '1D Barcode'
  ];

  useEffect(() => {
    if (!isScanning || !selectedType) return;

    const startScanning = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();

          codeReader.current.decodeFromVideoDevice(
            null,
            videoRef.current,
            (result, err) => {
              if (result) setResult(result.getText());
              if (err && err.name !== 'NotFoundException') {
                console.error(err);
                setResult('Error scanning barcode');
              }
            }
          );
        }
      } catch (err) {
        console.error(err);
        setResult('Error accessing camera');
      }
    };

    startScanning();

    return () => {
      codeReader.current.reset();
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [isScanning, facingMode, selectedType]);

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setResult('No result yet');
    setIsScanning(false);
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      codeReader.current.decodeFromImage(img)
        .then(result => setResult(result.getText()))
        .catch(() => setResult(`No ${selectedType} detected`));
    };
    img.src = URL.createObjectURL(file);
  };

  const startCameraScan = () => {
    setIsScanning(true);
  };

  return (
    <div className="App">
      <h1>Barcode Scanner</h1>

      {!selectedType ? (
        <section className="type-selection">
          <h2>Select Barcode Type</h2>
          <div className="type-buttons">
            {barcodeTypes.map(type => (
              <button
                key={type}
                className={selectedType === type ? 'selected' : ''}
                onClick={() => handleTypeSelect(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </section>
      ) : (
        <>
          <section className="selected-type">
            <h2>Scanning: {selectedType}</h2>
            <button onClick={() => setSelectedType(null)} className="back-button">
              Change Type
            </button>
          </section>

          <section className="input-methods">
            <h3>Choose Input Method</h3>
            <div className="method-buttons">
              <button onClick={startCameraScan} disabled={isScanning}>
                Use Camera
              </button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button onClick={() => fileInputRef.current.click()}>
                Upload Image
              </button>
            </div>
          </section>

          {isScanning && (
            <section className="scanner-container">
              <video ref={videoRef} width="300" height="300" muted playsInline />
              <div className="scanner-controls">
                <button onClick={toggleCamera}>
                  Switch to {facingMode === 'environment' ? 'Front' : 'Back'} Camera
                </button>
                <button onClick={() => setIsScanning(false)} className="stop-button">
                  Stop Scanning
                </button>
              </div>
            </section>
          )}

          <section className="result">
            <h3>Result:</h3>
            <p>{result}</p>
          </section>
        </>
      )}
    </div>
  );
}

export default App;