import os


def create_folder(filename):
    os.makedirs(os.path.dirname(filename), exist_ok=True)


def is_int(s):
    try:
        int(s)
        return True
    except ValueError:
        return False
