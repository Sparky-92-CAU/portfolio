FROM eclipse-temurin:25-jdk AS build

WORKDIR /app

COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
COPY src/ src/

RUN chmod +x mvnw && ./mvnw --batch-mode -DskipTests package

FROM eclipse-temurin:25-jre

WORKDIR /app

COPY --from=build --chown=10001:10001 /app/target/guitar-song-finder-api-0.1.0.jar /app/app.jar

USER 10001:10001
EXPOSE 10000

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
