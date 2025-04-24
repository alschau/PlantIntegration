import unittest
import datetime
import time

from Plants.plant import Plant

class TestPlantClass(unittest.TestCase):
    def setUp(self):
        Plant._id_counter = 1