import { useRef, useEffect, useState } from "react";
import html2canvas from "html2canvas";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const stripRef = useRef(null);

  const [photos, setPhotos] = useState([]);
  const [layout, setLayout] = useState("A");
  const [countdown, setCountdown] = useState(null);
  const [selectedColor, setSelectedColor] = useState("#cccccc");

  const layoutPresets = {
    A: 4,
    B: 3,
    C: 2,
    D: 6,
  };

  useEffect(() => {
    async function enableWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Webcam access error:", err);
      }
    }
    enableWebcam();
  }, []);

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    ctx.restore();

    const dataUrl = canvas.toDataURL("image/png");

    setPhotos((prevPhotos) => {
      const updated = [...prevPhotos, dataUrl];
      const maxPhotos = layoutPresets[layout];
      return updated.slice(-maxPhotos);
    });
  };

  const startSession = async () => {
    setPhotos([]);
    const numPhotos = layoutPresets[layout];

    for (let i = 0; i < numPhotos; i++) {
      await new Promise((resolve) => {
        let seconds = 3;
        setCountdown(seconds);
        const interval = setInterval(() => {
          seconds -= 1;
          if (seconds === 0) {
            clearInterval(interval);
            setCountdown(null);
            takePhoto();
            resolve();
          } else {
            setCountdown(seconds);
          }
        }, 1000);
      });
      await new Promise((r) => setTimeout(r, 500));
    }
  };

  const downloadStrip = async () => {
    if (stripRef.current) {
      const canvas = await html2canvas(stripRef.current, { useCORS: true });
      const link = document.createElement("a");
      link.download = `photo-strip-${layout}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  return (
    <div style={{ fontFamily: "'Baloo 2', cursive", textAlign: "center", padding: "20px", position: "relative" }}>
      <h1>Bunluke's Photo Booth</h1>

      {/* Countdown Overlay */}
      {countdown !== null && (
        <div
          style={{
            fontSize: "60px",
            fontWeight: "bold",
            color: selectedColor === "#000000" ? "#ffffff" : selectedColor,
            position: "absolute",
            top: "30%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(255,255,255,0.85)",
            padding: "20px",
            borderRadius: "12px",
            zIndex: 10,
          }}
        >
          {countdown}
        </div>
      )}

      {/* Webcam + Previews Side-by-Side */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: "20px",
          marginTop: "20px",
          flexWrap: "wrap",
        }}
      >
        {/* Webcam */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{
            maxWidth: "500px",
            height: "375px",
            background: "#000",
            transform: "scaleX(-1)",
            objectFit: "cover",
            border: "4px solid #000000",
            borderRadius: "12px"
          }}
        />

        {/* Live Previews */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {photos.map((src, index) => (
            <img
              key={index}
              src={src}
              alt={`Preview ${index + 1}`}
              style={{
                width: "160px",
                borderRadius: "8px",
                border: "2px solid #ccc",
              }}
            />
          ))}
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Layout & Color Picker */}
      <div style={{ marginTop: "20px" }}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ marginRight: "10px", fontWeight: "bold" }}>
            Choose Layout Color:
          </label>
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            style={{ marginRight: "10px" }}
          />
          {[{ label: "White", color: "#ffffff" }, { label: "Black", color: "#000000" }, { label: "Grey", color: "#cccccc" }, { label: "Pink", color: "#ffd1dc" }, { label: "Blue", color: "#aec6cf" }, { label: "Red", color: "#ff6961" }].map(({ label, color }) => (
            <button
              key={label}
              onClick={() => setSelectedColor(color)}
              style={{
                backgroundColor: color,
                color: color === "#000000" ? "#ffffff" : "#000000",
                border: selectedColor === color ? "3px solid #000" : "1px solid #999",
                borderRadius: "6px",
                padding: "6px 12px",
                marginRight: "6px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: "20px" }}>
          {Object.keys(layoutPresets).map((key) => (
            <button
              key={key}
              onClick={() => {
                setLayout(key);
                setPhotos([]);
              }}
              style={{
                margin: "5px",
                padding: "10px 16px",
                borderRadius: "8px",
                fontWeight: "bold",
                backgroundColor: layout === key ? "#333" : selectedColor,
                color:
                  layout === key
                    ? "#ffffff"
                    : selectedColor === "#000000"
                    ? "#ffffff"
                    : "#000000",
                border: layout === key ? "2px solid #000" : "1px solid #aaa",
                transform: layout === key ? "scale(1.05)" : "none",
                boxShadow: layout === key ? "0 0 10px rgba(0,0,0,0.2)" : "none",
                transition: "all 0.2s ease",
                cursor: "pointer",
              }}
            >
              Layout {key} ({layoutPresets[key]} poses)
            </button>
          ))}
        </div>
      </div>

      {/* Capture Buttons */}
      <div>
        <button onClick={takePhoto} style={{ marginTop: "20px" }}>
          Take Photo
        </button>
        <button onClick={startSession} style={{ marginTop: "20px", marginLeft: "10px" }}>
          Start Session
        </button>
      </div>

      {/* Final Strip Display (at the bottom) */}
      {photos.length === layoutPresets[layout] && (
        <>
          <div
            ref={stripRef}
            style={{
              background: selectedColor,
              padding: "12px",
              width: layout === "A" || layout === "D" ? "350px" : "220px",
              borderRadius: "10px",
              margin: "40px auto 20px",
              display: "grid",
              gridTemplateColumns: layout === "A" || layout === "D" ? "1fr 1fr" : "1fr",
              gap: "8px",
              justifyItems: "center",
            }}
          >
            {photos.map((src, index) => (
              <img
                key={index}
                src={src}
                alt={`Pose ${index + 1}`}
                style={{
                  width: "100%",
                  borderRadius: "8px",
                }}
              />
            ))}
            <div
              style={{
                gridColumn: layout === "A" || layout === "D" ? "span 2" : "span 1",
                textAlign: "center",
                marginTop: "10px",
                fontWeight: "bold",
                color: selectedColor === "#000000" ? "#ffffff" : "#000000",
              }}
            >
              Bunluke's Booth – {new Date().toLocaleDateString()}
            </div>
          </div>

          <button onClick={downloadStrip}>Download Strip</button>
        </>
      )}
    </div>
  );
}

export default App;
