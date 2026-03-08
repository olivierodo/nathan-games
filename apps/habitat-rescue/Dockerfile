# Use the official Node.js image based on Alpine Linux for the build stage.
FROM node:lts-alpine AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker's cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the React application
RUN npm run build

# Use the official Nginx image based on Alpine Linux for serving the application
FROM nginx:alpine

# Copy the static files from the build stage to the Nginx serving directory
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 8080 (or 80)
EXPOSE 8080

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]

