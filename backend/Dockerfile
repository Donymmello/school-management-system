FROM node:20-alpine

WORKDIR /app

# Copia os ficheiros de dependências primeiro (otimização de cache)
COPY package*.json ./

RUN npm install

# Copia o restante código fonte
COPY . .

EXPOSE 5000

CMD ["npm", "start"]