#!/bin/bash
#comment:

echo "############### easy jekyll install helper ###############"
echo "#################### by decaywood ####################"

echo "touch Gemfile..."

touch Gemfile
true > Gemfile

echo "write config..."

echo "source 'https://ruby.taobao.org/'" >> Gemfile
echo "gem 'github-pages'" >> Gemfile

echo "install dependencies..."

sudo apt-get install ruby
sudo apt-get install ruby-dev
sudo apt-get install gem
sudo apt-get install libxml2-dev libxslt-dev
sudo apt-get install zlib1g-dev
sudo apt-get install node.js

echo "install bundle..."

gem install bundle
bundle install
bundle update

echo "done..."
