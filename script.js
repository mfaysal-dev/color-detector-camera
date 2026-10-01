// DOM Elements
const video = document.getElementById('cam');
const startBtn = document.getElementById('startBtn');
const resultSection = document.getElementById('resultSection');
const colorPreview = document.getElementById('colorPreview');
const colorNameEl = document.getElementById('colorName');
const colorHexEl = document.getElementById('colorHex');
const colorRgbEl = document.getElementById('colorRgb');

let canvas, ctx;
let isRunning = false;

// Start Camera
startBtn.addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        });

        video.srcObject = stream;
        await video.play();

        // Initialize canvas
        canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx = canvas.getContext('2d');

        // Update UI
        isRunning = true;
        startBtn.disabled = true;
        startBtn.innerHTML = '<i class="fas fa-check"></i> চলছে...';
        resultSection.style.display = 'block';

        // Start detection loop
        detectColor();

    } catch (err) {
        alert('ক্যামেরা অনুমতি দিন! Please allow camera access.');
        console.error('Camera error:', err);
    }
});

// Main Detection Loop
function detectColor() {
    if (!isRunning) return;

    // Draw current frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get center pixel coordinates
    const centerX = Math.floor(canvas.width / 2);
    const centerY = Math.floor(canvas.height / 2);

    // Get pixel color data
    const pixelData = ctx.getImageData(centerX, centerY, 1, 1).data;
    const r = pixelData[0];
    const g = pixelData[1];
    const b = pixelData[2];

    // Convert to HEX
    const hex = rgbToHex(r, g, b);

    // Get color name
    const name = getColorName(r, g, b);

    // Update display
    colorPreview.style.background = hex;
    colorNameEl.textContent = name;
    colorHexEl.textContent = hex.toUpperCase();
    colorRgbEl.textContent = `${r}, ${g}, ${b}`;

    // Repeat
    requestAnimationFrame(detectColor);
}

// RGB to HEX Converter
function rgbToHex(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// RGB to HSL Converter
function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// Get Color Name from RGB Values
function getColorName(r, g, b) {
    const hsl = rgbToHsl(r, g, b);
    const brightness = (r + g + b) / 3;

    // Achromatic colors
    if (hsl.s < 15) {
        if (brightness > 220) return 'সাদা';
        if (brightness < 60) return 'কালো';
        if (brightness < 120) return 'গাঢ় ধূসর';
        return 'ধূসর';
    }

    // Chromatic colors
    if (hsl.h < 15 || hsl.h >= 345) return 'লাল';
    if (hsl.h < 45) return 'কমলা';
    if (hsl.h < 65) return 'হলুদ';
    if (hsl.h < 150) return 'সবুজ';
    if (hsl.h < 210) return 'আকাশী';
    if (hsl.h < 270) return 'নীল';
    if (hsl.h < 330) return 'বেগুনি';
    return 'লাল';
}

// Cleanup
window.addEventListener('beforeunload', () => {
    isRunning = false;
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
});