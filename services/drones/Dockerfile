# pull node image
FROM node:14-alpine

# create a working directory with a non-root user
RUN mkdir -p /app/node_modules && chown -R node:node /app

# describe working directory 
WORKDIR /app

# copy and cache package.json file
COPY package*.json ./

# define the non-root user
USER node

# install dependecies
RUN npm install

# copy all the code to the directory
COPY --chown=node:node . .

# start the node server 
CMD ["npm", "start"]