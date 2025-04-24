// src/AddPlantForm.js
import React, { useState } from 'react';
import './App.css';

function AddPlantForm({ onPlantAdded }) { // Receive callback function as prop
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [interval, setInterval] = useState(7); // Default interval
  const [imageFilename, setImageFilename] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault(); // Prevent default HTML form submission
    setError(null); // Clear previous errors
    setIsSubmitting(true);

    // Basic validation
    if (!name.trim() || interval <= 0) {
      setError("Plant name and a positive watering interval are required.");
      setIsSubmitting(false);
      return;
    }

    const newPlantData = {
      name: name.trim(),
      species: species.trim() || null, // Send null if empty
      watering_interval: parseInt(interval, 10), // Ensure it's a number
      image_filename: imageFilename.trim() || null, // Send null if empty
    };

    // Send data to the backend API
    fetch('/plants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newPlantData),
    })
    .then(res => {
      if (!res.ok) {
        // If status is not 2xx, try to get error message from response body
        return res.json().then(errData => {
            throw new Error(`Failed to add plant: ${errData.error || res.statusText}`);
        }).catch(() => {
            // Fallback if response body isn't JSON or doesn't have 'error'
            throw new Error(`Failed to add plant. Status: ${res.status}`);
        });
      }
      // Check specifically for 201 Created status
      if (res.status === 201) {
          return res.json(); // Get the newly created plant data
      } else {
          // Handle unexpected success status codes if needed
          console.warn("Received unexpected success status:", res.status);
          return res.json();
      }
    })
    .then(addedPlant => {
      console.log("Plant added successfully:", addedPlant);
      onPlantAdded(addedPlant); // Call the function passed from App component
      // Reset form fields
      setName('');
      setSpecies('');
      setInterval(7);
      setImageFilename('');
      setIsSubmitting(false);
    })
    .catch(err => {
      console.error("Error adding plant:", err);
      setError(err.message); // Display error to user
      setIsSubmitting(false);
    });
  };

//   // Basic form styling (can be moved to CSS)
//   const formStyle = {
//       border: '1px solid #ccc', padding: '20px', marginBottom: '20px', borderRadius: '8px', backgroundColor: '#f9f9f9'
//   };
//   const inputGroupStyle = { marginBottom: '10px' };
//   const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold' };
//   const inputStyle = { width: 'calc(100% - 16px)', padding: '8px', border: '1px solid #ccc', borderRadius: '4px'};
//   const buttonStyle = { padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };
//   const errorStyle = { color: 'red', marginTop: '10px' };

return (
    // --- ADD className HERE ---
    <form onSubmit={handleSubmit} className="add-plant-form">
      <h2>Add a New Plant</h2>
      {/* Remove inline styles from divs/labels/inputs if desired */}
      <div className="form-group">
        <label htmlFor="plantName">Plant Name*:</label>
        <input
          type="text"
          id="plantName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="plantSpecies">Species:</label>
        <input
          type="text"
          id="plantSpecies"
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="plantInterval">Watering Interval (days)*:</label>
        <input
          type="number"
          id="plantInterval"
          value={interval}
          onChange={(e) => setInterval(e.target.value)}
          required
          min="1"
        />
      </div>
      <div className="form-group">
        <label htmlFor="plantImage">Image Filename (e.g., c.png):</label>
        <input
          type="text"
          id="plantImage"
          value={imageFilename}
          onChange={(e) => setImageFilename(e.target.value)}
        />
         <small>(Place image in `src/Images`)</small>
      </div>
      {/* Target the button by type */}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Adding...' : 'Add Plant'}
      </button>
      {error && <p className="form-error">{error}</p>}
    </form>
  );
}

export default AddPlantForm;