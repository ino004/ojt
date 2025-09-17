// swagger.js
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Node.js + MongoDB API 🚀",
      version: "1.0.0",
      description: "API documentation with Swagger UI",
    },
servers: [
  {
    url: "https://ha-jaem.onrender.com",
    description: "Render server",
  },
  {
    url: "http://localhost:5000",
    description: "Local server",
  },
],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT", // để Swagger UI hiểu là token JWT
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./app/routes/*.js", "./app/controllers/*.js"], // nơi chứa route để swagger đọc @swagger comment
};

const swaggerSpec = swaggerJSDoc(options);

export function swaggerDocs(app) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}