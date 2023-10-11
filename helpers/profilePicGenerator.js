import { createCanvas } from "canvas";

function randColor() {
  let hue = Math.floor(Math.random() * (360 - 0 + 1) + 0);
  return `hsl(${hue}, 70%, 35%)`;
}

function randProfilePicture(str) {
  const canvas = createCanvas(600, 600);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = randColor();
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Circles
  ctx.beginPath();
  ctx.arc(canvas.width / 5, canvas.height / 3, 28, 0, 2 * Math.PI, false);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.closePath();

  ctx.beginPath();
  ctx.arc(
    canvas.width - canvas.width / 5,
    canvas.height / 3,
    28,
    0,
    2 * Math.PI,
    false
  );
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.closePath();

  // Arc
  ctx.beginPath();
  ctx.arc(
    canvas.width / 2 + 80,
    canvas.height / 2 + 40,
    100,
    1 * Math.PI,
    0,
    true
  );
  ctx.lineWidth = 28;
  ctx.strokeStyle = "#fff";
  ctx.stroke();
  ctx.closePath();

  return canvas.toDataURL("image/png");
}

export default randProfilePicture;
