// src/EditPlantForm.js
import React, { useState, useEffect } from 'react';

// Pass current plant data, save handler, and cancel handler as props
function EditPlantForm({ plant, onSave, onCancel }) {
  // Initialize state with current plant data
  const [name, setName] = useState(plant.name);
  const [species, setSpecies] = useState(plant.species || ''); // Handle null species
  const [interval, setInterval] = useState(plant.watering_interval);
  const [imageFilename, setImageFilename] = useState(plant.image_filename || ''); // Handle null image
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Handle potential prop changes (though unlikely in this setup)
  useEffect(() => {
      setName(plant.name);
      setSpecies(plant.species || '');
      setInterval(plant.watering_interval);
      setImageFilename(plant.image_filename || '');
  }, [plant]);


  const handleSave = (event) => {
    event.preventDefault();
    setError(null);

    if (!name.trim() || interval <= 0) {
      setError("Plant name and a positive watering interval are required.");
      return;
    }
    setIsSaving(true);

    const updatedPlantData = {
      // Include ID only if backend needs it for update verification (usually not for PUT body)
      // id: plant.id,
      name: name.trim(),
      species: species.trim() || null,
      watering_interval: parseInt(interval, 10),
      image_filename: imageFilename.trim() || null,
      // IMPORTANT: Do NOT send last_watered or next_watering from here
      // Keep existing values for those on the backend during update
    };

    // Call the onSave function passed from PlantTimer, sending the data
    // The actual API call will happen in PlantTimer's handler
    onSave(updatedPlantData)
        .catch((err) => {
             // If onSave rejects promise (API error), show error here
             setError(err.message || "Failed to save changes.");
        })
        .finally(() => {
            setIsSaving(false); // Re-enable button even on error
        });
  };

  return (
    // Use same form class for consistent styling?
    <form onSubmit={handleSave} className="add-plant-form edit-plant-form">
      {/* Add specific class if different styling needed */}
      <h4>Edit Plant</h4> {/* Changed from h2 */}
      {error && <p className="form-error">{error}</p>}

      {/* Reusing form-group class */}
      <div className="form-group">
        <label htmlFor={`editName-${plant.id}`}>Plant Name*:</label>
        <input
          type="text"
          id={`editName-${plant.id}`} // Unique ID needed if multiple forms could exist
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor={`editSpecies-${plant.id}`}>Species:</label>
        <input
          type="text"
          id={`editSpecies-${plant.id}`}
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor={`editInterval-${plant.id}`}>Watering Interval (days)*:</label>
        <input
          type="number"
          id={`editInterval-${plant.id}`}
          value={interval}
          onChange={(e) => setInterval(e.target.value)}
          required
          min="1"
        />
      </div>
       {/* <div className="form-group">
        <label htmlFor={`editImage-${plant.id}`}>Image Filename:</label>
        <input
          type="text"
          id={`editImage-${plant.id}`}
          value={imageFilename}
          onChange={(e) => setImageFilename(e.target.value)}
        />
         <small>(Must exist in `src/Images`)</small>
      </div> */}

      {/* Buttons for Save/Cancel */}
      <div className="edit-form-buttons">
        <button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
        {/* Call onCancel passed from PlantTimer when Cancel is clicked */}
        <button type="button" onClick={onCancel} disabled={isSaving}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default EditPlantForm;