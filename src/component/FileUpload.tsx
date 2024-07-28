import React, {
  useState,
  useRef,
  useEffect,
  ChangeEvent,
  FormEvent,
} from "react";
import axios from "axios";
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
      const base64Image = (image as string).split(",")[1];
      const response = await axios({
        method: "POST",
        url: "https://detect.roboflow.com/empty-shelf-detection-nipzt/3",
        params: {
          api_key: "UOL5rcqze2zXSUwYcKdl",
        },
        data: base64Image,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      console.log(response.data);
      setDetections(response.data.predictions || []);
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
                ctx.lineWidth = 10; // Thicker border
                ctx.strokeStyle = "red";
                ctx.stroke();
                ctx.closePath();

                ctx.font = "bold 82px Arial"; // Thicker and larger text
                ctx.fillStyle = "red";
                ctx.textAlign = "center";
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
  }, [preview, detections]);

  return (
    <div className="container mt-5">
      <h2>Image Upload</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="formFile" className="form-label">
            Choose an image file:
          </label>
          <input
            className="form-control"
            type="file"
            id="formFile"
            onChange={handleFileChange}
          />
        </div>
        <div className="d-flex justify-content-between">
          <div className="card custom-card">
            <div className="card-header text-center">Original Image</div>
            {preview && (
              <div className="card-body d-flex justify-content-center align-items-center custom-card-body">
                <img
                  src={preview}
                  alt="Original"
                  className="img-thumbnail custom-img"
                />
              </div>
            )}
          </div>
          <div className="card custom-card">
            <div className="card-header text-center">Image with Detections</div>
            {preview && (
              <div className="card-body d-flex justify-content-center align-items-center custom-card-body">
                <canvas ref={canvasRef} className="img-thumbnail custom-img" />
              </div>
            )}
          </div>
        </div>
        <button
          type="submit"
          className="btn btn-primary mt-3"
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </form>
    </div>
  );
};

export default FileUpload;
