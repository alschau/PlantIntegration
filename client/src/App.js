// src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import AddPlantForm from './AddPlantForm';

// Helper function to format remaining seconds
function formatTime(totalSeconds) {
  totalSeconds = Math.floor(totalSeconds); // Work with whole seconds

  if (totalSeconds <= 0) {
    return "Needs watering!";
  }
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  let timeString = "";
  if (days > 0) timeString += `${days}d `;
  // Pad hours, minutes, seconds with leading zeros if needed and part of the string
  const pad = (num) => String(num).padStart(2, '0');

  if (days > 0) {
      timeString += `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  } else if (hours > 0) {
      timeString += `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
  } else if (minutes > 0) {
      timeString += `${minutes}m ${pad(seconds)}s`;
  } else {
      timeString += `${seconds}s`;
  }

  return timeString;
}

// Component to display a single plant's timer and info
function PlantTimer({ plant, onPlantWatered, onPlantDeleted }) { // Receive onPlantWatered prop
  const [remainingTime, setRemainingTime] = useState(0);
  const [isWatering, setIsWatering] = useState(false); // Optional: disable button during request
  const [errorWatering, setErrorWatering] = useState(null); // Optional: show watering error
  const [isDeleting, setIsDeleting] = useState(false); // Optional: disable button during request

  useEffect(() => {
    // Timer calculation logic (keep as is)
    const calculateRemaining = () => {
      const nextWateringMillis = new Date(plant.next_watering_iso).getTime();
      const nowMillis = Date.now();
      const timeLeft = Math.max(0, (nextWateringMillis - nowMillis) / 1000);
      setRemainingTime(timeLeft);
    };
    calculateRemaining();
    const timerInterval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(timerInterval);
  }, [plant.next_watering_iso]);


  // const getDueDateString = () => { /* Keep as is */
  //   try { return new Date(plant.next_watering_iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return "Invalid date"; }
  // }
  // const getLastWateredString = () => { /* Keep as is */
  //   if (!plant.last_watered_iso || plant.last_watered_iso === "null") return 'Never';
  //   try { return new Date(plant.last_watered_iso).toLocaleDateString(undefined, { dateStyle: 'medium' }); } catch (e) { return "Invalid date"; }
  // }


  // --- Handler for the button click ---
  const handleWaterClick = () => {
    setIsWatering(true); // Disable button
    setErrorWatering(null); // Clear previous errors

    // Send POST request to the new backend endpoint
    fetch(`/plants/${plant.id}/water`, { method: 'POST' })
      .then(res => {
        if (!res.ok) { /* Error handling */ }
        return res.json(); // Expects response body
      })
      .then(updatedPlantData => { // <<<< ASSUMES 'updatedPlantData' is a SINGLE updated plant object
        console.log('Plant watered successfully:', updatedPlantData);
        onPlantWatered(updatedPlantData); // <<<< Calls App's handler with this data
        setIsWatering(false);
      })
      .catch(error => {
        console.error("Error watering plant:", error);
        setErrorWatering(error.message); // Show error message
        setIsWatering(false); // Re-enable button
      });
  };

  const imageUrl = plant.image_filename ? `/plant_images/${plant.image_filename}` : '/path/to/default/placeholder.png';

  // --- Handler for Delete Button ---
  const handleDeleteClick = () => {
    // Optional: Confirm before deleting
    if (!window.confirm(`Are you sure you want to delete "${plant.name}"? This cannot be undone.`)) {
      return; // Stop if user cancels
    }

    setIsDeleting(true); // Indicate deletion in progress

    fetch(`/plants/${plant.id}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) {
          // Try to get error from response body
          return res.json().then(errData => {
            throw new Error(errData.error || `Delete failed status: ${res.status}`);
          }).catch(() => { // Fallback if no JSON body
            throw new Error(`Delete failed status: ${res.status}`);
          });
        }

        // Handle potential 204 No Content response which doesn't have a body
        if (res.status === 204) {
          return null; // Or return a success indicator object if preferred
        }
        return res.json(); // Assumes 200 OK with { message: ... }
      })
      .then(data => { // data might be null or { message: ... }
        console.log(`Plant ${plant.id} deleted response:`, data);
        // Call the handler passed from App, providing the ID to remove
        onPlantDeleted(plant.id);
        // No need to setIsDeleting(false) here, as the component will be removed
      })
      .catch(error => {
        console.error("Error deleting plant:", error);
        alert(`Failed to delete plant: ${error.message}`); // Show alert or better UI error
        setIsDeleting(false); // Re-enable button on error
      });
  };

  return (
    <div className="plant-card">
      <img
        src={imageUrl}
        alt={`Pixel Art of ${plant.name}`} // Important for accessibility
        className="plant-image"
      />
      <h3>{plant.name}</h3>
      <p className="plant-species">({plant.species || 'Unknown Species'})</p>
      <p className="plant-timer">
        <span style={{ color: remainingTime <= 0 ? 'red' : 'inherit' }}>
          {formatTime(remainingTime)}
        </span>
      </p>
      {/* <div className="plant-details">
        <p>Interval: {plant.watering_interval} days</p>
        <p>Last Watered: {getLastWateredString()}</p>
        <p>Next Watering Due: {getDueDateString()}</p>
      </div> */}

      {/* --- Add the button --- */}
      <button
        onClick={handleWaterClick}
        disabled={isWatering} // Disable button while request is in progress
        className="water-button"
      >
      {isWatering ? 'Watering...' : 'Water Me!'}
      </button>
      {/* Optional: Display watering error */}
      {errorWatering && <p className="error-watering">{errorWatering}</p>}

      {/* --- Add Delete Button --- */}
      <button
        onClick={handleDeleteClick}
        disabled={isDeleting || isWatering} // Disable if deleting or watering
        className="delete-button"
      >
      {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
    </div>
  );
}

// Main App component fetches data and renders list
function App() {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  // Initial fetch logic (keep as is)
  useEffect(() => {
    setLoading(true); setError(null);
    fetch('/plants')
      .then(res => { if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`); return res.json(); })
      .then(data => { if (Array.isArray(data)) setPlants(data); else throw new Error("Invalid data format"); setLoading(false); })
      .catch(err => { console.error("Failed to fetch plants:", err); setError(`Failed to load plants: ${err.message}`); setLoading(false); });
  }, []);

  // --- Function to update a single plant in the state ---
  const handlePlantWatered = (updatedPlant) => {
    setPlants(currentPlants =>
      currentPlants.map(p =>
        // If this is the plant that was updated, replace it, otherwise keep the old one
        p.id === updatedPlant.id ? updatedPlant : p
      )
    );
  };

  // --- Handler for when a plant is added via the form ---
  const handlePlantAdded = (newlyAddedPlant) => {
    // Check if the backend returned an error object instead
    if (newlyAddedPlant && newlyAddedPlant.error) {
        console.error("Failed to add plant (backend error):", newlyAddedPlant.error);
        // Optionally, show an error message to the user here
        return;
    }
     // Add the new plant to the end of the existing list
    setPlants(currentPlants => [...currentPlants, newlyAddedPlant]);
    console.log("App state updated with new plant:", newlyAddedPlant);
  };

  // --- NEW Handler for deleting a plant ---
  const handlePlantDeleted = (deletedPlantId) => {
    // Filter the plants array, keeping only those whose ID does NOT match the deleted one
    setPlants(currentPlants =>
      currentPlants.filter(plant => plant.id !== deletedPlantId)
    );
    console.log(`Removed plant with ID ${deletedPlantId} from state.`);
    // Optional: Show a success message to the user
  };

  const toggleFormVisibility = () => {
    setIsFormVisible(prevState => !prevState); // Flip the boolean state
  };


  return (
    <div className="app-container">
      <h1>WATER YOUR PLANTS!</h1>

      {loading && <p>Loading plants...</p>}
      {error && <p className="error-message">Error: {error}</p>}
      {!loading && !error && (
        <div className="plant-list">
          {plants.length > 0 ? (
            plants.map((plant) => (
              // Pass the handler function down to PlantTimer
              <PlantTimer
                key={plant.id}
                plant={plant}
                onPlantWatered={handlePlantWatered}
                onPlantDeleted={handlePlantDeleted}
              />
            ))
          ) : ( <p>No plants found.</p> )}
        </div>
      )}
      <hr style={{margin: "30px 0"}}/>         
      
        {/* --- Button to toggle form visibility --- */}
        <button 
          onClick={toggleFormVisibility} 
          className={`toggle-form-button ${isFormVisible ? 'toggle-form-button--active' : ''}`}>
          {isFormVisible ? 'Nevermind' : 'Add Plant'}
      </button>

      {/* --- Conditionally render the Add Plant Form --- */}
      {/* The && operator means the part after it only renders if isFormVisible is true */}
      {isFormVisible && (
        <AddPlantForm onPlantAdded={handlePlantAdded} />
      )}
    </div>
  );
}

export default App;