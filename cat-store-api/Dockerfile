FROM eclipse-temurin:21-jdk AS build

WORKDIR /app
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
COPY src/ src/
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw && ./mvnw --batch-mode -DskipTests package

FROM eclipse-temurin:21-jre

WORKDIR /app
COPY --from=build --chown=10001:10001 /app/target/cat-store-api-0.1.0.jar /app/app.jar
USER 10001:10001
EXPOSE 8081
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
