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
POST_DIR = BASE_DIR + '/' + file_name

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

catalogue = []

rule = re.compile(r'[^a-zA-z| ]')

try:

    print('## Table of content:')
    print('')
    for line in open(POST_DIR, 'r'):
        for key, val in title:
            if line.find(key) != -1:
                this_line = rule.sub('', line.strip()).strip()
                catalogue.append(val + '[' + this_line + '](#' + this_line.lower().replace(' ', '-') + ')')
                break

    for line in catalogue:
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

except e:
    print('############## something wrong when executing, error is shown as following... ##############')
    print(e)
finally:
    sys.exit()