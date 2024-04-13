import os
import time

import prompt_toolkit
from prompt_toolkit.completion import WordCompleter, FuzzyWordCompleter
from prompt_toolkit.validation import ValidationError, Validator


def create_folder(filename):
    os.makedirs(os.path.dirname(filename), exist_ok=True)


def backup_file(file, file_ext=".bak"):
    timestamp_int = str(int(time.time()))
    with open(file, "r", encoding='utf-8') as f:
        with open(file + timestamp_int + file_ext, "w", encoding='utf-8') as f2:
            f2.write(f.read())


def is_int(s):
    try:
        int(s)
        return True
    except ValueError:
        return False


def in_list(element, list, ignore_case=False):
    if ignore_case:
        return element.lower() in (string.lower() for string in list)
    else:
        return element in list


class YNValidator(Validator):
    def __init__(self, options):
        self.options = options

    def validate(self, document):
        text = document.text
        if not (in_list(text, self.options, True)):
            raise ValidationError(message='This input is not accepted')


def default_input(prompt, default, options=[], ignore_case=False, retry=False):
    if options:
        completer = FuzzyWordCompleter(options)
        return prompt_toolkit.prompt(prompt, default=default, completer=completer, complete_while_typing=True,
                                     validator=YNValidator(options))
    return prompt_toolkit.prompt(prompt, default=default)


def convert_yn_to_bool(yn):
    if yn.lower() == 'y':
        return True
    else:
        return False
