import React, {
  useState,
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
} from "react";
import axios from "axios";
import ARViewer from "../component/ARViewer";
import "./FileUpload.css";

const loadImageBase64 = (file: File): Promise<string | ArrayBuffer | null> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [detections, setDetections] = useState<any[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (selectedFile) {
      setPreview(URL.createObjectURL(selectedFile));
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    try {
      setUploading(true);
      const image = await loadImageBase64(file);
      const response = await axios({
        method: "POST",
        url: "https://detect.roboflow.com/empty-shelf-detection-nipzt/3",
        params: {
          api_key: "UOL5rcqze2zXSUwYcKdl",
        },
        data: image,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      console.log(response.data);
      setDetections(response.data.predictions);
      alert("File uploaded successfully");
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (preview && detections.length > 0) {
      const img = new Image();
      img.src = preview;
      img.onload = () => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0, img.width, img.height);

            detections
              .filter((d) => d.class === "missing")
              .forEach((detection) => {
                const {
                  x,
                  y,
                  width: bboxWidth,
                  height: bboxHeight,
                  confidence,
                } = detection;
                ctx.beginPath();
                ctx.rect(
                  x - bboxWidth / 2,
                  y - bboxHeight / 2,
                  bboxWidth,
                  bboxHeight
                );
                ctx.lineWidth = 4; // Thicker border
                ctx.strokeStyle = "red";
                ctx.stroke();
                ctx.closePath();

                ctx.font = "bold 22px Arial"; // Thicker and smaller text
                ctx.fillStyle = "red";
                ctx.textAlign = "center";
                ctx.shadowColor = "white";
                ctx.shadowBlur = 1;
                ctx.fillText(
                  `${Math.round(confidence * 100)}%`,
                  x,
                  y - bboxHeight / 2 - 5
                );
              });
          }
        }
      };
    }
  }, [detections]);

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-brand">Your Brand</div>
        <div className="navbar-center">DPA Flash</div>
        <div className="navbar-signin">Sign In</div>
      </nav>
      <div className="container mt-5 upload-section">
        <div className="upload-container">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="formFile" className="form-label">
                Drag and Drop file or Browse:
              </label>
              <input
                className="form-control"
                type="file"
                id="formFile"
                onChange={handleFileChange}
              />
            </div>
            {preview && (
              <div className="mb-3">
                <img
                  src={preview}
                  alt="Preview"
                  className="img-thumbnail"
                  width="200"
                />
              </div>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </form>
        </div>
      </div>
      <div className="container mt-5 result-section">
        <div className="custom-card">
          <div className="card-header">Original Image</div>
          <div className="card-body d-flex justify-content-center align-items-center custom-card-body img-thumbnail custom-img">
            {preview && (
              <img src={preview} alt="Original" className="card-body " />
            )}
          </div>
        </div>

        <div className="spaceven">
          <br />
        </div>
        <div className="custom-card">
          <div className="card-header">Detection Result</div>
          <div className="card-body">
            {preview && (
              <div className="card-body d-flex justify-content-center align-items-center custom-card-body">
                <canvas ref={canvasRef} className="img-thumbnail custom-img" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;