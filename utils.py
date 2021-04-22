import os


def create_folder(filename):
    os.makedirs(os.path.dirname(filename), exist_ok=True)