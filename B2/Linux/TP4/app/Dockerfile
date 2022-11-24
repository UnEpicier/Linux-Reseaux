FROM node

# Update node & npm
RUN npm install -g npm@latest
RUN npm update -g && npm upgrade -g

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

EXPOSE 3000

CMD [ "npm", "start" ]
