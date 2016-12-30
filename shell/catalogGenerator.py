# !/usr/bin/env python
# !/usr/bin/python
# author : decaywood
import os
import re
import sys

if len(sys.argv) == 1:
    print('file name required!')
    sys.exit()

file_name = sys.argv[1]

BASE_DIR = os.path.dirname(__file__)
POST_DIR = BASE_DIR + os.path.sep + file_name

POST_DIR = POST_DIR if POST_DIR.startswith('.') else '.' + POST_DIR

if not os.path.exists(POST_DIR):
    print('file directory is not correct!')
    print('input : ' + file_name)
    sys.exit()

print('')
print('')
print('')
print('##############################################################')
print('###############  Catalog Generator by decaywood ##############')
print('##############################################################')
print('')
print('')
print('')

title = [
    ('#######', '          * '),
    ('######', '        * '),
    ('#####', '      * '),
    ('####', '    * '),
    ('###', '  * '),
    ('##', '* ')
]

rule = re.compile(r'[^a-zA-z| ]')


def format_title(title_line):
    for key, val in title:
        if key in title_line:
            this_line = rule.sub('', title_line.strip()).strip()
            return ''.join([val, '[', this_line, '](#', this_line.lower().replace(' ', '-'), ')'])


try:

    with open(POST_DIR, 'r') as file:
        print('## Table of content:')
        print('')

        for line in [format_title(line) for line in file if '##' in line]:
            print(line)

        print('')
        print('')
        print('')
        print('##############################################################')
        print('###############      generate successful!      ###############')
        print('##############################################################')
        print('')
        print('')
        print('')

except Exception:
    print('############## something wrong when executing, error is shown as following... ##############')

finally:
    pass