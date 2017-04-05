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


def check_underline(line, line_num, ignore):
    if ignore:
        return
    cols = []
    paris = []
    line = line.decode('utf-8')
    get_ignore_index_pair(line, paris)
    for index, char in enumerate(line):
        if '_' == char and line[index - 1] != '\\':
            legal = True
            for start, end in paris:
                legal = legal and not (start < index < end)
            if legal:
                cols.append(index)

    if cols:
        print 'line:', line_num, 'cols:', cols, 'content:'
        print line
    return cols


def stack_checker_gen(syntax):
    ignore = [False]

    def checker(line):
        if syntax in line:
            ignore[0] = not ignore[0]
        return ignore[0]

    return checker


def stack_checker():
    checker1 = stack_checker_gen('```')
    checker2 = stack_checker_gen('---')

    def check(line):
        return checker1(line) or checker2(line)

    return check


CHECKERS = [check_underline]


def process():
    dir_list = list_file_infos(POST_DIR)
    for path in dir_list:
        process_file(path)


def process_file(file_path):
    line_num = 0
    ignore = stack_checker()
    has_error = False
    for line in fileinput.input(file_path):
        _ignore = ignore(line)
        line_num += 1
        for func in CHECKERS:
            res = func(line, line_num, _ignore)
            has_error = has_error or res
    if has_error:
        print file_path
        print '------'


def list_file_infos(path):
    dir_list = []
    do_list_file_infos(dir_list, path)
    return dir_list


def do_list_file_infos(dir_list, path):
    dirs = os.listdir(path)
    for f_path in dirs:
        f_path = ''.join([path, os.path.sep, f_path])
        if os.path.isfile(f_path) and CARE_TYPE in f_path:
            dir_list.append(f_path)
        elif os.path.isdir(f_path):
            do_list_file_infos(dir_list, f_path)


def get_ignore_index_pair(line, pairs):
    match = PATTERN.match(line)
    if match:
        x, y = match.groups()
        start = line.rfind(y)
        end = start + len(y)
        line = line[:start]
        pairs.append((start, end))
        get_ignore_index_pair(line, pairs)


process()
