import React, { useState, useRef, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { ReactCompareSlider, ReactCompareSliderImage, ReactCompareSliderHandle } from "react-compare-slider";
import Color from "colorjs.io";

// Default palettes
const defaultPalettes = {
  "ColorChecker Classic": [
    [115, 82, 68], [194, 150, 130], [98, 122, 157], [87, 108, 67],
    [133, 128, 177], [103, 189, 170], [214, 126, 44], [80, 91, 166],
    [193, 90, 99], [94, 60, 108], [157, 188, 64], [224, 163, 46],
    [56, 61, 150], [70, 148, 73], [175, 54, 60], [231, 199, 31],
    [187, 86, 149], [8, 133, 161]
  ],
  "Portra 400": [
    [75, 60, 50], [160, 130, 110], [220, 200, 180], [60, 100, 80], [180, 150, 100]
  ],
  "Pro 400H": [
    [100, 120, 90], [180, 200, 170], [240, 210, 190], [140, 100, 80], [90, 160, 140]
  ],
  "Teal & Orange": [
    [38, 70, 83], [42, 157, 143], [233, 196, 106], [244, 162, 97], [231, 111, 81]
  ],
  "Sepia": [
    [112, 66, 20], [133, 94, 66], [192, 154, 107], [224, 192, 147]
  ],
  "Black & White": [
    [0, 0, 0], [255, 255, 255], [127, 127, 127]
  ]
};

// Helper functions
function getLuminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function colorDistance(c1, c2) {
  return Math.sqrt((c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2 + (c1[2] - c2[2]) ** 2);
}

function filterColors(colors, minBrightness = 30, maxBrightness = 230, minDistance = 25) {
  const filtered = [];
  for (const color of colors) {
    const luminance = getLuminance(...color);
    if (luminance < minBrightness || luminance > maxBrightness) continue;
    if (filtered.every(f => colorDistance(color, f) >= minDistance)) {
      filtered.push(color);
    }
  }
  return filtered;
}

// Conversion helper functions
function rgbToLab(r, g, b) {
  const color = new Color({ coords: [r / 255, g / 255, b / 255], space: "srgb" }).to("lab");
  return color.coords;
}

// Function to convert RGB to HSV
function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  let s = max === 0 ? 0 : delta / max;
  let v = max;

  if (delta !== 0) {
    if (max === r) {
      h = (g - b) / delta;
    } else if (max === g) {
      h = 2 + (b - r) / delta;
    } else {
      h = 4 + (r - g) / delta;
    }

    h *= 60;
    if (h < 0) h += 360;
  }

  return [h, s * 100, v * 100];
}

export default function App() {
  const [image, setImage] = useState(null);
  const [filteredImage, setFilteredImage] = useState(null);
  const [palettes, setPalettes] = useState(defaultPalettes);
  const [selectedPalette, setSelectedPalette] = useState("Portra 400");
  const [customColors, setCustomColors] = useState([]);
  const [newPaletteName, setNewPaletteName] = useState("");
  const [pickerColor, setPickerColor] = useState("#ffffff");
  const [mode, setMode] = useState("rgb");
  const [colorCount, setColorCount] = useState(10); // Number of colors to extract
  const [intensity, setIntensity] = useState(100); // Intensity slider for palette application
  const [contrast, setContrast] = useState(0); // Contrast control
  const [noise, setNoise] = useState(0); // Noise control
  const lastExtractedImageRef = useRef(null);
  const lastColorCountRef = useRef(null);
  const canvasRef = useRef(null);

  // Store the original contrast of the image
  const [originalContrast, setOriginalContrast] = useState(0);

  useEffect(() => {
    // Update image to the initial state (without modifications)
    if (image) {
      setFilteredImage(image); // Set the original image
      setOriginalContrast(0); // Set the original contrast
      setIntensity(100); // Reset intensity slider to its full value (no effect)
      setContrast(0); // Reset to default (no contrast effect)
      setNoise(0); // Reset noise to 0 (no effect)
    }
  }, [image]);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target.result);
        setFilteredImage(null); // Initially set the filtered image to null
        lastExtractedImageRef.current = null;
        lastColorCountRef.current = null;
      };
      reader.readAsDataURL(file);
    }
  };

  const extractPalette = () => {
    if (!image || (image === lastExtractedImageRef.current && colorCount === lastColorCountRef.current)) return;

    const img = new Image();
    img.src = image;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const colorMap = new Map();

      for (let i = 0; i < imageData.length; i += 4) {
        const key = `${imageData[i]},${imageData[i + 1]},${imageData[i + 2]}`;
        colorMap.set(key, (colorMap.get(key) || 0) + 1);
      }

      const sorted = Array.from(colorMap.entries()).sort((a, b) => b[1] - a[1]);
      const topRaw = sorted.map(([str]) => str.split(",").map(Number));
      const topColors = filterColors(topRaw).slice(0, colorCount);

      const randomId = Math.floor(10000 + Math.random() * 90000);
      const name = `Palette_${colorCount}_${randomId}`;

      setPalettes(prev => ({ ...prev, [name]: topColors }));
      setSelectedPalette(name);
      lastExtractedImageRef.current = image;
      lastColorCountRef.current = colorCount;
    };
  };

  const applyPaletteFilter = () => {
    const palette = palettes[selectedPalette];
    const img = new Image();
    img.src = image;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let paletteLAB = null;
      let paletteHSV = null;

      if (mode === "lab") {
        paletteLAB = palette.map(([r, g, b]) =>
          new Color({ coords: [r / 255, g / 255, b / 255], space: "srgb" }).to("lab")
        );
      }

      if (mode === "hsv") {
        paletteHSV = palette.map(([r, g, b]) =>
          rgbToHsv(r, g, b)
        );
      }

      const findClosestColor = (r, g, b) => {
        if (mode === "lab") {
          const color1 = new Color({ coords: [r / 255, g / 255, b / 255], space: "srgb" }).to("lab");
          let minDist = Infinity;
          let closest = [r, g, b];
          for (let i = 0; i < paletteLAB.length; i++) {
            const color2 = paletteLAB[i];
            const dist = color1.distance(color2);
            if (dist < minDist) {
              minDist = dist;
              closest = palette[i];
            }
          }
          return closest;
        } else if (mode === "hsv") {
          const hsv1 = rgbToHsv(r, g, b);
          let minDist = Infinity;
          let closest = [r, g, b];
          for (let i = 0; i < paletteHSV.length; i++) {
            const dist = Math.sqrt(
              (hsv1[0] - paletteHSV[i][0]) ** 2 + 
              (hsv1[1] - paletteHSV[i][1]) ** 2 + 
              (hsv1[2] - paletteHSV[i][2]) ** 2
            );
            if (dist < minDist) {
              minDist = dist;
              closest = palette[i];
            }
          }
          return closest;
        } else {
          let minDist = Infinity;
          let closest = [r, g, b];
          for (let [pr, pg, pb] of palette) {
            const dist = Math.sqrt((r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2);
            if (dist < minDist) {
              minDist = dist;
              closest = [pr, pg, pb];
            }
          }
          return closest;
        }
      };

      const blendColors = (original, paletteColor, intensity) => {
        const blendRatio = intensity / 100;
        return [
          Math.round(original[0] * (1 - blendRatio) + paletteColor[0] * blendRatio),
          Math.round(original[1] * (1 - blendRatio) + paletteColor[1] * blendRatio),
          Math.round(original[2] * (1 - blendRatio) + paletteColor[2] * blendRatio),
        ];
      };

      const applyEffects = (r, g, b) => {
        const contrastFactor = (259 * (originalContrast + contrast + 255)) / (255 * (259 - (originalContrast + contrast)));
        r = contrastFactor * (r - 128) + 128;
        g = contrastFactor * (g - 128) + 128;
        b = contrastFactor * (b - 128) + 128;

        r += Math.random() * noise - noise / 2;
        g += Math.random() * noise - noise / 2;
        b += Math.random() * noise - noise / 2;

        return [r, g, b];
      };

      for (let i = 0; i < data.length; i += 4) {
        let [r, g, b] = [data[i], data[i + 1], data[i + 2]];
        const [nr, ng, nb] = findClosestColor(r, g, b);
        const [blendedR, blendedG, blendedB] = blendColors([r, g, b], [nr, ng, nb], intensity);
        [data[i], data[i + 1], data[i + 2]] = applyEffects(blendedR, blendedG, blendedB);
      }

      ctx.putImageData(imageData, 0, 0);
      setFilteredImage(canvas.toDataURL());
    };
  };

  const addCustomColor = () => {
    const rgb = hexToRgb(pickerColor);
    setCustomColors([...customColors, rgb]);
  };

  const saveCustomPalette = () => {
    if (!newPaletteName || customColors.length === 0) return;
    const newPalettes = { ...palettes, [newPaletteName]: customColors };
    setPalettes(newPalettes);
    setSelectedPalette(newPaletteName);
    setNewPaletteName("");
    setCustomColors([]);
  };

  const resetSettings = () => {
    // Clear the filtered image, but not the original image
    setFilteredImage(null);
    setContrast(0);
    setNoise(0);
    setIntensity(100);
    setOriginalContrast(0);
  };

  const downloadImage = () => {
    const link = document.createElement("a");
    link.download = "filtered-image.png";
    link.href = filteredImage;
    link.click();
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Inter, sans-serif", backgroundColor: "#1b1b1b", color: "#f5f5f5" }}>
      <div style={{ width: 320, padding: 24, backgroundColor: "#111", borderRight: "1px solid #333", overflowY: "auto" }}>
        <h2 style={{ marginBottom: 16 }}>CinePalette</h2>
        <label>Upload Image</label>
        <input type="file" accept="image/*" onChange={handleUpload} style={{ marginBottom: 12 }} />

        <div style={{ marginBottom: 12 }}>
          <label>Number of Colors</label>
          <input
            type="range"
            min="10"
            max="20"
            value={colorCount}
            onChange={(e) => setColorCount(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        <button onClick={extractPalette} style={{ width: "100%", marginBottom: 12, padding: 8, fontWeight: 600 }}>🎨 Extract Palette</button>

        <label>Palette</label>
        <select value={selectedPalette} onChange={(e) => setSelectedPalette(e.target.value)} style={{ width: "100%", marginBottom: 10 }}>
          {Object.keys(palettes).map((key) => (
            <option key={key} value={key}>{key}</option>
          ))}
        </select>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
          {palettes[selectedPalette].map(([r, g, b], i) => (
            <div key={i} style={{ width: 24, height: 24, backgroundColor: `rgb(${r},${g},${b})`, border: "1px solid #444", borderRadius: 4 }} />
          ))}
        </div>

        {/* Matching Mode */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6 }}>Matching Mode</label>
          <select value={mode} onChange={(e) => setMode(e.target.value)} style={{ width: "100%", padding: 6 }}>
            <option value="rgb">RGB (Euclidean)</option>
            <option value="lab">LAB (Perceptual)</option>
            <option value="hsv">HSV (Color Wheel)</option>
          </select>
        </div>

        {/* Filter Intensity */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6 }}>Filter Intensity</label>
          <input
            type="range"
            min="0"
            max="100"
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        {/* Contrast and Noise sliders */}
        <div style={{ marginBottom: 12 }}>
          <label>Contrast</label>
          <input
            type="range"
            min="-100"
            max="100"
            value={contrast}
            onChange={(e) => setContrast(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Noise</label>
          <input
            type="range"
            min="0"
            max="100"
            value={noise}
            onChange={(e) => setNoise(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        {/* Buttons */}
        {image && (
          <>
            <button onClick={applyPaletteFilter} style={{ width: "100%", padding: 10, backgroundColor: "#f5f5f5", color: "#111", fontWeight: 600 }}>
              🎬 Apply Filter
            </button>
            <button onClick={resetSettings} style={{ width: "100%", padding: 10, backgroundColor: "#f5f5f5", color: "#111", fontWeight: 600 }}>
              🔄 Reset Settings
            </button>
          </>
        )}

        <hr style={{ margin: "24px 0", borderColor: "#444" }} />

        {/* Custom Palette */}
        <details>
          <summary>Custom Palette</summary>
          <input
            value={newPaletteName}
            onChange={(e) => setNewPaletteName(e.target.value)}
            placeholder="Palette Name"
            style={{ width: "100%", marginBottom: 10 }}
          />
          <HexColorPicker color={pickerColor} onChange={setPickerColor} style={{ marginBottom: 10 }} />
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={addCustomColor} style={{ flex: 1 }}>+ Add Color</button>
            <button onClick={saveCustomPalette} style={{ flex: 1 }}>💾 Save</button>
          </div>
        </details>

      </div>

      {/* Image and Download */}
      <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
        {image && filteredImage ? (
          <>
            <div style={{ textAlign: "center", fontSize: 20, marginBottom: 12 }}>Compare</div>
            <div style={{ maxHeight: "80vh", overflow: "hidden", borderRadius: 10 }}>
              <ReactCompareSlider
                itemOne={<ReactCompareSliderImage src={image} alt="Original" style={{ objectFit: "contain", width: "100%", height: "100%" }} />}
                itemTwo={<ReactCompareSliderImage src={filteredImage} alt="Filtered" style={{ objectFit: "contain", width: "100%", height: "100%" }} />}
                handle={({ position }) => (
                  <ReactCompareSliderHandle
                    position={position}
                    buttonStyle={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      backgroundColor: "#ffffffdd",
                      border: "2px solid #333",
                      boxShadow: "0 0 6px rgba(0,0,0,0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: "bold",
                      color: "#000"
                    }}
                  >
                    ⇆
                  </ReactCompareSliderHandle>
                )}
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  maxHeight: "85vh",
                  aspectRatio: "3/2",
                  borderRadius: 10,
                  objectFit: "contain"
                }}
              />
            </div>
            <div style={{ marginTop: 20, textAlign: "center" }}>
              <button
                onClick={downloadImage}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "#4caf50",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontWeight: "600"
                }}
              >
                💾 Save Filtered Image
              </button>
            </div>
          </>
        ) : (
          image && (
            <>
              <div style={{ textAlign: "center", fontSize: 20, marginBottom: 12 }}>Original Image</div>
              <img
                src={image}
                alt="Uploaded"
                style={{
                  width: "100%",
                  maxHeight: "85vh",
                  objectFit: "contain",
                  borderRadius: 10
                }}
              />
            </>
          )
        )}
      </div>
    </div>
  );
}