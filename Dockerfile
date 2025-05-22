# Use official Node 22 image
FROM node:22

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the files
COPY . .

# Expose port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
