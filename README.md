# CinePalette

CinePalette is a web application that allows you to apply color grading filters to your images using pre-defined color palettes or custom ones. It also offers various image adjustments such as contrast, noise, and filter intensity, along with color space options like RGB, LAB, and HSV. The app is built using React and leverages advanced image processing techniques for real-time adjustments.

## Features

- **Image Upload**: Upload any image and begin applying filters.
- **Palette Extraction**: Extract a color palette from an image with a customizable number of colors.
- **Color Grading**: Apply color grading filters using both predefined and custom color palettes.
- **Intensity Control**: Adjust the strength of the applied filter with a dedicated intensity slider.
- **Contrast Adjustment**: Change the contrast of your image with an intuitive slider.
- **Noise Adjustment**: Add or reduce noise in the image for a stylized effect.
- **Multiple Color Models**: Choose from RGB, LAB, or HSV color models for a more nuanced image processing experience.
- **Custom Palettes**: Create and save your own color palettes for later use.
- **Real-time Preview**: Compare the original and the filtered images side-by-side in real-time.

## Installation


To run this project locally, you need to have [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed. Follow these steps to set up the project:

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/cinepalette.git
2.	Navigate to the project directory:
   **cd cinepalette**
4.	Install the dependencies:
   **npm install**
5. Start the development server:
   **npm start**
The app will be available at http://localhost:3000

Usage

Once the application is up and running, you can:
	1.	Upload an image using the file upload input.
	2.	Choose a pre-defined color palette or extract a custom palette from the image.
	3.	Adjust the intensity of the filter to your liking.
	4.	Fine-tune contrast, noise, and other image properties using the available sliders.
	5.	Preview the filtered image in real-time and compare it with the original image using a side-by-side view.
	6.	Download the final image once you’re satisfied with the result.

Color Models

This application supports three color models:
	•	RGB: The most common color model, based on the combination of red, green, and blue channels.
	•	LAB: A perceptual color model that is device-independent, often used for image processing as it more closely resembles human vision.
	•	HSV: A color model based on hue, saturation, and value. This model allows easy manipulation of colors, particularly saturation and brightness.

The user can select which model to apply while adjusting the colors, making it versatile for different types of color corrections.
