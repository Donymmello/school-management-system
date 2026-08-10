FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5173

# Host 0.0.0.0 é necessário para o Vite expor a porta fora do container Alpine
CMD ["npx", "vite", "--host", "0.0.0.0"]