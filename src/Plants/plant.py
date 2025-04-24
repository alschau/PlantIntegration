import datetime

class Plant:
    _id_counter = 1

    def __init__(self, name, species=None, watering_interval=7, image_filename=None):
        self.plant_id = Plant._id_counter
        Plant._id_counter += 1
        self.name = name
        self.species = species
        self.watering_interval = watering_interval
        self.last_watered = None
        self.image_filename = image_filename

    def water(self):
        self.last_watered = datetime.datetime.now()
        print(f"Watered {self.name} at {self.last_watered}")

    def needs_watering(self):
        if self.last_watered is None:
            return True
        return (datetime.datetime.now() - self.last_watered).days >= self.watering_interval
    
    def calculate_next_watering_timestamp(self):
        if self.last_watered is None:
            return datetime.datetime.now() + datetime.timedelta(days=self.watering_interval)
        return self.last_watered + datetime.timedelta(days=self.watering_interval)
    
    def to_dict(self):
        """Converts the plant object into a dictionary suitable for JSON serialization."""
        next_watering_dt = self.calculate_next_watering_timestamp()

        # Convert datetimes to ISO 8601 strings. Handle None for last_watered.
        last_watered_str = self.last_watered.isoformat() if self.last_watered else "null"
        next_watering_str = next_watering_dt.isoformat()

        return {
            'id': self.plant_id,
            'name': self.name,
            'species': self.species,
            'watering_interval': self.watering_interval,
            'last_watered_iso': last_watered_str,
            'next_watering_iso': next_watering_str,
            "image_filename": self.image_filename
        }
    
    def delete(self):
        del self
        print(f"Deleted plant {self.name}")

    def __str__(self):
        return f"{self.name} ({self.species})"
