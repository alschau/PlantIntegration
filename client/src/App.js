// src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import AddPlantForm from './AddPlantForm';
import EditPlantForm from './EditPlantForm';

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
function PlantTimer({ plant, onPlantWatered, onPlantDeleted, onPlantUpdated }) { // Receive onPlantWatered prop
  const [remainingTime, setRemainingTime] = useState(0);
  const [isWatering, setIsWatering] = useState(false); // Optional: disable button during request
  const [errorWatering, setErrorWatering] = useState(null); // Optional: show watering error
  const [isDeleting, setIsDeleting] = useState(false); // Optional: disable button during request
  const [isEditing, setIsEditing] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(null);

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
    setIsWatering(true);
    setErrorWatering(null);
    setAnimationPhase(null);

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

        onPlantWatered(updatedPlantData);

        // --- Start Animation Sequence ---
        setAnimationPhase('kanne1'); // Show first image

        // After a short delay, switch to the second image
        const timerId1 = setTimeout(() => {
          setAnimationPhase('kanne2'); // Show second image

          // After another short delay, hide the animation
          const timerId2 = setTimeout(() => {
            setAnimationPhase(null); // Hide images
          }, 800); // Duration to show Kanne2_Tropfen.png (adjust as needed)

          // Store timer ID 2 for potential cleanup
          return timerId2; // Not strictly needed here but good practice pattern
        }, 500); // Duration to show Kanne1.png (adjust as needed)

        // Store timer ID 1 for potential cleanup
        return timerId1;
      })
      .catch(error => {
        console.error("Error watering plant:", error);
        setErrorWatering(error.message); // Show error message
        setIsWatering(false); // Re-enable button
        setAnimationPhase(null);
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

  // --- Handler to initiate saving from edit form ---
  const handleSaveEdit = (updatedData) => {
    console.log(`Saving updates for plant ${plant.id}`, updatedData);
    // Return the fetch promise so EditPlantForm can handle errors/finish state
    return fetch(`/plants/${plant.id}`, {
      method: 'PUT', // Or PATCH if backend handles partial updates
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    })
      .then(res => {
        if (!res.ok) {
          // Handle error response from backend
          return res.json().then(err => { throw new Error(err.error || `Update failed status: ${res.status}`) });
        }
        return res.json(); // Updated plant data from server
      })
      .then(updatedPlantFromServer => {
        onPlantUpdated(updatedPlantFromServer); // Update state in App component
        setIsEditing(false); // Exit edit mode on success
        // Optional: return something to indicate success to form
        return true;
      });
    // Catch block could be here or in EditPlantForm as implemented above
  };

  // --- Handler to cancel editing ---
  const handleCancelEdit = () => {
    setIsEditing(false); // Simply exit edit mode
  };



  return (
    <div className="plant-card">

      {/* --- Conditional Rendering --- */}
      {isEditing ? (
        // --- Show Edit Form when isEditing is true ---
        <EditPlantForm
          plant={plant}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
        />
      ) : (
        // --- Show Normal View when isEditing is false ---
        <> {/* Use Fragment to group elements */}

          <div className="plant-image-container">
            {/* Plant Image */}
            <img
              src={imageUrl}
              alt={plant.name}
              className="plant-image"
            // onError=... (keep if using)
            />

            {animationPhase === 'kanne1' && (
              <div className="watering-animation-overlay">
                <img src="/plant_images/Kanne1.png" alt="" />
              </div>
            )}
            {animationPhase === 'kanne2' && (
              <div className="watering-animation-overlay">
                <img src="/plant_images/Kanne2_Tropfen.png" alt="" />
              </div>
            )}
          </div>


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
          <div className="button-group">
            <button
              className="water-button"
              onClick={handleWaterClick}
              disabled={isWatering || isDeleting} // Disable button while request is in progress
            >
              {isWatering ? 'Watering...' : 'Water'}
            </button>
            {/* Optional: Display watering error */}

            <button
              className="edit-button"
              onClick={() => setIsEditing(true)}
              disabled={isWatering || isDeleting}>
              Edit
            </button>

            {/* --- Add Delete Button --- */}
            <button
              className="delete-button"
              onClick={handleDeleteClick}
              disabled={isDeleting || isWatering} // Disable if deleting or watering
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
          {errorWatering && <p className="error-watering">{errorWatering}</p>}
        </>
      )}
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

    if (updatedPlant && updatedPlant.error) {
      console.error("Update error:", updatedPlant.error);
      // Optionally show a global error message
      return;
    }
    setPlants(currentPlants =>
      currentPlants.map(p =>
        // If this is the plant that was updated, replace it, otherwise keep the old one
        p.id === updatedPlant.id ? updatedPlant : p
      )
    );
    console.log(`Updated plant ID ${updatedPlant.id} in state.`);
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

  // --- Handler for deleting a plant ---
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

  // --- Handler for when a plant is updated ---
  const handlePlantUpdated = (updatedPlant) => {
    // Same logic as watering: find and replace the plant in the array
    if (updatedPlant && updatedPlant.error) {
      console.error("Update error:", updatedPlant.error);
      // Optionally show a global error message
      return;
    }
    setPlants(currentPlants =>
      currentPlants.map(p =>
        p.id === updatedPlant.id ? updatedPlant : p
      )
    );
    console.log(`Updated plant ID ${updatedPlant.id} in state.`);
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
                onPlantUpdated={handlePlantUpdated}
              />
            ))
          ) : (<p>No plants found.</p>)}
        </div>
      )}
      <hr style={{ margin: "30px 0" }} />

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