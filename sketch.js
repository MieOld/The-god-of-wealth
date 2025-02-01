let handPose;
let video;
let hands = [];
let bgImage;
let images = {};
let coinImage;
let coins = [];
let gameActive = true; // Track game state
let movedImages = {}; // Store animation states
let allTouched = false;
let showRetryButton = false;
let startTime;

// Define three points arranged horizontally in the middle of the screen
let points = [
  { x: 165, y: 492, number: 1 },
  { x: 280, y: 492, number: 2 },
  { x: 395, y: 492, number: 3 }
];
let touchedPoints = new Set(); // 记录被点击过的小球编号

function preload() {
  handPose = ml5.handPose();
  bgImage = loadImage('background.jpg'); // Default background image
  images[1] = loadImage('png1.png');
  images[2] = loadImage('png2.png');
  images[3] = loadImage('png3.png');
  coinImage = loadImage('coin.png');
}

function setup() {
  createCanvas(560, 820); // Adjust canvas size to fit both images
  video = createCapture(VIDEO);
  video.size(560, 410);
  video.hide();
  handPose.detectStart(video, gotHands);

  for (let i = 1; i <= 3; i++) {
    movedImages[i] = { x: 0, y: 410, targetY: 0, moving: false };
  }
}

function draw() {
  console.log("Draw function running");
  image(bgImage, 0, 0, 560, 410); // Draw background image

  // Draw video feed (flipped horizontally)
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 410, 560, 410);
  pop();

  // Move images if needed
  for (let i = 1; i <= 3; i++) {
    if (movedImages[i].moving) {
      movedImages[i].y -= 20;
      if (movedImages[i].y <= movedImages[i].targetY) {
        movedImages[i].y = movedImages[i].targetY;
        movedImages[i].moving = false;
      }
    }
    image(images[i], movedImages[i].x, movedImages[i].y, 560, 410);
  }

  // Detect hands and update game state
  detectHands();
  drawPoints();
  drawHandKeypoints();

  // Start coin rain if all points are touched
  if (allTouched) {
    console.log("All touched! Starting coin rain...");
    generateCoins();
    updateCoins();
    if (millis() - startTime > 3000) {
      showRetryButton = true;
    }
  }

  // Draw retry button if needed
  if (showRetryButton) {
    drawRetryButton();
  }
}

function detectHands() {
  console.log("Detecting hands...");
  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    for (let j = 0; j < hand.keypoints.length; j++) {
      let keypoint = hand.keypoints[j];
      let mirroredX = width - keypoint.x;
      for (let k = 0; k < points.length; k++) {
        let d = dist(mirroredX, keypoint.y + 410, points[k].x, points[k].y);
        if (d < 30) { // 增大距离阈值
          touchedPoints.add(points[k].number); // 记录被点击过的小球编号
          movedImages[points[k].number].moving = true;
        }
      }
    }
  }
  console.log("Touched points:", touchedPoints, "All touched:", allTouched);
  if (touchedPoints.size === 3 && !allTouched) {
    allTouched = true;
    startTime = millis();
    console.log("✅✅✅ 所有小球都被触碰！金币雨启动！");
  }
}

function drawPoints() {
  for (let i = 0; i < points.length; i++) {
    fill(243, 216, 29);
    noStroke();
    circle(points[i].x, points[i].y, 15);
  }
}

function drawHandKeypoints() {
  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    for (let j = 0; j < hand.keypoints.length; j++) {
      let keypoint = hand.keypoints[j];
      let mirroredX = width - keypoint.x;
      fill(255, 105, 180);
      noStroke();
      circle(mirroredX, keypoint.y + 410, 10);
    }
  }
}

function generateCoins() {
  if (frameCount % 25 === 0) { // Generate coins more frequently
    for (let i = 0; i < 5; i++) {
      let newCoin = { x: random(width), y: random(-100, 0), speed: random(2, 5) };
      coins.push(newCoin);
    }
    console.log("Coins generated:", coins.length);
  }
}

function updateCoins() {
  for (let i = coins.length - 1; i >= 0; i--) {
    let coin = coins[i];
    coin.y += coin.speed;
    image(coinImage, coin.x, coin.y, 60, 60);
    if (coin.y > height) {
      coins.splice(i, 1); // Remove coins that fall off the screen
    }
  }
}

function drawRetryButton() {
  fill(255, 105, 180);
  rect(width / 2 - 50, 750, 100, 50, 10);
  fill(255);
  textSize(20);
  textAlign(CENTER, CENTER);
  text("再拜一次", width / 2, 775);
}

function gotHands(results) {
  hands = results;
  console.log("Hands detected:", hands);
}

function mousePressed() {
  if (showRetryButton && mouseX > width / 2 - 50 && mouseX < width / 2 + 50 && mouseY > 750 && mouseY < 800) {
    // Reset game state
    allTouched = false;
    showRetryButton = false;
    coins = [];
    touchedPoints.clear();
    for (let i = 1; i <= 3; i++) {
      movedImages[i] = { x: 0, y: 410, targetY: 0, moving: false };
    }
  }
}