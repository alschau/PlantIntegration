# This file will be the backend server for the Flask application.
# It will handle the API requests and serve the frontend files.

from flask import Flask, jsonify, request
import os
import json
from src.Plants.plantController import PlantController


JSON_FILE_PATH = 'src/Plants/plants.json'
image_folder_path = 'src/Images'
s = PlantController()
if os.path.exists(JSON_FILE_PATH):
    print("The JSON file exists. Loading data from it.")
    # If the JSON file exists, load the data from it
    with open(JSON_FILE_PATH, 'r') as f:
        s.setup_from_json()
else: 
    print("The JSON file does not exist. Setting up default data.")
    s.setup()
    s.json_export()


app = Flask(__name__,
            static_url_path='/plant_images', # URL prefix for images
            static_folder=image_folder_path  # Local directory containing images
            )


@app.route("/plants")
def get_plants():
    # Open the JSON file for reading
    with open(JSON_FILE_PATH, 'r') as f:
        plants_data = json.load(f)
    return jsonify(plants_data)




@app.route("/plants", methods=['POST'])
def add_plant_api():
    new_plant_data = request.get_json()
    new_plant_object = s.add_plant(new_plant_data)
    if new_plant_object:
        s.json_export()
        return jsonify(new_plant_object.to_dict()), 201
    else:
        return jsonify({"error": "Failed to add plant"}), 400
        

@app.route("/plants/<int:plant_id>", methods=["DELETE"])
def delete_plant_api(plant_id):
    deleted_successfully = s.delete_plant(plant_id)
    if deleted_successfully:
        s.json_export()
        return jsonify({"message": f"Plant {plant_id} deleted successfully"}), 200
    else:
        return jsonify({"error": f"Plant with ID {plant_id} not found"}), 404


@app.route('/plants/<int:plant_id>/water', methods=['POST'])
def water_plant_api(plant_id):
    """API endpoint to mark a specific plant as watered."""
    print(f"Received request to water plant ID: {plant_id}")
    # Call the controller method - It returns the updated plant or None
    updated_plant_object = s.water_plant(plant_id)

    if updated_plant_object:
        s.json_export()
        return updated_plant_object.to_dict()
    else:
        # Plant ID not found by the controller
        return jsonify({"error": f"Plant with ID {plant_id} not found"}), 404



# Members API Route
@app.route('/members')
def members():
    # This is the JSON data that will be returned when the /members endpoint is hit.
    return {"members": ["Member1", "Member2", "Member3"]}


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

    