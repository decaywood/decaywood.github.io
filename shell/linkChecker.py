# coding=utf-8
# !/usr/bin/env python
# !/usr/bin/python
# author : decaywood
import sys
import os
import re
import fileinput

def cur_file_dir():
   path = sys.path[0]
   if os.path.isdir(path):
       return path
   elif os.path.isfile(path):
       return os.path.dirname(path)

PATTERN = re.compile(r'.*\[(.*)\]\((.*)\).*')
BASE_DIR = cur_file_dir()
POST_DIR = ''.join([os.path.dirname(BASE_DIR), os.path.sep, '_posts'])
CARE_TYPE = '.markdown'

def check():
    links, mapping = get_local_links()
    for f_dir, content, url in links:
        real = ''.join([url[1:-1].replace('/', '-'), CARE_TYPE])
        if real not in mapping:
            print 'the url', '(', content, ')[', url, ']', 'is not found ....', 'case is in:', f_dir



def get_local_links():
    res = []
    dir_list, dir_mapping = list_file_infos(POST_DIR)
    container = []
    for f_dir in dir_list:
        get_link_in_file(container, f_dir)
    container = filter(lambda (w, x, y): ('http' not in y and 'www' not in y), container)
    for f_dir, content, url in container:
        index = url.find(')')
        index2 = url.find('#')
        url = url[:index] if index > -1 else url
        url = url[:index2] if index2 > -1 else url
        if url:
            res.append((f_dir, content, url))
    return res, dir_mapping


def get_link_in_file(container, file_path):
    for line in fileinput.input(file_path):

        matches = []
        get_matches_pair(line, matches)
        for x, y in matches:
            container.append((os.path.basename(file_path), x, y))


def list_file_infos(path):
    dir_list = []
    dir_mapping = {}
    do_list_file_infos(dir_list, path)
    for f_dir in dir_list:
        f_dir = os.path.basename(f_dir)
        dir_mapping[f_dir] = f_dir
    return dir_list, dir_mapping


def do_list_file_infos(dir_list, path):
    dirs = os.listdir(path)
    for f_path in dirs:
        f_path = ''.join([path, os.path.sep, f_path])
        if os.path.isfile(f_path) and CARE_TYPE in f_path:
            dir_list.append(f_path)
        elif os.path.isdir(f_path):
            do_list_file_infos(dir_list, f_path)


def get_matches_pair(line, matches):
    match = PATTERN.match(line)
    if match:
        x, y = match.groups()
        start = line.rfind(x)
        line = line[:start]
        matches.append((x, y))
        get_matches_pair(line, matches)

check()
