# ระบุ base image ที่ใช้ Node.js LTS version
FROM node:lts-alpine

# ตั้งค่า working directory
WORKDIR /app

# คัดลอกไฟล์ package.json และ package-lock.json เข้าสู่ working directory
COPY package*.json ./

# ติดตั้ง npm packages
RUN npm install

# คัดลอกไฟล์และโฟลเดอร์ที่เหลือในโปรเจคของคุณ
COPY . .

# สำหรับการสื่อสารกับแอปพลิเคชัน Express.js ที่ทำงานใน Docker container
EXPOSE 3000

# รันแอปพลิเคชัน Express.js
CMD ["node", "./bin/www"]

# docker build -t smf-backend-pg .
# docker run -p 3000:3000 --name smf-backend-pg-container smf-backend-pg