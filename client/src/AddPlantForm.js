// src/AddPlantForm.js
import React, { useState } from 'react';
import './App.css'; // Ensure you have styles for the form and image gallery
// We'll add styles to App.css, ensure it's imported in App.js or index.js

// Define the list of available image filenames
const availableImageFiles = Array.from({ length: 16 }, (_, i) => `P${i + 1}.png`);
// Generates ['P1.png', 'P2.png', ..., 'P16.png']

function AddPlantForm({ onPlantAdded }) {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [interval, setInterval] = useState(7);
  // --- State for selected image filename ---
  const [selectedImage, setSelectedImage] = useState(null); // Use null when nothing selected
  // --- Remove imageFilename state ---
  // const [imageFilename, setImageFilename] = useState('');

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageSelect = (filename) => {
      setSelectedImage(filename); // Update state when an image is clicked
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError(null);

    // --- Validation ---
    if (!name.trim() || interval <= 0) {
      setError("Plant name and a positive watering interval are required.");
      return;
    }
    // --- Ensure an image is selected ---
    if (!selectedImage) {
        setError("Please select an image for the plant.");
        return;
    }
    // --- End Validation ---

    setIsSubmitting(true);

    const newPlantData = {
      name: name.trim(),
      species: species.trim() || null,
      watering_interval: parseInt(interval, 10),
      // --- Use the selected image state ---
      image_filename: selectedImage,
    };

    // Fetch remains the same
    fetch('/plants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPlantData),
    })
    .then(res => { /* Error handling as before */
        if (!res.ok) { return res.json().then(errData => { throw new Error(`Failed to add plant: ${errData.error || res.statusText}`); }).catch(() => { throw new Error(`Failed to add plant. Status: ${res.status}`); }); }
        if (res.status === 201) { return res.json(); } else { console.warn("Unexpected success status:", res.status); return res.json(); }
    })
    .then(addedPlant => {
      console.log("Plant added successfully:", addedPlant);
      onPlantAdded(addedPlant);
      // Reset form fields, including selected image
      setName('');
      setSpecies('');
      setInterval(7);
      setSelectedImage(null); // Clear selection
      setIsSubmitting(false);
    })
    .catch(err => {
      console.error("Error adding plant:", err);
      setError(err.message);
      setIsSubmitting(false);
    });
  };

  return (
    // Use className for styling from App.css
    <form onSubmit={handleSubmit} className="add-plant-form">
      <h2>Add a New Plant</h2>
      {/* Input fields for name, species, interval (keep as before) */}
      <div className="form-group">
        <label htmlFor="plantName">Plant Name:</label>
        <input type="text" id="plantName" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="form-group">
        <label htmlFor="plantSpecies">Species: (optional)</label>
        <input type="text" id="plantSpecies" value={species} onChange={(e) => setSpecies(e.target.value)} />
      </div>
      <div className="form-group">
        <label htmlFor="plantInterval">Watering Interval in days:</label>
        <input type="number" id="plantInterval" value={interval} onChange={(e) => setInterval(e.target.value)} required min="1" />
      </div>

      {/* --- Image Selection Gallery --- */}
      <div className="form-group">
        <label>Select Plant Image:</label>
        <div className="image-gallery">
          {availableImageFiles.map(filename => (
            <img
              key={filename}
              // Construct URL using Flask static path
              src={`/plant_images/${filename}`}
              alt={`Select ${filename.replace('.png', '')}`} // More descriptive alt text
              // Add 'selected' class conditionally
              className={`gallery-image ${selectedImage === filename ? 'selected' : ''}`}
              // Update state on click
              onClick={() => handleImageSelect(filename)}
            />
          ))}
        </div>
      </div>
      {/* --- End Image Selection --- */}


      {/* Submit button (keep as before) */}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Adding...' : 'Add Plant'}
      </button>
      {error && <p className="form-error">{error}</p>}
    </form>
  );
}

export default AddPlantForm;