from src.Plants.plant import Plant
import json
import datetime
import os

class PlantController:
    plants = []
    def __init__(self):
        self.plants = []

    def add_plant(self, plant):
        self.plants.append(plant)

    def add_plant(self, plant_data):
        new_plant = Plant(
            name=plant_data['name'],
            species=plant_data.get('species'),
            watering_interval=int(plant_data['watering_interval']),
            image_filename=plant_data.get('image_filename')
        )
        self.plants.append(new_plant)
        return new_plant
    
    def get_plants(self):
        return self.plants
    
    def delete_plant(self, plant_id):
        initial_length = len(self.plants)
        self.plants = [plant for plant in self.plants if plant.plant_id != plant_id]
        if len(self.plants) < initial_length:
            print(f"Controller deleted plant ID: {plant_id}")
            return True
        else:
            print(f"Controller could not find plant ID: {plant_id} to delete.")
            return False    

    def setup(self):
        p1 = Plant("Hansrurdi", "Cactus", 14, "P10.png")
        p2 = Plant("Jakobli", "Aussenpflanze", 7, "P14.png")
        p3 = Plant("Palmtree", "Aussenpflanze", 7, "P1.png")

        self.plants.append(p1)
        self.plants.append(p2)
        self.plants.append(p3)

    def json_export(self):
        plants_data = [plant.to_dict() for plant in self.plants]
        output_filepath = "src/Plants/plants.json"
        try:
            with open(output_filepath, "w") as f:
                json.dump(plants_data, f, indent=4)
        except IOError as e:
            print(f"Error writing to file {output_filepath}: {e}")
        except TypeError as e:
            print(f"Error serializing data to JSON: {e}")
    
    def single_json_export(self, plant_id):
        for plant in self.plants:
            if plant.plant_id == plant_id:
                return plant.to_dict()
        return None

    def water_plant(self, plant_id):
        for plant in self.plants:
            if plant.plant_id == plant_id:
                plant.water()
                return plant
            
    def setup_from_json(self):
        filepath = "src/Plants/plants.json"
        self.plants = []
        max_id = 0
        print(f"Attempting to load from: {filepath}") # Debug print
        with open(filepath, "r") as f:
            plants_data = json.load(f)

            for plant_data in plants_data:
                plant = Plant(
                    name=plant_data.get('name'), # Use .get for safety
                    species=plant_data.get('species'),
                    watering_interval=plant_data.get('watering_interval', 7),
                    image_filename=plant_data.get('image_filename')
                )

                last_watered_iso_str = plant_data.get('last_watered_iso')
                if last_watered_iso_str:
                    try:
                        # Convert ISO string back to datetime object
                        plant.last_watered = datetime.datetime.fromisoformat(last_watered_iso_str)
                    except (ValueError, TypeError) as date_err:
                            print(f"Warning: Could not parse last_watered_iso '{last_watered_iso_str}' for plant {plant_data.get('name')}: {date_err}")
                            plant.last_watered = None
                else:
                    plant.last_watered = None

                # --- Handle ID ---
                # Assign loaded ID and track the maximum
                loaded_id = plant_data.get('id')
                if loaded_id is not None:
                    plant.plant_id = loaded_id
                    if loaded_id > max_id:
                        max_id = loaded_id
                else:
                    print(f"Warning: Plant data missing 'id' field: {plant_data.get('name')}")

                self.plants.append(plant)

        # Update the class ID counter to avoid collisions when adding new plants
        Plant._id_counter = max_id + 1
        print(f"Loaded {len(self.plants)} plants. Next ID will be {Plant._id_counter}")
        return True # Indicate success


