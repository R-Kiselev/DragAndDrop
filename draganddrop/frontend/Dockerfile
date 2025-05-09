FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Добавьте ARG для переменной окружения
ARG REACT_APP_API_URL

# Сделайте переменную окружения доступной для RUN команд
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

RUN npm run build

RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
