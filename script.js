// -------------------------
// Load face-api.js Models
// -------------------------
Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri("models/"),
  faceapi.nets.faceRecognitionNet.loadFromUri("models/"),
  faceapi.nets.faceLandmark68Net.loadFromUri("models/")
]).then(() => {
  console.log("Face API Models Loaded");
});

// -------------------------
// Load Student Dataset
// -------------------------
async function loadStudentData() {
  const response = await fetch("students.json");
  const students = await response.json();
  const labeledDescriptors = [];

  for (const student of students) {
    const descriptors = [];

    for (let i = 1; i <= student.images; i++) {
      try {
        const imgUrl = `students/${student.name}/${i}.png`;  // we use PNG
        const img = await faceapi.fetchImage(imgUrl);

        const det = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!det) {
          console.warn(`No face detected for ${student.name}/${i}.png`);
          continue;
        }

        descriptors.push(det.descriptor);

      } catch (error) {
        console.error("Error loading student image:", error);
      }
    }

    if (descriptors.length > 0) {
      labeledDescriptors.push(
        new faceapi.LabeledFaceDescriptors(student.name, descriptors)
      );
    }
  }

  return labeledDescriptors;
}

// -------------------------
// Handle Group Photo Upload
// -------------------------
document.getElementById("photoInput").addEventListener("change", async function () {
  const file = this.files[0];
  if (!file) return;

  const img = document.getElementById("groupPhoto");
  img.src = URL.createObjectURL(file);

  const attendanceList = document.getElementById("attendanceList");
  attendanceList.innerHTML = "";

  // Load student dataset
  const labeledDescriptors = await loadStudentData();
  const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);

  img.onload = async () => {
    const detections = await faceapi
      .detectAllFaces(img)
      .withFaceLandmarks()
      .withFaceDescriptors();

    console.log("Faces Detected:", detections.length);

    detections.forEach((fd, i) => {
      const bestMatch = faceMatcher.findBestMatch(fd.descriptor);

      let li = document.createElement("li");
      li.textContent = `${bestMatch.toString()}`;
      attendanceList.appendChild(li);
    });
  };
});
