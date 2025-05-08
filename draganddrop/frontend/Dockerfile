FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Добавляем аргумент сборки и устанавливаем переменную окружения
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

RUN npm install -g serve

EXPOSE 3000

RUN echo ">>> Building frontend with API endpoint: $REACT_APP_API_URL"

CMD ["serve", "-s", "build", "-l", "3000"]
