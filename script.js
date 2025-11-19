const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const resultDiv = document.getElementById("result");

// Start webcam
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
  })
  .catch(err => {
    console.error("Camera error:", err);
  });

// Analyze face
document.getElementById("analyze").addEventListener("click", async () => {
  const ctx = canvas.getContext("2d");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const base64 = canvas.toDataURL("image/jpeg").split(",")[1];

  const body = {
    requests: [{
      image: { content: base64 },
      features: [{ type: "FACE_DETECTION" }]
    }]
  };

  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=YOUR_API_KEY_HERE`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }
  );

  const data = await res.json();
  console.log(data);

  if (data.responses[0].faceAnnotations) {
    resultDiv.textContent = "✅ Face Detected";
  } else {
    resultDiv.textContent = "❌ No Face Found";
  }
});
